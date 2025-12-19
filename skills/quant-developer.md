---
name: quant-developer
description: Quant developer expert for algorithmic trading with QuantConnect LEAN, backtesting, strategy development, and deployment. Use for creating and testing trading algorithms.
---

# Quant Developer Skill

Expert guide for algorithmic trading development using QuantConnect LEAN and related tools.

## Required Tools & Dependencies

### Python Environment
```bash
# Create virtual environment
python -m venv quant-env
source quant-env/bin/activate  # Linux/Mac
# or: quant-env\Scripts\activate  # Windows

# Verify Python 3.10+
python --version
```

### Core Tools
```bash
# LEAN CLI (QuantConnect local)
pip install lean

# Initialize LEAN
lean init
lean login  # Optional for cloud features
```

### Trading Libraries
```bash
# Core backtesting
pip install backtrader zipline-reloaded vectorbt

# Data & Analysis
pip install pandas numpy scipy

# Technical Analysis
pip install ta-lib pandas-ta
# Note: TA-Lib may require system dependencies:
# Ubuntu: apt install libta-lib0-dev
# macOS: brew install ta-lib
```

### Data Sources
```bash
# Yahoo Finance
pip install yfinance

# Alpha Vantage (needs API key)
pip install alpha-vantage

# Interactive Brokers
pip install ib_insync
```

### Full Install (One Command)
```bash
pip install lean backtrader vectorbt pandas numpy scipy yfinance pandas-ta matplotlib plotly
```

---

## Quick Reference

