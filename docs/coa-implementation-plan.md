# Chart of Account (CoA) — Implementation Plan

Membuat fitur master data **Chart of Account** dengan hierarki 3 level, per-tenant, default CoA saat register, dan UI di Next.js.

---

## Proposed Changes

### Backend — CoA Module

#### [NEW] `backend/app/modules/master_data/chart_of_accounts/models.py`

- Model `ChartOfAccount` dengan kolom:
  - `id` UUID, primary key, `default=uuid.uuid4`
  - `tenant_id` FK → `tenants.id`
  - `parent_id` FK → `chart_of_accounts.id` (nullable, self-referential)
  - `code` String(20), unique per tenant
  - `name` String(200)
  - `account_type` String(20) — enum: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`
  - `normal_balance` String(6) — enum: `DEBIT`, `CREDIT`
  - `level` Integer (1, 2, atau 3) — dihitung otomatis di service
  - `description` Text, nullable
  - `is_active` Boolean, default True
  - `created_at`, `updated_at`, `created_by`, `updated_by`
  - `deleted_at` (untuk soft delete)
- Constraint: `UniqueConstraint("tenant_id", "code")`

#### [NEW] `backend/app/modules/master_data/chart_of_accounts/schemas.py`

- `AccountType` Enum: `ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE`
- `NormalBalance` Enum: `DEBIT | CREDIT`
- `CreateChartOfAccountDto` — input create
- `UpdateChartOfAccountDto` — input update
- `ChartOfAccountDto` — response, `model_config = ConfigDict(from_attributes=True)`
- `ChartOfAccountTreeDto` — response dengan field `children: list[ChartOfAccountTreeDto]` (untuk tree view)
- `ChartOfAccountListResponse` — untuk paginated list

#### [NEW] `backend/app/modules/master_data/chart_of_accounts/repository.py`

- `get_by_id`, `get_by_code`, `create`, `update`, `archive`
- `list(tenant_id, search, page, page_size, account_type, include_archived)`
- `get_tree(tenant_id)` — query semua akun, di-build jadi hierarki tree di service

#### [NEW] `backend/app/modules/master_data/chart_of_accounts/service.py`

- `create_account`: validasi parent (max level 2 agar child-nya jadi level 3), validasi kode unik
- `update_account`: validasi parent tidak menyebabkan circular reference
- `get_tree`: build nested tree dari flat list
- `list_accounts`: flat paginated list (untuk tabel)
- `seed_default_coa(tenant_id, created_by)`: membuat set akun default lengkap (Asset s/d Expense)

#### [NEW] `backend/app/modules/master_data/chart_of_accounts/router.py`

Endpoints:
| Method | Path | Keterangan |
|--------|------|------------|
| `GET` | `/chart-of-accounts` | List flat + filter + pagination |
| `GET` | `/chart-of-accounts/tree` | Hierarki tree untuk UI |
| `POST` | `/chart-of-accounts` | Buat akun baru |
| `GET` | `/chart-of-accounts/{id}` | Detail akun |
| `PUT` | `/chart-of-accounts/{id}` | Update akun |
| `DELETE` | `/chart-of-accounts/{id}` | Soft delete (archive) |

---

### Backend — Auth Integration (Default CoA saat Register)

#### [MODIFY] `backend/app/modules/auth/service.py`

- Tambahkan metode `create_default_coa(tenant_id)` di class `TenantProvisioningService`
- Panggil metode ini dari `SignupService.signup()` setelah `create_default_roles()` (baris ~306)
- Default CoA mencakup akun-akun standard Indonesia (lihat daftar di bawah)

**Contoh data default CoA:**

```
Level 1:  1000 - Aset (ASSET, DEBIT)
Level 2:    1100 - Aset Lancar (ASSET, DEBIT)
Level 3:      1110 - Kas (ASSET, DEBIT)
Level 3:      1120 - Bank (ASSET, DEBIT)
Level 3:      1130 - Piutang Usaha (ASSET, DEBIT)
Level 2:    1200 - Aset Tetap (ASSET, DEBIT)
Level 3:      1210 - Peralatan (ASSET, DEBIT)
Level 1:  2000 - Liabilitas (LIABILITY, CREDIT)
Level 2:    2100 - Liabilitas Jangka Pendek (LIABILITY, CREDIT)
Level 3:      2110 - Hutang Usaha (LIABILITY, CREDIT)
Level 1:  3000 - Ekuitas (EQUITY, CREDIT)
Level 3:      3100 - Modal Pemilik (EQUITY, CREDIT)
Level 1:  4000 - Pendapatan (REVENUE, CREDIT)
Level 3:      4100 - Pendapatan Penjualan (REVENUE, CREDIT)
Level 1:  5000 - Beban (EXPENSE, DEBIT)
Level 3:      5100 - Beban Gaji (EXPENSE, DEBIT)
Level 3:      5200 - Beban Operasional (EXPENSE, DEBIT)
```

---

### Backend — Alembic Migration

#### [NEW] `backend/alembic/versions/xxxx_create_chart_of_accounts_table.py`

- Buat tabel `chart_of_accounts` dengan semua kolom di atas
- Self-referential FK `parent_id → chart_of_accounts.id`

---

### Backend — Routing

#### [MODIFY] `backend/app/modules/master_data/router.py`

- Tambahkan `include_router` untuk `chart_of_accounts_router` dengan prefix `/chart-of-accounts`

---

### Frontend — Pages

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/chart-of-accounts/page.tsx`

