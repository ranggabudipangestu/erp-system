import redis
from typing import Optional
from datetime import datetime, timedelta

from app.core.config import get_settings


settings = get_settings()


class RateLimiter:
    """Redis-based rate limiter for login attempts"""
    
    def __init__(self):
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            self.redis_client.ping()
        except (redis.ConnectionError, redis.RedisError):
            # Fallback to None if Redis is not available
            self.redis_client = None
    
    def is_rate_limited(self, identifier: str) -> bool:
        """
        Check if identifier is rate limited
        
        Args:
            identifier: IP address or email for rate limiting
            
        Returns:
            True if rate limited, False otherwise
        """
        if not self.redis_client:
            # If Redis is not available, don't apply rate limiting
            return False
        
        key = f"login_attempts:{identifier}"
        
        try:
            current_attempts = self.redis_client.get(key)
            if current_attempts is None:
                return False
            
            return int(current_attempts) >= settings.LOGIN_RATE_LIMIT
        except (redis.ConnectionError, redis.RedisError, ValueError):
            # If Redis operation fails, don't block the user
            return False
    
    def record_attempt(self, identifier: str) -> int:
        """
        Record a login attempt
        
        Args:
            identifier: IP address or email for rate limiting
            
        Returns:
            Current number of attempts
        """
        if not self.redis_client:
            return 0
        
        key = f"login_attempts:{identifier}"
        
        try:
            # Increment attempts counter
            current = self.redis_client.incr(key)
            
            # Set expiration on first attempt
            if current == 1:
                self.redis_client.expire(key, settings.LOGIN_RATE_WINDOW)
            
            return current
        except (redis.ConnectionError, redis.RedisError):
            return 0
    
    def reset_attempts(self, identifier: str) -> bool:
        """
        Reset login attempts for identifier (on successful login)
        
        Args:
            identifier: IP address or email for rate limiting
            
        Returns:
            True if reset successful, False otherwise
        """
        if not self.redis_client:
            return True
        
        key = f"login_attempts:{identifier}"
        
        try:
            self.redis_client.delete(key)
            return True
        except (redis.ConnectionError, redis.RedisError):
            return False
    
    def get_remaining_time(self, identifier: str) -> Optional[int]:
        """
        Get remaining time in seconds until rate limit resets
        
        Args:
            identifier: IP address or email for rate limiting
            
        Returns:
            Remaining seconds or None if not rate limited
        """
        if not self.redis_client:
            return None
        
        key = f"login_attempts:{identifier}"
        
        try:
            ttl = self.redis_client.ttl(key)
            return ttl if ttl > 0 else None
        except (redis.ConnectionError, redis.RedisError):
            return None