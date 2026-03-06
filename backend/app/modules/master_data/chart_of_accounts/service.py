from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from .models import ChartOfAccount
from .repository import ChartOfAccountRepository
from .schemas import (
    AccountType,
    ChartOfAccountDto,
    ChartOfAccountListResponse,
    ChartOfAccountTreeDto,
    CreateChartOfAccountDto,
    NormalBalance,
    UpdateChartOfAccountDto,
)


class ChartOfAccountService:
    def __init__(self, repository: ChartOfAccountRepository):
        self.repository = repository

    def create_account(self, tenant_id: UUID, payload: CreateChartOfAccountDto) -> ChartOfAccountDto:
        # Check for duplicate code
        existing = self.repository.get_by_code(tenant_id, payload.code)
        if existing:
            raise ValueError(f"Account with code '{payload.code}' already exists")

        level = 1
        if payload.parent_id:
            parent = self.repository.get_by_id(tenant_id, payload.parent_id)
            if not parent:
                raise ValueError(f"Parent account with ID '{payload.parent_id}' not found")
            if parent.level >= 3:
                raise ValueError("Cannot add child to a level 3 account. Maximum hierarchy depth is 3 levels.")
            level = parent.level + 1

        account = ChartOfAccount(
            id=uuid4(),
            tenant_id=tenant_id,
            parent_id=payload.parent_id,
            code=payload.code,
            name=payload.name,
            account_type=payload.account_type.value,
            normal_balance=payload.normal_balance.value,
            level=level,
            description=payload.description,
            is_active=payload.is_active,
            created_by=payload.created_by,
            created_at=datetime.now(timezone.utc),
        )
        created = self.repository.create(account)
        return ChartOfAccountDto.model_validate(created)

    def get_account(self, tenant_id: UUID, account_id: UUID) -> Optional[ChartOfAccountDto]:
        account = self.repository.get_by_id(tenant_id, account_id)
        if not account:
            return None
        return ChartOfAccountDto.model_validate(account)

    def update_account(
        self, tenant_id: UUID, account_id: UUID, payload: UpdateChartOfAccountDto
    ) -> ChartOfAccountDto:
        account = self.repository.get_by_id(tenant_id, account_id)
        if not account:
            raise ValueError(f"Account with ID '{account_id}' not found")

        # Check for duplicate code (if changed)
        if payload.code != account.code:
            existing = self.repository.get_by_code(tenant_id, payload.code)
            if existing:
                raise ValueError(f"Account with code '{payload.code}' already exists")

        # Validate new parent
        new_level = account.level
        if payload.parent_id != account.parent_id:
            if payload.parent_id:
                parent = self.repository.get_by_id(tenant_id, payload.parent_id)
                if not parent:
                    raise ValueError(f"Parent account with ID '{payload.parent_id}' not found")
                if parent.level >= 3:
                    raise ValueError("Cannot move account under a level 3 parent. Maximum depth is 3.")
                # Prevent circular reference
                if str(parent.id) == str(account_id):
                    raise ValueError("Account cannot be its own parent")
                new_level = parent.level + 1
            else:
                new_level = 1

        account.code = payload.code
        account.name = payload.name
        account.account_type = payload.account_type.value
        account.normal_balance = payload.normal_balance.value
        account.parent_id = payload.parent_id
        account.level = new_level
        account.description = payload.description
        account.is_active = payload.is_active
        account.updated_by = payload.updated_by
        account.updated_at = datetime.now(timezone.utc)

        updated = self.repository.update(account)
        return ChartOfAccountDto.model_validate(updated)

    def archive_account(self, tenant_id: UUID, account_id: UUID) -> bool:
        account = self.repository.get_by_id(tenant_id, account_id)
        if not account:
            return False
        if self.repository.has_active_children(tenant_id, account_id):
            raise ValueError("Cannot archive an account that has active child accounts. Archive children first.")
        self.repository.archive(account)
        return True

    def list_accounts(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        account_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> ChartOfAccountListResponse:
        items, total = self.repository.list(
            tenant_id=tenant_id,
            search=search,
            account_type=account_type,
            page=page,
            page_size=page_size,
            include_archived=include_archived,
        )
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return ChartOfAccountListResponse(
            items=[ChartOfAccountDto.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_tree(self, tenant_id: UUID) -> List[ChartOfAccountTreeDto]:
        """Return all active accounts as a nested tree (level 1 → children)."""
        all_accounts = self.repository.get_all_for_tree(tenant_id)

        # Build a map of id → TreeDto (without children yet)
        dto_map: dict[str, ChartOfAccountTreeDto] = {}
        for acc in all_accounts:
            dto_map[str(acc.id)] = ChartOfAccountTreeDto(
                id=acc.id,
                tenant_id=acc.tenant_id,
                parent_id=acc.parent_id,
                code=acc.code,
                name=acc.name,
                account_type=acc.account_type,
                normal_balance=acc.normal_balance,
                level=acc.level,
                description=acc.description,
                is_active=acc.is_active,
                children=[],
            )

        roots: List[ChartOfAccountTreeDto] = []
        for acc in all_accounts:
            dto = dto_map[str(acc.id)]
            if acc.parent_id and str(acc.parent_id) in dto_map:
                dto_map[str(acc.parent_id)].children.append(dto)
            else:
                roots.append(dto)

        return roots

    def seed_default_coa(self, tenant_id: UUID, created_by: str = "system") -> List[ChartOfAccount]:
        """Create default Chart of Accounts for a new tenant."""
        # fmt: off
        # Level is intentionally NOT hardcoded here — it is computed from parent_code at insert time.
        default_accounts = [
            # Level 1 — Root categories
            {"code": "1000", "name": "Aset",                          "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": None},
            {"code": "2000", "name": "Liabilitas",                    "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": None},
            {"code": "3000", "name": "Ekuitas",                       "type": AccountType.EQUITY,     "balance": NormalBalance.CREDIT, "parent_code": None},
            {"code": "4000", "name": "Pendapatan",                    "type": AccountType.REVENUE,    "balance": NormalBalance.CREDIT, "parent_code": None},
            {"code": "5000", "name": "Beban",                         "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": None},
            {"code": "6000", "name": "Harga Pokok Penjualan",          "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": None},
            # Level 2 — Aset sub-categories
            {"code": "1100", "name": "Aset Lancar",                   "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1000"},
            {"code": "1200", "name": "Aset Tetap",                    "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1000"},
            # Level 2 — Liabilitas sub-categories
            {"code": "2100", "name": "Liabilitas Jangka Pendek",      "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2000"},
            {"code": "2200", "name": "Liabilitas Jangka Panjang",     "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2000"},
            # Level 2 — Ekuitas sub-categories (children of 3000=L1, so L2)
            {"code": "3100", "name": "Modal Pemilik",                 "type": AccountType.EQUITY,     "balance": NormalBalance.CREDIT, "parent_code": "3000"},
            {"code": "3200", "name": "Laba Ditahan",                  "type": AccountType.EQUITY,     "balance": NormalBalance.CREDIT, "parent_code": "3000"},
            # Level 2 — Pendapatan sub-categories (children of 4000=L1, so L2)
            {"code": "4100", "name": "Pendapatan Penjualan",          "type": AccountType.REVENUE,    "balance": NormalBalance.CREDIT, "parent_code": "4000"},
            {"code": "4200", "name": "Pendapatan Lain-lain",          "type": AccountType.REVENUE,    "balance": NormalBalance.CREDIT, "parent_code": "4000"},
            # Level 2 — Beban sub-categories (children of 5000=L1, so L2)
            {"code": "5100", "name": "Beban Gaji",                    "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "5000"},
            {"code": "5200", "name": "Beban Operasional",             "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "5000"},
            {"code": "5300", "name": "Beban Penyusutan",              "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "5000"},
            {"code": "5400", "name": "Beban Pajak",                   "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "5000"},
            {"code": "5900", "name": "Beban Lain-lain",               "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "5000"},
            # Level 2 — HPP sub-categories (children of 6000=L1, so L2)
            {"code": "6100", "name": "HPP Bahan Baku",                "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "6000"},
            {"code": "6200", "name": "HPP Tenaga Kerja Langsung",     "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "6000"},
            {"code": "6300", "name": "HPP Overhead Pabrik",           "type": AccountType.EXPENSE,    "balance": NormalBalance.DEBIT,  "parent_code": "6000"},
            # Level 3 — Aset Lancar
            {"code": "1110", "name": "Kas",                           "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1100"},
            {"code": "1120", "name": "Bank",                          "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1100"},
            {"code": "1130", "name": "Piutang Usaha",                 "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1100"},
            {"code": "1140", "name": "Persediaan",                    "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1100"},
            # Level 3 — Aset Tetap
            {"code": "1210", "name": "Peralatan",                     "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1200"},
            {"code": "1220", "name": "Kendaraan",                     "type": AccountType.ASSET,      "balance": NormalBalance.DEBIT,  "parent_code": "1200"},
            {"code": "1230", "name": "Akumulasi Penyusutan Aset",     "type": AccountType.ASSET,      "balance": NormalBalance.CREDIT, "parent_code": "1200"},
            # Level 3 — Liabilitas Jangka Pendek
            {"code": "2110", "name": "Hutang Usaha",                  "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2100"},
            {"code": "2120", "name": "Hutang Pajak",                  "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2100"},
            {"code": "2130", "name": "Beban yang Masih Harus Dibayar","type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2100"},
            # Level 3 — Liabilitas Jangka Panjang
            {"code": "2210", "name": "Hutang Bank Jangka Panjang",    "type": AccountType.LIABILITY,  "balance": NormalBalance.CREDIT, "parent_code": "2200"},
        ]
        # fmt: on
        now = datetime.now(timezone.utc)

        # Build level map: code -> level (computed from parent, not hardcoded)
        code_to_level: dict[str, int] = {}
        code_to_id: dict[str, UUID] = {}
        accounts_to_create: List[ChartOfAccount] = []

        for data in default_accounts:
            new_id = uuid4()
            parent_code = data["parent_code"]
            parent_id = code_to_id.get(parent_code) if parent_code else None
            # Auto-compute level: root = 1, otherwise parent_level + 1
            level = (code_to_level[parent_code] + 1) if parent_code else 1
            code_to_level[data["code"]] = level

            acc = ChartOfAccount(
                id=new_id,
                tenant_id=tenant_id,
                parent_id=parent_id,
                code=data["code"],
                name=data["name"],
                account_type=data["type"].value,
                normal_balance=data["balance"].value,
                level=level,
                is_active=True,
                created_by=created_by,
                created_at=now,
            )
            code_to_id[data["code"]] = new_id
            accounts_to_create.append(acc)

        return self.repository.create_many(accounts_to_create)
