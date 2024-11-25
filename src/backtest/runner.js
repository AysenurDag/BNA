import { TradingStrategy } from '../strategies/tradingStrategy.js';
import binanceService from '../services/binanceService.js';

class BacktestRunner {
  constructor(symbol, startTime, endTime, initialBalance = 10000) {
    this.symbol = symbol;
    this.startTime = startTime;
    this.endTime = endTime;
    this.balance = initialBalance;
    this.positions = [];
    this.trades = [];
    this.strategy = new TradingStrategy(symbol);
  }

  async run() {
    try {
      const historicalData = await binanceService.getHistoricalData(
        this.symbol,
        this.startTime,
        this.endTime
      );

      const prices = historicalData.map(candle => parseFloat(candle.close));
      let position = null;

      for (let i = 100; i < prices.length; i++) {
        const windowPrices = prices.slice(0, i + 1);
        const analysis = await this.strategy.analyze(windowPrices);
        const currentPrice = prices[i];

        if (!position && analysis.signal === 'BUY') {
          position = this.openPosition('BUY', currentPrice, this.balance * 0.1);
        } else if (!position && analysis.signal === 'SELL') {
          position = this.openPosition('SELL', currentPrice, this.balance * 0.1);
        }

        if (position) {
          if (this.shouldClosePosition(position, currentPrice)) {
            this.closePosition(position, currentPrice);
            position = null;
          }
        }
      }

      return this.generateReport();
    } catch (error) {
      console.error('Backtest error:', error);
      throw error;
    }
  }

  openPosition(type, price, amount) {
    const position = {
      type,
      entryPrice: price,
      amount,
      stopLoss: this.strategy.calculateStopLoss(price, type === 'BUY'),
      takeProfit: this.strategy.calculateTakeProfit(price, type === 'BUY')
    };
    this.positions.push(position);
    return position;
  }

  shouldClosePosition(position, currentPrice) {
    if (position.type === 'BUY') {
      return currentPrice <= position.stopLoss || currentPrice >= position.takeProfit;
    }
    return currentPrice >= position.stopLoss || currentPrice <= position.takeProfit;
  }

  closePosition(position, currentPrice) {
    const pnl = position.type === 'BUY'
      ? (currentPrice - position.entryPrice) * position.amount / position.entryPrice
      : (position.entryPrice - currentPrice) * position.amount / position.entryPrice;

    this.balance += pnl;
    this.trades.push({
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      pnl,
      amount: position.amount
    });
  }

  generateReport() {
    const winningTrades = this.trades.filter(t => t.pnl > 0);
    return {
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      winRate: (winningTrades.length / this.trades.length) * 100,
      finalBalance: this.balance,
      totalReturn: ((this.balance - 10000) / 10000) * 100,
      trades: this.trades
    };
  }
}

export default BacktestRunner;