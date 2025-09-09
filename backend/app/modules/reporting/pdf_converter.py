from io import BytesIO
from typing import Dict, Any

from jinja2 import Template
from weasyprint import HTML, CSS


class PDFConverter:
    """PDF converter using WeasyPrint for HTML to PDF conversion."""

    @staticmethod
    def html_to_pdf(html_content: str, css_content: str = None) -> bytes:
        """Convert HTML content to PDF bytes."""
        try:
            html = HTML(string=html_content)
            
            if css_content:
                css = CSS(string=css_content)
                pdf_bytes = html.write_pdf(stylesheets=[css])
            else:
                pdf_bytes = html.write_pdf()
                
            return pdf_bytes
            
        except Exception as e:
            raise RuntimeError(f"Failed to convert HTML to PDF: {e}")

    @staticmethod
    def render_template_to_pdf(
        template_content: str,
        data: Dict[str, Any],
        css_content: str = None
    ) -> bytes:
        """Render Jinja2 template with data and convert to PDF."""
        try:
            # Render Jinja2 template
            template = Template(template_content)
            html_content = template.render(**data)
            
            # Convert to PDF
            return PDFConverter.html_to_pdf(html_content, css_content)
            
        except Exception as e:
            raise RuntimeError(f"Failed to render template to PDF: {e}")

    @staticmethod
    def get_sample_invoice_data() -> Dict[str, Any]:
        """Get sample invoice data for template preview."""
        return {
            "invoice": {
                "id": "INV-2025-001",
                "date": "2025-09-08",
                "due_date": "2025-09-22",
                "number": "INV-2025-001",
                "status": "unpaid"
            },
            "company": {
                "name": "PT. Sample Company",
                "address": "Jl. Sample Street No. 123",
                "city": "Jakarta",
                "postal_code": "12345",
                "phone": "+62-21-1234567",
                "email": "info@samplecompany.com"
            },
            "customer": {
                "name": "John Doe",
                "address": "Jl. Customer Street No. 456",
                "city": "Surabaya",
                "postal_code": "67890",
                "phone": "+62-31-9876543",
                "email": "john.doe@email.com"
            },
            "items": [
                {
                    "name": "Product A",
                    "description": "High quality product A",
                    "quantity": 2,
                    "unit_price": 150000,
                    "total": 300000
                },
                {
                    "name": "Product B",
                    "description": "Premium product B",
                    "quantity": 1,
                    "unit_price": 250000,
                    "total": 250000
                },
                {
                    "name": "Service C",
                    "description": "Professional service C",
                    "quantity": 3,
                    "unit_price": 100000,
                    "total": 300000
                }
            ],
            "subtotal": 850000,
            "tax_rate": 0.11,
            "tax_amount": 93500,
            "total": 943500,
            "currency": "IDR",
            "notes": "Payment due within 14 days. Thank you for your business!",
            "bank_account": {
                "bank_name": "Bank Sample",
                "account_name": "PT. Sample Company",
                "account_number": "1234567890"
            }
        }

    @staticmethod
    def get_sample_receipt_data() -> Dict[str, Any]:
        """Get sample receipt data for template preview."""
        return {
            "receipt": {
                "id": "RCP-2025-001",
                "date": "2025-09-08",
                "number": "RCP-2025-001"
            },
            "company": {
                "name": "PT. Sample Company",
                "address": "Jl. Sample Street No. 123",
                "city": "Jakarta",
                "postal_code": "12345",
                "phone": "+62-21-1234567"
            },
            "customer": {
                "name": "Jane Smith",
                "phone": "+62-81-2345678"
            },
            "items": [
                {
                    "name": "Product X",
                    "quantity": 1,
                    "unit_price": 50000,
                    "total": 50000
                },
                {
                    "name": "Product Y",
                    "quantity": 2,
                    "unit_price": 25000,
                    "total": 50000
                }
            ],
            "subtotal": 100000,
            "tax_rate": 0.11,
            "tax_amount": 11000,
            "total": 111000,
            "currency": "IDR",
            "payment_method": "Cash"
        }

    @staticmethod
    def get_sample_po_data() -> Dict[str, Any]:
        """Get sample purchase order data for template preview."""
        return {
            "po": {
                "id": "PO-2025-001",
                "date": "2025-09-08",
                "number": "PO-2025-001",
                "delivery_date": "2025-09-15"
            },
            "company": {
                "name": "PT. Sample Company",
                "address": "Jl. Sample Street No. 123",
                "city": "Jakarta",
                "postal_code": "12345",
                "phone": "+62-21-1234567",
                "email": "purchasing@samplecompany.com"
            },
            "supplier": {
                "name": "CV. Supplier ABC",
                "address": "Jl. Supplier Street No. 789",
                "city": "Bandung",
                "postal_code": "40123",
                "phone": "+62-22-1234567",
                "email": "sales@supplierabc.com"
            },
            "items": [
                {
                    "name": "Raw Material A",
                    "description": "High quality raw material",
                    "quantity": 100,
                    "unit": "kg",
                    "unit_price": 15000,
                    "total": 1500000
                },
                {
                    "name": "Component B",
                    "description": "Electronic component",
                    "quantity": 50,
                    "unit": "pcs",
                    "unit_price": 25000,
                    "total": 1250000
                }
            ],
            "subtotal": 2750000,
            "tax_rate": 0.11,
            "tax_amount": 302500,
            "total": 3052500,
            "currency": "IDR",
            "terms": "Payment 30 days after delivery",
            "delivery_address": "Warehouse PT. Sample Company, Jl. Gudang No. 1, Jakarta"
        }

    @staticmethod
    def get_sample_product_report_data() -> Dict[str, Any]:
        """Get sample product report data for template preview."""
        return {
            "company": {
                "name": "PT. Sample Company",
                "address": "Jl. Sample Street No. 123",
                "city": "Jakarta",
                "postal_code": "12345",
                "phone": "+62-21-1234567",
                "email": "info@samplecompany.com"
            },
            "report": {
                "title": "Product Inventory Report",
                "date": "2025-09-08",
                "type": "Complete Inventory",
                "generated_by": "System Administrator"
            },
            "currency": "IDR",
            "summary": {
                "total_products": 25,
                "active_products": 22,
                "low_stock_products": 5,
                "total_inventory_value": 15750000
            },
            "categories": [
                {
                    "name": "Electronics",
                    "product_count": 8,
                    "products": [
                        {
                            "code": "ELC001",
                            "name": "Smartphone Galaxy S24",
                            "brand": "Samsung",
                            "unit": "pcs",
                            "price": 8000000,
                            "cost_price": 6500000,
                            "stock_quantity": 15,
                            "minimum_stock": 10,
                            "is_active": True
                        },
                        {
                            "code": "ELC002", 
                            "name": "Laptop ThinkPad X1",
                            "brand": "Lenovo",
                            "unit": "pcs",
                            "price": 15000000,
                            "cost_price": 12000000,
                            "stock_quantity": 5,
                            "minimum_stock": 8,
                            "is_active": True
                        },
                        {
                            "code": "ELC003",
                            "name": "Wireless Mouse MX Master",
                            "brand": "Logitech",
                            "unit": "pcs",
                            "price": 1200000,
                            "cost_price": 950000,
                            "stock_quantity": 25,
                            "minimum_stock": 15,
                            "is_active": True
                        },
                        {
                            "code": "ELC004",
                            "name": "USB-C Hub 7-in-1",
                            "brand": "Anker",
                            "unit": "pcs",
                            "price": 850000,
                            "cost_price": 650000,
                            "stock_quantity": 12,
                            "minimum_stock": 10,
                            "is_active": True
                        }
                    ]
                },
                {
                    "name": "Office Supplies",
                    "product_count": 12,
                    "products": [
                        {
                            "code": "OFF001",
                            "name": "A4 Copy Paper",
                            "brand": "PaperOne",
                            "unit": "ream",
                            "price": 65000,
                            "cost_price": 50000,
                            "stock_quantity": 50,
                            "minimum_stock": 30,
                            "is_active": True
                        },
                        {
                            "code": "OFF002",
                            "name": "Ballpoint Pen Blue",
                            "brand": "Pilot",
                            "unit": "pcs",
                            "price": 15000,
                            "cost_price": 10000,
                            "stock_quantity": 8,
                            "minimum_stock": 20,
                            "is_active": True
                        },
                        {
                            "code": "OFF003",
                            "name": "Stapler Heavy Duty",
                            "brand": "MAX",
                            "unit": "pcs",
                            "price": 120000,
                            "cost_price": 95000,
                            "stock_quantity": 6,
                            "minimum_stock": 10,
                            "is_active": True
                        },
                        {
                            "code": "OFF004",
                            "name": "Whiteboard Marker Set",
                            "brand": "Snowman",
                            "unit": "set",
                            "price": 45000,
                            "cost_price": 35000,
                            "stock_quantity": 18,
                            "minimum_stock": 12,
                            "is_active": True
                        }
                    ]
                },
                {
                    "name": "Furniture",
                    "product_count": 5,
                    "products": [
                        {
                            "code": "FUR001",
                            "name": "Office Chair Ergonomic",
                            "brand": "Herman Miller",
                            "unit": "pcs",
                            "price": 3500000,
                            "cost_price": 2800000,
                            "stock_quantity": 8,
                            "minimum_stock": 5,
                            "is_active": True
                        },
                        {
                            "code": "FUR002",
                            "name": "Standing Desk Adjustable",
                            "brand": "FlexiSpot",
                            "unit": "pcs",
                            "price": 4200000,
                            "cost_price": 3400000,
                            "stock_quantity": 3,
                            "minimum_stock": 5,
                            "is_active": True
                        }
                    ]
                }
            ],
            "low_stock_products": [
                {
                    "code": "ELC002",
                    "name": "Laptop ThinkPad X1",
                    "category_name": "Electronics",
                    "stock_quantity": 5,
                    "minimum_stock": 8,
                    "shortage": 3,
                    "reorder_value": 36000000
                },
                {
                    "code": "OFF002",
                    "name": "Ballpoint Pen Blue",
                    "category_name": "Office Supplies",
                    "stock_quantity": 8,
                    "minimum_stock": 20,
                    "shortage": 12,
                    "reorder_value": 120000
                },
                {
                    "code": "OFF003",
                    "name": "Stapler Heavy Duty",
                    "category_name": "Office Supplies",
                    "stock_quantity": 6,
                    "minimum_stock": 10,
                    "shortage": 4,
                    "reorder_value": 380000
                },
                {
                    "code": "FUR002",
                    "name": "Standing Desk Adjustable",
                    "category_name": "Furniture",
                    "stock_quantity": 3,
                    "minimum_stock": 5,
                    "shortage": 2,
                    "reorder_value": 6800000
                }
            ],
            "top_products": [
                {
                    "code": "ELC001",
                    "name": "Smartphone Galaxy S24",
                    "stock_quantity": 15,
                    "price": 8000000,
                    "stock_value": 120000000
                },
                {
                    "code": "ELC002",
                    "name": "Laptop ThinkPad X1",
                    "stock_quantity": 5,
                    "price": 15000000,
                    "stock_value": 75000000
                },
                {
                    "code": "FUR001",
                    "name": "Office Chair Ergonomic",
                    "stock_quantity": 8,
                    "price": 3500000,
                    "stock_value": 28000000
                },
                {
                    "code": "ELC003",
                    "name": "Wireless Mouse MX Master",
                    "stock_quantity": 25,
                    "price": 1200000,
                    "stock_value": 30000000
                },
                {
                    "code": "FUR002",
                    "name": "Standing Desk Adjustable",
                    "stock_quantity": 3,
                    "price": 4200000,
                    "stock_value": 12600000
                }
            ]
        }