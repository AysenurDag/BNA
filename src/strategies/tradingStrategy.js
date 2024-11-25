import { TechnicalIndicators } from './indicators.js';

export class TradingStrategy {
  constructor(symbol, config = {}) {
    this.symbol = symbol;
    this.config = {
      rsiPeriod: config.rsiPeriod || 14,
      rsiOverbought: config.rsiOverbought || 70,
      rsiOversold: config.rsiOversold || 30,
      bbPeriod: config.bbPeriod || 20,
      bbStdDev: config.bbStdDev || 2,
      stopLoss: config.stopLoss || 0.02, // 2%
      takeProfit: config.takeProfit || 0.03, // 3%
    };
  }

  async analyze(prices) {
    const rsi = await TechnicalIndicators.calculateRSI(prices, this.config.rsiPeriod);
    const bb = await TechnicalIndicators.calculateBollingerBands(prices, this.config.bbPeriod, this.config.bbStdDev);
    const macd = await TechnicalIndicators.calculateMACD(prices);

    return {
      signal: this.generateSignal(rsi, bb, prices[prices.length - 1]),
      indicators: { rsi, bb, macd }
    };
  }

  generateSignal(rsi, bb, currentPrice) {
    if (rsi < this.config.rsiOversold && currentPrice < bb.lower) {
      return 'BUY';
    } else if (rsi > this.config.rsiOverbought && currentPrice > bb.upper) {
      return 'SELL';
    }
    return 'HOLD';
  }

  calculateStopLoss(entryPrice, isBuy) {
    if (isBuy) {
      return entryPrice * (1 - this.config.stopLoss);
    }
    return entryPrice * (1 + this.config.stopLoss);
  }

  calculateTakeProfit(entryPrice, isBuy) {
    if (isBuy) {
      return entryPrice * (1 + this.config.takeProfit);
    }
    return entryPrice * (1 - this.config.takeProfit);
  }
}