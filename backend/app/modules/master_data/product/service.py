from datetime import datetime
from uuid import UUID, uuid4

from .repository import ProductRepository
from .models import Product
from .schemas import ProductDto, CreateProductDto, UpdateProductDto


def map_to_dto(entity: Product) -> ProductDto:
    return ProductDto(
        id=entity.id,
        code=entity.code,
        name=entity.name,
        description=entity.description,
        category=entity.category,
        brand=entity.brand,
        unit=entity.unit,
        price=entity.price,
        cost_price=entity.cost_price,
        stock_quantity=entity.stock_quantity,
        minimum_stock=entity.minimum_stock,
        is_active=entity.is_active,
        image_url=entity.image_url,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        created_by=entity.created_by,
        updated_by=entity.updated_by,
    )


class ProductService:
    def __init__(self, repo: ProductRepository) -> None:
        self.repo = repo

    def get_all(self) -> list[ProductDto]:
        return [map_to_dto(p) for p in self.repo.get_all()]

    def get_by_id(self, id: UUID) -> ProductDto | None:
        entity = self.repo.get_by_id(id)
        return map_to_dto(entity) if entity else None

    def get_by_code(self, code: str) -> ProductDto | None:
        entity = self.repo.get_by_code(code)
        return map_to_dto(entity) if entity else None

    def get_by_category(self, category: str) -> list[ProductDto]:
        return [map_to_dto(p) for p in self.repo.get_by_category(category)]

    def search(self, search_term: str) -> list[ProductDto]:
        return [map_to_dto(p) for p in self.repo.search(search_term)]

    def create(self, payload: CreateProductDto) -> ProductDto:
        if self.repo.code_exists(payload.code):
            raise ValueError(f"Product with code '{payload.code}' already exists.")

        entity = Product(
            id=uuid4(),
            code=payload.code,
            name=payload.name,
            description=payload.description,
            category=payload.category,
            brand=payload.brand,
            unit=payload.unit,
            price=payload.price,
            cost_price=payload.cost_price,
            stock_quantity=payload.stock_quantity,
            minimum_stock=payload.minimum_stock,
            is_active=payload.is_active,
            image_url=payload.image_url,
            created_by=payload.created_by,
            created_at=datetime.utcnow(),
        )
        created = self.repo.create(entity)
        return map_to_dto(created)

    def update(self, id: UUID, payload: UpdateProductDto) -> ProductDto:
        existing = self.repo.get_by_id(id)
        if not existing:
            raise ValueError(f"Product with ID '{id}' not found.")

        existing.name = payload.name
        existing.description = payload.description
        existing.category = payload.category
        existing.brand = payload.brand
        existing.unit = payload.unit
        existing.price = payload.price
        existing.cost_price = payload.cost_price
        existing.stock_quantity = payload.stock_quantity
        existing.minimum_stock = payload.minimum_stock
        existing.is_active = payload.is_active
        existing.image_url = payload.image_url
        existing.updated_by = payload.updated_by
        existing.updated_at = datetime.utcnow()

        updated = self.repo.update(existing)
        return map_to_dto(updated)

    def delete(self, id: UUID) -> bool:
        return self.repo.delete(id)

