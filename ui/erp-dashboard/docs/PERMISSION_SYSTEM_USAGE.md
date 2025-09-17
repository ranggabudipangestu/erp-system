# Permission Management System Usage Guide

## Overview

The permission management system provides fine-grained access control based on subscription plans, roles, and individual menu permissions. This system supports:

- **Subscription-based feature access** - Features available based on plan (Basic, Professional, Enterprise)
- **Role-based permissions** - Granular permissions per role per menu item
- **Action-level controls** - View, Create, Edit, Delete, Export permissions
- **Dynamic UI rendering** - Menus and actions rendered based on user permissions

## Architecture

```
User → Role(s) → Permissions → Menu Items ← Subscription Plan
```

- Users are assigned one or more roles
- Roles have specific permissions for menu items
- Menu items are filtered by subscription plan
- Final permissions are the union of all role permissions for available menu items

## Backend Implementation

### 1. Database Schema

The system uses these key tables:
- `subscription_plans` - Available plans (Basic, Professional, Enterprise)
- `modules` - Menu categories (Master Data, Sales, etc.)
- `menu_items` - Individual menu items with permission keys
- `plan_menu_items` - Which menu items are available per plan
- `role_permissions` - Granular permissions per role per menu item

### 2. API Endpoints

```typescript
GET /api/v1/permissions/available-menus    // Get menus for current tenant's plan
GET /api/v1/permissions/roles              // Get roles for tenant
POST /api/v1/permissions/roles             // Create role
PUT /api/v1/permissions/roles/{id}         // Update role
DELETE /api/v1/permissions/roles/{id}      // Delete role
GET /api/v1/permissions/user-permissions   // Get current user's permissions
GET /api/v1/permissions/subscription-plans // Get available plans
```

### 3. Permission Service

```python
# Example usage in service
permission_service = PermissionService(db)

# Get available menus based on subscription plan
available_menus = permission_service.get_available_menus_for_tenant(tenant_id)

# Get user's effective permissions
user_permissions = permission_service.get_user_permissions(user_id, tenant_id)
```

## Frontend Implementation

### 1. Permission Provider

Wrap your app with the PermissionProvider to provide permission context:

```tsx
import { PermissionProvider } from '@/hooks/usePermissions';

function App() {
  return (
    <PermissionProvider>
      {/* Your app components */}
    </PermissionProvider>
  );
}
```

### 2. Using Permission Hooks

```tsx
import { usePermissions, PermissionGate } from '@/hooks/usePermissions';

function MyComponent() {
  const { 
    hasPermission, 
    canView, 
    canCreate, 
    canEdit, 
    canDelete, 
    canExport,
    availableMenus 
  } = usePermissions();

  // Check specific permissions
  const canViewProducts = canView('products.view');
  const canCreateProducts = canCreate('products.view');
  
  // Check with custom action
  const hasCustomPermission = hasPermission('products.view', 'can_export');

  return (
    <div>
      {canCreateProducts && (
        <button onClick={handleCreate}>Add Product</button>
      )}
    </div>
  );
}
```

### 3. Permission Gates

Use PermissionGate to conditionally render components:

```tsx
<PermissionGate 
  permission="products.view" 
  action="can_create"
  fallback={<div>You don't have permission to create products</div>}
>
  <button>Add Product</button>
</PermissionGate>
```

### 4. Protected Routes

Protect entire routes with ProtectedPermissionRoute:

```tsx
import ProtectedPermissionRoute from '@/components/auth/ProtectedPermissionRoute';

function ProductsPage() {
  return (
    <ProtectedPermissionRoute 
      permission="products.view"
      fallback={<AccessDeniedPage />}
    >
      <ProductList />
    </ProtectedPermissionRoute>
  );
}
```

### 5. Dynamic Navigation

Use DynamicSidebar to render menus based on permissions:

```tsx
import DynamicSidebar from '@/components/layout/DynamicSidebar';

function Layout({ children }) {
  return (
    <div className="flex">
      <DynamicSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## Common Patterns

### 1. Table with Action Buttons

```tsx
function ProductTable() {
  const { canEdit, canDelete } = usePermissions();

  return (
    <table>
      <tbody>
        {products.map(product => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>
              {canEdit('products.view') && (
                <button onClick={() => edit(product.id)}>Edit</button>
              )}
              {canDelete('products.view') && (
                <button onClick={() => delete(product.id)}>Delete</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 2. Conditional Form Fields

```tsx
function ProductForm() {
  const { canEdit } = usePermissions();

  return (
    <form>
      <input name="name" disabled={!canEdit('products.view')} />
      
      <PermissionGate permission="products.view" action="can_edit">
        <button type="submit">Save</button>
      </PermissionGate>
    </form>
  );
}
```

### 3. Feature Flags Based on Subscription

```tsx
function AdvancedFeatures() {
  const { availableMenus } = usePermissions();
  const isEnterprise = availableMenus?.current_plan === 'enterprise';

  return (
    <div>
      {isEnterprise && (
        <AdvancedReportsSection />
      )}
    </div>
  );
}
```

## Permission Keys Convention

Use a hierarchical naming convention for permission keys:

```
module.feature.action
```

Examples:
- `products.view` - View products
- `sales.invoices.view` - View sales invoices  
- `users.view` - View users
- `roles.view` - View roles

## Role Management

### Creating Roles

Roles are created with specific permissions for menu items:

```tsx
const roleData = {
  name: "Sales Manager",
  description: "Manage sales operations",
  permissions: [
    {
      menu_item_id: "uuid-of-products-menu",
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: false,
      can_export: true
    },
    {
      menu_item_id: "uuid-of-invoices-menu", 
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_export: true
    }
  ]
};

await permissionService.createRole(roleData);
```

### Updating Permissions

```tsx
const updateData = {
  permissions: [
    {
      menu_item_id: "uuid-of-products-menu",
      can_view: true,
      can_create: false, // Removed create permission
      can_edit: true,
      can_delete: false,
      can_export: true
    }
  ]
};

await permissionService.updateRole(roleId, updateData);
```

## Troubleshooting

### Common Issues

1. **Permission not working**: Check that the permission key matches exactly between backend and frontend
2. **Menu not showing**: Verify the menu item is included in the current subscription plan
3. **Permission cache**: The permission context caches permissions - use `refresh()` to reload

### Debugging

```tsx
function DebugPermissions() {
  const { permissions, availableMenus, error } = usePermissions();
  
  console.log('Current permissions:', permissions);
  console.log('Available menus:', availableMenus);
  console.log('Error:', error);
}
```

## Migration Guide

When migrating existing code to use the new permission system:

1. **Replace hard-coded role checks** with permission checks
2. **Update navigation** to use DynamicSidebar
3. **Wrap sensitive routes** with ProtectedPermissionRoute
4. **Add permission gates** around action buttons
5. **Update API calls** to use the new permission endpoints

### Before

```tsx
// Old way
if (user.role === 'admin') {
  showDeleteButton = true;
}
```

### After

```tsx
// New way
const { canDelete } = usePermissions();
const showDeleteButton = canDelete('products.view');
```

## Best Practices

1. **Use descriptive permission keys** that clearly indicate the resource and action
2. **Implement graceful fallbacks** for denied permissions
3. **Cache permissions** appropriately to avoid excessive API calls
4. **Test with different roles** and subscription plans
5. **Keep UI consistent** between different permission levels
6. **Provide clear feedback** when actions are not permitted
7. **Use PermissionGate** for simple show/hide logic
8. **Use ProtectedPermissionRoute** for entire page protection