using TradingBot.Core.Models;

namespace TradingBot.Core.Services;

public interface IBinanceService
{
    Task<decimal> GetCurrentPrice(string symbol);
    Task<bool> PlaceOrder(string symbol, decimal quantity, bool isBuy);
    Task<IEnumerable<TradingStrategy>> GetActiveStrategies();
}