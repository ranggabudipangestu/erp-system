using ProductEntity = ERP.Modules.MasterData.Product.Entities.Product;

namespace ERP.Modules.MasterData.Product.Contracts;

public interface IProductRepository
{
    Task<IEnumerable<ProductEntity>> GetAllAsync();
    Task<ProductEntity?> GetByIdAsync(Guid id);
    Task<ProductEntity?> GetByCodeAsync(string code);
    Task<IEnumerable<ProductEntity>> GetByCategoryAsync(string category);
    Task<IEnumerable<ProductEntity>> SearchAsync(string searchTerm);
    Task<ProductEntity> CreateAsync(ProductEntity product);
    Task<ProductEntity> UpdateAsync(ProductEntity product);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> CodeExistsAsync(string code);
}