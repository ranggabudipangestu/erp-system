from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.db import session_scope
from .repository import ProductRepository
from .service import ProductService
from .schemas import ProductDto, CreateProductDto, UpdateProductDto


router = APIRouter()


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> ProductService:
    repo = ProductRepository(session)
    return ProductService(repo)


@router.get("", response_model=List[ProductDto])
def get_products(service: ProductService = Depends(get_service)):
    return service.get_all()


@router.get("/{id}", response_model=ProductDto)
def get_product(id: UUID, service: ProductService = Depends(get_service)):
    product = service.get_by_id(id)
    if product is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return product


@router.get("/by-code/{code}", response_model=ProductDto)
def get_product_by_code(code: str, service: ProductService = Depends(get_service)):
    product = service.get_by_code(code)
    if product is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return product


@router.get("/by-category/{category}", response_model=List[ProductDto])
def get_products_by_category(category: UUID, service: ProductService = Depends(get_service)):
    return service.get_by_category(category)


@router.get("/search", response_model=List[ProductDto])
def search_products(
    searchTerm: str = Query(..., description="Search term is required."),
    service: ProductService = Depends(get_service),
):
    if not searchTerm or not searchTerm.strip():
        # Match .NET's BadRequest behavior for empty terms
        raise HTTPException(status_code=400, detail="Search term is required.")
    return service.search(searchTerm)


@router.post("", response_model=ProductDto, status_code=201)
def create_product(payload: CreateProductDto, service: ProductService = Depends(get_service)):
    try:
        created = service.create(payload)
        return created
    except ValueError as ex:
        raise HTTPException(status_code=400, detail=str(ex))


@router.put("/{id}", response_model=ProductDto)
def update_product(id: UUID, payload: UpdateProductDto, service: ProductService = Depends(get_service)):
    try:
        updated = service.update(id, payload)
        return updated
    except ValueError as ex:
        # .NET returned NotFound for missing update target
        if "not found" in str(ex).lower():
            raise HTTPException(status_code=404, detail=str(ex))
        raise


@router.delete("/{id}", status_code=204)
def delete_product(id: UUID, service: ProductService = Depends(get_service)):
    deleted = service.delete(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not Found")
    return None
