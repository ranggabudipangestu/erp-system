from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, Boolean, Integer, Numeric
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.db import Base


class Product(Base):
    __tablename__ = "Products"
    __table_args__ = (
        {"schema": "masterdata"},
    )

    id: Mapped[UUID] = mapped_column("Id", PG_UUID(as_uuid=True), primary_key=True)
    code: Mapped[str] = mapped_column("Code", String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column("Name", String(200), nullable=False)
    description: Mapped[str | None] = mapped_column("Description", String(1000), nullable=True)
    category: Mapped[str | None] = mapped_column("Category", String(100), nullable=True)
    brand: Mapped[str | None] = mapped_column("Brand", String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column("Unit", String(50), nullable=True)
    price: Mapped[float] = mapped_column("Price", Numeric(18, 2), nullable=False, default=0)
    cost_price: Mapped[float] = mapped_column("CostPrice", Numeric(18, 2), nullable=False, default=0)
    stock_quantity: Mapped[int] = mapped_column("StockQuantity", Integer, nullable=False, default=0)
    minimum_stock: Mapped[int] = mapped_column("MinimumStock", Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column("IsActive", Boolean, nullable=False, default=True)
    image_url: Mapped[str | None] = mapped_column("ImageUrl", String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("UpdatedAt", DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column("CreatedBy", String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column("UpdatedBy", String(100), nullable=True)


# Unique constraint on Code is enforced via the column definition above.
