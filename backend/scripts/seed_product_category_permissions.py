"""Seed product_categories permissions for existing roles."""
import os
import sys
import uuid
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure project package is importable
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(BACKEND_ROOT))

from app.core.config import settings

ROLES = ["admin", "owner", "finance", "sales", "warehouse", "production"]


def seed_product_categories_permission():
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get menu_item_id for master_product_categories
        result = session.execute(text("SELECT id FROM menu_items WHERE code = 'master_product_categories'"))
        menu_item_id = result.scalar()

        if not menu_item_id:
            print("ERROR: menu_item 'master_product_categories' not found.")
            return

        print(f"Found menu_item_id: {menu_item_id}")

        # Get role IDs
        roles_result = session.execute(
            text("SELECT id, name FROM roles WHERE name IN ('admin', 'owner', 'finance', 'sales', 'warehouse', 'production')")
        )
        roles = roles_result.fetchall()

        for role_id, role_name in roles:
            session.execute(
                text("""
                    INSERT INTO role_permissions (id, role_id, menu_item_id, can_view, can_create, can_edit, can_delete, can_export)
                    VALUES (:id, :role_id, :menu_item_id, true, true, true, true, false)
                    ON CONFLICT (role_id, menu_item_id) DO UPDATE SET
                        can_view = true,
                        can_create = true,
                        can_edit = true,
                        can_delete = true
                """),
                {"id": str(uuid.uuid4()), "role_id": role_id, "menu_item_id": menu_item_id},
            )
            print(f"  Granted product_categories permissions to role '{role_name}'")

        session.commit()
        print("Done!")
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    seed_product_categories_permission()
