using ERP.Modules.MasterData.Product.Contracts;
using ProductEntity = ERP.Modules.MasterData.Product.Entities.Product;
using Microsoft.EntityFrameworkCore;

namespace ERP.Modules.MasterData.Product.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly DbContext _context;

    public ProductRepository(DbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductEntity>> GetAllAsync()
    {
        return await _context.Set<ProductEntity>()
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<ProductEntity?> GetByIdAsync(Guid id)
    {
        return await _context.Set<ProductEntity>().FindAsync(id);
    }

    public async Task<ProductEntity?> GetByCodeAsync(string code)
    {
        return await _context.Set<ProductEntity>()
            .FirstOrDefaultAsync(p => p.Code == code);
    }

    public async Task<IEnumerable<ProductEntity>> GetByCategoryAsync(string category)
    {
        return await _context.Set<ProductEntity>()
            .Where(p => p.Category == category)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductEntity>> SearchAsync(string searchTerm)
    {
        return await _context.Set<ProductEntity>()
            .Where(p => p.Name.Contains(searchTerm) || 
                       p.Code.Contains(searchTerm) ||
                       (p.Description != null && p.Description.Contains(searchTerm)))
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<ProductEntity> CreateAsync(ProductEntity product)
    {
        _context.Set<ProductEntity>().Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<ProductEntity> UpdateAsync(ProductEntity product)
    {
        _context.Entry(product).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var product = await _context.Set<ProductEntity>().FindAsync(id);
        if (product == null)
            return false;

        _context.Set<ProductEntity>().Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Set<ProductEntity>().AnyAsync(p => p.Id == id);
    }

    public async Task<bool> CodeExistsAsync(string code)
    {
        return await _context.Set<ProductEntity>().AnyAsync(p => p.Code == code);
    }
}