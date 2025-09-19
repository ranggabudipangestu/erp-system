from datetime import date
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.core.security import SecurityPrincipal, get_current_principal
from .excel_export_service import ExcelExportService
from .schemas import (
    PreviewTemplateRequest,
    ReportingTemplateDto,
    TemplateHistoryResponse,
    TemplateUploadResponse,
)
from .service import ReportingService


router = APIRouter()


def get_service() -> ReportingService:
    return ReportingService()


def get_excel_service() -> ExcelExportService:
    return ExcelExportService()


def _tenant_id(principal: SecurityPrincipal) -> str:
    return str(principal.tenant_id)


def _stream_excel_response(
    entity: str,
    tenant_id: str,
    excel_service: ExcelExportService,
    *,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    category_id: Optional[str] = None,
    low_stock_only: bool = False,
    location: Optional[str] = None,
):
    try:
        excel_content = excel_service.export_entity_to_excel(
            entity_type=entity,
            tenant_id=tenant_id,
            from_date=from_date,
            to_date=to_date,
            status=status,
            customer_id=customer_id,
            category_id=category_id,
            low_stock_only=low_stock_only,
            location=location,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - unexpected runtime failure
        raise HTTPException(status_code=500, detail=f"Export failed: {exc}") from exc

    filename = excel_service.get_export_filename(entity, tenant_id)

    return StreamingResponse(
        excel_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/admin/templates/{template_type}/upload", response_model=TemplateUploadResponse)
def upload_template(
    template_type: str,
    file: UploadFile = File(...),
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Upload a new template version for the authenticated tenant."""

    if not file.filename.endswith(".html"):
        raise HTTPException(status_code=400, detail="Only HTML files are allowed")

    tenant_id = _tenant_id(principal)

    try:
        file_content = BytesIO(file.file.read())
        template = service.upload_template(
            tenant_id=tenant_id,
            template_type=template_type,
            file_content=file_content,
            filename=file.filename,
        )
    except Exception as exc:  # pragma: no cover - storage/service errors
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return TemplateUploadResponse(
        id=template.id,
        tenant_id=template.tenant_id,
        template_type=template.template_type,
        version=template.version,
        message=f"Template {template_type} v{template.version} uploaded successfully",
    )


@router.post("/admin/templates/{template_type}/preview")
def preview_template(
    template_type: str,
    request: PreviewTemplateRequest = PreviewTemplateRequest(),
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Preview a template version as PDF for the authenticated tenant."""

    tenant_id = _tenant_id(principal)

    try:
        pdf_content = service.preview_template(
            tenant_id=tenant_id,
            template_type=template_type,
            version=request.version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={template_type}_preview.pdf"},
    )


@router.post("/admin/templates/{template_type}/{version}/activate")
def activate_template(
    template_type: str,
    version: int,
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Activate a specific template version for the current tenant."""

    tenant_id = _tenant_id(principal)

    try:
        service.activate_template(
            tenant_id=tenant_id,
            template_type=template_type,
            version=version,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"message": f"Template {template_type} v{version} activated successfully"}


@router.get("/admin/templates/{template_type}/history", response_model=TemplateHistoryResponse)
def get_template_history(
    template_type: str,
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Return template version history for the authenticated tenant."""

    tenant_id = _tenant_id(principal)

    try:
        templates = service.get_template_history(tenant_id=tenant_id, template_type=template_type)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return TemplateHistoryResponse(
        templates=[ReportingTemplateDto.model_validate(t) for t in templates]
    )


@router.get("/reports/{entity}/export")
def export_entity_to_excel(
    entity: str,
    from_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    to_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    category_id: Optional[str] = Query(None, description="Category filter (for inventory)"),
    low_stock_only: bool = Query(False, description="Show only low stock items (for inventory)"),
    location: Optional[str] = Query(None, description="Location filter (for inventory)"),
    principal: SecurityPrincipal = Depends(get_current_principal),
    excel_service: ExcelExportService = Depends(get_excel_service),
):
    """Export entity data to Excel for the current tenant."""

    tenant_id = _tenant_id(principal)

    return _stream_excel_response(
        entity,
        tenant_id,
        excel_service,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
    )


@router.get("/reports/invoices/export")
def export_invoices(
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Invoice status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    principal: SecurityPrincipal = Depends(get_current_principal),
    excel_service: ExcelExportService = Depends(get_excel_service),
):
    """Shortcut endpoint to export invoices."""

    tenant_id = _tenant_id(principal)

    return _stream_excel_response(
        "invoices",
        tenant_id,
        excel_service,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
    )


@router.get("/reports/orders/export")
def export_orders(
    from_date: Optional[date] = Query(None, description="Start date filter"),
    to_date: Optional[date] = Query(None, description="End date filter"),
    status: Optional[str] = Query(None, description="Order status filter"),
    customer_id: Optional[str] = Query(None, description="Customer filter"),
    principal: SecurityPrincipal = Depends(get_current_principal),
    excel_service: ExcelExportService = Depends(get_excel_service),
):
    """Shortcut endpoint to export orders."""

    tenant_id = _tenant_id(principal)

    return _stream_excel_response(
        "orders",
        tenant_id,
        excel_service,
        from_date=from_date,
        to_date=to_date,
        status=status,
        customer_id=customer_id,
    )


@router.get("/reports/inventory/export")
def export_inventory(
    category_id: Optional[str] = Query(None, description="Product category filter"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    location: Optional[str] = Query(None, description="Location filter"),
    principal: SecurityPrincipal = Depends(get_current_principal),
    excel_service: ExcelExportService = Depends(get_excel_service),
):
    """Shortcut endpoint to export inventory."""

    tenant_id = _tenant_id(principal)

    return _stream_excel_response(
        "inventory",
        tenant_id,
        excel_service,
        category_id=category_id,
        low_stock_only=low_stock_only,
        location=location,
    )


@router.get("/reports/products")
def generate_product_report(
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Generate product inventory report PDF for the current tenant."""

    tenant_id = _tenant_id(principal)

    try:
        sample_data = service._get_sample_data("product")
        pdf_content = service.generate_pdf(tenant_id=tenant_id, template_type="product", data=sample_data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    report_date = sample_data["report"].get("date", "report")

    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=product_report_{report_date}.pdf"},
    )


@router.get("/reports/invoice/{invoice_id}")
def generate_invoice_pdf(
    invoice_id: str,
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Generate an invoice PDF for the current tenant."""

    tenant_id = _tenant_id(principal)

    try:
        pdf_content = service.generate_invoice_pdf(tenant_id=tenant_id, invoice_id=invoice_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=invoice_{invoice_id}.pdf"},
    )


@router.get("/reports/{template_type}/{entity_id}")
def generate_pdf_report(
    template_type: str,
    entity_id: str,
    principal: SecurityPrincipal = Depends(get_current_principal),
    service: ReportingService = Depends(get_service),
):
    """Generate a PDF for any template type using sample data."""

    tenant_id = _tenant_id(principal)

    try:
        sample_data = service._get_sample_data(template_type)
        pdf_content = service.generate_pdf(
            tenant_id=tenant_id,
            template_type=template_type,
            data=sample_data,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={template_type}_{entity_id}.pdf"},
    )

