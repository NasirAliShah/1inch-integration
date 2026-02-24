/**
 * 1inch API Swap Transaction Script
 * Purpose: Get swap transaction data for USDC to ALVA token on Base chain
 * 
 * This generates the actual transaction data that can be signed and executed
 * USDC Address (Base): 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 * ALVA Address (Base): 0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0'; // Use same domain as quote script
const CHAIN_ID = 8453; // Base Chain
const API_KEY = "zeb0FSQeMzOEBZP6bqdT1DGLhFCKWTqq";

// Token Addresses
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base (6 decimals)
const ALVA_TOKEN_ADDRESS = '0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb'; // ALVA token address on Base

// Swap Configuration
// NOTE: Amount should match the source token's decimals
// For USDC (6 decimals): 1 USDC = 1000000 wei
// For ETH (18 decimals): 0.00001 ETH = 10000000000000 wei
const AMOUNT_IN_WEI = '10000000000000'; // 0.00001 ETH worth (18 decimals)
const WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f'; // Your wallet address
const SLIPPAGE_PERCENT = '5'; // 5% slippage tolerance

/**
 * Fetches swap transaction data from 1inch API
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap (in smallest unit)
 * @param {string} fromAddress - Wallet address executing the swap
 * @param {string} slippage - Slippage tolerance percentage
 * @returns {Promise<Object>} Swap transaction data from 1inch API
 */
async function getSwapTransaction(fromToken, toToken, amount, fromAddress, slippage) {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file. Please add your API key.');
    }

    // Construct the API URL with query parameters
    const params = new URLSearchParams({
      src: fromToken,           // Source token (USDC)
      dst: toToken,             // Destination token (ALVA)
      amount: amount,           // Amount to swap in wei
      from: fromAddress,        // Your wallet address
      origin: fromAddress,      // Origin address (usually same as from)
      slippage: slippage,       // Slippage tolerance
      includeTokensInfo: true,  // Include token metadata
      includeProtocols: true,   // Include protocol routing information
      // Enable Aerodrome and other DEXs - use protocols parameter to include specific DEXs
      // protocols: 'UNISWAP_V2,UNISWAP_V3,SUSHISWAP,CURVE,BALANCER,AERODROME', // Include Aerodrome
      // Alternative: Use excludeProtocols to exclude unwanted DEXs instead
      // excludeProtocols: 'SOME_UNWANTED_DEX',
      disableEstimate: true,
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Fetching swap transaction from 1inch API...\n');
    console.log(`📊 Swap Details:`);
    console.log(`   From: USDC`);
    console.log(`   To: ALVA Token`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} ETH)`);
    console.log(`   Wallet: ${fromAddress}`);
    console.log(`   Slippage: ${slippage}%\n`);

    // Log the full URL for debugging
    console.log(`🔗 API URL: ${url}\n`);

    // Make API request with authorization header
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();

    // Display swap transaction details
    displaySwapTransaction(data);

    return data;

  } catch (error) {
    console.error('❌ Error fetching swap transaction:', error.message);
    throw error;
  }
}

/**
 * Displays the swap transaction information in a readable format
 * @param {Object} swapData - Swap transaction response from 1inch API
 */
function displaySwapTransaction(swapData) {
  console.log('✅ Swap Transaction Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 SWAP TRANSACTION DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Extract token amounts - /swap endpoint uses different field names
  const fromTokenAmount = swapData.fromTokenAmount || swapData.srcAmount || AMOUNT_IN_WEI;
  const toTokenAmount = swapData.toTokenAmount || swapData.dstAmount || swapData.toAmount;
  
  // Extract decimals and symbols - use API response first, then fallback
  const fromDecimals = swapData.fromToken?.decimals || swapData.srcToken?.decimals || 6; // USDC = 6 decimals
  const toDecimals = swapData.toToken?.decimals || swapData.dstToken?.decimals || 18; // ALVA = 18 decimals
  const fromSymbol = swapData.fromToken?.symbol || swapData.srcToken?.symbol || 'USDC';
  const toSymbol = swapData.toToken?.symbol || swapData.dstToken?.symbol || 'ALVA';
  
  // Debug: Log the actual decimals being used
  console.log(`\n🔍 DEBUG - Token Decimals:`);
  console.log(`   From Token Decimals: ${fromDecimals}`);
  console.log(`   To Token Decimals: ${toDecimals}\n`);

  // Input amount - the amount in wei is for the source token
  // If swapping USDC (6 decimals), divide by 10^6
  // If swapping ETH (18 decimals), divide by 10^18
  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} smallest units)\n`);

  // Output amount
  const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
  console.log(`💵 You Receive (estimated):`);
  console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
  console.log(`   (${toTokenAmount} smallest units)\n`);

  // Exchange rate
  const rate = toAmountFormatted / fromAmountFormatted;
  console.log(`📊 Exchange Rate:`);
  console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);

  // Transaction details
  if (swapData.tx) {
    console.log(`🔗 Transaction Details:`);
    console.log(`   To Contract: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei (${swapData.tx.value / 1e18} ETH)`);
    console.log(`   Gas Limit: ${parseInt(swapData.tx.gas).toLocaleString()}`);
    console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei\n`);
  }

  // Protocol routing information - handle different response structures
  if (swapData.protocols && swapData.protocols.length > 0) {
    console.log(`🔀 Routing Through ${swapData.protocols.length} Route(s):\n`);
    swapData.protocols.forEach((routePart, index) => {
      console.log(`   Route ${index + 1}:`);
      
      // Handle different protocol structure formats
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
      } else {
        console.log(`      → ${JSON.stringify(routePart)}`);
      }
    });
  }

  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   • This transaction data is ready to be signed and executed');
  console.log('   • DO NOT sign this transaction unless you want to spend real ETH');
  console.log('   • Always verify the transaction details before signing');
  console.log('   • Make sure you have enough ETH for gas fees');

  console.log('\n📋 Next Steps to Execute:');
  console.log('   1. Review all transaction details carefully');
  console.log('   2. Sign the transaction with your private key');
  console.log('   3. Broadcast the signed transaction to the network');
  console.log('   4. Wait for confirmation');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Log transaction object for developers
  console.log('🔧 Raw Transaction Object (for developers):');
  console.log(JSON.stringify(swapData.tx, null, 2));
  
  // Debug: Log full response structure
  console.log('\n🐛 Full API Response (for debugging):');
  console.log(JSON.stringify(swapData, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting 1inch Swap Transaction Generation...\n');
    
    // Get swap transaction data for USDC -> ALVA swap
    await getSwapTransaction(
      USDC_ADDRESS, 
      ALVA_TOKEN_ADDRESS, 
      AMOUNT_IN_WEI, 
      WALLET_ADDRESS, 
      SLIPPAGE_PERCENT
    );
    
    console.log('✨ Process completed successfully!');
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Execute the script
main();
