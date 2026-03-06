#!/usr/bin/env python
"""
Seed default Chart of Accounts for tenants that don't have any CoA yet.

Usage (jalankan dari root project):
    make seed-coa

Atau langsung:
    cd backend && python scripts/seed_default_coa.py

Flags:
    --dry-run    Lihat tenant yang akan di-seed tanpa menulis ke DB
    --tenant-id  Seed hanya untuk 1 tenant (UUID)
"""
import sys
import os
import argparse

# Pastikan 'backend/' di sys.path agar import 'app.*' bisa resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.db import init_engine_and_session, session_scope
from app.modules.master_data.chart_of_accounts.repository import ChartOfAccountRepository
from app.modules.master_data.chart_of_accounts.service import ChartOfAccountService

# Import Tenant model agar metadata-nya terdaftar
from app.modules.auth.models import Tenant  # noqa: F401


def main():
    parser = argparse.ArgumentParser(description="Seed default CoA untuk tenant yang belum punya akun.")
    parser.add_argument("--dry-run", action="store_true", help="Tampilkan tenant yang akan diskip/seed tanpa mengubah DB")
    parser.add_argument("--tenant-id", type=str, default=None, help="Seed hanya untuk tenant dengan UUID ini")
    args = parser.parse_args()

    init_engine_and_session(settings.database_url)

    from sqlalchemy import text

    with session_scope() as session:
        # Ambil semua tenant (atau 1 tenant jika --tenant-id diberikan)
        if args.tenant_id:
            rows = session.execute(
                text("SELECT id, name FROM tenants WHERE id = :tid"),
                {"tid": args.tenant_id}
            ).fetchall()
        else:
            rows = session.execute(text("SELECT id, name FROM tenants ORDER BY name")).fetchall()

        if not rows:
            print("Tidak ada tenant ditemukan.")
            return

        coa_repo = ChartOfAccountRepository(session)
        coa_service = ChartOfAccountService(coa_repo)

        seeded = 0
        skipped = 0

        for row in rows:
            tenant_id = row[0]
            tenant_name = row[1]
            count = coa_repo.count_by_tenant(tenant_id)

            if count > 0:
                print(f"  [SKIP]   {tenant_name} ({tenant_id}) — sudah punya {count} akun")
                skipped += 1
                continue

            if args.dry_run:
                print(f"  [DRY-RUN] {tenant_name} ({tenant_id}) — akan di-seed")
            else:
                print(f"  [SEED]   {tenant_name} ({tenant_id}) — menyisipkan akun default...", end="", flush=True)
                coa_service.seed_default_coa(tenant_id=tenant_id, created_by="system:seed_script")
                print(" ✓")
            seeded += 1

        print()
        if args.dry_run:
            print(f"DRY-RUN selesai: {seeded} tenant akan di-seed, {skipped} tenant dilewati.")
        else:
            print(f"Selesai: {seeded} tenant di-seed, {skipped} tenant dilewati.")


if __name__ == "__main__":
    main()
