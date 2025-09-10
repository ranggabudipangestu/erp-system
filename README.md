# ERP System

A modular monolith ERP (Enterprise Resource Planning) system built with modern technologies.

## Tech Stack

### Backend
- **FastAPI** (Python 3.12)
- **PostgreSQL** database
- **SQLAlchemy** for data access

### Frontend
- **React 18** with **Next.js 15**
- **TypeScript**
- **Tailwind CSS** for styling

### Reporting
- **QuestPDF** for PDF generation
- **EPPlus** for Excel reports
- **Metabase** for dashboards and analytics

### Deployment
- **Docker & Docker Compose** for local development
- **Kubernetes** ready for production scaling

## Architecture

The system follows a **modular monolith** architecture with clear separation of concerns:

```
/modules          # Business modules
  /auth           # Authentication & authorization
  /company        # Company management
  /finance        # Financial management
  /inventory      # Stock management
  /reporting      # Reports generation
  /master-data    # Master data management
    /Product      # Product master data

/infrastructure   # Cross-cutting concerns
  /db            # (replaced by Python SQLAlchemy setup)
  /caching       # (TBD)
  /event-bus     # (TBD)

/backend         # FastAPI backend (primary)

/ui             # User interface
  /react-app     # Next.js frontend application
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-system
   ```

2. **Start the application**
   ```bash
   docker compose up -d postgres redis minio api frontend metabase
   ```

3. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:8000
   - **API OpenAPI**: http://localhost:8000/docs
   - **Redis**: redis://localhost:6379
   - **Metabase**: http://localhost:3001

### Development

#### Backend Development (FastAPI)
```bash
# Option A: Docker (hot reload)
docker compose up -d --build api

# Option B: Local
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg2://erp_user:erp_password@localhost:5432/erp_system
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

#### Frontend Development
```bash
# Install dependencies
cd ui/react-app
npm install

# Start development server
npm run dev
```

## Database

The system uses PostgreSQL with the following schemas:
- `auth` - User authentication and authorization
- `company` - Company and organization data
- `finance` - Financial transactions and accounting
- `inventory` - Product and stock management
- `reporting` - Report definitions and metadata

## Services

### Core Modules
- **Authentication Module**: User management, roles, permissions
- **Company Module**: Organization structure, departments, employees
- **Finance Module**: Accounting, invoicing, payments
- **Inventory Module**: Products, stock levels, warehouses
- **Reporting Module**: Report generation and export

### Infrastructure Services
- **Database**: Entity Framework Core with PostgreSQL
- **Caching**: Redis-compatible caching layer
- **Event Bus**: Internal event handling for decoupled communication

### API Interfaces
- **REST API**: Primary API interface with OpenAPI documentation
- **GraphQL**: Flexible query interface for frontend applications
- **gRPC**: High-performance inter-service communication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
