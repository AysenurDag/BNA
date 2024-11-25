import Binance from 'node-binance-api';
import { TradingStrategy } from '../strategies/tradingStrategy.js';

class BinanceService {
  constructor() {
    this.client = new Binance().options({
      APIKEY: process.env.BINANCE_API_KEY || 'your-api-key',
      APISECRET: process.env.BINANCE_API_SECRET || 'your-api-secret',
      test: true // Use testnet
    });
    this.strategies = new Map();
    this.priceCache = new Map();
  }

  async getCurrentPrice(symbol) {
    try {
      const ticker = await this.client.prices(symbol);
      return ticker[symbol];
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol, startTime, endTime, interval = '1h') {
    try {
      const candles = await this.client.candlesticks(symbol, interval, {
        startTime,
        endTime,
        limit: 1000
      });
      return candles;
    } catch (error) {
      console.error('Error getting historical data:', error);
      throw error;
    }
  }

  async placeOrder(symbol, quantity, isBuy, options = {}) {
    try {
      const strategy = this.strategies.get(symbol) || new TradingStrategy(symbol);
      const currentPrice = await this.getCurrentPrice(symbol);

      const orderParams = {
        stopLoss: strategy.calculateStopLoss(currentPrice, isBuy),
        takeProfit: strategy.calculateTakeProfit(currentPrice, isBuy),
        ...options
      };

      const order = isBuy
        ? await this.client.buy(symbol, quantity, undefined, orderParams)
        : await this.client.sell(symbol, quantity, undefined, orderParams);

      return order;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async analyzePair(symbol) {
    try {
      const prices = await this.getRecentPrices(symbol);
      const strategy = this.strategies.get(symbol) || new TradingStrategy(symbol);
      return await strategy.analyze(prices);
    } catch (error) {
      console.error('Error analyzing pair:', error);
      throw error;
    }
  }

  async getRecentPrices(symbol, limit = 100) {
    try {
      const candles = await this.client.candlesticks(symbol, '1h', { limit });
      return candles.map(candle => parseFloat(candle[4])); // Close prices
    } catch (error) {
      console.error('Error getting recent prices:', error);
      throw error;
    }
  }

  getActiveStrategies() {
    return Array.from(this.strategies.values())
      .filter(s => s.isActive)
      .map(s => ({
        symbol: s.symbol,
        config: s.config,
        lastAnalysis: s.lastAnalysis
      }));
  }
}

export default new BinanceService();