export class Portfolio {
  constructor(initialBalance = 10000) {
    this.balance = initialBalance;
    this.positions = new Map();
    this.tradeHistory = [];
    this.initialBalance = initialBalance;
  }

  openPosition(symbol, type, price, size, stopLoss, takeProfit) {
    if (this.positions.has(symbol)) {
      throw new Error(`Position already exists for ${symbol}`);
    }

    const position = {
      symbol,
      type,
      entryPrice: price,
      size,
      stopLoss,
      takeProfit,
      openTime: new Date(),
      unrealizedPnL: 0
    };

    this.positions.set(symbol, position);
    this.balance -= size * price;
    return position;
  }

  closePosition(symbol, price) {
    const position = this.positions.get(symbol);
    if (!position) {
      throw new Error(`No position found for ${symbol}`);
    }

    const pnl = this.calculatePnL(position, price);
    this.balance += (position.size * price) + pnl;

    const trade = {
      symbol,
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice: price,
      size: position.size,
      pnl,
      duration: new Date() - position.openTime
    };

    this.tradeHistory.push(trade);
    this.positions.delete(symbol);
    return trade;
  }

  calculatePnL(position, currentPrice) {
    const multiplier = position.type === 'long' ? 1 : -1;
    return position.size * (currentPrice - position.entryPrice) * multiplier;
  }

  updatePositions(prices) {
    for (const [symbol, position] of this.positions) {
      const currentPrice = prices[symbol];
      if (!currentPrice) continue;

      position.unrealizedPnL = this.calculatePnL(position, currentPrice);

      // Check stop loss and take profit
      if (position.type === 'long') {
        if (currentPrice <= position.stopLoss) {
          this.closePosition(symbol, currentPrice);
        } else if (currentPrice >= position.takeProfit) {
          this.closePosition(symbol, currentPrice);
        }
      } else {
        if (currentPrice >= position.stopLoss) {
          this.closePosition(symbol, currentPrice);
        } else if (currentPrice <= position.takeProfit) {
          this.closePosition(symbol, currentPrice);
        }
      }
    }
  }

  getMetrics() {
    const winningTrades = this.tradeHistory.filter(t => t.pnl > 0);
    const losingTrades = this.tradeHistory.filter(t => t.pnl < 0);

    return {
      currentBalance: this.balance,
      totalReturn: ((this.balance - this.initialBalance) / this.initialBalance) * 100,
      winRate: (winningTrades.length / this.tradeHistory.length) * 100,
      averageWin: winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length,
      averageLoss: losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length,
      maxDrawdown: this.calculateMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio()
    };
  }

  calculateMaxDrawdown() {
    let peak = this.initialBalance;
    let maxDrawdown = 0;

    for (const trade of this.tradeHistory) {
      const balance = this.initialBalance + trade.pnl;
      peak = Math.max(peak, balance);
      const drawdown = (peak - balance) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown * 100;
  }

  calculateSharpeRatio() {
    const returns = this.tradeHistory.map(t => t.pnl / this.initialBalance);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    return avgReturn / stdDev;
  }
}