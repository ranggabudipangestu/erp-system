# 📄 Product Requirements Document (PRD)  
## Modul: Master Data Kontak

### 1. Ringkasan
Modul **Master Data Kontak** menyediakan basis data terpusat untuk menyimpan informasi terkait **Customer, Supplier, dan Karyawan**.  
Modul ini akan digunakan lintas modul ERP (Sales, Procurement, Finance, HR, Manufacturing).  
Kontak bisa memiliki lebih dari satu peran (contoh: seorang individu bisa tercatat sebagai Customer sekaligus Supplier).  

---

### 2. Tujuan
- Menyediakan satu sumber data yang konsisten untuk semua modul.  
- Memudahkan pencarian dan manajemen kontak per tenant.  
- Mendukung integrasi dengan transaksi inti (Sales Order, Purchase Order, Invoice, Payroll, dll).  
- Memastikan data kontak tidak ganda (deduplication).  

---

### 3. Scope MVP
- **CRUD kontak** dengan aturan hanya bisa di-*archive* (tidak benar-benar dihapus).  
- Mendukung tiga tipe utama: **Customer, Supplier, Karyawan**.  
- Setiap kontak bisa memiliki lebih dari satu tipe.  
- Fitur **search & filter** berdasarkan kategori (role) dan nama.  
- **Import/export** data kontak via CSV/Excel.  
- **Deduplication** otomatis saat create/update kontak (cek by `code`).  
- **RBAC dasar**: hanya user dengan role tertentu bisa tambah/edit/hapus kontak.  

---

### 4. Data Model

#### Field Dasar (semua tipe)
- `code` (string, unique per tenant, digunakan untuk deduplication)  
- `name` (string, required)  
- `email` (string, optional)  
- `phone` (string, optional)  
- `address_billing` (string, opsional, relevan untuk Customer)  
- `address_shipping` (string, opsional, relevan untuk Customer)  
- `tax_number` (string, opsional, NPWP)  
- `roles` (array: [Customer, Supplier, Employee])  
- `status` (enum: Active, Archived)  
- `created_at`, `updated_at`  

#### Field Tambahan per Tipe
- **Customer**  
  - `credit_limit`  
  - `distribution_channel`  
  - `pic_name`  

- **Supplier**  
  - `bank_account_number`  
  - `payment_terms`  
  - `sales_contact_name`  

- **Karyawan**  
  - `employee_id`  
  - `department`  
  - `job_title`  
  - `employment_status` (permanent, contract, intern, etc.)  

---

### 5. Use Cases
1. **Admin Sales** menambahkan customer baru untuk transaksi Sales Order.  
2. **Finance** mengakses informasi supplier untuk membuat Purchase Order dan Invoice.  
3. **HR** mengelola data karyawan untuk kebutuhan payroll.  
4. **User** mencari kontak berdasarkan nama atau role.  
5. **System** melakukan pengecekan otomatis agar tidak ada duplikasi `code`.  
6. **User** melakukan archive kontak yang tidak aktif, tanpa menghapus data historis transaksinya.  

---

### 6. Non-Functional Requirements
- **Multi-tenant:** setiap tenant hanya bisa mengakses datanya sendiri.  
- **Soft Delete (archive):** kontak yang sudah terkait transaksi tidak bisa dihapus permanen.  
- **Scalability:** harus bisa menangani ribuan kontak per tenant.  
- **Performance:** search/filter harus tetap cepat (<2 detik untuk 10.000+ data).  

---

### 7. Out of Scope (MVP)
- Integrasi dengan sistem eksternal (CRM, HRIS).  
- Custom field per tenant.  
- Tagging & grouping kontak.  
- Approval workflow yang kompleks.  

---

### 8. RFC – Implementasi Teknis (High Level)

#### API Endpoints (contoh)
- `POST /master-data/contacts` → create contact  
- `GET /master-data/contacts` → list + filter by role, name  
- `GET /master-data/contacts/{id}` → detail contact  
- `PUT /master-data/contacts/{id}` → update contact  
- `DELETE /master-data/contacts/{id}` → archive contact  
- `POST /master-data/contacts/import` → import CSV/Excel  
- `GET /master-data/contacts/export` → export CSV/Excel  

#### Database (contoh schema SQL)
```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(50),
  address_billing TEXT,
  address_shipping TEXT,
  tax_number VARCHAR(50),
  roles JSON, -- ["Customer", "Supplier", "Employee"]
  status ENUM('Active','Archived') DEFAULT 'Active',
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE (tenant_id, code)
);
