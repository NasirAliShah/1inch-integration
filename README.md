# 1inch API Integration

Implementation of 1inch API for token swap on Ethereum mainnet.

## Features

- Get swap quotes for ETH to RDX token
- Uses 1inch API v6.0
- Displays detailed quote information including routing and gas estimates

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

1. Get your API key from [1inch Business Portal](https://business.1inch.com/portal/)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Add your API key to `.env`:
   ```
   ONEINCH_API_KEY=your_actual_api_key_here
   ```

## Usage

### Get Quote for ETH → RDX Swap

Run the quote script:

```bash
npm run quote
```

Or directly:

```bash
node getQuote.js
```

### Token Information

- **Source Token**: ETH (Native Ethereum)
- **Destination Token**: RDX Token
  - Address: `0xf222b0e892f419c35e61892cddf0a8ec190c4b9d`
- **Network**: Ethereum Mainnet (Chain ID: 1)
- **Default Amount**: 1 ETH

### Customize Amount

Edit `getQuote.js` and modify the `AMOUNT_IN_WEI` variable:

```javascript
// Example: Swap 0.1 ETH instead of 1 ETH
const AMOUNT_IN_WEI = '100000000000000000'; // 0.1 ETH
```

## Output

The script will display:
- Amount of ETH you're sending
- Estimated RDX tokens you'll receive
- Exchange rate
- Gas estimation
- Protocol routing information

## Important Notes

⚠️ **Mainnet Only**: 1inch API does not support testnets (Sepolia, Goerli, etc.)

⚠️ **Rate Limits**: Public API is limited to 1 request/second. For higher limits, upgrade to enterprise plan.

⚠️ **This is a Quote Only**: This script only fetches quotes. It does NOT execute swaps.

## Next Steps

To execute an actual swap, you'll need to:
1. Use the `/swap` endpoint instead of `/quote`
2. Sign the transaction with a wallet
3. Broadcast the transaction to the network

## Resources

- [1inch API Documentation](https://business.1inch.com/portal/documentation)
- [1inch Developer Portal](https://portal.1inch.dev/)