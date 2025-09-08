from datetime import datetime
from uuid import UUID
from sqlalchemy import String, DateTime, Boolean, Integer, Numeric, ForeignKey
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.db import Base


class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column("name", String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column("description", String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column("created_by", String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column("updated_by", String(100), nullable=True)

    # Relationship
    products: Mapped[list["Product"]] = relationship("Product", back_populates="product_category")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column("id", PG_UUID(as_uuid=True), primary_key=True)
    code: Mapped[str] = mapped_column("code", String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column("name", String(200), nullable=False)
    description: Mapped[str | None] = mapped_column("description", String(1000), nullable=True)
    category: Mapped[UUID | None] = mapped_column("category", PG_UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True)
    brand: Mapped[str | None] = mapped_column("brand", String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column("unit", String(50), nullable=True)
    price: Mapped[float] = mapped_column("price", Numeric(18, 2), nullable=False, default=0)
    cost_price: Mapped[float] = mapped_column("cost_price", Numeric(18, 2), nullable=False, default=0)
    stock_quantity: Mapped[int] = mapped_column("stock_quantity", Integer, nullable=False, default=0)
    minimum_stock: Mapped[int] = mapped_column("minimum_stock", Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=True)
    image_url: Mapped[str | None] = mapped_column("image_url", String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column("updated_at", DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column("created_by", String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column("updated_by", String(100), nullable=True)

    # Relationship
    product_category: Mapped["ProductCategory | None"] = relationship("ProductCategory", back_populates="products")


# Unique constraint on Code is enforced via the column definition above.
