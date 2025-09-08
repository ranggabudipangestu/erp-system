from typing import Iterable, Optional
from uuid import UUID

from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from .models import Product


class ProductRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_all(self) -> Iterable[Product]:
        stmt = select(Product).order_by(Product.name.asc())
        return list(self.session.execute(stmt).scalars().all())

    def get_by_id(self, id: UUID) -> Optional[Product]:
        return self.session.get(Product, id)

    def get_by_code(self, code: str) -> Optional[Product]:
        stmt = select(Product).where(Product.code == code)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_category(self, category: UUID) -> Iterable[Product]:
        stmt = select(Product).where(Product.category == category).order_by(Product.name.asc())
        return list(self.session.execute(stmt).scalars().all())

    def search(self, search_term: str) -> Iterable[Product]:
        term = f"%{search_term}%"
        stmt = select(Product).where(
            or_(
                Product.name.ilike(term),
                Product.code.ilike(term),
                func.coalesce(Product.description, "").ilike(term),
            )
        ).order_by(Product.name.asc())
        return list(self.session.execute(stmt).scalars().all())

    def create(self, product: Product) -> Product:
        self.session.add(product)
        self.session.flush()
        return product

    def update(self, product: Product) -> Product:
        self.session.flush()
        return product

    def delete(self, id: UUID) -> bool:
        entity = self.get_by_id(id)
        if not entity:
            return False
        self.session.delete(entity)
        self.session.flush()
        return True

    def exists(self, id: UUID) -> bool:
        return self.get_by_id(id) is not None

    def code_exists(self, code: str) -> bool:
        return self.get_by_code(code) is not None

