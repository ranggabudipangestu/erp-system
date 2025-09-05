using ERP.Modules.MasterData.Product.Contracts;
using ERP.Modules.MasterData.Product.DTOs;
using ProductEntity = ERP.Modules.MasterData.Product.Entities.Product;

namespace ERP.Modules.MasterData.Product.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(MapToDto);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<ProductDto?> GetProductByCodeAsync(string code)
    {
        var product = await _productRepository.GetByCodeAsync(code);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<IEnumerable<ProductDto>> GetProductsByCategoryAsync(string category)
    {
        var products = await _productRepository.GetByCategoryAsync(category);
        return products.Select(MapToDto);
    }

    public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string searchTerm)
    {
        var products = await _productRepository.SearchAsync(searchTerm);
        return products.Select(MapToDto);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto)
    {
        if (await _productRepository.CodeExistsAsync(createProductDto.Code))
        {
            throw new ArgumentException($"Product with code '{createProductDto.Code}' already exists.");
        }

        var product = new ProductEntity
        {
            Code = createProductDto.Code,
            Name = createProductDto.Name,
            Description = createProductDto.Description,
            Category = createProductDto.Category,
            Brand = createProductDto.Brand,
            Unit = createProductDto.Unit,
            Price = createProductDto.Price,
            CostPrice = createProductDto.CostPrice,
            StockQuantity = createProductDto.StockQuantity,
            MinimumStock = createProductDto.MinimumStock,
            IsActive = createProductDto.IsActive,
            ImageUrl = createProductDto.ImageUrl,
            CreatedBy = createProductDto.CreatedBy,
            CreatedAt = DateTime.UtcNow
        };

        var createdProduct = await _productRepository.CreateAsync(product);
        return MapToDto(createdProduct);
    }

    public async Task<ProductDto> UpdateProductAsync(Guid id, UpdateProductDto updateProductDto)
    {
        var existingProduct = await _productRepository.GetByIdAsync(id);
        if (existingProduct == null)
        {
            throw new ArgumentException($"Product with ID '{id}' not found.");
        }

        existingProduct.Name = updateProductDto.Name;
        existingProduct.Description = updateProductDto.Description;
        existingProduct.Category = updateProductDto.Category;
        existingProduct.Brand = updateProductDto.Brand;
        existingProduct.Unit = updateProductDto.Unit;
        existingProduct.Price = updateProductDto.Price;
        existingProduct.CostPrice = updateProductDto.CostPrice;
        existingProduct.StockQuantity = updateProductDto.StockQuantity;
        existingProduct.MinimumStock = updateProductDto.MinimumStock;
        existingProduct.IsActive = updateProductDto.IsActive;
        existingProduct.ImageUrl = updateProductDto.ImageUrl;
        existingProduct.UpdatedBy = updateProductDto.UpdatedBy;
        existingProduct.UpdatedAt = DateTime.UtcNow;

        var updatedProduct = await _productRepository.UpdateAsync(existingProduct);
        return MapToDto(updatedProduct);
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        return await _productRepository.DeleteAsync(id);
    }

    private static ProductDto MapToDto(ProductEntity product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Code = product.Code,
            Name = product.Name,
            Description = product.Description,
            Category = product.Category,
            Brand = product.Brand,
            Unit = product.Unit,
            Price = product.Price,
            CostPrice = product.CostPrice,
            StockQuantity = product.StockQuantity,
            MinimumStock = product.MinimumStock,
            IsActive = product.IsActive,
            ImageUrl = product.ImageUrl,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CreatedBy = product.CreatedBy,
            UpdatedBy = product.UpdatedBy
        };
    }
}