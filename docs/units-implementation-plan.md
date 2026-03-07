# Master Data: Units — Implementation Plan

Implement a fully functional Units of Measurement feature for the ERP system, following standard master data patterns.

---

## Key Design Decisions

- **Fields**: `code` (String 50), `name` (String 100), `value` (Numeric 15,4 — represents unit quantity, e.g. BOX40 = 40)
- **Soft delete**: `deleted_at` timestamp (no `is_active` boolean)
- **Unique constraint**: `(tenant_id, code)`
- **Multi-tenant**: Scoped by `tenant_id` FK → `tenants.id`

---

## Proposed Changes

### Backend — Model & Migration

#### [NEW] `backend/app/modules/master_data/units/models.py`

- Model `Unit`:
  - `id` UUID, primary key, `default=uuid.uuid4`
  - `tenant_id` FK → `tenants.id`
  - `code` String(50)
  - `name` String(100)
  - `value` Numeric(15,4), default=1
  - `deleted_at` DateTime (nullable, soft delete)
  - `created_at`, `updated_at`, `created_by`, `updated_by`
- Constraint: `UniqueConstraint("tenant_id", "code", name="uq_units_tenant_code")`

#### [NEW] Alembic migration — `create_units_table`

#### [NEW] Alembic migration — `replace_symbol_with_value_in_units`

---

### Backend — Module

#### [NEW] `backend/app/modules/master_data/units/schemas.py`

- `UnitBase`: code, name, value (Decimal, ge=0)
- `UnitCreateRequest`, `UnitUpdateRequest`
- `UnitDto`: full response with `from_attributes=True`
- `UnitListResponse`: items, total, page, size

#### [NEW] `backend/app/modules/master_data/units/repository.py`

Standard CRUD + `get_by_code` (checks all records including archived), `list` with search/pagination/include_archived.

#### [NEW] `backend/app/modules/master_data/units/service.py`

- Duplicate code check (including archived, for unique constraint alignment)
- `list_units` with pagination

#### [NEW] `backend/app/modules/master_data/units/router.py`

| Method   | Path          | Description        |
| -------- | ------------- | ------------------ |
| `GET`    | `/units`      | List + pagination  |
| `POST`   | `/units`      | Create unit        |
| `GET`    | `/units/{id}` | Get unit detail    |
| `PUT`    | `/units/{id}` | Update unit        |
| `DELETE` | `/units/{id}` | Archive (soft del) |

#### [MODIFY] `backend/app/modules/master_data/router.py`

Register units router under `/units`.

---

### Backend — Permissions

#### [NEW] `backend/scripts/seed_unit_permissions.py`

Seed `units.view` permissions for roles: admin, owner, finance, sales, warehouse, production.

---

### Frontend — Types & API

#### [NEW] `ui/erp-dashboard/types/units.ts`

- `Unit`, `UnitCreateRequest`, `UnitUpdateRequest`, `UnitListResponse`

#### [NEW] `ui/erp-dashboard/lib/api/units.ts`

- `UnitsApi` class with `getUnits`, `getUnit`, `createUnit`, `updateUnit`, `deleteUnit`
- Uses standard `ApiResponse<T>` envelope

---

### Frontend — Pages & Components

#### [NEW] `ui/erp-dashboard/components/master-data/units/UnitForm.tsx`

Form with code, name, value (numeric input with helper text).

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/units/page.tsx`

List page with DataTable, search, include archived filter, pagination.

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/units/create/page.tsx`

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/units/[id]/edit/page.tsx`

---

## Verification Plan

### API Test

- Create unit (PCS, value=1), create unit (BOX40, value=40)
- List units, verify pagination metadata
- Update unit, verify changes
- Archive unit, verify soft delete

### Browser Test

- Navigate to Units page, verify list renders
- Create → Edit → Archive flow
