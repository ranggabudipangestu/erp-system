using System.ComponentModel.DataAnnotations;

namespace ERP.Modules.MasterData.Product.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [MaxLength(50)]
    public string? Brand { get; set; }

    [MaxLength(50)]
    public string? Unit { get; set; }

    public decimal Price { get; set; }

    public decimal CostPrice { get; set; }

    public int StockQuantity { get; set; }

    public int MinimumStock { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }
}