---
name: crypto-trading
description: Cryptocurrency trading specialist with Freqtrade bot, crypto MCPs, DeFi tools, and exchange APIs. Use for building crypto trading bots, backtesting strategies, and integrating with exchanges.
---

# Crypto Trading Specialist Skill

Expert guide for cryptocurrency trading automation, DeFi integration, and exchange connectivity.

## MCP Servers for Crypto

### Recommended MCPs

| MCP | Purpose | Install |
|-----|---------|---------|
| **CCXT MCP** | 100+ exchanges | `npm i mcp-server-ccxt` |
| **Binance MCP** | Binance trading | `npm i binance-mcp` |
| **CoinGecko MCP** | Market data | Built-in |
| **Bit2Me MCP** | Full trading | [mcp.bit2me.com](https://mcp.bit2me.com) |
| **DeFi Rates MCP** | Lending rates | `npm i defi-rates-mcp` |

### CCXT MCP Setup (100+ Exchanges)

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "ccxt": {
      "command": "npx",
      "args": ["-y", "mcp-server-ccxt"],
      "env": {
        "BINANCE_API_KEY": "your-key",
        "BINANCE_SECRET": "your-secret",
        "COINBASE_API_KEY": "your-key",
        "COINBASE_SECRET": "your-secret"
      }
    }
  }
}
```

### Binance MCP Tools

```typescript
// Available tools
mcp__binance__get_price({ symbol: "BTCUSDT" })
mcp__binance__get_orderbook({ symbol: "ETHUSDT", limit: 10 })
mcp__binance__get_klines({ symbol: "BTCUSDT", interval: "1h", limit: 100 })
mcp__binance__place_order({ symbol: "BTCUSDT", side: "BUY", type: "MARKET", quantity: 0.001 })
mcp__binance__get_balance()
mcp__binance__get_open_orders()
```

### CoinGecko MCP (Free Market Data)

```typescript
// Get top coins
mcp__coingecko__get_coins_markets({
  vs_currency: "usd",
  order: "market_cap_desc",
  per_page: 100
})

// Get coin details
mcp__coingecko__get_coin({ id: "bitcoin" })

// Historical data
mcp__coingecko__get_coin_market_chart({
  id: "ethereum",
  vs_currency: "usd",
  days: 30
})
```

## Freqtrade Bot Setup

### Installation

```bash
# Clone Freqtrade
git clone https://github.com/freqtrade/freqtrade.git
cd freqtrade

# Setup (recommended)
./setup.sh -i

# Or Docker (simplest)
docker-compose up -d

# Create user directory
freqtrade create-userdir --userdir user_data

# Create config
freqtrade new-config
```

### Configuration

```json
// user_data/config.json
{
    "max_open_trades": 5,
    "stake_currency": "USDT",
    "stake_amount": 100,
    "tradable_balance_ratio": 0.99,
    "fiat_display_currency": "USD",
    "dry_run": true,
    "dry_run_wallet": 1000,

    "exchange": {
        "name": "binance",
        "key": "YOUR_API_KEY",
        "secret": "YOUR_API_SECRET",
        "ccxt_config": {
            "enableRateLimit": true
        },
        "pair_whitelist": [
            "BTC/USDT",
            "ETH/USDT",
            "SOL/USDT",
            "BNB/USDT"
        ]
    },

    "pairlists": [
        {
            "method": "VolumePairList",
            "number_assets": 20,
            "sort_key": "quoteVolume",
            "min_value": 10000000
        }
    ],

    "telegram": {
        "enabled": true,
        "token": "YOUR_BOT_TOKEN",
        "chat_id": "YOUR_CHAT_ID"
    },

    "api_server": {
        "enabled": true,
        "listen_ip_address": "0.0.0.0",
        "listen_port": 8080,
        "username": "freqtrader",
        "password": "SuperSecurePassword"
    }
}
```

### Strategy Template

```python
# user_data/strategies/MyStrategy.py
from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter
from pandas import DataFrame
import talib.abstract as ta

