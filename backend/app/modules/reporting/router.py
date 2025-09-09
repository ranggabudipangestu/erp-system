from typing import List, Optional
from io import BytesIO
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Query
from fastapi.responses import StreamingResponse

from app.core.db import session_scope
from .service import ReportingService
from .excel_export_service import ExcelExportService
from .schemas import (
    ReportingTemplateDto,
    TemplateUploadResponse,
    TemplateHistoryResponse,
    ActivateTemplateRequest,
    PreviewTemplateRequest
)


router = APIRouter()


def get_session():
    with session_scope() as session:
        yield session


def get_service() -> ReportingService:
    return ReportingService()


def get_excel_service() -> ExcelExportService:
    return ExcelExportService()


# Admin Template Management Endpoints

@router.post("/admin/templates/{template_type}/upload", response_model=TemplateUploadResponse)
def upload_template(
    template_type: str,
    tenant_id: str,
    file: UploadFile = File(...),
    service: ReportingService = Depends(get_service)
):
    """Upload a new template version."""
    if not file.filename.endswith('.html'):
        raise HTTPException(status_code=400, detail="Only HTML files are allowed")
    
    try:
        file_content = BytesIO(file.file.read())
        template = service.upload_template(
            tenant_id=tenant_id,
            template_type=template_type,
            file_content=file_content,
            filename=file.filename
        )
        
        return TemplateUploadResponse(
            id=template.id,
            tenant_id=template.tenant_id,
            template_type=template.template_type,
            version=template.version,
            message=f"Template {template_type} v{template.version} uploaded successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.post("/admin/templates/{template_type}/preview")
def preview_template(
    template_type: str,
    tenant_id: str,
    request: PreviewTemplateRequest = PreviewTemplateRequest(),
    service: ReportingService = Depends(get_service)
):
    """Preview template with sample data."""
    try:
        pdf_content = service.preview_template(
            tenant_id=tenant_id,
            template_type=template_type,
            version=request.version
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={template_type}_preview.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/reports/products")
def generate_product_report(
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate product inventory report PDF."""
    try:
        # Use sample data for now. In real implementation,
        # this would fetch actual product data from database
        sample_data = service._get_sample_data("product")
        
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type="product",
            data=sample_data
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=product_report_{sample_data['report']['date']}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.post("/admin/templates/{template_type}/{version}/activate")
def activate_template(
    template_type: str,
    version: int,
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Activate a specific template version."""
    try:
        service.activate_template(
            tenant_id=tenant_id,
            template_type=template_type,
            version=version
        )
        
        return {"message": f"Template {template_type} v{version} activated successfully"}
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/reports/products")
def generate_product_report(
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate product inventory report PDF."""
    try:
        # Use sample data for now. In real implementation,
        # this would fetch actual product data from database
        sample_data = service._get_sample_data("product")
        
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type="products",
            data=sample_data
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=product_report_{sample_data['report']['date']}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/admin/templates/{template_type}/history", response_model=TemplateHistoryResponse)
def get_template_history(
    template_type: str,
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Get all template versions for a specific type."""
    try:
        templates = service.get_template_history(
            tenant_id=tenant_id,
            template_type=template_type
        )
        
        return TemplateHistoryResponse(
            templates=[ReportingTemplateDto.model_validate(t) for t in templates]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


# Report Generation Endpoints

@router.get("/reports/invoice/{invoice_id}")
def generate_invoice_pdf(
    invoice_id: str,
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate PDF for a specific invoice."""
    try:
        pdf_content = service.generate_invoice_pdf(
            tenant_id=tenant_id,
            invoice_id=invoice_id
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=invoice_{invoice_id}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/reports/products")
def generate_product_report(
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate product inventory report PDF."""
    try:
        # Use sample data for now. In real implementation,
        # this would fetch actual product data from database
        sample_data = service._get_sample_data("product")
        
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type="product",
            data=sample_data
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=product_report_{sample_data['report']['date']}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/reports/{template_type}/{entity_id}")
def generate_pdf_report(
    template_type: str,
    entity_id: str,
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate PDF for any entity using specified template type."""
    try:
        # For now, use sample data. In real implementation,
        # this would fetch entity data from database based on entity_id
        sample_data = service._get_sample_data(template_type)
        
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type=template_type,
            data=sample_data
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={template_type}_{entity_id}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )


@router.get("/reports/products")
def generate_product_report(
    tenant_id: str,
    service: ReportingService = Depends(get_service)
):
    """Generate product inventory report PDF."""
    try:
        # Use sample data for now. In real implementation,
        # this would fetch actual product data from database
        sample_data = service._get_sample_data("product")
        
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type="product",
            data=sample_data
        )
        
        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename=product_report_{sample_data['report']['date']}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Excel Export Endpoints

@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """
    Export entity data to Excel format.
    
    Supported entities: invoice, order, inventory
    """
    try:
        # Export data to Excel
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location
        )
        
        # Generate filename
        filename = excel_service.get_export_filename(entity, tenant_id)
        
        # Return Excel file as attachment
        return StreamingResponse(
            excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/reports/invoices/export")
def export_invoices(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export invoice data to Excel."""
    return export_entity_to_excel(
        entity="invoices",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/orders/export")
def export_orders(
    tenant_id: str = Query(..., description="Tenant ID"),
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export order data to Excel."""
    return export_entity_to_excel(
        entity="orders",
        tenant_id=tenant_id,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        excel_service=excel_service
    )


@router.get("/reports/inventory/export")
def export_inventory(
    tenant_id: str = Query(..., description="Tenant ID"),
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    excel_service: ExcelExportService = Depends(get_excel_service)
):
    """Export inventory data to Excel."""
    return export_entity_to_excel(
        entity="inventory",
        tenant_id=tenant_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
        excel_service=excel_service
    )