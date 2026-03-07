from __future__ import annotations

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    String,
    DateTime,
    Numeric,
    Integer,
    UniqueConstraint,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func

from app.core.db import Base


class ProductCategory(Base):
    __tablename__ = "product_categories"
    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_product_categories_tenant_code"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    parent_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True
    )

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    parent: Mapped["ProductCategory | None"] = relationship(
        "ProductCategory", remote_side="ProductCategory.id", back_populates="children"
    )
    children: Mapped[list["ProductCategory"]] = relationship(
        "ProductCategory", back_populates="parent", cascade="all"
    )
    products: Mapped[list["Product"]] = relationship("Product", back_populates="product_category")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        {},
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    category: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True
    )
    brand: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    cost_price: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minimum_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationship
    product_category: Mapped["ProductCategory | None"] = relationship("ProductCategory", back_populates="products")