class MyStrategy(IStrategy):
    # Strategy parameters
    INTERFACE_VERSION = 3
    minimal_roi = {"0": 0.05, "30": 0.025, "60": 0.01, "120": 0}
    stoploss = -0.10
    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.02

    # Timeframe
    timeframe = '5m'

    # Hyperopt parameters
    buy_rsi = IntParameter(20, 40, default=30, space='buy')
    sell_rsi = IntParameter(60, 80, default=70, space='sell')

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # EMAs
        dataframe['ema_fast'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['ema_slow'] = ta.EMA(dataframe, timeperiod=50)

        # Bollinger Bands
        bollinger = ta.BBANDS(dataframe, timeperiod=20)
        dataframe['bb_upper'] = bollinger['upperband']
        dataframe['bb_lower'] = bollinger['lowerband']
        dataframe['bb_middle'] = bollinger['middleband']

        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macd_signal'] = macd['macdsignal']

        # Volume
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] < self.buy_rsi.value) &
                (dataframe['ema_fast'] > dataframe['ema_slow']) &
                (dataframe['close'] < dataframe['bb_lower']) &
                (dataframe['volume'] > dataframe['volume_sma'])
            ),
            'enter_long'
        ] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] > self.sell_rsi.value) |
                (dataframe['close'] > dataframe['bb_upper'])
            ),
            'exit_long'
        ] = 1

        return dataframe
```

### Freqtrade Commands

```bash
# Backtesting
freqtrade backtesting --strategy MyStrategy --timerange 20230101-20240101

# Hyperopt (optimize parameters)
freqtrade hyperopt --strategy MyStrategy --hyperopt-loss SharpeHyperOptLoss \
    --spaces buy sell roi stoploss --epochs 500

# Download data
freqtrade download-data --pairs BTC/USDT ETH/USDT --timerange 20220101-

# Paper trading (dry run)
freqtrade trade --strategy MyStrategy --config user_data/config.json

# Live trading
freqtrade trade --strategy MyStrategy --config user_data/config-live.json

# List strategies
freqtrade list-strategies

# Plot results
freqtrade plot-dataframe --strategy MyStrategy --pair BTC/USDT
```

## DeFi Integration

### DeFi Rates MCP

```typescript
// Compare lending rates across protocols
mcp__defi__get_lending_rates({
  token: "USDC",
  protocols: ["aave", "compound", "morpho"]
})

// Best yield opportunities
mcp__defi__get_best_yields({
  chain: "ethereum",
  min_tvl: 1000000
})
```

### Web3 Python Integration

```python
from web3 import Web3

