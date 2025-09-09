from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Integer, Text
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ReportingTemplate(Base):
    __tablename__ = "reporting_templates"
    __table_args__ = (
        {},
    )

    id: Mapped[int] = mapped_column("id", Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[str] = mapped_column("tenant_id", String(50), nullable=False)
    template_type: Mapped[str] = mapped_column("template_type", String(50), nullable=False)  # invoice, receipt, po
    version: Mapped[int] = mapped_column("version", Integer, nullable=False)
    file_path: Mapped[str] = mapped_column("file_path", Text, nullable=False)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        "created_at", DateTime(timezone=True), nullable=False, server_default=func.now()
    )