/**
 * PACA Token Swap on Base Network
 * Purpose: Handle swaps with PACA token (0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb)
 * 
 * This script works with any token, even if not officially listed by 1inch
 */

require('dotenv').config();

// API Configuration for Base Network
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453; // Base Mainnet Chain ID
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const PACA_TOKEN_ADDRESS = '0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb'; // PACA Token
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Swap Configuration
const AMOUNT_IN_WEI = '1000000000000000000'; // 1 PACA token (assuming 18 decimals)
const WALLET_ADDRESS = '0xb316e2469e32e4c782533d8dace9f70b2ad88557'; // Address with balance
const SLIPPAGE_PERCENT = '5'; // 5% slippage for less liquid tokens

/**
 * Get quote for PACA token swap (works with any token)
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Wallet address
 * @returns {Promise<Object>} Quote data
 */
async function getPacaQuote(fromToken, toToken, amount, fromAddress) {
  try {
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file');
    }

    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      // Don't include token info for unlisted tokens
      includeProtocols: true
    });

    const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${params.toString()}`;

    console.log(`📊 Getting quote for PACA token swap...`);
    console.log(`   From: ${fromToken}`);
    console.log(`   To: ${toToken}`);
    console.log(`   Amount: ${amount}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Check for specific error types
      if (errorData.description && errorData.description.includes('cannot estimate')) {
        console.log('⚠️ Cannot estimate swap - this might mean:');
        console.log('   • Insufficient liquidity for this token pair');
        console.log('   • Token is not tradeable on available DEXs');
        console.log('   • Amount is too large for available liquidity\n');
      }
      
      throw new Error(`Quote Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();
    displayPacaQuote(data, fromToken, toToken);
    return data;

  } catch (error) {
    console.error('❌ Error getting PACA quote:', error.message);
    throw error;
  }
}

/**
 * Get swap transaction for PACA token
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Wallet address
 * @param {string} slippage - Slippage tolerance
 * @returns {Promise<Object>} Swap transaction data
 */
async function getPacaSwapTransaction(fromToken, toToken, amount, fromAddress, slippage) {
  try {
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file');
    }

    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      origin: fromAddress,
      slippage: slippage,
      includeProtocols: true
    });

    const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Creating PACA swap transaction...\n');
    console.log(`📊 Swap Details:`);
    console.log(`   Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
    console.log(`   From Token: ${fromToken}`);
    console.log(`   To Token: ${toToken}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Wallet: ${fromAddress}`);
    console.log(`   Slippage: ${slippage}%\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Swap Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();
    displayPacaSwapTransaction(data);
    return data;

  } catch (error) {
    console.error('❌ Error creating PACA swap:', error.message);
    throw error;
  }
}

/**
 * Display PACA quote information
 * @param {Object} quoteData - Quote response from 1inch API
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 */
function displayPacaQuote(quoteData, fromToken, toToken) {
  console.log('✅ PACA Quote Retrieved Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PACA TOKEN QUOTE DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const fromTokenAmount = quoteData.fromTokenAmount || AMOUNT_IN_WEI;
  const toTokenAmount = quoteData.toTokenAmount || quoteData.toAmount;
  
  // For unlisted tokens, we might not have token info
  const fromDecimals = quoteData.fromToken?.decimals || 18; // Assume 18 decimals
  const toDecimals = quoteData.toToken?.decimals || (toToken === USDC_ADDRESS ? 6 : 18);
  const fromSymbol = quoteData.fromToken?.symbol || 'PACA';
  const toSymbol = quoteData.toToken?.symbol || (toToken === USDC_ADDRESS ? 'USDC' : 'WETH');

  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} smallest units)\n`);

  if (toTokenAmount && toTokenAmount !== 'undefined') {
    const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
    console.log(`💵 You Receive (estimated):`);
    console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${toSymbol}`);
    console.log(`   (${toTokenAmount} smallest units)\n`);

    const rate = toAmountFormatted / fromAmountFormatted;
    console.log(`📈 Exchange Rate:`);
    console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${toSymbol}\n`);
  } else {
    console.log(`💵 You Receive: Unable to calculate (token might be unlisted)\n`);
  }

  if (quoteData.gas) {
    console.log(`⛽ Estimated Gas: ${parseInt(quoteData.gas).toLocaleString()}\n`);
  }

  // Show protocols being used
  if (quoteData.protocols && quoteData.protocols.length > 0) {
    console.log(`🔀 Available through ${quoteData.protocols.length} protocol(s)\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Display PACA swap transaction information
 * @param {Object} swapData - Swap transaction response from 1inch API
 */
function displayPacaSwapTransaction(swapData) {
  console.log('✅ PACA Swap Transaction Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 PACA TOKEN SWAP TRANSACTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (swapData.tx) {
    console.log(`🔗 Transaction Details:`);
    console.log(`   To Contract: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei`);
    console.log(`   Gas Limit: ${parseInt(swapData.tx.gas).toLocaleString()}`);
    if (swapData.tx.gasPrice) {
      console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei`);
    }
    console.log('');
  }

  if (swapData.protocols && swapData.protocols.length > 0) {
    console.log(`🔀 Routing Through ${swapData.protocols.length} Route(s):\n`);
    swapData.protocols.forEach((routePart, index) => {
      console.log(`   Route ${index + 1}:`);
      
      if (Array.isArray(routePart)) {
        routePart.forEach((step) => {
          if (Array.isArray(step)) {
            step.forEach((protocol) => {
              const percentage = protocol.part || 100;
              console.log(`      → ${protocol.name} (${percentage}%)`);
            });
          } else if (step && step.name) {
            const percentage = step.part || 100;
            console.log(`      → ${step.name} (${percentage}%)`);
          }
        });
      } else if (routePart && routePart.name) {
        const percentage = routePart.part || 100;
        console.log(`      → ${routePart.name} (${percentage}%)`);
      }
    });
  }

  console.log('\n⚠️  IMPORTANT NOTES FOR PACA TOKEN:');
  console.log('   • PACA is a smaller/newer token with potentially lower liquidity');
  console.log('   • Higher slippage tolerance may be needed');
  console.log('   • Always verify token contract address before swapping');
  console.log('   • Transaction is ready for signing and execution');

  console.log('\n🔧 Raw Transaction Object:');
  console.log(JSON.stringify(swapData.tx, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test multiple swap scenarios for PACA token
 */
async function testPacaSwaps() {
  console.log('🧪 Testing PACA Token Swap Scenarios\n');
  
  const scenarios = [
    {
      name: 'PACA → WETH',
      from: PACA_TOKEN_ADDRESS,
      to: WETH_ADDRESS,
      amount: '1000000000000000000' // 1 PACA
    },
    {
      name: 'PACA → USDC',
      from: PACA_TOKEN_ADDRESS,
      to: USDC_ADDRESS,
      amount: '1000000000000000000' // 1 PACA
    },
    {
      name: 'WETH → PACA',
      from: WETH_ADDRESS,
      to: PACA_TOKEN_ADDRESS,
      amount: '1000000000000000' // 0.001 WETH
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`\n🔄 Testing: ${scenario.name}`);
      console.log('━'.repeat(50));
      
      const quote = await getPacaQuote(
        scenario.from,
        scenario.to,
        scenario.amount,
        WALLET_ADDRESS
      );
      
      console.log(`✅ ${scenario.name} quote successful!\n`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ ${scenario.name} failed: ${error.message.split('\n')[0]}\n`);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 PACA Token Swap Analysis on Base Network\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Token Information:`);
    console.log(`   PACA Token: ${PACA_TOKEN_ADDRESS}`);
    console.log(`   Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
    console.log(`   Wallet: ${WALLET_ADDRESS}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test different swap scenarios
    await testPacaSwaps();
    
    console.log('✨ PACA token analysis completed!');
    
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Execute the script
if (require.main === module) {
  main();
}

// Export for use in other modules
module.exports = {
  getPacaQuote,
  getPacaSwapTransaction,
  PACA_TOKEN_ADDRESS,
  WETH_ADDRESS,
  USDC_ADDRESS
};
