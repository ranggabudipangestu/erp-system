"""Central definitions for ERP modules and menu permissions."""
from __future__ import annotations

from typing import Dict, List, TypedDict


class MenuItemDef(TypedDict, total=False):
    code: str
    name: str
    route: str
    permission_key: str
    icon: str | None
    description: str | None
    sort_order: int


MENU_STRUCTURE: Dict[str, List[MenuItemDef]] = {
    "master_data": [
        {
            "code": "master_products",
            "name": "Products",
            "route": "/master-data/products",
            "permission_key": "products.view",
            "icon": "package",
        },
        {
            "code": "master_product_categories",
            "name": "Product Categories",
            "route": "/master-data/product-categories",
            "permission_key": "product_categories.view",
            "icon": "tags",
        },
        {
            "code": "master_contacts",
            "name": "Contacts",
            "route": "/master-data/contacts",
            "permission_key": "contacts.view",
            "icon": "users",
        },
        {
            "code": "master_chart_of_accounts",
            "name": "Chart of Accounts",
            "route": "/master-data/chart-of-accounts",
            "permission_key": "chart_of_accounts.view",
            "icon": "book-open",
        },
        {
            "code": "master_locations",
            "name": "Locations",
            "route": "/master-data/locations",
            "permission_key": "locations.view",
            "icon": "map-pin",
        },
        {
            "code": "master_currencies",
            "name": "Currencies",
            "route": "/master-data/currencies",
            "permission_key": "currencies.view",
            "icon": "coins",
        },
        {
            "code": "master_units",
            "name": "Units",
            "route": "/master-data/units",
            "permission_key": "units.view",
            "icon": "ruler",
        },
        {
            "code": "master_payment_terms",
            "name": "Payment Terms",
            "route": "/master-data/payment-terms",
            "permission_key": "payment_terms.view",
            "icon": "calendar-clock",
        },
        {
            "code": "master_taxes",
            "name": "Taxes",
            "route": "/master-data/taxes",
            "permission_key": "taxes.view",
            "icon": "percent",
        },
    ],
    "finance": [
        {
            "code": "finance_cash_bank_in",
            "name": "Cash/Bank In",
            "route": "/finance/cash-bank-in",
            "permission_key": "finance.cash_bank_in.view",
            "icon": "log-in",
        },
        {
            "code": "finance_cash_bank_out",
            "name": "Cash/Bank Out",
            "route": "/finance/cash-bank-out",
            "permission_key": "finance.cash_bank_out.view",
            "icon": "log-out",
        },
        {
            "code": "finance_journal_general",
            "name": "General Journal",
            "route": "/finance/journal-entries",
            "permission_key": "finance.journal.view",
            "icon": "book",
        },
        {
            "code": "finance_ap_payment",
            "name": "AP Payments",
            "route": "/finance/ap-payments",
            "permission_key": "finance.ap_payments.view",
            "icon": "wallet-cards",
        },
        {
            "code": "finance_ar_payment",
            "name": "AR Payments",
            "route": "/finance/ar-payments",
            "permission_key": "finance.ar_payments.view",
            "icon": "wallet",
        },
        {
            "code": "finance_report_general_ledger",
            "name": "General Ledger",
            "route": "/finance/reports/general-ledger",
            "permission_key": "finance.reports.general_ledger",
            "icon": "book-open",
        },
        {
            "code": "finance_report_ap_aging",
            "name": "AP Aging",
            "route": "/finance/reports/ap-aging",
            "permission_key": "finance.reports.ap_aging",
            "icon": "timer",
        },
        {
            "code": "finance_report_ar_aging",
            "name": "AR Aging",
            "route": "/finance/reports/ar-aging",
            "permission_key": "finance.reports.ar_aging",
            "icon": "timer-reset",
        },
        {
            "code": "finance_report_balance_sheet",
            "name": "Balance Sheet",
            "route": "/finance/reports/balance-sheet",
            "permission_key": "finance.reports.balance_sheet",
            "icon": "scale",
        },
        {
            "code": "finance_report_cash_flow",
            "name": "Cash Flow",
            "route": "/finance/reports/cash-flow",
            "permission_key": "finance.reports.cash_flow",
            "icon": "waves",
        },
        {
            "code": "finance_report_ar_recap",
            "name": "AR Recap",
            "route": "/finance/reports/ar-recap",
            "permission_key": "finance.reports.ar_recap",
            "icon": "list",
        },
        {
            "code": "finance_report_ap_recap",
            "name": "AP Recap",
            "route": "/finance/reports/ap-recap",
            "permission_key": "finance.reports.ap_recap",
            "icon": "list-checks",
        },
    ],
    "inventory": [
        {
            "code": "inventory_product_mutation",
            "name": "Product Mutation",
            "route": "/inventory/product-mutations",
            "permission_key": "inventory.product_mutations.view",
            "icon": "shuffle",
        },
        {
            "code": "inventory_stock_opname",
            "name": "Stock Opname",
            "route": "/inventory/stock-opname",
            "permission_key": "inventory.stock_opname.view",
            "icon": "clipboard-list",
        },
        {
            "code": "inventory_stock_adjustment",
            "name": "Stock Adjustment",
            "route": "/inventory/stock-adjustments",
            "permission_key": "inventory.stock_adjustments.view",
            "icon": "sliders",
        },
        {
            "code": "inventory_report_stock_card",
            "name": "Stock Card",
            "route": "/inventory/reports/stock-card",
            "permission_key": "inventory.reports.stock_card",
            "icon": "id-card",
        },
        {
            "code": "inventory_report_inventory",
            "name": "Inventory Report",
            "route": "/inventory/reports/inventory",
            "permission_key": "inventory.reports.inventory",
            "icon": "bar-chart-2",
        },
    ],
    "purchasing": [
        {
            "code": "purchasing_purchase_request",
            "name": "Purchase Request",
            "route": "/purchasing/purchase-requests",
            "permission_key": "purchasing.purchase_requests.view",
            "icon": "file-plus",
        },
        {
            "code": "purchasing_request_for_quotation",
            "name": "Request for Quotation",
            "route": "/purchasing/request-for-quotation",
            "permission_key": "purchasing.rfq.view",
            "icon": "file-question",
        },
        {
            "code": "purchasing_purchase_order",
            "name": "Purchase Order",
            "route": "/purchasing/purchase-orders",
            "permission_key": "purchasing.purchase_orders.view",
            "icon": "file-text",
        },
        {
            "code": "purchasing_goods_receipt",
            "name": "Goods Receipt",
            "route": "/purchasing/goods-receipts",
            "permission_key": "purchasing.goods_receipts.view",
            "icon": "package-plus",
        },
        {
            "code": "purchasing_receive_invoice",
            "name": "Receive Invoice",
            "route": "/purchasing/received-invoices",
            "permission_key": "purchasing.receive_invoices.view",
            "icon": "file-check",
        },
        {
            "code": "purchasing_purchase_return",
            "name": "Purchase Return",
            "route": "/purchasing/purchase-returns",
            "permission_key": "purchasing.purchase_returns.view",
            "icon": "rotate-ccw",
        },
        {
            "code": "purchasing_tukar_faktur",
            "name": "Tukar Faktur",
            "route": "/purchasing/tukar-faktur",
            "permission_key": "purchasing.tukar_faktur.view",
            "icon": "repeat",
        },
        {
            "code": "purchasing_report_purchase",
            "name": "Purchase Report",
            "route": "/purchasing/reports/purchase",
            "permission_key": "purchasing.reports.purchase",
            "icon": "bar-chart",
        },
    ],
    "sales": [
        {
            "code": "sales_sales_quotation",
            "name": "Sales Quotation",
            "route": "/sales/quotations",
            "permission_key": "sales.quotations.view",
            "icon": "file-input",
        },
        {
            "code": "sales_sales_order",
            "name": "Sales Order",
            "route": "/sales/orders",
            "permission_key": "sales.orders.view",
            "icon": "shopping-bag",
        },
        {
            "code": "sales_sales_invoice",
            "name": "Sales Invoice",
            "route": "/sales/invoices",
            "permission_key": "sales.invoices.view",
            "icon": "receipt",
        },
        {
            "code": "sales_sales_return",
            "name": "Sales Return",
            "route": "/sales/returns",
            "permission_key": "sales.returns.view",
            "icon": "rotate-cw",
        },
        {
            "code": "sales_pos",
            "name": "Point of Sale",
            "route": "/sales/pos",
            "permission_key": "sales.pos.view",
            "icon": "touchpad",
        },
        {
            "code": "sales_report_sales",
            "name": "Sales Report",
            "route": "/sales/reports/sales",
            "permission_key": "sales.reports.sales",
            "icon": "bar-chart-3",
        },
        {
            "code": "sales_report_salesperson",
            "name": "Salesperson Report",
            "route": "/sales/reports/salesperson",
            "permission_key": "sales.reports.salesperson",
            "icon": "users-2",
        },
        {
            "code": "sales_report_customer",
            "name": "Customer Report",
            "route": "/sales/reports/customers",
            "permission_key": "sales.reports.customer",
            "icon": "user-circle",
        },
        {
            "code": "sales_report_item",
            "name": "Item Sales Report",
            "route": "/sales/reports/items",
            "permission_key": "sales.reports.item",
            "icon": "list",
        },
    ],
    "manufacturing": [
        {
            "code": "manufacturing_bill_of_material",
            "name": "Bill of Material",
            "route": "/manufacturing/bill-of-material",
            "permission_key": "manufacturing.bom.view",
            "icon": "layers",
        },
        {
            "code": "manufacturing_production_order",
            "name": "Production Order",
            "route": "/manufacturing/production-orders",
            "permission_key": "manufacturing.production_orders.view",
            "icon": "factory",
        },
        {
            "code": "manufacturing_work_center",
            "name": "Work Center",
            "route": "/manufacturing/work-centers",
            "permission_key": "manufacturing.work_centers.view",
            "icon": "server-cog",
        },
        {
            "code": "manufacturing_report_production",
            "name": "Production Report",
            "route": "/manufacturing/reports/production",
            "permission_key": "manufacturing.reports.production",
            "icon": "chart-line",
        },
        {
            "code": "manufacturing_report_work_center",
            "name": "Work Center Report",
            "route": "/manufacturing/reports/work-center",
            "permission_key": "manufacturing.reports.work_center",
            "icon": "wrench",
        },
    ],
    "administration": [
        {
            "code": "admin_users",
            "name": "User Management",
            "route": "/users",
            "permission_key": "users.view",
            "icon": "users",
        },
        {
            "code": "admin_roles",
            "name": "Role Management",
            "route": "/roles",
            "permission_key": "roles.view",
            "icon": "shield",
        },
    ],
}


ALL_MENU_PERMISSION_KEYS: List[str] = sorted(
    {item["permission_key"] for items in MENU_STRUCTURE.values() for item in items}
)
