# RBAC & Navigation Flow

This document explains how role-based access control (RBAC) and menu rendering work across the ERP system after the latest changes.

## Overview

The RBAC implementation spans both backend and frontend. Roles and permissions live in the `auth` module, navigation metadata lives in the `permissions` module, and the UI consumes a REST endpoint to render menus dynamically. Tokens issued at login embed the user’s roles and aggregated permission keys to simplify request authorization.

The key steps are:

1. Seed available modules, menu items, subscription plans, and default roles.
2. Issue JWTs that include the caller’s roles and permissions.
3. Guard backend endpoints with `get_current_principal` and `require_permissions`.
4. Expose `GET /api/v1/permissions/navigation` to return the caller’s menu tree.
5. Render the sidebar on the frontend using that API instead of static JSON.

## Backend Flow

### Permission Metadata

- **Module & menu definitions**: `backend/app/modules/permissions/menu_definitions.py` holds the canonical list of modules and menu items (`permission_key`, `route`, `icon`, etc.).
- **Seeding**: `seed_permission_data.py` creates subscription plans, modules, and menu items based on the definitions, then associates them with plan tiers.
- **Default roles**: `seed_default_roles.py` (and runtime tenant provisioning) create `owner`, `admin`, `finance`, `sales`, `warehouse`, `production` roles per tenant with appropriate permission arrays.

### Token issuance & security

- `TokenService.generate_access_token` resolves the user’s tenant roles and aggregates all permission keys before embedding them in the JWT payload (`roles`, `permissions`).
- `get_current_principal` (in `backend/app/core/security.py`) verifies the token, rehydrates the principal, and returns a `SecurityPrincipal` that contains `tenant_id`, `user_id`, `roles`, and a set of permission keys.
- `require_permissions([...])` checks the principal’s permission set declaratively in route dependencies.

### Navigation endpoint

- `PermissionService.get_navigation_for_user` builds a module → menu tree filtered to permission keys the caller owns and to menu items included in the tenant’s subscription plan.
- `GET /api/v1/permissions/navigation` (in `backend/app/modules/permissions/router.py`) returns a `NavigationResponse` with modules and routable menu entries.

## Frontend Flow

### Data access

- `permissionService.getNavigation()` (`ui/erp-dashboard/lib/api/permissions.ts`) calls the navigation endpoint with the bearer token automatically attached.
- `useMenuData` hook (`ui/erp-dashboard/hooks/useMenuData.ts`) fetches navigation, maps server icons to UI icons, and outputs the menu tree expected by `MenuRenderer`.

### Sidebar rendering

- `AppSidebar` consumes `useMenuData`, handles loading/error states, and passes the menu tree to `MenuRenderer`.
- `MenuRenderer` recursively renders the modules and their child entries, matching the previous static structure but now driven by roles.

## Auditing and logout

- Auth failures/successes are logged in `audit_logs`; after the latest fix, tenant context is attached. `AuthService.logout` revokes all tokens for the caller and records a logout audit entry.
- Frontend `UserDropdown` invokes the logout endpoint, clears local storage/cookies, and redirects to `/login`.

## Testing Tips

1. Run the seed migrations (`seed_permission_data.py`, `seed_default_roles.py`) after pulling the changes to populate modules, menu items, and default roles.
2. Create multiple roles (e.g., admin vs. finance) and log in as each to confirm the sidebar menus differ accordingly.
3. Hit `GET /api/v1/permissions/navigation` directly (curl/Postman) with a bearer token to inspect the returned structure.
4. Attempt to access protected endpoints without the required permission to confirm `require_permissions` blocks the request.

## Files of Interest

- Backend
  - `backend/app/core/security.py`
  - `backend/app/modules/permissions/menu_definitions.py`
  - `backend/app/modules/permissions/service.py`
  - `backend/app/modules/permissions/router.py`
  - `backend/app/modules/auth/service.py` (tenant provisioning)
  - `backend/app/modules/auth/auth_service.py` (authenticate & logout)
- Frontend
  - `ui/erp-dashboard/lib/api/permissions.ts`
  - `ui/erp-dashboard/hooks/useMenuData.ts`
  - `ui/erp-dashboard/layout/AppSidebar.tsx`
  - `ui/erp-dashboard/components/menu/MenuRenderer.tsx`

Keep this document in sync as you add new modules or change navigation behavior.