- Halaman list CoA dengan **tree view** (collapsed/expand per level)
- Tombol "Tambah Akun Root", filter by `account_type`
- Setiap row: tombol Edit, Delete (dengan konfirmasi)
- Breadcrumb: Master Data → Chart of Account

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/chart-of-accounts/create/page.tsx`

- Form buat akun baru

#### [NEW] `ui/erp-dashboard/app/(admin)/master-data/chart-of-accounts/[id]/edit/page.tsx`

- Form edit akun

---

### Frontend — Components

#### [NEW] `ui/erp-dashboard/components/master-data/chart-of-accounts/ChartOfAccountForm.tsx`

- Form shared (dipakai oleh create dan edit page)
- Field: `code`, `name`, `account_type` (dropdown), `normal_balance` (auto-suggest berdasarkan type), `parent_id` (dropdown dengan search, hanya tampilkan akun level 1 & 2), `description`, `is_active`
- Auto-suggest `normal_balance`: ASSET/EXPENSE → DEBIT, LIABILITY/EQUITY/REVENUE → CREDIT

#### [NEW] `ui/erp-dashboard/components/master-data/chart-of-accounts/CoATreeTable.tsx`

- Komponen tree table yang bisa expand/collapse per parent
- Visual indentasi per level (level 1 bold, level 2, level 3 normal)
- Badge per `account_type` dengan warna berbeda

---

## Verification Plan

### 1. Backend — Manual API Test (Swagger UI)

Jalankan `make dev`, buka [http://localhost:8000/docs](http://localhost:8000/docs):

1. `POST /auth/signup` → daftar tenant baru → cek response sukses
2. Login dengan akun baru, ambil `access_token`
3. `GET /master-data/chart-of-accounts/tree` → pastikan default CoA sudah muncul (level 1–3)
4. `POST /master-data/chart-of-accounts` → buat akun baru (level 3, parent_id diisi)
5. `PUT /master-data/chart-of-accounts/{id}` → update nama akun
6. `DELETE /master-data/chart-of-accounts/{id}` → soft delete
7. `GET /master-data/chart-of-accounts` → pastikan akun yang dihapus tidak muncul
8. Coba buat akun level 4 (parent adalah akun level 3) → harus gagal dengan error validasi

### 2. Frontend — Manual UI Test

Buka [http://localhost:3000/master-data/chart-of-accounts](http://localhost:3000/master-data/chart-of-accounts):

1. Tree table default CoA langsung terlihat setelah login
2. Klik expand/collapse pada row parent
3. Klik "Tambah Akun" → isi form → save → akun baru muncul di tree
4. Klik Edit pada akun yang ada → ubah nama → save → nama terupdate
5. Klik Delete → konfirmasi → akun hilang dari list
