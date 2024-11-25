export class RiskManagement {
  constructor(config = {}) {
    this.config = {
      maxPositionSize: config.maxPositionSize || 0.1, // 10% of portfolio
      maxDrawdown: config.maxDrawdown || 0.2, // 20% maximum drawdown
      riskPerTrade: config.riskPerTrade || 0.02, // 2% risk per trade
      maxOpenPositions: config.maxOpenPositions || 3,
      ...config
    };
  }

  calculatePositionSize(accountBalance, currentPrice, stopLoss) {
    const riskAmount = accountBalance * this.config.riskPerTrade;
    const stopLossDistance = Math.abs(currentPrice - stopLoss);
    const positionSize = riskAmount / stopLossDistance;
    
    // Ensure position size doesn't exceed maxPositionSize
    const maxSize = accountBalance * this.config.maxPositionSize;
    return Math.min(positionSize, maxSize);
  }

  validateTrade(trade, portfolio) {
    const openPositions = portfolio.getOpenPositions();
    
    // Check maximum open positions
    if (openPositions.length >= this.config.maxOpenPositions) {
      return { valid: false, reason: 'Maximum open positions reached' };
    }
    
    // Check drawdown limit
    const currentDrawdown = portfolio.getCurrentDrawdown();
    if (currentDrawdown > this.config.maxDrawdown) {
      return { valid: false, reason: 'Maximum drawdown exceeded' };
    }
    
    // Check position size
    if (trade.size > portfolio.getBalance() * this.config.maxPositionSize) {
      return { valid: false, reason: 'Position size too large' };
    }
    
    return { valid: true };
  }

  adjustStopLoss(position, currentPrice, atr) {
    const minStopDistance = atr * 1.5;
    const suggestedStop = position.type === 'long'
      ? currentPrice - minStopDistance
      : currentPrice + minStopDistance;
    
    return position.type === 'long'
      ? Math.max(position.stopLoss, suggestedStop)
      : Math.min(position.stopLoss, suggestedStop);
  }

  calculateTakeProfit(entryPrice, stopLoss, riskRewardRatio = 2) {
    const stopDistance = Math.abs(entryPrice - stopLoss);
    return entryPrice + (stopDistance * riskRewardRatio);
  }
}