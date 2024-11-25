// Common trading pairs
const commonPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT',
    'XRPUSDT', 'DOTUSDT', 'UNIUSDT', 'BCHUSDT', 'LTCUSDT',
    'LINKUSDT', 'VETUSDT', 'XLMUSDT', 'ETCUSDT', 'THETAUSDT',
    'FILUSDT', 'TRXUSDT', 'XMRUSDT', 'EOSUSDT', 'AAVEUSDT',
    'AVAXUSDT', 'SOLUSDT', 'RENDERUSDT', 'FETUSDT'
];

let priceChart = null;
let backtestChart = null;
let isMonitoring = false;

function setupAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    
    input.addEventListener('input', function() {
        const value = this.value.toUpperCase();
        const filteredPairs = value === '' ? commonPairs : commonPairs.filter(pair => 
            pair.includes(value)
        );
        
        if (filteredPairs.length > 0) {
            suggestionsDiv.innerHTML = filteredPairs
                .map(pair => `<div class="suggestion-item">${pair}</div>`)
                .join('');
            suggestionsDiv.style.display = 'block';
            
            const items = suggestionsDiv.getElementsByClassName('suggestion-item');
            Array.from(items).forEach(item => {
                item.addEventListener('click', function() {
                    input.value = this.textContent;
                    suggestionsDiv.style.display = 'none';
                });
            });
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    input.addEventListener('focus', function() {
        const filteredPairs = commonPairs;
        suggestionsDiv.innerHTML = filteredPairs
            .map(pair => `<div class="suggestion-item">${pair}</div>`)
            .join('');
        suggestionsDiv.style.display = 'block';
        
        const items = suggestionsDiv.getElementsByClassName('suggestion-item');
        Array.from(items).forEach(item => {
            item.addEventListener('click', function() {
                input.value = this.textContent;
                suggestionsDiv.style.display = 'none';
            });
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

function updatePriceChart(symbol, prices) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: prices.map((_, i) => i),
            datasets: [{
                label: symbol + ' Price',
                data: prices,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

async function checkPrice() {
    const symbol = document.getElementById('symbolInput').value.toUpperCase();
    const resultDiv = document.getElementById('priceResult');
    
    try {
        const response = await fetch(`/api/trading/price/${symbol}`);
        const data = await response.json();
        resultDiv.innerHTML = `Current price of ${data.symbol}: $${parseFloat(data.price).toFixed(2)}`;
        resultDiv.style.color = '#4CAF50';

        const pricesResponse = await fetch(`/api/trading/history/${symbol}`);
        const pricesData = await pricesResponse.json();
        updatePriceChart(symbol, pricesData.prices);
    } catch (error) {
        resultDiv.innerHTML = 'Error fetching price';
        resultDiv.style.color = '#f44336';
    }
}

async function placeOrder() {
    const symbol = document.getElementById('orderSymbol').value.toUpperCase();
    const quantity = document.getElementById('orderQuantity').value;
    const isBuy = document.getElementById('orderType').value === 'true';
    const stopLoss = document.getElementById('stopLoss').value;
    const takeProfit = document.getElementById('takeProfit').value;
    const resultDiv = document.getElementById('orderResult');

    try {
        const response = await fetch('/api/trading/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                symbol, 
                quantity, 
                isBuy,
                stopLoss: stopLoss ? parseFloat(stopLoss) / 100 : undefined,
                takeProfit: takeProfit ? parseFloat(takeProfit) / 100 : undefined
            })
        });
        
        if (response.ok) {
            resultDiv.innerHTML = `Order placed successfully: ${isBuy ? 'BUY' : 'SELL'} ${quantity} ${symbol}`;
            resultDiv.style.color = '#4CAF50';
        } else {
            throw new Error('Order failed');
        }
    } catch (error) {
        resultDiv.innerHTML = 'Error placing order';
        resultDiv.style.color = '#f44336';
    }
}

async function toggleMonitoring() {
    const button = document.getElementById('monitoringButton');
    isMonitoring = !isMonitoring;
    
    try {
        const response = await fetch(`/api/trading/monitor/${isMonitoring ? 'start' : 'stop'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbols: commonPairs
            })
        });
        
        if (response.ok) {
            button.textContent = isMonitoring ? 'Stop Monitoring' : 'Start Monitoring';
            button.style.backgroundColor = isMonitoring ? '#f44336' : '#4CAF50';
        }
    } catch (error) {
        console.error('Error toggling monitoring:', error);
    }
}

async function runBacktest() {
    const symbol = document.getElementById('backtestSymbol').value.toUpperCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const resultDiv = document.getElementById('backtestResult');

    try {
        const response = await fetch('/api/trading/backtest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                symbol,
                startTime: new Date(startDate).getTime(),
                endTime: new Date(endDate).getTime()
            })
        });

        const result = await response.json();
        updateBacktestChart(result);
        
        resultDiv.innerHTML += `
            <div class="backtest-stats">
                <p>Total Trades: ${result.totalTrades}</p>
                <p>Win Rate: ${result.winRate.toFixed(2)}%</p>
                <p>Total Return: ${result.totalReturn.toFixed(2)}%</p>
                <p>Final Balance: $${result.finalBalance.toFixed(2)}</p>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = 'Error running backtest';
        resultDiv.style.color = '#f44336';
    }
}

function updateBacktestChart(result) {
    const ctx = document.getElementById('backtestChart').getContext('2d');
    
    if (backtestChart) {
        backtestChart.destroy();
    }

    const balanceHistory = result.trades.map((trade, index) => ({
        x: index,
        y: 10000 + result.trades.slice(0, index + 1).reduce((sum, t) => sum + t.pnl, 0)
    }));

    backtestChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Account Balance',
                data: balanceHistory,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Balance (USDT)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Trade Number'
                    }
                }
            }
        }
    });
}

// Initialize autocomplete for all symbol inputs
document.addEventListener('DOMContentLoaded', function() {
    setupAutocomplete('symbolInput', 'symbolSuggestions');
    setupAutocomplete('orderSymbol', 'orderSymbolSuggestions');
    setupAutocomplete('backtestSymbol', 'backtestSymbolSuggestions');
    
    // Set default dates for backtesting
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('startDate').value = oneMonthAgo.toISOString().slice(0, 16);
    document.getElementById('endDate').value = now.toISOString().slice(0, 16);
});