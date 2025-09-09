from typing import List
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse

from app.core.db import session_scope
from .service import ReportingService
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