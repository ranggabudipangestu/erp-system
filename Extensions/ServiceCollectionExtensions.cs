using ERP.Modules.MasterData.Product.Contracts;
using ERP.Modules.MasterData.Product.Repositories;
using ERP.Modules.MasterData.Product.Services;

namespace ERP.Interfaces.REST.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all application services across all modules.
    /// This is the single entry point for service registration.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register all module services
        services.AddMasterDataServices();
        services.AddAuthServices();
        services.AddFinanceServices();
        services.AddInventoryServices();
        services.AddCompanyServices();
        services.AddReportingServices();
        
        return services;
    }

    #region Module Service Registration
    
    public static IServiceCollection AddMasterDataServices(this IServiceCollection services)
    {
        // Product services
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IProductService, ProductService>();
        
        // Add other master data services here as they are created
        // services.AddScoped<ICategoryRepository, CategoryRepository>();
        // services.AddScoped<ICategoryService, CategoryService>();
        
        return services;
    }
    
    public static IServiceCollection AddAuthServices(this IServiceCollection services)
    {
        // Auth module services will go here when implemented
        // services.AddScoped<IUserRepository, UserRepository>();
        // services.AddScoped<IAuthService, AuthService>();
        
        return services;
    }
    
    public static IServiceCollection AddFinanceServices(this IServiceCollection services)
    {
        // Finance module services will go here when implemented
        // services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        // services.AddScoped<IFinanceService, FinanceService>();
        
        return services;
    }
    
    public static IServiceCollection AddInventoryServices(this IServiceCollection services)
    {
        // Inventory module services will go here when implemented
        // services.AddScoped<IInventoryRepository, InventoryRepository>();
        // services.AddScoped<IInventoryService, InventoryService>();
        
        return services;
    }
    
    public static IServiceCollection AddCompanyServices(this IServiceCollection services)
    {
        // Company module services will go here when implemented
        // services.AddScoped<ICompanyRepository, CompanyRepository>();
        // services.AddScoped<ICompanyService, CompanyService>();
        
        return services;
    }
    
    public static IServiceCollection AddReportingServices(this IServiceCollection services)
    {
        // Reporting module services will go here when implemented
        // services.AddScoped<IReportRepository, ReportRepository>();
        // services.AddScoped<IReportService, ReportService>();
        
        return services;
    }
    
    #endregion
}