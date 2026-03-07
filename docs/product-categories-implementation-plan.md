# Master Data: Product Categories (Hierarchical) — Implementation Plan

Implement a fully functional Product Categories feature with hierarchy support (`parent_id`), following the same patterns as Units.

---

## Key Design Decisions

> [!IMPORTANT]
> The `ProductCategory` model **already exists** in `product/models.py` with a basic structure. We will **refactor** it to match the Units pattern: add `tenant_id`, `code`, `parent_id`, `deleted_at` and remove `is_active`.

- **Hierarchy**: Self-referencing `parent_id` FK to `product_categories.id`. `null` = top-level category.
- **Unique constraint**: `(tenant_id, code)` — same as Units.
- **Soft delete**: `deleted_at` timestamp instead of `is_active` boolean.
- **Existing product FK** (`products.category → product_categories.id`) will be preserved.

---

## Proposed Changes

### Backend — Model & Migration

#### [MODIFY] `backend/app/modules/master_data/product/models.py`

Refactor `ProductCategory`:

- Add `tenant_id` (FK → tenants.id)
- Add `code` (String 50)
- Add `parent_id` (FK → product_categories.id, nullable) for hierarchy
- Replace `is_active` with `deleted_at`
- Add UUID default (`uuid.uuid4`)

#### [NEW] Alembic migration

Alter `product_categories` table: add `tenant_id`, `code`, `parent_id`, `deleted_at`; drop `is_active`; add unique constraint `uq_product_categories_tenant_code`.

---

### Backend — Module (new package)

#### [NEW] `backend/app/modules/master_data/product_categories/__init__.py`

#### [NEW] `backend/app/modules/master_data/product_categories/schemas.py`

- `ProductCategoryBase`: code, name, description (optional), parent_id (optional)
- `ProductCategoryCreateRequest`, `ProductCategoryUpdateRequest`
- `ProductCategoryDto`: full response with `children` (list of nested DTOs)
- `ProductCategoryListResponse`: items, total, page, size

#### [NEW] `backend/app/modules/master_data/product_categories/repository.py`

Standard CRUD + `get_by_code`, `list` with search/pagination, `get_children` for tree traversal.

#### [NEW] `backend/app/modules/master_data/product_categories/service.py`

- Duplicate code check, circular parent validation
- `list_categories` with optional `parent_id` filter and `as_tree` mode

#### [NEW] `backend/app/modules/master_data/product_categories/router.py`

| Method   | Path                       | Description           |
| -------- | -------------------------- | --------------------- |
| `GET`    | `/product-categories`      | List + pagination     |
| `GET`    | `/product-categories/tree` | Hierarchical tree     |
| `POST`   | `/product-categories`      | Create category       |
| `GET`    | `/product-categories/{id}` | Get category detail   |
| `PUT`    | `/product-categories/{id}` | Update category       |
| `DELETE` | `/product-categories/{id}` | Archive (soft delete) |

#### [MODIFY] `backend/app/modules/master_data/router.py`

Register the new `product_categories` router under `/product-categories`.

---

### Backend — Permissions

#### [NEW] `backend/scripts/seed_product_category_permissions.py`

Seed `product_categories.view` permissions for relevant roles (admin, owner, finance, sales, warehouse, production) — same pattern as `seed_unit_permissions.py`.

---

### Frontend — Types & API

#### [NEW] `ui/erp-dashboard/types/productCategories.ts`

- `ProductCategory`, `ProductCategoryCreateRequest`, `ProductCategoryUpdateRequest`

#### [NEW] `ui/erp-dashboard/lib/api/productCategories.ts`

- `ProductCategoriesApi` class with standard CRUD + `getTree`

---

### Frontend — Pages & Components

#### [NEW] `ui/erp-dashboard/components/master-data/product-categories/ProductCategoryForm.tsx`

Form with code, name, description, and parent category dropdown (tree-aware).

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/product-categories/page.tsx`

List page — optionally show parent hierarchy in a "Parent" column.

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/product-categories/create/page.tsx`

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/product-categories/[id]/edit/page.tsx`

---

## Verification Plan

### API Test

- Create parent category (e.g., Elektronik)
- Create child category (e.g., Laptop, parent=Elektronik)
- GET /tree — verify hierarchy
- Edit, archive, verify soft delete

### Browser Test

- Navigate to Product Categories page, verify list renders
- Create → Edit → Archive flow via UI
- Verify parent column shows hierarchy
