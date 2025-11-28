/**
 * 1inch API Base Network WETH to USDC Swap
 * Purpose: Get swap transaction data for WETH to USDC on Base network
 * 
 * This is for addresses that have WETH tokens instead of native ETH
 */

require('dotenv').config();

// API Configuration for Base Network
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const CHAIN_ID = 8453; // Base Mainnet
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base
const USDC_TOKEN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Swap Configuration
const AMOUNT_IN_WEI = '1000000000000000'; // 0.001 WETH (small amount for testing)
const WALLET_ADDRESS = '0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb'; // Address with WETH liquidity
const SLIPPAGE_PERCENT = '1'; // 1% slippage tolerance

/**
 * Get quote for WETH to USDC swap
 * @param {string} fromToken - Source token address (WETH)
 * @param {string} toToken - Destination token address (USDC)
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Wallet address
 * @returns {Promise<Object>} Quote data
 */
async function getWETHQuote(fromToken, toToken, amount, fromAddress) {
  try {
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file');
    }

    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      includeTokensInfo: true,
      includeProtocols: true
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/quote?${params.toString()}`;

    console.log('📊 Getting WETH → USDC quote on Base...\n');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Quote Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();
    displayWETHQuote(data);
    return data;

  } catch (error) {
    console.error('❌ Error getting WETH quote:', error.message);
    throw error;
  }
}

/**
 * Get swap transaction for WETH to USDC
 * @param {string} fromToken - Source token address (WETH)
 * @param {string} toToken - Destination token address (USDC)
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Wallet address
 * @param {string} slippage - Slippage tolerance
 * @returns {Promise<Object>} Swap transaction data
 */
async function getWETHSwapTransaction(fromToken, toToken, amount, fromAddress, slippage) {
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
      includeTokensInfo: true,
      includeProtocols: true
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Creating WETH → USDC swap transaction...\n');
    console.log(`📊 Swap Details:`);
    console.log(`   Network: Base (Chain ID: ${CHAIN_ID})`);
    console.log(`   From: WETH`);
    console.log(`   To: USDC`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} WETH)`);
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
    displayWETHSwapTransaction(data);
    return data;

  } catch (error) {
    console.error('❌ Error creating WETH swap:', error.message);
    throw error;
  }
}

/**
 * Display WETH quote information
 * @param {Object} quoteData - Quote response from 1inch API
 */
function displayWETHQuote(quoteData) {
  console.log('✅ WETH Quote Retrieved Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 WETH → USDC QUOTE DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const fromTokenAmount = quoteData.fromTokenAmount || AMOUNT_IN_WEI;
  const toTokenAmount = quoteData.toTokenAmount || quoteData.toAmount;
  
  const fromDecimals = quoteData.fromToken?.decimals || 18; // WETH has 18 decimals
  const toDecimals = quoteData.toToken?.decimals || 6; // USDC has 6 decimals
  const fromSymbol = quoteData.fromToken?.symbol || 'WETH';
  const toSymbol = quoteData.toToken?.symbol || 'USDC';

  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} wei)\n`);

  const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
  console.log(`💵 You Receive (estimated):`);
  console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
  console.log(`   (${toTokenAmount} smallest units)\n`);

  const rate = toAmountFormatted / fromAmountFormatted;
  console.log(`📈 Exchange Rate:`);
  console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);

  if (quoteData.gas) {
    console.log(`⛽ Estimated Gas: ${parseInt(quoteData.gas).toLocaleString()}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Display WETH swap transaction information
 * @param {Object} swapData - Swap transaction response from 1inch API
 */
function displayWETHSwapTransaction(swapData) {
  console.log('✅ WETH Swap Transaction Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 WETH → USDC SWAP TRANSACTION DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const fromTokenAmount = swapData.fromTokenAmount || swapData.srcAmount || AMOUNT_IN_WEI;
  const toTokenAmount = swapData.toTokenAmount || swapData.dstAmount || swapData.toAmount;
  
  const fromDecimals = swapData.fromToken?.decimals || swapData.srcToken?.decimals || 18;
  const toDecimals = swapData.toToken?.decimals || swapData.dstToken?.decimals || 6;
  const fromSymbol = swapData.fromToken?.symbol || swapData.srcToken?.symbol || 'WETH';
  const toSymbol = swapData.toToken?.symbol || swapData.dstToken?.symbol || 'USDC';

  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} wei)\n`);

  const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
  console.log(`💵 You Receive (estimated):`);
  console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
  console.log(`   (${toTokenAmount} smallest units)\n`);

  const rate = toAmountFormatted / fromAmountFormatted;
  console.log(`📈 Exchange Rate:`);
  console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);

  if (swapData.tx) {
    console.log(`🔗 Transaction Details:`);
    console.log(`   To Contract: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei (${swapData.tx.value / 1e18} ETH for gas)`);
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

  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('   • This swaps WETH tokens (not native ETH)');
  console.log('   • You need WETH token balance in your wallet');
  console.log('   • You also need some ETH for gas fees');
  console.log('   • Transaction is ready for signing and execution');

  console.log('\n🔧 Raw Transaction Object:');
  console.log(JSON.stringify(swapData.tx, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting WETH → USDC Swap on Base Network...\n');
    console.log(`🌐 Network: Base (Chain ID: ${CHAIN_ID})`);
    console.log(`💰 Address: ${WALLET_ADDRESS}`);
    console.log(`🔄 Swap: WETH → USDC\n`);
    
    // Step 1: Get WETH quote first
    const quote = await getWETHQuote(
      WETH_ADDRESS, 
      USDC_TOKEN_ADDRESS, 
      AMOUNT_IN_WEI,
      WALLET_ADDRESS
    );
    
    // Step 2: Get WETH swap transaction
    await getWETHSwapTransaction(
      WETH_ADDRESS, 
      USDC_TOKEN_ADDRESS, 
      AMOUNT_IN_WEI, 
      WALLET_ADDRESS, 
      SLIPPAGE_PERCENT
    );
    
    console.log('✨ WETH swap process completed successfully!');
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Execute the script
main();
