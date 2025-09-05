FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER app
EXPOSE 5000
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["api/rest/ERP.Interfaces.REST.csproj", "api/rest/"]
COPY ["modules/master-data/ERP.Modules.MasterData.csproj", "modules/master-data/"]
COPY ["modules/auth/ERP.Modules.Auth.csproj", "modules/auth/"]
COPY ["modules/company/ERP.Modules.Company.csproj", "modules/company/"]
COPY ["modules/finance/ERP.Modules.Finance.csproj", "modules/finance/"]
COPY ["modules/inventory/ERP.Modules.Inventory.csproj", "modules/inventory/"]
COPY ["modules/reporting/ERP.Modules.Reporting.csproj", "modules/reporting/"]
COPY ["infrastructure/db/ERP.Infrastructure.DB.csproj", "infrastructure/db/"]
COPY ["infrastructure/caching/ERP.Infrastructure.Caching.csproj", "infrastructure/caching/"]
COPY ["infrastructure/event-bus/ERP.Infrastructure.EventBus.csproj", "infrastructure/event-bus/"]

RUN dotnet restore "./api/rest/ERP.Interfaces.REST.csproj"
COPY . .
WORKDIR "/src/api/rest"
RUN dotnet build "./ERP.Interfaces.REST.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ERP.Interfaces.REST.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ERP.Interfaces.REST.dll"]