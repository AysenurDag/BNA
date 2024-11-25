using System;

namespace TradingBot.Core.Models;

public class TradingStrategy
{
    public string Symbol { get; set; } = string.Empty;
    public decimal EntryPrice { get; set; }
    public decimal ExitPrice { get; set; }
    public decimal StopLoss { get; set; }
    public decimal Quantity { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}