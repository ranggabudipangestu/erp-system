from fastapi import APIRouter

# Sub-routers
from app.modules.master_data.product.router import router as product_router
from app.modules.master_data.contact.router import router as contact_router
from app.modules.master_data.payment_terms.router import router as payment_terms_router
from app.modules.master_data.chart_of_accounts.router import router as coa_router
from app.modules.master_data.units.router import router as units_router


router = APIRouter()

# Group all Master Data related endpoints under /master-data
router.include_router(product_router, prefix="/products", tags=["Products"])
router.include_router(contact_router, prefix="/contacts", tags=["Contacts"])
router.include_router(payment_terms_router, prefix="/payment-terms", tags=["Payment Terms"])
router.include_router(coa_router, prefix="/chart-of-accounts", tags=["Chart of Accounts"])
router.include_router(units_router, prefix="/units", tags=["Units"])
