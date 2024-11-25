import { TechnicalIndicators } from './indicators.js';

export class SuperTrendStrategy {
  constructor(config = {}) {
    this.config = {
      period: config.period || 10,
      multiplier: config.multiplier || 3,
      ...config
    };
  }

  async calculate(highs, lows, closes) {
    const atr = await this._calculateATR(highs, lows, closes, this.config.period);
    const basicUpperBand = this._calculateBasicBands(highs, lows, atr, true);
    const basicLowerBand = this._calculateBasicBands(highs, lows, atr, false);
    
    return this._calculateSuperTrend(closes, basicUpperBand, basicLowerBand);
  }

  async _calculateATR(highs, lows, closes, period) {
    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
    return await TechnicalIndicators.calculateEMA(trueRanges, period);
  }

  _calculateBasicBands(highs, lows, atr, isUpper) {
    const multiplier = this.config.multiplier;
    return isUpper
      ? ((highs + lows) / 2) + (multiplier * atr)
      : ((highs + lows) / 2) - (multiplier * atr);
  }

  _calculateSuperTrend(closes, upperBand, lowerBand) {
    let trend = [];
    let superTrend = [];
    let isUpTrend = closes[0] > lowerBand;

    for (let i = 0; i < closes.length; i++) {
      if (isUpTrend) {
        if (closes[i] < superTrend[i - 1]) {
          isUpTrend = false;
          superTrend[i] = upperBand;
        } else {
          superTrend[i] = lowerBand;
        }
      } else {
        if (closes[i] > superTrend[i - 1]) {
          isUpTrend = true;
          superTrend[i] = lowerBand;
        } else {
          superTrend[i] = upperBand;
        }
      }
      trend[i] = isUpTrend;
    }

    return { trend, superTrend };
  }
}