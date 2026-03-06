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

def seed_units_permission():
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # 1. Get menu_item_id for 'master_units'
        result = session.execute(text("SELECT id FROM menu_items WHERE code = 'master_units'"))
        menu_item_id = result.scalar()

        if not menu_item_id:
            print("master_units menu item not found.")
            return

        # 2. Get role IDs for all roles so everyone can view units (or at least admin/owner)
        roles_result = session.execute(text("SELECT id, name FROM roles WHERE name IN ('admin', 'owner', 'finance', 'sales', 'warehouse', 'production')"))
        roles = roles_result.fetchall()

        for role_id, role_name in roles:
            # 3. Insert or update permission for this role and menu item
            session.execute(
                text("""
                    INSERT INTO role_permissions (id, role_id, menu_item_id, can_view, can_create, can_edit, can_delete, can_export)
                    VALUES (:id, :role_id, :menu_item_id, true, true, true, true, true)
                    ON CONFLICT (role_id, menu_item_id) DO UPDATE SET
                        can_view = true,
                        can_create = true,
                        can_edit = true,
                        can_delete = true,
                        can_export = true
                """),
                {"id": str(uuid.uuid4()), "role_id": role_id, "menu_item_id": menu_item_id}
            )
            print(f"Added master_units permissions for {role_name}")

        session.commit()
        print("Successfully seeded units permission.")
    except Exception as e:
        session.rollback()
        print(f"Error seeding units permission: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_units_permission()