| Tool | Purpose | Install |
|------|---------|---------|
| **LEAN CLI** | Local backtesting/live trading | `pip install lean` |
| **QuantConnect** | Cloud platform | [quantconnect.com](https://www.quantconnect.com) |
| **Backtrader** | Python backtesting | `pip install backtrader` |
| **Zipline** | Quantopian-style backtest | `pip install zipline-reloaded` |
| **VectorBT** | Fast vectorized backtest | `pip install vectorbt` |
| **TA-Lib** | Technical indicators | `pip install ta-lib` |

## QuantConnect LEAN Setup

### Installation (Docker Recommended)

```bash
# Install LEAN CLI
pip install lean

# Initialize project
lean init

# Login to QuantConnect (optional, for cloud features)
lean login

# Create new project
lean create-project "MyStrategy" --language python
```

### Project Structure

```
MyStrategy/
├── main.py              # Strategy code
├── config.json          # Backtest configuration
├── research.ipynb       # Jupyter research
└── backtest/            # Results storage
    └── 2024-01-15_10-30-00/
        ├── log.txt
        ├── results.json
        └── chart.html
```

### Basic Strategy Template

```python
# main.py - QuantConnect LEAN Strategy
from AlgorithmImports import *

class MyStrategy(QCAlgorithm):
    def Initialize(self):
        # Backtest period
        self.SetStartDate(2020, 1, 1)
        self.SetEndDate(2024, 1, 1)
        self.SetCash(100000)

        # Add assets
        self.spy = self.AddEquity("SPY", Resolution.Daily).Symbol
        self.btc = self.AddCrypto("BTCUSD", Resolution.Hour).Symbol

        # Technical indicators
        self.sma_fast = self.SMA(self.spy, 10, Resolution.Daily)
        self.sma_slow = self.SMA(self.spy, 50, Resolution.Daily)
        self.rsi = self.RSI(self.spy, 14, MovingAverageType.Wilders, Resolution.Daily)

        # Risk management
        self.SetRiskManagement(MaximumDrawdownPercentPerSecurity(0.05))

        # Brokerage model
        self.SetBrokerageModel(BrokerageName.InteractiveBrokersBrokerage)

    def OnData(self, data):
        if not self.sma_fast.IsReady or not self.sma_slow.IsReady:
            return

        # Golden cross strategy
        if self.sma_fast.Current.Value > self.sma_slow.Current.Value:
            if not self.Portfolio[self.spy].Invested:
                self.SetHoldings(self.spy, 0.9)  # 90% allocation
                self.Debug(f"BUY: SMA Cross Up at {self.Time}")
        else:
            if self.Portfolio[self.spy].Invested:
                self.Liquidate(self.spy)
                self.Debug(f"SELL: SMA Cross Down at {self.Time}")

    def OnOrderEvent(self, orderEvent):
        if orderEvent.Status == OrderStatus.Filled:
            self.Log(f"Order filled: {orderEvent}")
```

### Run Backtest

```bash
# Local backtest (Docker)
lean backtest "MyStrategy"

# Cloud backtest
lean cloud backtest "MyStrategy" --open --push

# With specific data
lean backtest "MyStrategy" --data-provider-historical QuantConnect

# Generate report
lean report
```

## Strategy Patterns

### 1. Mean Reversion

```python
def OnData(self, data):
    if not self.bb.IsReady:
        return

    price = data[self.symbol].Close

    # Buy when price touches lower band
    if price < self.bb.LowerBand.Current.Value:
        self.SetHoldings(self.symbol, 1.0)

    # Sell when price touches upper band
    elif price > self.bb.UpperBand.Current.Value:
        self.Liquidate()
```

### 2. Momentum

```python
def OnData(self, data):
    # ROC (Rate of Change) momentum
    returns = {}
    for symbol in self.symbols:
        history = self.History(symbol, 30, Resolution.Daily)
        if len(history) > 0:
            returns[symbol] = (history['close'][-1] / history['close'][0]) - 1

    # Long top performers
    sorted_returns = sorted(returns.items(), key=lambda x: x[1], reverse=True)
    top_stocks = [x[0] for x in sorted_returns[:5]]

    for symbol in self.symbols:
        if symbol in top_stocks:
            self.SetHoldings(symbol, 0.2)
        else:
            self.Liquidate(symbol)
```

### 3. Pairs Trading

```python
def Initialize(self):
    self.pair1 = self.AddEquity("GLD").Symbol
    self.pair2 = self.AddEquity("SLV").Symbol
    self.lookback = 30
    self.z_threshold = 2.0

def OnData(self, data):
    history1 = self.History(self.pair1, self.lookback, Resolution.Daily)['close']
    history2 = self.History(self.pair2, self.lookback, Resolution.Daily)['close']

    # Calculate spread
    spread = history1 - history2
    z_score = (spread.iloc[-1] - spread.mean()) / spread.std()

    if z_score > self.z_threshold:
        self.SetHoldings(self.pair1, -0.5)  # Short overvalued
        self.SetHoldings(self.pair2, 0.5)   # Long undervalued
    elif z_score < -self.z_threshold:
        self.SetHoldings(self.pair1, 0.5)
        self.SetHoldings(self.pair2, -0.5)
    elif abs(z_score) < 0.5:
        self.Liquidate()
```

### 4. Machine Learning Integration

```python
from sklearn.ensemble import RandomForestClassifier
import numpy as np

class MLStrategy(QCAlgorithm):
    def Initialize(self):
        self.SetStartDate(2020, 1, 1)
        self.symbol = self.AddEquity("SPY").Symbol
        self.model = RandomForestClassifier(n_estimators=100)
        self.trained = False

    def OnData(self, data):
        if not self.trained:
            self.TrainModel()
            self.trained = True

        # Get features
        features = self.GetFeatures()
        if features is None:
            return

        # Predict
        prediction = self.model.predict([features])[0]

        if prediction == 1 and not self.Portfolio[self.symbol].Invested:
            self.SetHoldings(self.symbol, 0.9)
        elif prediction == 0 and self.Portfolio[self.symbol].Invested:
            self.Liquidate()

    def GetFeatures(self):
        history = self.History(self.symbol, 50, Resolution.Daily)
        if len(history) < 50:
            return None

        close = history['close'].values
        return [
            np.mean(close[-10:]) / np.mean(close[-50:]),  # SMA ratio
            (close[-1] - np.min(close)) / (np.max(close) - np.min(close)),  # Price position
            np.std(close[-10:]) / np.std(close[-50:]),  # Volatility ratio
        ]

    def TrainModel(self):
        # Training logic with historical data
        history = self.History(self.symbol, 500, Resolution.Daily)
        # ... prepare X, y ...
        self.model.fit(X, y)
```

## Risk Management

### Position Sizing

```python
# Kelly Criterion
def KellySize(self, win_rate, win_loss_ratio):
    return win_rate - ((1 - win_rate) / win_loss_ratio)

# Volatility-based sizing
def VolatilitySizing(self, symbol, target_vol=0.02):
    history = self.History(symbol, 20, Resolution.Daily)
    daily_vol = history['close'].pct_change().std()
    return min(target_vol / daily_vol, 1.0)
```

### Stop Loss / Take Profit

```python
def OnOrderEvent(self, orderEvent):
    if orderEvent.Status == OrderStatus.Filled:
        if orderEvent.Direction == OrderDirection.Buy:
            entry_price = orderEvent.FillPrice
            # Set stop loss at 2%
            self.StopMarketOrder(self.symbol, -orderEvent.FillQuantity,
                               entry_price * 0.98)
            # Set take profit at 5%
            self.LimitOrder(self.symbol, -orderEvent.FillQuantity,
                          entry_price * 1.05)
```

## Data Sources

### QuantConnect Data

```python
# Equities
self.AddEquity("AAPL", Resolution.Minute)

# Crypto
self.AddCrypto("BTCUSD", Resolution.Hour, Market.Coinbase)

# Forex
self.AddForex("EURUSD", Resolution.Minute)

# Futures
self.AddFuture(Futures.Indices.SP500EMini)

# Options
option = self.AddOption("SPY")
option.SetFilter(-5, 5, 0, 30)  # strikes, expiry range

# Alternative data
self.AddData(QuiverCongressTrading, "congress")
```

### External Data (Yahoo, Alpha Vantage)

```python
# Using yfinance for research
import yfinance as yf

def research():
    spy = yf.download("SPY", start="2020-01-01", end="2024-01-01")
    returns = spy['Adj Close'].pct_change()
    sharpe = returns.mean() / returns.std() * np.sqrt(252)
    print(f"Sharpe Ratio: {sharpe:.2f}")
```

## Performance Metrics

```python
# Key metrics to track
metrics = {
    "Total Return": "final_portfolio_value / initial_cash - 1",
    "CAGR": "(final/initial)^(1/years) - 1",
    "Sharpe Ratio": "mean(returns) / std(returns) * sqrt(252)",
    "Sortino Ratio": "mean(returns) / downside_std * sqrt(252)",
    "Max Drawdown": "max((peak - trough) / peak)",
    "Win Rate": "winning_trades / total_trades",
    "Profit Factor": "gross_profit / gross_loss",
    "Calmar Ratio": "CAGR / max_drawdown"
}
```

## CLI Commands Reference

```bash
# Project management
lean init                           # Initialize workspace
lean create-project "Name"          # New project
lean cloud pull                     # Sync from cloud
lean cloud push                     # Sync to cloud

# Backtesting
lean backtest "Project"             # Local backtest
lean cloud backtest "Project"       # Cloud backtest
lean optimize "Project"             # Parameter optimization

# Live trading
lean live "Project"                 # Start live trading
lean live stop "Project"            # Stop live trading

# Research
lean research "Project"             # Start Jupyter

# Data
lean data download                  # Download data
lean data generate                  # Generate sample data
```

## Best Practices

1. **Always backtest first** - Never deploy untested strategies
2. **Walk-forward analysis** - Test on out-of-sample data
3. **Realistic transaction costs** - Include slippage, commissions
4. **Avoid overfitting** - Simple strategies often work better
5. **Paper trade before live** - Use dry-run mode
6. **Monitor in production** - Set up alerts for anomalies
7. **Version control** - Track all strategy changes
8. **Document assumptions** - Record why strategy should work

## Integration with Other Skills

- **security-audit**: Review API key management
- **devops**: Deploy strategies to cloud
- **multi-agent-patterns**: Parallel strategy testing
- **crypto-trading**: Crypto-specific strategies

## Resources

- [QuantConnect Docs](https://www.quantconnect.com/docs)
- [LEAN CLI](https://www.lean.io/cli/)
- [QuantConnect Forum](https://www.quantconnect.com/forum)
- [LEAN GitHub](https://github.com/QuantConnect/Lean)