# Connect to Ethereum
w3 = Web3(Web3.HTTPProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'))

# Check balance
balance = w3.eth.get_balance('0xYourAddress')
print(f"Balance: {w3.from_wei(balance, 'ether')} ETH")

# Uniswap price check
uniswap_router = w3.eth.contract(
    address='0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    abi=UNISWAP_ABI
)
```

## Exchange APIs Direct

### Binance API

```python
from binance.client import Client
from binance.enums import *

client = Client(API_KEY, API_SECRET)

# Get price
ticker = client.get_symbol_ticker(symbol="BTCUSDT")
print(f"BTC: ${ticker['price']}")

# Place order
order = client.create_order(
    symbol='BTCUSDT',
    side=SIDE_BUY,
    type=ORDER_TYPE_MARKET,
    quantity=0.001
)

# Get account balance
balances = client.get_account()['balances']
for b in balances:
    if float(b['free']) > 0:
        print(f"{b['asset']}: {b['free']}")
```

### CCXT (Universal)

```python
import ccxt

# Initialize exchange
exchange = ccxt.binance({
    'apiKey': 'YOUR_KEY',
    'secret': 'YOUR_SECRET',
    'enableRateLimit': True,
})

# Fetch OHLCV
ohlcv = exchange.fetch_ohlcv('BTC/USDT', '1h', limit=100)

# Fetch order book
orderbook = exchange.fetch_order_book('ETH/USDT')

# Place order
order = exchange.create_market_buy_order('BTC/USDT', 0.001)

# Get balance
balance = exchange.fetch_balance()
print(balance['USDT'])
```

## Trading Strategies

### Grid Trading

```python
class GridStrategy(IStrategy):
    grid_levels = 10
    grid_spacing = 0.01  # 1%

    def populate_entry_trend(self, dataframe, metadata):
        current_price = dataframe['close'].iloc[-1]

        # Create grid levels
        for i in range(self.grid_levels):
            level = current_price * (1 - self.grid_spacing * (i + 1))
            if dataframe['close'].iloc[-1] <= level:
                dataframe.loc[dataframe.index[-1], 'enter_long'] = 1

        return dataframe
```

### DCA (Dollar Cost Averaging)

```python
class DCAStrategy(IStrategy):
    dca_interval = 24  # hours
    dca_amount = 100   # USDT

    def populate_entry_trend(self, dataframe, metadata):
        # Entry every dca_interval candles
        dataframe['candle_count'] = range(len(dataframe))
        dataframe.loc[
            dataframe['candle_count'] % self.dca_interval == 0,
            'enter_long'
        ] = 1
        return dataframe
```

### Sentiment-Based

```python
# Using Fear & Greed Index
import requests

def get_fear_greed():
    url = "https://api.alternative.me/fng/"
    response = requests.get(url).json()
    return int(response['data'][0]['value'])

class SentimentStrategy(IStrategy):
    def populate_entry_trend(self, dataframe, metadata):
        fng = get_fear_greed()

        # Buy when extreme fear
        if fng < 25:
            dataframe.loc[dataframe.index[-1], 'enter_long'] = 1

        return dataframe
```

## Risk Management

### Position Sizing

```python
# Risk per trade: 1-2% of portfolio
def calculate_position_size(portfolio_value, risk_percent, stop_loss_percent):
    risk_amount = portfolio_value * risk_percent
    position_size = risk_amount / stop_loss_percent
    return position_size

# Example: $10,000 portfolio, 2% risk, 5% stop loss
# Position = $10,000 * 0.02 / 0.05 = $4,000
```

### Multi-Exchange Arbitrage Detection

```python
async def check_arbitrage(symbol):
    exchanges = [ccxt.binance(), ccxt.coinbase(), ccxt.kraken()]

    prices = {}
    for ex in exchanges:
        ticker = await ex.fetch_ticker(symbol)
        prices[ex.id] = ticker['last']

    min_price = min(prices.values())
    max_price = max(prices.values())
    spread = (max_price - min_price) / min_price * 100

    if spread > 0.5:  # 0.5% opportunity
        print(f"Arbitrage: Buy on {min(prices, key=prices.get)}, Sell on {max(prices, key=prices.get)}")
```

## Monitoring & Alerts

### Telegram Integration

```python
import telegram

async def send_alert(message):
    bot = telegram.Bot(token='YOUR_BOT_TOKEN')
    await bot.send_message(chat_id='YOUR_CHAT_ID', text=message)

# Alert on price movement
if price_change > 5:
    await send_alert(f"BTC moved {price_change}%!")
```

### WebSocket Real-time Data

```python
from binance import BinanceSocketManager

bsm = BinanceSocketManager(client)

# Real-time price updates
async def handle_message(msg):
    print(f"Price: {msg['c']}")

bsm.start_symbol_ticker_socket('BTCUSDT', handle_message)
```

## Best Practices

1. **Start with dry-run** - Never risk real money without testing
2. **Small position sizes** - Max 1-2% risk per trade
3. **Multiple strategies** - Diversify approaches
4. **Secure API keys** - Read-only keys when possible
5. **Monitor 24/7** - Use alerts and monitoring
6. **Tax tracking** - Keep records of all trades
7. **Cold storage** - Don't keep all funds on exchanges

## Integration with Other Skills

- **quant-developer**: Advanced algorithmic strategies
- **security-audit**: API key and wallet security
- **devops**: Deploy trading bots to cloud
- **multi-agent-patterns**: Parallel strategy backtesting

## Resources

- [Freqtrade Docs](https://www.freqtrade.io/)
- [CCXT Manual](https://docs.ccxt.com/)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [CoinGecko API](https://www.coingecko.com/en/api)