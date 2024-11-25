import { SMA, EMA, RSI, BollingerBands, MACD } from 'trading-signals';
import NodeCache from 'node-cache';

const indicatorCache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

export class TechnicalIndicators {
  static async calculateRSI(prices, period = 14) {
    const cacheKey = `rsi-${period}-${prices[prices.length - 1]}`;
    const cached = indicatorCache.get(cacheKey);
    if (cached) return cached;

    const rsi = new RSI(period);
    prices.forEach(price => rsi.update(price));
    const result = rsi.getResult();
    indicatorCache.set(cacheKey, result);
    return result;
  }

  static async calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const cacheKey = `bb-${period}-${stdDev}-${prices[prices.length - 1]}`;
    const cached = indicatorCache.get(cacheKey);
    if (cached) return cached;

    const bb = new BollingerBands(period, stdDev);
    prices.forEach(price => bb.update(price));
    const result = bb.getResult();
    indicatorCache.set(cacheKey, result);
    return result;
  }

  static async calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const cacheKey = `macd-${fastPeriod}-${slowPeriod}-${signalPeriod}-${prices[prices.length - 1]}`;
    const cached = indicatorCache.get(cacheKey);
    if (cached) return cached;

    const macd = new MACD({ fastPeriod, slowPeriod, signalPeriod });
    prices.forEach(price => macd.update(price));
    const result = macd.getResult();
    indicatorCache.set(cacheKey, result);
    return result;
  }

  static async calculateSMA(prices, period = 20) {
    const cacheKey = `sma-${period}-${prices[prices.length - 1]}`;
    const cached = indicatorCache.get(cacheKey);
    if (cached) return cached;

    const sma = new SMA(period);
    prices.forEach(price => sma.update(price));
    const result = sma.getResult();
    indicatorCache.set(cacheKey, result);
    return result;
  }

  static async calculateEMA(prices, period = 20) {
    const cacheKey = `ema-${period}-${prices[prices.length - 1]}`;
    const cached = indicatorCache.get(cacheKey);
    if (cached) return cached;

    const ema = new EMA(period);
    prices.forEach(price => ema.update(price));
    const result = ema.getResult();
    indicatorCache.set(cacheKey, result);
    return result;
  }
}