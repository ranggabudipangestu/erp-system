from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from uuid import UUID, uuid4
import jwt
import secrets
import hashlib
from passlib.context import CryptContext

from app.core.config import get_settings
from .models import User, AuthToken, AuditLog
from .repository import AuthTokenRepository, UserRepository, AuditLogRepository
from .token_service import TokenService
from .rate_limiter import RateLimiter


settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations including token generation and validation"""
    
    def __init__(
        self, 
        auth_token_repo: AuthTokenRepository,
        user_repo: UserRepository,
        audit_repo: AuditLogRepository
    ):
        self.auth_token_repo = auth_token_repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo
        self.token_service = TokenService(auth_token_repo)
        self.rate_limiter = RateLimiter()
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 30
    
    def authenticate(
        self, 
        email: str, 
        password: str, 
        tenant_domain: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Dict[str, any]]:
        """
        Authenticate user with email and password
        
        Args:
            email: User email
            password: Plain text password
            tenant_domain: Optional tenant domain (when feature flag enabled)
            ip_address: Client IP address for rate limiting and audit
            
        Returns:
            Dict with tokens and user info if successful, None if failed
        """
        # Rate limiting check
        rate_limit_key = f"{email}:{ip_address}" if ip_address else email
        if self.rate_limiter.is_rate_limited(rate_limit_key):
            remaining_time = self.rate_limiter.get_remaining_time(rate_limit_key)
            raise ValueError(f"Too many login attempts. Try again in {remaining_time} seconds.")
        
        try:
            # Find user by email - this will return user with tenant relationships
            user = self.user_repo.get_by_email(email)
            if not user:
                self._record_failed_attempt(email, "user_not_found", ip_address)
                self.rate_limiter.record_attempt(rate_limit_key)
                return None

            # Get user's primary tenant
            user_tenant = self.user_repo.get_primary_tenant(user.id)
            if not user_tenant:
                self._record_failed_attempt(email, "no_tenant", ip_address, user_id=user.id)
                self.rate_limiter.record_attempt(rate_limit_key)
                return None

            # Check tenant domain if feature flag is enabled
            if settings.REQUIRE_TENANT_DOMAIN and tenant_domain:
                if not user_tenant.tenant or user_tenant.tenant.domain != tenant_domain:
                    self._record_failed_attempt(
                        email,
                        "invalid_tenant_domain",
                        ip_address,
                        tenant_id=user_tenant.tenant_id,
                        user_id=user.id,
                    )
                    self.rate_limiter.record_attempt(rate_limit_key)
                    return None

            # Validate password
            if not self.verify_password(password, user.password_hash):
                self._record_failed_attempt(
                    email,
                    "invalid_password",
                    ip_address,
                    tenant_id=user_tenant.tenant_id,
                    user_id=user.id,
                )
                self.rate_limiter.record_attempt(rate_limit_key)
                return None

            # Check if user is active
            if user.status != "active":
                self._record_failed_attempt(
                    email,
                    "user_inactive",
                    ip_address,
                    tenant_id=user_tenant.tenant_id,
                    user_id=user.id,
                )
                self.rate_limiter.record_attempt(rate_limit_key)
                return None
            
            # Successful authentication - reset rate limiting
            self.rate_limiter.reset_attempts(rate_limit_key)
            
            # Generate tokens
            access_token = self.token_service.generate_access_token(user, user_tenant.tenant_id)
            refresh_token = self.token_service.generate_refresh_token(user, user_tenant.tenant_id, ip_address)
            
            # Log successful login
            self._record_successful_login(user.id, user_tenant.tenant_id, ip_address)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "status": user.status,
                    "is_verified": user.is_verified,
                    "mfa_enabled": user.mfa_enabled
                },
                "tenant": {
                    "id": str(user_tenant.tenant_id),
                    "name": user_tenant.tenant.name if user_tenant.tenant else None,
                    "domain": user_tenant.tenant.domain if user_tenant.tenant else None,
                    "roles": user_tenant.roles
                }
            }
            
        except Exception as e:
            # Log unexpected error
            tenant_id = user_tenant.tenant_id if 'user_tenant' in locals() and user_tenant else None
            recorded_user_id = user.id if 'user' in locals() and user else None
            self._record_failed_attempt(
                email,
                f"system_error: {str(e)}",
                ip_address,
                tenant_id=tenant_id,
                user_id=recorded_user_id,
            )
            self.rate_limiter.record_attempt(rate_limit_key)
            raise e

    def _record_failed_attempt(
        self,
        email: str,
        reason: str,
        ip_address: Optional[str] = None,
        tenant_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Record failed login attempt in audit log"""
        if tenant_id is None:
            # Database schema requires tenant_id; skip logging when we cannot resolve it.
            return
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="login_failed",
            resource="auth",
            resource_id=email,
            payload={
                "email": email,
                "reason": reason,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        self.audit_repo.create(audit_log)
    
    def _record_successful_login(
        self, 
        user_id: UUID, 
        tenant_id: UUID,
        ip_address: Optional[str] = None
    ) -> None:
        """Record successful login in audit log"""
        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="login_success",
            resource="auth",
            resource_id=str(user_id),
            payload={
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        self.audit_repo.create(audit_log)
    
    def generate_tokens(self, user: User, tenant_id: UUID, ip_address: Optional[str] = None) -> Dict[str, str]:
        """
        Generate access and refresh tokens for user
        
        Args:
            user: User instance
            tenant_id: Tenant ID for the session
            ip_address: Client IP address
            
        Returns:
            Dict containing access_token, refresh_token, token_type, and expires_in
        """
        # Generate access token
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(tenant_id),
            "exp": datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        access_token = jwt.encode(access_token_data, self.secret_key, algorithm=self.algorithm)

        # Generate refresh token
        refresh_token_value = secrets.token_urlsafe(32)
        refresh_token_expires = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)

        # Store refresh token hash in database
        token_hash = hashlib.sha256(refresh_token_value.encode()).hexdigest()
        auth_token = AuthToken(
            id=uuid4(),
            user_id=user.id,
            tenant_id=tenant_id,
            refresh_token_hash=token_hash,
            expires_at=refresh_token_expires,
            ip_address=ip_address
        )

        self.auth_token_repo.create(auth_token)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60  # seconds
        }
    
    def verify_access_token(self, token: str) -> Optional[Dict]:
        """
        Verify and decode access token
        
        Args:
            token: JWT access token
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
                return None
                
            # Check token type
            if payload.get("type") != "access":
                return None
                
            return payload
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str, ip_address: Optional[str] = None) -> Optional[Dict[str, str]]:
        """
        Generate new access token using refresh token
        
        Args:
            refresh_token: Refresh token value
            ip_address: Client IP address
            
        Returns:
            New token pair or None if refresh token is invalid
        """
        # Verify refresh token exists and is not expired
        auth_token = self.auth_token_repo.get_valid_refresh_token(refresh_token)
        if not auth_token:
            return None
        
        # Generate new token pair
        user = auth_token.user  # Assuming relationship is loaded
        return self.generate_tokens(user, auth_token.tenant_id, ip_address)
    
    def revoke_token(self, token_value: str, user_id: UUID) -> bool:
        """
        Revoke a refresh token
        
        Args:
            token_value: Token to revoke
            user_id: User ID (for security)
            
        Returns:
            True if token was revoked, False otherwise
        """
        return self.auth_token_repo.revoke_token(token_value, user_id)
    
    def revoke_all_tokens(self, user_id: UUID, tenant_id: Optional[UUID] = None) -> int:
        """
        Revoke all tokens for a user (optionally scoped to tenant)

        Args:
            user_id: User ID
            tenant_id: Optional tenant ID to scope revocation

        Returns:
            Number of tokens revoked
        """
        return self.auth_token_repo.revoke_all_user_tokens(user_id, tenant_id)

    def logout(self, user_id: UUID, tenant_id: UUID, ip_address: Optional[str] = None) -> int:
        """Revoke active sessions for the user and record an audit trail."""

        revoked_sessions = self.revoke_all_tokens(user_id, tenant_id)

        audit_log = AuditLog(
            id=uuid4(),
            tenant_id=tenant_id,
            user_id=user_id,
            action="logout",
            resource="auth",
            resource_id=str(user_id),
            payload={
                "revoked_sessions": revoked_sessions,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc),
        )
        self.audit_repo.create(audit_log)

        return revoked_sessions
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
