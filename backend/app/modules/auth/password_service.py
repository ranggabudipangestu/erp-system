import secrets
import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from uuid import UUID
import redis
import json
import os
import logging

from passlib.context import CryptContext

from .repository import UserRepository, AuditLogRepository
from .models import User, AuditLog
from .email_service import EmailService
from uuid import uuid4

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> Dict[str, bool]:
    """
    Validate password strength requirements:
    - Minimum 8 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains number
    - Contains special character
    """
    validations = {
        'length': len(password) >= 8,
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'number': bool(re.search(r'\d', password)),
        'special': bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?]', password))
    }
    
    return validations


def is_password_strong(password: str) -> bool:
    """Check if password meets all strength requirements"""
    validations = validate_password_strength(password)
    return all(validations.values())


class PasswordService:
    """Service for handling password reset functionality"""
    
    def __init__(
        self, 
        user_repo: UserRepository,
        audit_repo: AuditLogRepository,
        email_service: EmailService = None,
        user_tenant_repo = None
    ):
        self.user_repo = user_repo
        self.audit_repo = audit_repo
        self.email_service = email_service or EmailService()
        self.user_tenant_repo = user_tenant_repo
        
        # Redis configuration
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_db = int(os.getenv("REDIS_DB", "0"))
        redis_password = os.getenv("REDIS_PASSWORD", None)
        
        try:
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            # For development, we can use a mock redis client
            self.redis_client = None
    
    def _generate_reset_token(self) -> str:
        """Generate a secure token for password reset"""
        return secrets.token_urlsafe(32)
    
    def _store_reset_token(self, email: str, token: str, ttl_minutes: int = 15) -> bool:
        """Store reset token in Redis with TTL"""
        if not self.redis_client:
            logger.warning("Redis not available, logging token instead")
            logger.info(f"Reset token for {email}: {token} (TTL: {ttl_minutes} min)")
            return True
        
        try:
            # Store token with email as value, TTL in seconds
            key = f"password_reset:{token}"
            ttl_seconds = ttl_minutes * 60
            
            token_data = {
                "email": email,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)).isoformat()
            }
            
            self.redis_client.setex(key, ttl_seconds, json.dumps(token_data))
            logger.info(f"Reset token stored for {email} with TTL {ttl_minutes} minutes")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store reset token: {e}")
            return False
    
    def _get_reset_token_data(self, token: str) -> Optional[Dict]:
        """Retrieve and validate reset token data"""
        if not self.redis_client:
            logger.warning("Redis not available, cannot validate token")
            return None
        
        try:
            key = f"password_reset:{token}"
            token_data_str = self.redis_client.get(key)
            
            if not token_data_str:
                return None
            
            token_data = json.loads(token_data_str)
            
            # Check if token is expired (double-check with stored expiry)
            expires_at = datetime.fromisoformat(token_data["expires_at"])
            if expires_at < datetime.now(timezone.utc):
                self._revoke_reset_token(token)
                return None
            
            return token_data
            
        except Exception as e:
            logger.error(f"Failed to retrieve reset token: {e}")
            return None
    
    def _revoke_reset_token(self, token: str) -> bool:
        """Remove reset token from Redis"""
        if not self.redis_client:
            return True
        
        try:
            key = f"password_reset:{token}"
            self.redis_client.delete(key)
            logger.info(f"Reset token revoked: {token}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke reset token: {e}")
            return False
    
    def _revoke_all_user_sessions(self, user_id: UUID) -> bool:
        """Revoke all active sessions for a user (placeholder implementation)"""
        # TODO: Implement session revocation logic
        # This would typically involve:
        # 1. Removing all refresh tokens for the user
        # 2. Adding access tokens to a blacklist
        # 3. Notifying active sessions to logout
        
        logger.info(f"All sessions revoked for user {user_id}")
        return True
    
    def _get_user_primary_tenant_id(self, user_id: UUID) -> UUID | None:
        """Get user's primary tenant ID for audit logging"""
        if not self.user_tenant_repo:
            logger.warning(f"No user_tenant_repo provided, skipping tenant lookup for user {user_id}")
            return None
            
        try:
            primary_user_tenant = self.user_tenant_repo.get_primary_tenant(user_id)
            return primary_user_tenant.tenant_id if primary_user_tenant else None
        except Exception as e:
            logger.warning(f"Could not get primary tenant for user {user_id}: {e}")
            return None
    
    def initiate_password_reset(self, email: str, ip_address: str = None) -> bool:
        """
        Initiate password reset process by sending reset email.
        Always returns success for security (don't reveal if email exists).
        """
        try:
            # Look for user by email
            user = self.user_repo.get_by_email(email)
            
            if user:
                # Generate secure token
                token = self._generate_reset_token()
                
                # Store token in Redis (15 min TTL)
                if self._store_reset_token(email, token, ttl_minutes=15):
                    # Generate reset link
                    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                    reset_link = f"{frontend_url}/reset-password/{token}"
                    
                    # Send reset email
                    email_sent = self.email_service.send_password_reset_email(
                        recipient_email=email,
                        recipient_name=user.name,
                        reset_link=reset_link
                    )
                    
                    # Create audit log
                    primary_tenant_id = self._get_user_primary_tenant_id(user.id)
                    if primary_tenant_id:  # Only create audit log if we have tenant_id
                        audit_log = AuditLog(
                            id=uuid4(),
                            tenant_id=primary_tenant_id,
                            user_id=user.id,
                            action="password.reset_initiated",
                            resource="user",
                            resource_id=str(user.id),
                            payload={
                                "email": email,
                                "email_sent": email_sent,
                                "token_generated": True
                            },
                            ip_address=ip_address,
                            created_at=datetime.now(timezone.utc)
                        )
                        self.audit_repo.create(audit_log)
                    else:
                        logger.warning(f"Skipping audit log for password reset - no tenant found for user {user.id}")
                    
                    if not email_sent:
                        logger.warning(f"Failed to send reset email to {email}")
            else:
                # User not found, but don't reveal this for security
                logger.info(f"Password reset requested for non-existent email: {email}")
                
                # Create audit log for security monitoring (no tenant_id for invalid attempts)
                # We'll skip audit log for invalid emails to avoid constraint issues
                logger.info(f"Password reset attempted for invalid email {email} from IP {ip_address}")
            
            # Always return success for security
            return True
            
        except Exception as e:
            logger.error(f"Error in password reset initiation: {e}")
            # Still return success for security
            return True
    
    def validate_reset_token(self, token: str) -> Dict[str, any]:
        """
        Validate reset token and return status.
        
        Returns:
        - valid: bool
        - email: str (if valid)
        - message: str
        """
        try:
            token_data = self._get_reset_token_data(token)
            
            if not token_data:
                return {
                    "valid": False,
                    "message": "Invalid or expired token"
                }
            
            email = token_data["email"]
            
            # Verify user still exists
            user = self.user_repo.get_by_email(email)
            if not user:
                self._revoke_reset_token(token)
                return {
                    "valid": False,
                    "message": "Invalid token"
                }
            
            return {
                "valid": True,
                "email": email,
                "message": "Token is valid"
            }
            
        except Exception as e:
            logger.error(f"Error validating reset token: {e}")
            return {
                "valid": False,
                "message": "Token validation failed"
            }
    
    def reset_password(self, token: str, new_password: str, ip_address: str = None) -> Dict[str, any]:
        """
        Reset password using valid token.
        
        Returns:
        - success: bool
        - message: str
        """
        try:
            # Validate token first
            validation = self.validate_reset_token(token)
            if not validation["valid"]:
                return {
                    "success": False,
                    "message": validation["message"]
                }
            
            email = validation["email"]
            
            # Validate password strength
            if not is_password_strong(new_password):
                validations = validate_password_strength(new_password)
                missing_requirements = []
                
                if not validations['length']:
                    missing_requirements.append("minimum 8 characters")
                if not validations['uppercase']:
                    missing_requirements.append("uppercase letter")
                if not validations['lowercase']:
                    missing_requirements.append("lowercase letter")
                if not validations['number']:
                    missing_requirements.append("number")
                if not validations['special']:
                    missing_requirements.append("special character")
                
                return {
                    "success": False,
                    "message": f"Password must contain: {', '.join(missing_requirements)}"
                }
            
            # Get user
            user = self.user_repo.get_by_email(email)
            if not user:
                self._revoke_reset_token(token)
                return {
                    "success": False,
                    "message": "Invalid token"
                }
            
            # Update password
            user.password_hash = hash_password(new_password)
            user.updated_at = datetime.now(timezone.utc)
            
            updated_user = self.user_repo.update(user)
            
            if not updated_user:
                return {
                    "success": False,
                    "message": "Failed to update password"
                }
            
            # Revoke the used token
            self._revoke_reset_token(token)
            
            # Revoke all user sessions for security
            self._revoke_all_user_sessions(user.id)
            
            # Send confirmation email
            confirmation_sent = self.email_service.send_password_confirmation_email(
                recipient_email=email,
                recipient_name=user.name
            )
            
            # Create audit log
            primary_tenant_id = self._get_user_primary_tenant_id(user.id)
            if primary_tenant_id:  # Only create audit log if we have tenant_id
                audit_log = AuditLog(
                    id=uuid4(),
                    tenant_id=primary_tenant_id,
                    user_id=user.id,
                    action="password.reset_completed",
                    resource="user",
                    resource_id=str(user.id),
                    payload={
                        "email": email,
                        "confirmation_sent": confirmation_sent,
                        "sessions_revoked": True
                    },
                    ip_address=ip_address,
                    created_at=datetime.now(timezone.utc)
                )
                self.audit_repo.create(audit_log)
            else:
                logger.warning(f"Skipping audit log for password reset completed - no tenant found for user {user.id}")
            
            logger.info(f"Password reset completed for user {user.id}")
            
            return {
                "success": True,
                "message": "Password has been reset successfully"
            }
            
        except Exception as e:
            logger.error(f"Error resetting password: {e}")
            return {
                "success": False,
                "message": "Password reset failed"
            }
    
    def change_password(
        self, 
        user_id: UUID, 
        current_password: str, 
        new_password: str, 
        ip_address: str = None
    ) -> Dict[str, any]:
        """
        Change password for authenticated user.
        
        Returns:
        - success: bool
        - message: str
        """
        try:
            # Get user
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {
                    "success": False,
                    "message": "User not found"
                }
            
            # Verify current password
            if not verify_password(current_password, user.password_hash):
                # Create audit log for failed attempt
                primary_tenant_id = self._get_user_primary_tenant_id(user.id)
                if primary_tenant_id:  # Only create audit log if we have tenant_id
                    audit_log = AuditLog(
                        id=uuid4(),
                        tenant_id=primary_tenant_id,
                        user_id=user.id,
                        action="password.change_failed_invalid_current",
                        resource="user",
                        resource_id=str(user.id),
                        payload={
                            "email": user.email
                        },
                        ip_address=ip_address,
                        created_at=datetime.now(timezone.utc)
                    )
                    self.audit_repo.create(audit_log)
                else:
                    logger.warning(f"Skipping audit log for password change failed - no tenant found for user {user.id}")
                
                return {
                    "success": False,
                    "message": "Current password is incorrect"
                }
            
            # Validate new password strength
            if not is_password_strong(new_password):
                validations = validate_password_strength(new_password)
                missing_requirements = []
                
                if not validations['length']:
                    missing_requirements.append("minimum 8 characters")
                if not validations['uppercase']:
                    missing_requirements.append("uppercase letter")
                if not validations['lowercase']:
                    missing_requirements.append("lowercase letter")
                if not validations['number']:
                    missing_requirements.append("number")
                if not validations['special']:
                    missing_requirements.append("special character")
                
                return {
                    "success": False,
                    "message": f"Password must contain: {', '.join(missing_requirements)}"
                }
            
            # Check if new password is different from current
            if verify_password(new_password, user.password_hash):
                return {
                    "success": False,
                    "message": "New password must be different from current password"
                }
            
            # Update password
            user.password_hash = hash_password(new_password)
            user.updated_at = datetime.now(timezone.utc)
            
            updated_user = self.user_repo.update(user)
            
            if not updated_user:
                return {
                    "success": False,
                    "message": "Failed to update password"
                }
            
            # Revoke all user sessions for security
            self._revoke_all_user_sessions(user.id)
            
            # Send confirmation email
            confirmation_sent = self.email_service.send_password_confirmation_email(
                recipient_email=user.email,
                recipient_name=user.name
            )
            
            # Create audit log
            primary_tenant_id = self._get_user_primary_tenant_id(user.id)
            if primary_tenant_id:  # Only create audit log if we have tenant_id
                audit_log = AuditLog(
                    id=uuid4(),
                    tenant_id=primary_tenant_id,
                    user_id=user.id,
                    action="password.changed",
                    resource="user",
                    resource_id=str(user.id),
                    payload={
                        "email": user.email,
                        "confirmation_sent": confirmation_sent,
                        "sessions_revoked": True
                    },
                    ip_address=ip_address,
                    created_at=datetime.now(timezone.utc)
                )
                self.audit_repo.create(audit_log)
            else:
                logger.warning(f"Skipping audit log for password changed - no tenant found for user {user.id}")
            
            logger.info(f"Password changed for user {user.id}")
            
            return {
                "success": True,
                "message": "Password has been changed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return {
                "success": False,
                "message": "Password change failed"
            }