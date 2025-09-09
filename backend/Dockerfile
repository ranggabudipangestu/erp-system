FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps including WeasyPrint dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    libcairo2 \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app
COPY app /app

EXPOSE 8000

ENV DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@postgres:5432/erp_system \
    CORS_ORIGINS=http://localhost:3000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

