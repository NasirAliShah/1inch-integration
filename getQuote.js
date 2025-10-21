/**
 * 1inch API Quote Script
 * Purpose: Get a quote for swapping ETH to RDX token on Ethereum mainnet
 * 
 * RDX Token Address: 0xf222b0e892f419c35e61892cddf0a8ec190c4b9d
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const CHAIN_ID = 1; // Ethereum Mainnet
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH address for 1inch
const RDX_TOKEN_ADDRESS = '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d'; // RDX token address

// Amount to swap (in wei - smallest unit)
// Example: 0.001 ETH = 1000000000000000 wei
const AMOUNT_IN_WEI = '1000000000000000'; // 0.001 ETH

/**
 * Fetches a swap quote from 1inch API
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap (in smallest unit)
 * @returns {Promise<Object>} Quote response from 1inch API
 */
async function getQuote(fromToken, toToken, amount) {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file. Please add your API key.');
    }

    // Construct the API URL with query parameters
    const params = new URLSearchParams({
      src: fromToken,          // Source token (ETH)
      dst: toToken,            // Destination token (RDX)
      amount: amount,          // Amount to swap in wei
      includeTokensInfo: true, // Include token metadata in response
      includeProtocols: true,  // Include protocol routing information
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/quote?${params.toString()}`;

    console.log('🔍 Fetching quote from 1inch API...\n');
    console.log(`📊 Request Details:`);
    console.log(`   From: ETH`);
    console.log(`   To: RDX Token`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} ETH)\n`);

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

    // Display quote results
    displayQuote(data);

    return data;

  } catch (error) {
    console.error('❌ Error fetching quote:', error.message);
    throw error;
  }
}

/**
 * Displays the quote information in a readable format
 * @param {Object} quoteData - Quote response from 1inch API
 */
function displayQuote(quoteData) {
  console.log('✅ Quote Retrieved Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SWAP QUOTE DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Extract token amounts - handle different API response formats
  const fromTokenAmount = AMOUNT_IN_WEI; // Use the input amount we sent
  const toTokenAmount = quoteData.dstAmount || quoteData.toAmount || quoteData.toTokenAmount;
  
  // Extract decimals
  const fromDecimals = quoteData.srcToken?.decimals || 18;
  const toDecimals = quoteData.dstToken?.decimals || 18;
  
  // Extract symbols
  const fromSymbol = quoteData.srcToken?.symbol || 'ETH';
  const toSymbol = quoteData.dstToken?.symbol || 'RDX';

  // Input amount
  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send:`);
  console.log(`   ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`   (${fromTokenAmount} wei)\n`);

  // Output amount
  const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);
  console.log(`💵 You Receive (estimated):`);
  console.log(`   ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
  console.log(`   (${toTokenAmount} smallest units)\n`);

  // Exchange rate
  const rate = toAmountFormatted / fromAmountFormatted;
  console.log(`📊 Exchange Rate:`);
  console.log(`   1 ${fromSymbol} = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);

  // Gas estimation
  if (quoteData.gas || quoteData.estimatedGas) {
    const gasAmount = quoteData.gas || quoteData.estimatedGas;
    console.log(`⛽ Estimated Gas: ${gasAmount.toLocaleString()}\n`);
  }

  // Protocol routing information
  if (quoteData.protocols && quoteData.protocols.length > 0) {
    console.log(`🔀 Routing Through ${quoteData.protocols.length} Route(s):\n`);
    quoteData.protocols.forEach((routePart, index) => {
      console.log(`   Route ${index + 1}:`);
      routePart.forEach((step) => {
        step.forEach((protocol) => {
          const percentage = protocol.part || 100;
          console.log(`      → ${protocol.name} (${percentage}%)`);
        });
      });
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Log full response for debugging (optional - can be commented out)
  console.log('📋 Full API Response (for debugging):');
  console.log(JSON.stringify(quoteData, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting 1inch Quote Retrieval...\n');
    
    // Get quote for ETH -> RDX swap
    await getQuote(ETH_ADDRESS, RDX_TOKEN_ADDRESS, AMOUNT_IN_WEI);
    
    console.log('✨ Process completed successfully!');
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Execute the script
main();
