from __future__ import annotations

from typing import List, Set, Optional, TypedDict
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.db import session_scope
from app.modules.auth.repository import (
    UserTenantRepository,
    RoleRepository,
    AuthTokenRepository,
)
from app.modules.auth.token_service import TokenService


class SecurityPrincipal(TypedDict):
    user_id: UUID
    tenant_id: UUID
    email: str
    roles: List[str]
    permissions: Set[str]


security_scheme = HTTPBearer(auto_error=False)


def get_session():
    with session_scope() as session:
        yield session


def get_token_service(session=Depends(get_session)) -> TokenService:
    auth_repo = AuthTokenRepository(session)
    return TokenService(auth_repo)


def get_current_principal(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    session=Depends(get_session),
    token_service: TokenService = Depends(get_token_service),
) -> SecurityPrincipal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    payload = token_service.verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    try:
        user_id: UUID = UUID(payload.get("sub"))
        tenant_id: UUID = UUID(payload.get("tenant_id"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")

    email: str = payload.get("email") or ""

    # Resolve roles for this user in current tenant
    user_tenant_repo = UserTenantRepository(session)
    role_repo = RoleRepository(session)

    user_tenant = user_tenant_repo.get_by_user_and_tenant(user_id, tenant_id)
    if not user_tenant:
        # User has no membership to this tenant
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied (tenant mismatch)")

    roles = user_tenant.roles or []

    # Aggregate permissions from roles
    permissions: Set[str] = set()
    for role_name in roles:
        role = role_repo.get_by_name_and_tenant(role_name, tenant_id)
        if role and role.permissions:
            for p in role.permissions:
                permissions.add(p)

    return SecurityPrincipal(
        user_id=user_id,
        tenant_id=tenant_id,
        email=email,
        roles=list(roles),
        permissions=permissions,
    )


def require_permissions(required: List[str]):
    """Dependency factory to enforce required permissions. Returns the principal on success."""

    def _dep(principal: SecurityPrincipal = Depends(get_current_principal)) -> SecurityPrincipal:
        # If no specific permission is required, just ensure authenticated
        if not required:
            return principal

        # Require all listed permissions
        missing = [p for p in required if p not in principal["permissions"]]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join(missing)}",
            )
        return principal

    return _dep