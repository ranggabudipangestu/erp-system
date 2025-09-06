FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app
COPY app /app

EXPOSE 6000

ENV DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@postgres:5432/erp_system \
    CORS_ORIGINS=http://localhost:3000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "6000"]

