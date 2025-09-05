#!/bin/bash

# Script to run EF Core migrations
echo "🔄 Running EF Core migrations..."

# Export PATH to include dotnet tools
export PATH="$PATH:~/.dotnet/tools"

# Set connection string for local development
export ConnectionStrings__DefaultConnection="Host=localhost;Database=erp_system;Username=erp_user;Password=erp_password"

# Run migrations
dotnet ef database update --project infrastructure/db --startup-project api/rest

echo "✅ Migrations completed!"