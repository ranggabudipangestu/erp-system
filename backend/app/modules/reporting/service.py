from typing import BinaryIO, Dict, Any, Optional, List
from io import BytesIO

from sqlalchemy.orm import Session

from app.core.db import session_scope
from app.modules.reporting.models import ReportingTemplate
from app.modules.reporting.storage import StorageAdapter, get_storage_adapter
from app.modules.reporting.pdf_converter import PDFConverter


class ReportingService:
    """Main service class for reporting functionality."""

    def __init__(self, storage: StorageAdapter = None):
        self.storage = storage or get_storage_adapter()
        self.pdf_converter = PDFConverter()

    def upload_template(
        self,
        tenant_id: str,
        template_type: str,
        file_content: BinaryIO,
        filename: str = "template.html"
    ) -> ReportingTemplate:
        """Upload a new template version."""
        
        with session_scope() as session:
            # Get next version number
            latest_version = session.query(ReportingTemplate)\
                .filter_by(tenant_id=tenant_id, template_type=template_type)\
                .order_by(ReportingTemplate.version.desc())\
                .first()
            
            next_version = (latest_version.version + 1) if latest_version else 1
            
            # Generate file path: templates/{tenantId}/{templateType}/v{version}/template.html
            file_path = f"templates/{tenant_id}/{template_type}/v{next_version}/{filename}"
            
            # Save to storage
            stored_path = self.storage.save(file_path, file_content)
            
            # Save metadata to database
            template = ReportingTemplate(
                tenant_id=tenant_id,
                template_type=template_type,
                version=next_version,
                file_path=stored_path,
                is_active=False
            )
            
            session.add(template)
            session.flush()  # To get the ID
            
            return template

    def preview_template(
        self,
        tenant_id: str,
        template_type: str,
        version: Optional[int] = None
    ) -> bytes:
        """Preview template with sample data."""
        
        with session_scope() as session:
            # Get template
            query = session.query(ReportingTemplate)\
                .filter_by(tenant_id=tenant_id, template_type=template_type)
            
            if version:
                template = query.filter_by(version=version).first()
            else:
                # Get latest version
                template = query.order_by(ReportingTemplate.version.desc()).first()
            
            if not template:
                raise ValueError(f"Template not found for {template_type}")
            
            # Load template content
            template_content = self.storage.load(template.file_path).decode('utf-8')
            
            # Get sample data based on template type
            sample_data = self._get_sample_data(template_type)
            
            # Render to PDF
            return self.pdf_converter.render_template_to_pdf(template_content, sample_data)

    def activate_template(
        self,
        tenant_id: str,
        template_type: str,
        version: int
    ) -> bool:
        """Activate a specific template version."""
        
        with session_scope() as session:
            # Deactivate all existing templates for this type
            session.query(ReportingTemplate)\
                .filter_by(tenant_id=tenant_id, template_type=template_type)\
                .update({"is_active": False})
            
            # Activate the specified version
            template = session.query(ReportingTemplate)\
                .filter_by(
                    tenant_id=tenant_id,
                    template_type=template_type,
                    version=version
                )\
                .first()
            
            if not template:
                raise ValueError(f"Template version {version} not found for {template_type}")
            
            template.is_active = True
            
            return True

    def get_template_history(
        self,
        tenant_id: str,
        template_type: str
    ) -> List[ReportingTemplate]:
        """Get all template versions for a specific type."""
        
        with session_scope() as session:
            return session.query(ReportingTemplate)\
                .filter_by(tenant_id=tenant_id, template_type=template_type)\
                .order_by(ReportingTemplate.version.desc())\
                .all()

    def generate_pdf(
        self,
        tenant_id: str,
        template_type: str,
        data: Dict[str, Any]
    ) -> bytes:
        """Generate PDF using active template with real data."""
        
        with session_scope() as session:
            # Get active template
            template = session.query(ReportingTemplate)\
                .filter_by(
                    tenant_id=tenant_id,
                    template_type=template_type,
                    is_active=True
                )\
                .first()
            
            if not template:
                raise ValueError(f"No active template found for {template_type}")
            
            # Load template content
            template_content = self.storage.load(template.file_path).decode('utf-8')
            
            # Render to PDF
            return self.pdf_converter.render_template_to_pdf(template_content, data)

    def generate_invoice_pdf(
        self,
        tenant_id: str,
        invoice_id: str,
        # This would normally fetch invoice data from database
        # For now, we'll use sample data
    ) -> bytes:
        """Generate invoice PDF for specific invoice ID."""
        
        # In real implementation, this would fetch invoice data from database
        # For now, use sample data with the invoice_id
        sample_data = self.pdf_converter.get_sample_invoice_data()
        sample_data["invoice"]["id"] = invoice_id
        sample_data["invoice"]["number"] = invoice_id
        
        return self.generate_pdf(tenant_id, "invoice", sample_data)

    def _get_sample_data(self, template_type: str) -> Dict[str, Any]:
        """Get sample data based on template type."""
        if template_type == "invoice":
            return self.pdf_converter.get_sample_invoice_data()
        elif template_type == "receipt":
            return self.pdf_converter.get_sample_receipt_data()
        elif template_type == "po":
            return self.pdf_converter.get_sample_po_data()
        elif template_type == "product":
            return self.pdf_converter.get_sample_product_report_data()
        else:
            raise ValueError(f"Unsupported template type: {template_type}")

    def delete_template(
        self,
        tenant_id: str,
        template_type: str,
        version: int
    ) -> bool:
        """Delete a specific template version."""
        
        with session_scope() as session:
            template = session.query(ReportingTemplate)\
                .filter_by(
                    tenant_id=tenant_id,
                    template_type=template_type,
                    version=version
                )\
                .first()
            
            if not template:
                return False
            
            # Don't allow deleting active template
            if template.is_active:
                raise ValueError("Cannot delete active template")
            
            # Delete from storage
            try:
                self.storage.delete(template.file_path)
            except Exception:
                # Continue even if storage deletion fails
                pass
            
            # Delete from database
            session.delete(template)
            
            return True