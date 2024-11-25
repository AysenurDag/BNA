using Binance.Net.Clients;
using Binance.Net.Objects;
using TradingBot.Core.Models;

namespace TradingBot.Core.Services;

public class BinanceService : IBinanceService
{
    private readonly BinanceClient _client;
    private readonly List<TradingStrategy> _strategies;

    public BinanceService()
    {
        var config = new BinanceClientOptions
        {
            ApiCredentials = new BinanceApiCredentials(
                "your-api-key",
                "your-api-secret"
            ),
            SpotApiOptions = new BinanceApiClientOptions
            {
                BaseAddress = "https://testnet.binance.vision"
            }
        };

        _client = new BinanceClient(config);
        _strategies = new List<TradingStrategy>();
    }

    public async Task<decimal> GetCurrentPrice(string symbol)
    {
        var result = await _client.SpotApi.ExchangeData.GetPriceAsync(symbol);
        return result.Data.Price;
    }

    public async Task<bool> PlaceOrder(string symbol, decimal quantity, bool isBuy)
    {
        var result = await _client.SpotApi.Trading.PlaceOrderAsync(
            symbol,
            isBuy ? Binance.Net.Enums.OrderSide.Buy : Binance.Net.Enums.OrderSide.Sell,
            Binance.Net.Enums.SpotOrderType.Market,
            quantity
        );

        return result.Success;
    }

    public Task<IEnumerable<TradingStrategy>> GetActiveStrategies()
    {
        return Task.FromResult(_strategies.Where(s => s.IsActive).AsEnumerable());
    }
}