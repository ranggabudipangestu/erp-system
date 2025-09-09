from fastapi import FastAPI


def register_routers(app: FastAPI) -> None:
    """Register all module routers to the FastAPI app.

    This is the single entry point to wire routes for the modular monolith.
    Add new module routers here as they are implemented.
    """

    # Master Data module
    from app.modules.master_data.router import router as master_data_router

    app.include_router(master_data_router, prefix="/master-data", tags=["MasterData"]) 
    app.include_router(master_data_router, prefix="/finance", tags=["Finance"]) 
    app.include_router(master_data_router, prefix="/inventory", tags=["Inventory"]) 
    app.include_router(master_data_router, prefix="/purchasing", tags=["Purchasing"])
    app.include_router(master_data_router, prefix="/sales", tags=["Sales"])
    app.include_router(master_data_router, prefix="/manufacture", tags=["Manufacture"])
    app.include_router(master_data_router, prefix="/user", tags=["User"])
    app.include_router(master_data_router, prefix="/auth", tags=["Auth"])

    # Reporting module
    from app.modules.reporting.router import router as reporting_router
    app.include_router(reporting_router, prefix="/reporting", tags=["Reporting"])
