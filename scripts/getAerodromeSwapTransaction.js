/**
 * 1inch API Aerodrome Token Swap Transaction
 * Purpose: Get swap transaction data for Aerodrome token on Base network
 * This generates the actual transaction data that can be signed and executed
 * Token Address: 0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const CHAIN_ID = 8453; // Base Mainnet
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH address for 1inch
const AERODROME_TOKEN_ADDRESS = '0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb'; // Aerodrome token address

// Swap Configuration
const AMOUNT_IN_WEI = '1000000000000000'; // 0.001 ETH (small amount for testing)
const WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f'; // Your wallet address
const SLIPPAGE_PERCENT = '5'; // 5% slippage tolerance

/**
 * Fetches swap transaction data from 1inch API
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap in wei
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
      src: fromToken,           // Source token (ETH)
      dst: toToken,             // Destination token (Aerodrome token)
      amount: amount,           // Amount to swap in wei
      from: fromAddress,        // Your wallet address
      origin: fromAddress,      // Origin address (usually same as from)
      slippage: slippage,       // Slippage tolerance
      includeTokensInfo: true,  // Include token metadata
      includeProtocols: true,   // Include protocol routing information
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Fetching swap transaction from 1inch API on Base...\n');
    console.log(`📊 Swap Details:`);
    console.log(`   Network: Base (Chain ID: ${CHAIN_ID})`);
    console.log(`   From: ETH`);
    console.log(`   To: Aerodrome Token`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} ETH)`);
    console.log(`   Wallet: ${fromAddress}`);
    console.log(`   Slippage: ${slippage}%\n`);

    console.log(`🔗 API URL: ${url}\n`);

    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    // Parse the response
    const data = await response.json();
    
    console.log('✅ Swap Transaction Generated Successfully!\n');
    
    // Display the swap transaction details
    displaySwapTransaction(data);
    
    return data;

  } catch (error) {
    console.error('❌ Error fetching swap transaction:', error.message);
    throw error;
  }
}

/**
 * Display swap transaction information in a formatted way
 * @param {Object} swapData - Swap transaction response from 1inch API
 */
function displaySwapTransaction(swapData) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 SWAP TRANSACTION DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Extract amounts and token information
  const fromTokenAmount = swapData.fromTokenAmount || swapData.srcAmount || AMOUNT_IN_WEI;
  const toTokenAmount = swapData.dstAmount || swapData.toTokenAmount || swapData.toAmount;
  
  // Get token information
  const fromDecimals = swapData.fromToken?.decimals || swapData.srcToken?.decimals || 18;
  const toDecimals = swapData.toToken?.decimals || swapData.dstToken?.decimals || 18;
  const fromSymbol = swapData.fromToken?.symbol || swapData.srcToken?.symbol || 'ETH';
  const toSymbol = swapData.toToken?.symbol || swapData.dstToken?.symbol || 'TOKEN';

  // Format amounts for display
  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} wei)\n`);

  if (toTokenAmount && toTokenAmount !== 'undefined') {
    const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
    console.log(`💵 You Receive (estimated):`);
    console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
    console.log(`   (${toTokenAmount} smallest units)\n`);

    // Calculate and display exchange rate
    const rate = toAmountFormatted / fromAmountFormatted;
    console.log(`📈 Exchange Rate:`);
    console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);
  }

  // Display transaction details
  if (swapData.tx) {
    console.log(`🔗 Transaction Details:`);
    console.log(`   To Contract: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei (${swapData.tx.value / 1e18} ETH)`);
    console.log(`   Gas Limit: ${parseInt(swapData.tx.gas).toLocaleString()}`);
    if (swapData.tx.gasPrice) {
      console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei`);
    }
    console.log('');
  }

  // Display routing information
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

  console.log('🔧 Raw Transaction Object (for developers):');
  console.log(JSON.stringify(swapData.tx, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting 1inch Aerodrome Token Swap Transaction Generation...\n');
    console.log(`🌐 Network: Base (Chain ID: ${CHAIN_ID})`);
    console.log(`💰 Address: ${WALLET_ADDRESS}`);
    console.log(`🔄 Swap: ETH → Aerodrome Token\n`);
    
    // Get the swap transaction
    await getSwapTransaction(
      ETH_ADDRESS, 
      AERODROME_TOKEN_ADDRESS, 
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
if (require.main === module) {
  main();
}

// Export for use in other modules
module.exports = {
  getSwapTransaction,
  AERODROME_TOKEN_ADDRESS,
  ETH_ADDRESS
};
