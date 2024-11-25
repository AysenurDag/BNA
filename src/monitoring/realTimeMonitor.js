import EventEmitter from 'events';
import binanceService from '../services/binanceService.js';
import { TradingStrategy } from '../strategies/tradingStrategy.js';

class RealTimeMonitor extends EventEmitter {
  constructor(symbols = ['BTCUSDT', 'ETHUSDT']) {
    super();
    this.symbols = symbols;
    this.strategies = new Map();
    this.priceAlerts = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.symbols.forEach(symbol => {
      this.strategies.set(symbol, new TradingStrategy(symbol));
      this._startMonitoring(symbol);
    });
  }

  stop() {
    this.isRunning = false;
  }

  async _startMonitoring(symbol) {
    while (this.isRunning) {
      try {
        const price = await binanceService.getCurrentPrice(symbol);
        const strategy = this.strategies.get(symbol);
        const prices = await binanceService.getRecentPrices(symbol);
        
        const analysis = await strategy.analyze(prices);
        
        this._checkAlerts(symbol, price);
        this._emitUpdate(symbol, price, analysis);

        if (analysis.signal !== 'HOLD') {
          this._emitSignal(symbol, analysis);
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second interval
      } catch (error) {
        console.error(`Monitoring error for ${symbol}:`, error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  setPriceAlert(symbol, price, type = 'above') {
    if (!this.priceAlerts.has(symbol)) {
      this.priceAlerts.set(symbol, []);
    }
    this.priceAlerts.get(symbol).push({ price, type });
  }

  _checkAlerts(symbol, currentPrice) {
    const alerts = this.priceAlerts.get(symbol) || [];
    alerts.forEach(alert => {
      if (alert.type === 'above' && currentPrice >= alert.price) {
        this.emit('priceAlert', {
          symbol,
          type: 'above',
          targetPrice: alert.price,
          currentPrice
        });
      } else if (alert.type === 'below' && currentPrice <= alert.price) {
        this.emit('priceAlert', {
          symbol,
          type: 'below',
          targetPrice: alert.price,
          currentPrice
        });
      }
    });
  }

  _emitUpdate(symbol, price, analysis) {
    this.emit('update', {
      symbol,
      price,
      analysis,
      timestamp: new Date().toISOString()
    });
  }

  _emitSignal(symbol, analysis) {
    this.emit('signal', {
      symbol,
      signal: analysis.signal,
      indicators: analysis.indicators,
      timestamp: new Date().toISOString()
    });
  }
}

export default new RealTimeMonitor();