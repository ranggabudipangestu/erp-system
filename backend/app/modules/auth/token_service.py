from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from uuid import UUID, uuid4
import jwt
import secrets
import hashlib

from app.core.config import get_settings
from .models import User, AuthToken
from .repository import AuthTokenRepository


settings = get_settings()


class TokenService:
    """Service for JWT token generation and validation"""
    
    def __init__(self, auth_token_repo: AuthTokenRepository):
        self.auth_token_repo = auth_token_repo
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 30
    
    def generate_access_token(self, user: User, tenant_id: UUID) -> str:
        """Generate JWT access token"""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "tenant_id": str(tenant_id),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes),
            "iat": datetime.now(timezone.utc),
            "type": "access"
        }
        
        return jwt.encode(token_data, self.secret_key, algorithm=self.algorithm)
    
    def generate_refresh_token(self, user: User, tenant_id: UUID, ip_address: Optional[str] = None) -> str:
        """Generate and store refresh token"""
        refresh_token_value = secrets.token_urlsafe(32)
        refresh_token_expires = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        # Store refresh token in database
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
        return refresh_token_value
    
    def verify_access_token(self, token: str) -> Optional[Dict]:
        """Verify and decode access token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                return None
                
            # Check token type
            if payload.get("type") != "access":
                return None
                
            return payload
        except jwt.InvalidTokenError:
            return None
    
    def refresh_access_token(self, refresh_token: str, ip_address: Optional[str] = None) -> Optional[Dict[str, str]]:
        """Generate new access token using refresh token"""
        # Verify refresh token exists and is not expired
        auth_token = self.auth_token_repo.get_valid_refresh_token(refresh_token)
        if not auth_token:
            return None
        
        # Generate new tokens
        new_access_token = self.generate_access_token(auth_token.user, auth_token.tenant_id)
        new_refresh_token = self.generate_refresh_token(auth_token.user, auth_token.tenant_id, ip_address)
        
        # Revoke old refresh token
        self.auth_token_repo.revoke_token(refresh_token, auth_token.user_id)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }
    
    def revoke_token(self, token_value: str, user_id: UUID) -> bool:
        """Revoke a refresh token"""
        return self.auth_token_repo.revoke_token(token_value, user_id)
    
    def revoke_all_tokens(self, user_id: UUID, tenant_id: Optional[UUID] = None) -> int:
        """Revoke all tokens for a user"""
        return self.auth_token_repo.revoke_all_user_tokens(user_id, tenant_id)
