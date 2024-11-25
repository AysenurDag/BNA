import { TechnicalIndicators } from './indicators.js';

export class TechnicalAnalysis {
  static async analyzeTrend(prices, config = {}) {
    const sma20 = await TechnicalIndicators.calculateSMA(prices, 20);
    const sma50 = await TechnicalIndicators.calculateSMA(prices, 50);
    const sma200 = await TechnicalIndicators.calculateSMA(prices, 200);
    
    return {
      shortTerm: prices[prices.length - 1] > sma20,
      mediumTerm: prices[prices.length - 1] > sma50,
      longTerm: prices[prices.length - 1] > sma200,
      trendStrength: this._calculateTrendStrength(prices, sma20, sma50, sma200)
    };
  }

  static async analyzeVolatility(prices, config = {}) {
    const bb = await TechnicalIndicators.calculateBollingerBands(prices);
    const atr = await this._calculateATR(prices);
    
    return {
      volatility: (bb.upper - bb.lower) / bb.middle,
      atr,
      isHighVolatility: this._isHighVolatility(bb, atr)
    };
  }

  static async analyzeMomentum(prices, config = {}) {
    const rsi = await TechnicalIndicators.calculateRSI(prices);
    const macd = await TechnicalIndicators.calculateMACD(prices);
    
    return {
      rsi,
      macd,
      momentum: this._calculateMomentumScore(rsi, macd)
    };
  }

  static _calculateTrendStrength(prices, sma20, sma50, sma200) {
    const currentPrice = prices[prices.length - 1];
    let strength = 0;
    
    if (currentPrice > sma20) strength += 1;
    if (currentPrice > sma50) strength += 2;
    if (currentPrice > sma200) strength += 3;
    
    return strength / 6; // Normalized to 0-1
  }

  static _calculateATR(prices, period = 14) {
    const ranges = [];
    for (let i = 1; i < prices.length; i++) {
      ranges.push(Math.abs(prices[i] - prices[i - 1]));
    }
    return ranges.slice(-period).reduce((a, b) => a + b) / period;
  }

  static _isHighVolatility(bb, atr) {
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    return bbWidth > 0.05 || atr > bb.middle * 0.02;
  }

  static _calculateMomentumScore(rsi, macd) {
    let score = 0;
    
    if (rsi > 70) score -= 2;
    else if (rsi < 30) score += 2;
    else if (rsi > 60) score -= 1;
    else if (rsi < 40) score += 1;
    
    if (macd.histogram > 0) score += 1;
    else score -= 1;
    
    return Math.max(-3, Math.min(3, score)); // Normalized to -3 to 3
  }
}