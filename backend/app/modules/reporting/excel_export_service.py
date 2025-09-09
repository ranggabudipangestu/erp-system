from typing import Optional
from datetime import date
from io import BytesIO

from .excel_exporter import (
    ExcelExporter, 
    InvoiceExcelExporter, 
    OrderExcelExporter, 
    InventoryExcelExporter
)
from .data_repository import DataRepositoryFactory


class ExcelExportService:
    """Service for exporting entity data to Excel format"""
    
    def __init__(self):
        self.repository_factory = DataRepositoryFactory()
    
    def export_entity_to_excel(
        self,
        entity_type: str,
        tenant_id: str,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        status: Optional[str] = None,
        customer_id: Optional[str] = None,
        category_id: Optional[str] = None,
        low_stock_only: bool = False,
        location: Optional[str] = None
    ) -> BytesIO:
        """
        Export entity data to Excel format
        
        Args:
            entity_type: Type of entity to export (invoice, order, inventory)
            tenant_id: Tenant identifier
            from_date: Start date filter
            to_date: End date filter
            status: Status filter
            customer_id: Customer filter
            category_id: Category filter (for inventory)
            low_stock_only: Show only low stock items (for inventory)
            location: Location filter (for inventory)
            
        Returns:
            BytesIO: Excel file content
        """
        
        # Get appropriate repository
        repository = self.repository_factory.get_repository(entity_type)
        
        # Get data based on entity type
        if entity_type.lower() in ['invoice', 'invoices']:
            data = repository.get_invoices(
                tenant_id=tenant_id,
                from_date=from_date,
                to_date=to_date,
                status=status,
                customer_id=customer_id
            )
            exporter = InvoiceExcelExporter()
            return exporter.export_invoices(data)
            
        elif entity_type.lower() in ['order', 'orders']:
            data = repository.get_orders(
                tenant_id=tenant_id,
                from_date=from_date,
                to_date=to_date,
                status=status,
                customer_id=customer_id
            )
            exporter = OrderExcelExporter()
            return exporter.export_orders(data)
            
        elif entity_type.lower() in ['inventory', 'stock', 'products']:
            data = repository.get_inventory(
                tenant_id=tenant_id,
                category_id=category_id,
                low_stock_only=low_stock_only,
                location=location
            )
            exporter = InventoryExcelExporter()
            return exporter.export_inventory(data)
            
        else:
            raise ValueError(f"Unsupported entity type: {entity_type}")
    
    def get_export_filename(self, entity_type: str, tenant_id: str) -> str:
        """Generate appropriate filename for export"""
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Normalize entity type for filename
        entity_name = entity_type.lower()
        if entity_name in ['invoice', 'invoices']:
            entity_name = 'invoices'
        elif entity_name in ['order', 'orders']:
            entity_name = 'orders'
        elif entity_name in ['inventory', 'stock', 'products']:
            entity_name = 'inventory'
        
        return f"{entity_name}_{tenant_id}_{timestamp}.xlsx"