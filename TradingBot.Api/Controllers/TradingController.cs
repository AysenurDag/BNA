using Microsoft.AspNetCore.Mvc;
using TradingBot.Core.Services;

namespace TradingBot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TradingController : ControllerBase
{
    private readonly IBinanceService _binanceService;

    public TradingController(IBinanceService binanceService)
    {
        _binanceService = binanceService;
    }

    [HttpGet("price/{symbol}")]
    public async Task<IActionResult> GetPrice(string symbol)
    {
        var price = await _binanceService.GetCurrentPrice(symbol);
        return Ok(new { Symbol = symbol, Price = price });
    }

    [HttpPost("order")]
    public async Task<IActionResult> PlaceOrder([FromBody] OrderRequest request)
    {
        var success = await _binanceService.PlaceOrder(request.Symbol, request.Quantity, request.IsBuy);
        return success ? Ok() : BadRequest();
    }

    [HttpGet("strategies")]
    public async Task<IActionResult> GetStrategies()
    {
        var strategies = await _binanceService.GetActiveStrategies();
        return Ok(strategies);
    }
}

public class OrderRequest
{
    public string Symbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public bool IsBuy { get; set; }
}