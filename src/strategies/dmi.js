import { TechnicalIndicators } from './indicators.js';

export class DMIStrategy {
  constructor(config = {}) {
    this.config = {
      period: config.period || 14,
      threshold: config.threshold || 25,
      ...config
    };
  }

  async calculate(highs, lows, closes) {
    const plusDM = this._calculatePlusDM(highs, lows);
    const minusDM = this._calculateMinusDM(highs, lows);
    const trueRange = await this._calculateTrueRange(highs, lows, closes);
    
    const smoothedPlusDM = await TechnicalIndicators.calculateEMA(plusDM, this.config.period);
    const smoothedMinusDM = await TechnicalIndicators.calculateEMA(minusDM, this.config.period);
    const smoothedTR = await TechnicalIndicators.calculateEMA(trueRange, this.config.period);

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;
    const adx = this._calculateADX(plusDI, minusDI);

    return {
      plusDI,
      minusDI,
      adx
    };
  }

  _calculatePlusDM(highs, lows) {
    const plusDM = [];
    for (let i = 1; i < highs.length; i++) {
      const highDiff = highs[i] - highs[i - 1];
      const lowDiff = lows[i - 1] - lows[i];
      plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    }
    return plusDM;
  }

  _calculateMinusDM(highs, lows) {
    const minusDM = [];
    for (let i = 1; i < lows.length; i++) {
      const highDiff = highs[i] - highs[i - 1];
      const lowDiff = lows[i - 1] - lows[i];
      minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    }
    return minusDM;
  }

  async _calculateTrueRange(highs, lows, closes) {
    const tr = [];
    for (let i = 1; i < highs.length; i++) {
      tr.push(Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      ));
    }
    return tr;
  }

  _calculateADX(plusDI, minusDI) {
    const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
    return dx;
  }

  generateSignal(plusDI, minusDI, adx) {
    if (adx < this.config.threshold) {
      return 'HOLD'; // Trend not strong enough
    }

    if (plusDI > minusDI) {
      return 'BUY';
    } else if (minusDI > plusDI) {
      return 'SELL';
    }

    return 'HOLD';
  }
}