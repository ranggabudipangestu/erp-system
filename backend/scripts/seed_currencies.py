import uuid
import sys
import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings


def seed_currency_permissions():
    """Seed permissions for master_currencies"""
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    with Session() as session:
        # Check if master_currencies menu item exists
        result = session.execute(
            text("SELECT id FROM menu_items WHERE code = :code"),
            {"code": "master_currencies"}
        ).fetchone()

        if not result:
            # Get master_data module id
            md_module = session.execute(
                text("SELECT id FROM modules WHERE code = :code"),
                {"code": "master_data"}
            ).fetchone()
            
            if not md_module:
                print("Error: modules 'master_data' not found!")
                return
                
            md_module_id = md_module[0]
            menu_item_id = str(uuid.uuid4())
            
            # Insert menu item
            session.execute(
                text("""
                INSERT INTO menu_items (id, module_id, code, name, icon, path, sort_order, is_active)
                VALUES (:id, :module_id, :code, :name, :icon, :path, :sort_order, :is_active)
                """),
                {
                    "id": menu_item_id,
                    "module_id": md_module_id,
                    "code": "master_currencies",
                    "name": "Currencies",
                    "icon": "BanknotesIcon",
                    "path": "/master-data/currencies",
                    "sort_order": 5, # adjust later if needed
                    "is_active": True
                }
            )
            print("Inserted menu_item: master_currencies")
        else:
            menu_item_id = result[0]
            print("menu_item master_currencies already exists")

        # Get all roles to assign permissions
        roles_result = session.execute(text("SELECT id, name FROM roles")).fetchall()
        for role in roles_result:
            role_id = role[0]
            role_name = role[1]
            
            # Check if permission already exists
            perm = session.execute(
                text("""
                SELECT id FROM role_permissions 
                WHERE role_id = :role_id AND menu_item_id = :menu_item_id
                """),
                {"role_id": role_id, "menu_item_id": menu_item_id}
            ).fetchone()
            
            if not perm:
                # Default permissions based on role
                # Super Admin and Owner have full access. Others view only for now
                can_view = True
                can_create = role_name in ("Super Admin", "Owner")
                can_edit = role_name in ("Super Admin", "Owner")
                can_delete = role_name in ("Super Admin", "Owner")
                
                session.execute(
                    text("""
                    INSERT INTO role_permissions (id, role_id, menu_item_id, can_view, can_create, can_edit, can_delete)
                    VALUES (:id, :role_id, :menu_item_id, :can_view, :can_create, :can_edit, :can_delete)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "role_id": role_id,
                        "menu_item_id": menu_item_id,
                        "can_view": can_view,
                        "can_create": can_create,
                        "can_edit": can_edit,
                        "can_delete": can_delete
                    }
                )
                print(f"Inserted permissions for role: {role_name}")
            else:
                print(f"Permissions for role: {role_name} already exist")
                
        # Link menu item to subscription plans if not linked
        plans = session.execute(text("SELECT id FROM subscription_plans")).fetchall()
        for plan in plans:
            plan_id = plan[0]
            plan_menu = session.execute(
                text("""
                SELECT id FROM plan_menu_items 
                WHERE plan_id = :plan_id AND menu_item_id = :menu_item_id
                """),
                {"plan_id": plan_id, "menu_item_id": menu_item_id}
            ).fetchone()
            
            if not plan_menu:
                session.execute(
                    text("""
                    INSERT INTO plan_menu_items (id, plan_id, menu_item_id, is_included)
                    VALUES (:id, :plan_id, :menu_item_id, :is_included)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "plan_id": plan_id,
                        "menu_item_id": menu_item_id,
                        "is_included": True
                    }
                )
                print(f"Linked menu_item to plan: {plan_id}")
        
        session.commit()
        print("Done seeding permissions")

        # Seed default currencies into all tenants
        tenants = session.execute(text("SELECT id FROM tenants")).fetchall()
        defaults = [
            {"code": "IDR", "name": "Indonesian Rupiah", "symbol": "Rp", "exchange_rate": "1.0000"},
            {"code": "USD", "name": "US Dollar", "symbol": "$", "exchange_rate": "16000.0000"},
            {"code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate": "17000.0000"},
        ]
        user_email = "system@populix.co"

        for (tenant_id,) in tenants:
            for cur in defaults:
                exists = session.execute(
                    text("""
                    SELECT id FROM currencies 
                    WHERE tenant_id = :tenant_id AND code = :code
                    """),
                    {"tenant_id": tenant_id, "code": cur["code"]}
                ).fetchone()

                if not exists:
                    session.execute(
                        text("""
                        INSERT INTO currencies (id, tenant_id, code, name, symbol, exchange_rate, created_by)
                        VALUES (:id, :tenant_id, :code, :name, :symbol, :exchange_rate, :created_by)
                        """),
                        {
                            "id": str(uuid.uuid4()),
                            "tenant_id": tenant_id,
                            "code": cur["code"],
                            "name": cur["name"],
                            "symbol": cur["symbol"],
                            "exchange_rate": cur["exchange_rate"],
                            "created_by": user_email
                        }
                    )
                    print(f"Seeded currency {cur['code']} for tenant {tenant_id}")

        session.commit()
        print("Done seeding default currencies")


if __name__ == "__main__":
    seed_currency_permissions()
