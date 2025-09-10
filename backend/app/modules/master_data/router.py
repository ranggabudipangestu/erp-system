from fastapi import APIRouter

# Sub-routers
from app.modules.master_data.product.router import router as product_router


router = APIRouter()

# Group all Master Data related endpoints under /master-data
router.include_router(product_router, prefix="/products", tags=["Products"])

