/**
 * 1inch OffChain Oracle Token Price Fetcher
 * Purpose: Get accurate token prices using 1inch's on-chain oracle
 */

require('dotenv').config();
const ethers = require('ethers');

// Configuration - supports both Alchemy and Infura
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;

// Prefer Alchemy, fallback to Infura
let provider;
if (ALCHEMY_API_KEY) {
  provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
  console.log('🔗 Using Alchemy provider');
} else if (INFURA_API_KEY) {
  provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
  console.log('🔗 Using Infura provider');
} else {
  throw new Error('Please provide either ALCHEMY_API_KEY or INFURA_API_KEY in .env file');
}

// 1inch OffChain Oracle ABI (simplified for price fetching)
const OffChainOracleAbi = [
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'srcToken', type: 'address' },
      { internalType: 'bool', name: 'useSrcWrappers', type: 'bool' }
    ],
    name: 'getRateToEth',
    outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'srcToken', type: 'address' },
      { internalType: 'contract IERC20', name: 'dstToken', type: 'address' },
      { internalType: 'bool', name: 'useWrappers', type: 'bool' }
    ],
    name: 'getRate',
    outputs: [{ internalType: 'uint256', name: 'weightedRate', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// 1inch OffChain Oracle Contract Address
const offChainOracleAddress = '0x0AdDd25a91563696D8567Df78D5A01C9a991F9B8';
const offchainOracle = new ethers.Contract(offChainOracleAddress, OffChainOracleAbi, provider);

// Common token addresses and decimals
const TOKENS = {
  USDT: { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
  USDC: { address: '0xa0b86a33e6441c8c06dd2a76c88b0b8685c2c5c', decimals: 6 },
  DAI: { address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
  WETH: { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', decimals: 18 },
  // Add your custom token here
  RDX: { address: '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d', decimals: 18 }
};

/**
 * Get token price in ETH using 1inch Oracle
 * @param {string} tokenAddress - Token contract address
 * @param {number} tokenDecimals - Token decimals
 * @returns {Promise<number>} Price in ETH
 */
async function getTokenPriceInETH(tokenAddress, tokenDecimals = 18) {
  try {
    if (!ALCHEMY_API_KEY && !INFURA_API_KEY) {
      throw new Error('Either ALCHEMY_API_KEY or INFURA_API_KEY required in .env file');
    }

    console.log(`🔍 Getting price for token: ${tokenAddress}`);
    console.log(`📊 Token decimals: ${tokenDecimals}`);

    // Get rate from 1inch oracle
    const rate = await offchainOracle.getRateToEth(tokenAddress, true);
    
    console.log(`📈 Raw oracle rate: ${rate.toString()}`);

    // Calculate price: rate * (10^tokenDecimals) / (10^18) / (10^18)
    const numerator = 10 ** tokenDecimals;
    const denominator = 1e18; // ETH decimals
    const priceInETH = parseFloat(rate.toString()) * numerator / denominator / 1e18;

    console.log(`💰 Price in ETH: ${priceInETH.toFixed(10)}`);
    
    return priceInETH;

  } catch (error) {
    console.error('❌ Error getting token price:', error.message);
    throw error;
  }
}

/**
 * Get token price in USD (requires ETH price)
 * @param {string} tokenAddress - Token contract address
 * @param {number} tokenDecimals - Token decimals
 * @param {number} ethPriceUSD - Current ETH price in USD
 * @returns {Promise<number>} Price in USD
 */
async function getTokenPriceInUSD(tokenAddress, tokenDecimals = 18, ethPriceUSD = null) {
  try {
    // Get token price in ETH
    const priceInETH = await getTokenPriceInETH(tokenAddress, tokenDecimals);

    // If ETH price not provided, fetch it from external API
    if (!ethPriceUSD) {
      ethPriceUSD = await getETHPriceUSD();
    }

    const priceInUSD = priceInETH * ethPriceUSD;

    console.log(`💵 ETH price: $${ethPriceUSD}`);
    console.log(`💰 Token price in USD: $${priceInUSD.toFixed(10)}`);

    return priceInUSD;

  } catch (error) {
    console.error('❌ Error getting USD price:', error.message);
    throw error;
  }
}

/**
 * Get current ETH price in USD from external API
 * @returns {Promise<number>} ETH price in USD
 */
async function getETHPriceUSD() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.log('Using fallback ETH price: $3000');
    return 3000; // Fallback price
  }
}

/**
 * Get price for a known token by symbol
 * @param {string} symbol - Token symbol (USDT, USDC, DAI, etc.)
 * @returns {Promise<Object>} Price data
 */
async function getTokenPriceBySymbol(symbol) {
  const token = TOKENS[symbol.toUpperCase()];
  
  if (!token) {
    throw new Error(`Unknown token: ${symbol}. Available: ${Object.keys(TOKENS).join(', ')}`);
  }

  console.log(`🪙 Getting price for ${symbol.toUpperCase()}`);
  
  const priceInETH = await getTokenPriceInETH(token.address, token.decimals);
  const priceInUSD = await getTokenPriceInUSD(token.address, token.decimals);

  return {
    symbol: symbol.toUpperCase(),
    address: token.address,
    decimals: token.decimals,
    priceInETH,
    priceInUSD
  };
}

/**
 * Compare token price with external source
 * @param {string} tokenAddress - Token contract address
 * @param {number} tokenDecimals - Token decimals
 */
async function compareWithExternalPrice(tokenAddress, tokenDecimals = 18) {
  try {
    console.log('🔄 Comparing 1inch Oracle vs External Prices...\n');
    
    // Get 1inch oracle price
    const oraclePrice = await getTokenPriceInUSD(tokenAddress, tokenDecimals);
    
    // Try to get external price (CoinGecko)
    let externalPrice = null;
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
      const data = await response.json();
      externalPrice = data[tokenAddress.toLowerCase()]?.usd;
    } catch (error) {
      console.log('Could not fetch external price for comparison');
    }

    console.log('\n📊 PRICE COMPARISON:');
    console.log(`   1inch Oracle: $${oraclePrice.toFixed(10)}`);
    
    if (externalPrice) {
      console.log(`   CoinGecko:    $${externalPrice}`);
      const difference = ((oraclePrice - externalPrice) / externalPrice * 100);
      console.log(`   Difference:   ${difference.toFixed(2)}%`);
    }

    return { oraclePrice, externalPrice };

  } catch (error) {
    console.error('❌ Error in comparison:', error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting 1inch Oracle Price Fetcher...\n');

    // Example 1: Get USDT price (known token)
    console.log('📊 Example 1: USDT Price');
    await getTokenPriceBySymbol('USDT');
    
    console.log('\n' + '─'.repeat(60) + '\n');

    // Example 2: Get your custom token price
    console.log('📊 Example 2: Custom Token Price');
    const customTokenAddress = '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d'; // RDX
    const customTokenDecimals = 18;
    
    await compareWithExternalPrice(customTokenAddress, customTokenDecimals);

    console.log('\n✨ Process completed successfully!');

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    console.log('\n💡 Make sure you have ALCHEMY_API_KEY or INFURA_API_KEY in your .env file');
  }
}

// Export functions
module.exports = {
  getTokenPriceInETH,
  getTokenPriceInUSD,
  getTokenPriceBySymbol,
  compareWithExternalPrice,
  TOKENS
};

// Run if called directly
if (require.main === module) {
  main();
}
