from typing import List, Optional
from uuid import UUID

from app.core.exceptions import ResourceNotFoundError
from .models import Currency
from .repository import CurrencyRepository
from .schemas import CurrencyCreateRequest, CurrencyUpdateRequest


class CurrencyService:
    def __init__(self, repository: CurrencyRepository):
        self.repository = repository

    def create_currency(self, tenant_id: UUID, user_id: str, request: CurrencyCreateRequest) -> Currency:
        """Create a new currency."""
        # Check for duplicate code
        existing = self.repository.get_by_code(tenant_id=tenant_id, code=request.code)
        if existing:
            raise ValueError(f"Currency with code '{request.code}' already exists.")

        currency = Currency(
            tenant_id=tenant_id,
            code=request.code,
            name=request.name,
            symbol=request.symbol,
            exchange_rate=request.exchange_rate,
            created_by=user_id,
            updated_by=user_id,
        )
        return self.repository.create(currency)

    def get_currency(self, tenant_id: UUID, currency_id: UUID) -> Currency:
        """Get a currency by ID."""
        currency = self.repository.get_by_id(tenant_id=tenant_id, currency_id=currency_id)
        if not currency:
            raise ResourceNotFoundError(message="Currency not found.")
        return currency

    def list_currencies(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> tuple[List[Currency], int]:
        """List currencies with pagination and search."""
        return self.repository.list(
            tenant_id=tenant_id,
            search=search,
            page=page,
            page_size=page_size,
            include_archived=include_archived,
        )

    def update_currency(
        self, tenant_id: UUID, user_id: str, currency_id: UUID, request: CurrencyUpdateRequest
    ) -> Currency:
        """Update an existing currency."""
        currency = self.get_currency(tenant_id=tenant_id, currency_id=currency_id)

        # Check for duplicate code if code is changed
        if currency.code != request.code:
            existing = self.repository.get_by_code(tenant_id=tenant_id, code=request.code)
            if existing:
                raise ValueError(f"Currency with code '{request.code}' already exists.")

        currency.code = request.code
        currency.name = request.name
        currency.symbol = request.symbol
        currency.exchange_rate = request.exchange_rate
        currency.updated_by = user_id

        return self.repository.update(currency)

    def archive_currency(self, tenant_id: UUID, currency_id: UUID) -> Currency:
        """Soft delete a currency."""
        currency = self.get_currency(tenant_id=tenant_id, currency_id=currency_id)
        return self.repository.archive(currency)
