using ERP.Modules.MasterData.Product.DTOs;

namespace ERP.Modules.MasterData.Product.Contracts;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllProductsAsync();
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto?> GetProductByCodeAsync(string code);
    Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(string category);
    Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm);
    Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto);
    Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductDto updateProductDto);
    Task<bool> DeleteProductAsync(Guid id);
}