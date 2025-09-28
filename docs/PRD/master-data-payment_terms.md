# 📄 Product Requirements Document (PRD)  
## Modul: Master Data Payment Terms

### 1. Ringkasan
Modul **Payment Terms** digunakan untuk mendefinisikan syarat pembayaran yang berlaku bagi **Supplier** dan **Customer**.  
Setiap kontak hanya bisa memiliki **satu payment term default**, namun saat membuat transaksi (Purchase Order, Sales Invoice, dll) user masih bisa mengganti payment term secara manual.  

---

### 2. Tujuan
- Menyediakan **master data terpusat** untuk syarat pembayaran.  
- Memastikan transaksi memiliki default payment term dari kontak terkait.  
- Mendukung fleksibilitas override payment term di level transaksi.  
- Menyediakan histori perubahan untuk audit.  

---

### 3. Scope MVP
- **CRUD Payment Terms** (add, edit, delete(soft delete)).  
- Field utama: `code`, `name`, `description`, `due_days`, `early_payment_discount_percent`, `early_payment_discount_days`.  
- Payment term **per tenant**, tidak global.  
- Assign ke kontak (Customer/Supplier).  
- Export payment terms ke CSV/Excel.  
- Audit log untuk perubahan data.  
- RBAC: semua user dengan akses manajemen master data bisa CRUD.  

---

### 4. Data Model

#### Field Payment Terms
- `id` (primary key)  
- `tenant_id` (FK)  
- `code` (string, unique per tenant, digunakan untuk referensi)  
- `name` (string, required, contoh: Net 30, COD)  
- `description` (string, optional)  
- `due_days` (integer, jumlah hari jatuh tempo dari invoice date)  
- `early_payment_discount_percent` (decimal, optional, contoh: 2 = 2%)  
- `early_payment_discount_days` (integer, optional, jumlah hari untuk diskon early payment, contoh: 10 hari)  
- `created_at`, `updated_at`  
- `updated_at`, `updated_at`  
- `deleted_at`, `deleted_at` (untuk soft delete)  

#### Relasi
- **Contacts** → memiliki field `payment_term_id` (FK).  
- **Transactions** (SO/PO/Invoice) → default dari kontak, bisa diubah di transaksi.  

---

### 5. Use Cases
1. **Admin Finance** membuat payment term "Net 30" dengan 30 hari jatuh tempo.  
2. **Admin Procurement** menghubungkan supplier baru dengan payment term "Net 45".  
3. **System** otomatis menambahkan payment term dari kontak ke PO saat dibuat.  
4. **User** melakukan override payment term di transaksi tertentu (misalnya: dari Net 30 ke COD).  
5. **System** menyimpan histori perubahan payment term (misalnya: Supplier A awalnya Net 30, kemudian diubah jadi Net 45).  

---

### 6. Non-Functional Requirements
- **Multi-tenant:** setiap tenant hanya bisa mengakses payment term miliknya.  
- **Soft Delete (archive):** payment term tidak bisa dihapus permanen jika sudah dipakai di kontak atau transaksi.  
- **Audit log:** setiap perubahan (create, update, archive) tercatat.  
- **Performance:** dropdown search untuk 100+ payment terms tetap responsif.  

---

### 7. Out of Scope (MVP)
- Import payment terms.  
- Multi-currency support.  
- Advanced installment schedule (cicilan bertingkat).  

---

### 8. RFC – Implementasi Teknis (High Level)

#### API Endpoints (contoh)
- `POST /payment-terms` → create payment term  
- `GET /payment-terms` → list + filter (active/archived)  
- `GET /payment-terms/{id}` → detail  
- `PUT /payment-terms/{id}` → update  
- `DELETE /payment-terms/{id}` → soft delete  
- `GET /payment-terms/export` → export CSV/Excel  

#### Database (contoh schema SQL)
```sql
CREATE TABLE payment_terms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  due_days INT,
  early_payment_discount_percent DECIMAL(5,2),
  early_payment_discount_days INT,
  created_at DATETIME,
  updated_at DATETIME,
  deleted_at DATETIME
  UNIQUE (tenant_id, code)
);

ALTER TABLE contacts ADD COLUMN payment_term_id BIGINT NULL;
ALTER TABLE contacts ADD CONSTRAINT fk_payment_term FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id);
