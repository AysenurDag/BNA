import { Router } from 'express';
import binanceService from '../services/binanceService.js';
import realTimeMonitor from '../monitoring/realTimeMonitor.js';

const router = Router();

router.get('/price/:symbol', async (req, res) => {
  try {
    const price = await binanceService.getCurrentPrice(req.params.symbol);
    res.json({ symbol: req.params.symbol, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/order', async (req, res) => {
  try {
    const { symbol, quantity, isBuy } = req.body;
    const order = await binanceService.placeOrder(symbol, quantity, isBuy);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/strategies', (req, res) => {
  try {
    const strategies = binanceService.getActiveStrategies();
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoints for advanced features
router.post('/monitor/start', (req, res) => {
  try {
    const { symbols } = req.body;
    realTimeMonitor.symbols = symbols || ['BTCUSDT', 'ETHUSDT'];
    realTimeMonitor.start();
    res.json({ message: 'Monitoring started', symbols: realTimeMonitor.symbols });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/monitor/stop', (req, res) => {
  try {
    realTimeMonitor.stop();
    res.json({ message: 'Monitoring stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alert', (req, res) => {
  try {
    const { symbol, price, type } = req.body;
    realTimeMonitor.setPriceAlert(symbol, price, type);
    res.json({ message: 'Price alert set', symbol, price, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;