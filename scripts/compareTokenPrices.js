const axios = require("axios");
require('dotenv').config();

// Token addresses to check
const TOKENS = [
  "0x09675e24CA1EB06023451AC8088EcA1040F47585",
  "0x8e729198d1C59B82bd6bBa579310C40d740A11C2", 
  "0xCb76314C2540199f4B844D4ebbC7998C604880cA",
  "0x421b05cf5ce28Cb7347E73e2278E84472F0E4a88",
  "0xb28a3778e1A78a8c327693516ed4F5B11db41306",
  "0xD699B83e43415B774B6ed4ce9999680F049aF2ab",
  "0xaA7D24c3E14491aBaC746a98751A4883E9b70843",
  "0xBb3D7F42C58Abd83616Ad7C8C72473Ee46df2678",
  "0x8e0eef788350f40255d86dfe8d91ec0ad3a4547f",
  "0x1258D60B224c0C5cD888D37bbF31aa5FCFb7e870",
  "0xc575BD129848Ce06A460A19466c30E1D0328F52C",
  "0x391cF4b21F557c935C7f670218Ef42C21bd8d686",
  "0x967da4048cd07ab37855c090aaf366e4ce1b9f48",
  "0x9cf0ed013e67db12ca3af8e7506fe401aa14dad6",
  "0xf1df7305E4BAB3885caB5B1e4dFC338452a67891",
  "0x8CEDb0680531d26e62ABdBd0F4c5428b7fDC26d5",
  "0x3566C8eE9780245e974e759a7716EA6BA0702588",
  "0x80122c6a83C8202Ea365233363d3f4837D13e888",
  "0x6019Dcb2d0b3E0d1D8B0cE8D16191b3A4f93703d",
  "0x40e3d1A4B2C47d9AA61261F5606136ef73E28042",
  "0x5FC111f3Fa4C6b32eAf65659CFEbdeed57234069",
  "0x048d07Bd350ba516b84587E147284881B593Eb86"
];

// Get ETH price from CoinGecko Pro API
async function getETHPrice() {
  try {
    const baseUrl = process.env.COINGECKO_API_URL || 'https://pro-api.coingecko.com/api/v3/';
    const apiKey = process.env.COINGECKO_API_KEY || 'CG-PXLTxeQZHgysVjz2acUPgyRr';
    
    const response = await axios.get(`${baseUrl}simple/price?ids=ethereum&vs_currencies=usd`, {
      headers: {
        'Accept': 'application/json',
        'x-cg-pro-api-key': apiKey
      }
    });
    return response.data.ethereum.usd;
  } catch (error) {
    console.error('❌ Error getting ETH price:', error.message);
    return null;
  }
}

// Get token price from 1inch
async function get1inchPrice(tokenAddress) {
  try {
    const url = `https://api.1inch.com/price/v1.1/1/${tokenAddress}`;
    const config = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        Authorization: `Bearer ${process.env.ONE_INCH_API_KEY }`,
      },
      params: {
        currency: "USD",
      },
      paramsSerializer: {
        indexes: null,
      },
      timeout: 10000,
    };
    
    const response = await axios.get(url, config);
    return response.data[tokenAddress.toLowerCase()];
  } catch (error) {
    console.error(`❌ 1inch error for ${tokenAddress}:`, error.message);
    return null;
  }
}

// Get token price from CoinGecko Pro API
async function getCoinGeckoPrice(tokenAddress) {
  try {
    const baseUrl = process.env.COINGECKO_API_URL || 'https://pro-api.coingecko.com/api/v3/';
    const apiKey = process.env.COINGECKO_API_KEY || 'CG-PXLTxeQZHgysVjz2acUPgyRr';
    
    const url = `${baseUrl}simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`;
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-cg-pro-api-key': apiKey
      }
    });
    
    // CoinGecko always returns addresses in lowercase
    const price = response.data[tokenAddress.toLowerCase()]?.usd || null;
    
    return price;
  } catch (error) {
    console.error(`❌ CoinGecko Pro error for ${tokenAddress}:`, error.message);
    return null;
  }
}

// Calculate price difference percentage
function calculateDifference(price1, price2) {
  if (!price1 || !price2) return null;
  return ((Math.abs(price1 - price2) / price1) * 100).toFixed(2);
}

// Compare prices for all tokens
async function compareAllPrices() {
  console.log('🚀 Token Price Comparison: 1inch vs CoinGecko\n');
  
  // Get ETH price first
  console.log('📊 Getting ETH price from CoinGecko...');
  const ethPrice = await getETHPrice();
  console.log(`💰 ETH Price: $${ethPrice}\n`);
  
  console.log('🔍 Checking token prices...\n');
  console.log('Token Address'.padEnd(45) + '1inch Price'.padEnd(15) + 'CoinGecko Price'.padEnd(18) + 'Difference %');
  console.log('-'.repeat(95));
  
  const results = [];
  
  for (let i = 0; i < TOKENS.length; i++) {
    const token = TOKENS[i];
    
    // Get prices from both sources
    const [inchPrice, geckoPrice] = await Promise.all([
      get1inchPrice(token),
      getCoinGeckoPrice(token)
    ]);
    
    const difference = calculateDifference(inchPrice, geckoPrice);
    
    // Format prices for display
    const inchDisplay = inchPrice ? `$${parseFloat(inchPrice).toFixed(8)}` : 'N/A';
    const geckoDisplay = geckoPrice ? `$${parseFloat(geckoPrice).toFixed(8)}` : 'N/A';
    const diffDisplay = difference ? `${difference}%` : 'N/A';
    
    // Display row
    console.log(
      token.padEnd(45) + 
      inchDisplay.padEnd(15) + 
      geckoDisplay.padEnd(18) + 
      diffDisplay
    );
    
    // Store result
    results.push({
      address: token,
      inchPrice: inchPrice,
      geckoPrice: geckoPrice,
      difference: difference,
      ethPrice: ethPrice
    });
    
    // Small delay with Pro API (much higher rate limits)
    if (i < TOKENS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log('-'.repeat(95));
  
  // Summary statistics
  const validComparisons = results.filter(r => r.inchPrice && r.geckoPrice);
  const avgDifference = validComparisons.length > 0 
    ? (validComparisons.reduce((sum, r) => sum + parseFloat(r.difference), 0) / validComparisons.length).toFixed(2)
    : 0;
  
  console.log(`\n📈 Summary:`);
  console.log(`   • Total tokens checked: ${TOKENS.length}`);
  console.log(`   • Available on 1inch: ${results.filter(r => r.inchPrice).length}`);
  console.log(`   • Available on CoinGecko: ${results.filter(r => r.geckoPrice).length}`);
  console.log(`   • Both sources available: ${validComparisons.length}`);
  console.log(`   • Average price difference: ${avgDifference}%`);
  
  // Find tokens with significant differences (>5%)
  const significantDiffs = validComparisons.filter(r => parseFloat(r.difference) > 5);
  if (significantDiffs.length > 0) {
    console.log(`\n⚠️  Tokens with >5% price difference:`);
    significantDiffs.forEach(token => {
      console.log(`   • ${token.address}: ${token.difference}% difference`);
    });
  }
  
  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `price_comparison_${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
  
  return results;
}

// Run comparison
if (require.main === module) {
  compareAllPrices().catch(console.error);
}

module.exports = { 
  compareAllPrices, 
  get1inchPrice, 
  getCoinGeckoPrice, 
  getETHPrice,
  TOKENS 
};
