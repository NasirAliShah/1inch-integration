/**
 * 1inch API WETH Swap Transaction Script
 * Purpose: Get swap transaction data for WETH to other tokens on Ethereum mainnet
 * 
 * This script handles swapping WETH (Wrapped ETH) that you received from contract operations
 * to other tokens using the 1inch API
 * 
 * Use Case: When your contract gives you WETH and you want to swap it for another token
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const CHAIN_ID = 1; // Ethereum Mainnet
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH contract address on Ethereum
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC token address (example destination)
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH address for 1inch

// Swap Configuration
const WETH_AMOUNT_IN_WEI = '100000000000000000'; // 0.1 WETH (example amount)
const WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f'; // Your wallet address
const SLIPPAGE_PERCENT = '1'; // 1% slippage tolerance

/**
 * Fetches swap transaction data from 1inch API for WETH swaps
 * @param {string} fromToken - Source token address (WETH)
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount of WETH to swap (in wei)
 * @param {string} fromAddress - Wallet address executing the swap
 * @param {string} slippage - Slippage tolerance percentage
 * @returns {Promise<Object>} Swap transaction data from 1inch API
 */
async function getWethSwapTransaction(fromToken, toToken, amount, fromAddress, slippage) {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file. Please add your API key.');
    }

    // Construct the API URL with query parameters
    const params = new URLSearchParams({
      src: fromToken,           // Source token (WETH)
      dst: toToken,             // Destination token
      amount: amount,           // Amount to swap in wei
      from: fromAddress,        // Your wallet address
      origin: fromAddress,      // Origin address (usually same as from)
      slippage: slippage,       // Slippage tolerance
      includeTokensInfo: true,  // Include token metadata
      includeProtocols: true,   // Include protocol routing information
      // Include major DEXs for better routing
      protocols: 'UNISWAP_V2,UNISWAP_V3,SUSHISWAP,CURVE,BALANCER,AERODROME',
    });

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Fetching WETH swap transaction from 1inch API...\n');
    console.log(`📊 Swap Details:`);
    console.log(`   From: WETH (Wrapped ETH)`);
    console.log(`   To: ${getTokenSymbol(toToken)}`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} WETH)`);
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
    displayWethSwapTransaction(data);

    return data;

  } catch (error) {
    console.error('❌ Error fetching WETH swap transaction:', error.message);
    throw error;
  }
}

/**
 * Get token symbol for display purposes
 * @param {string} tokenAddress - Token contract address
 * @returns {string} Token symbol
 */
function getTokenSymbol(tokenAddress) {
  const tokenMap = {
    [WETH_ADDRESS]: 'WETH',
    [USDC_ADDRESS]: 'USDC',
    [ETH_ADDRESS]: 'ETH',
    '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d': 'RDX',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 'DAI',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT'
  };
  
  return tokenMap[tokenAddress] || 'Unknown Token';
}

/**
 * Displays the WETH swap transaction information in a readable format
 * @param {Object} swapData - Swap transaction response from 1inch API
 */
function displayWethSwapTransaction(swapData) {
  console.log('✅ WETH Swap Transaction Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 WETH SWAP TRANSACTION DETAILS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Extract token amounts
  const fromTokenAmount = swapData.fromTokenAmount || swapData.srcAmount || WETH_AMOUNT_IN_WEI;
  const toTokenAmount = swapData.toTokenAmount || swapData.dstAmount || swapData.toAmount;
  
  // Extract decimals and symbols
  const fromDecimals = swapData.fromToken?.decimals || swapData.srcToken?.decimals || 18;
  const toDecimals = swapData.toToken?.decimals || swapData.dstToken?.decimals || 18;
  const fromSymbol = swapData.fromToken?.symbol || swapData.srcToken?.symbol || 'WETH';
  const toSymbol = swapData.toToken?.symbol || swapData.dstToken?.symbol || 'Token';

  // Input amount (WETH)
  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  console.log(`💰 You Send (WETH from contract):`);
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

  // Transaction details
  if (swapData.tx) {
    console.log(`🔗 Transaction Details:`);
    console.log(`   To Contract: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei (${swapData.tx.value / 1e18} ETH)`);
    console.log(`   Gas Limit: ${parseInt(swapData.tx.gas).toLocaleString()}`);
    console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei\n`);
  }

  // Protocol routing information
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
      }
    });
  }

  console.log('\n⚠️  IMPORTANT NOTES FOR WETH SWAPS:');
  console.log('   • Make sure you have approved the 1inch router to spend your WETH');
  console.log('   • WETH swaps require ERC-20 token approval before execution');
  console.log('   • You need ETH for gas fees (separate from WETH amount)');
  console.log('   • Verify the transaction details before signing');

  console.log('\n📋 Steps to Execute WETH Swap:');
  console.log('   1. Approve 1inch router to spend your WETH (if not already done)');
  console.log('   2. Review all transaction details carefully');
  console.log('   3. Sign the swap transaction with your private key');
  console.log('   4. Broadcast the signed transaction to the network');
  console.log('   5. Wait for confirmation');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Log transaction object for developers
  console.log('🔧 Raw Transaction Object (for developers):');
  console.log(JSON.stringify(swapData.tx, null, 2));
}

/**
 * Get WETH approval transaction data
 * This is needed before swapping WETH tokens
 * @param {string} spenderAddress - 1inch router address that needs approval
 * @param {string} amount - Amount of WETH to approve (use max for unlimited)
 * @returns {Object} Approval transaction data
 */
function getWethApprovalData(spenderAddress, amount = '115792089237316195423570985008687907853269984665640564039457584007913129639935') {
  // ERC-20 approve function signature: approve(address,uint256)
  const approveSignature = '0x095ea7b3';
  
  // Pad addresses and amounts to 32 bytes
  const paddedSpender = spenderAddress.slice(2).padStart(64, '0');
  const paddedAmount = BigInt(amount).toString(16).padStart(64, '0');
  
  const data = approveSignature + paddedSpender + paddedAmount;
  
  return {
    to: WETH_ADDRESS,
    data: data,
    value: '0',
    gasLimit: '50000' // Typical gas limit for ERC-20 approval
  };
}

/**
 * Main execution function with multiple swap examples
 */
async function main() {
  try {
    console.log('🚀 Starting WETH Swap Transaction Generation...\n');
    
    console.log('📝 Available Swap Options:\n');
    console.log('1. WETH → USDC');
    console.log('2. WETH → ETH');
    console.log('3. WETH → Custom Token\n');
    
    // Example 1: WETH to USDC swap
    console.log('🔄 Example 1: WETH → USDC Swap\n');
    await getWethSwapTransaction(
      WETH_ADDRESS, 
      USDC_ADDRESS, 
      WETH_AMOUNT_IN_WEI, 
      WALLET_ADDRESS, 
      SLIPPAGE_PERCENT
    );
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Example 2: WETH to ETH swap (unwrapping)
    console.log('🔄 Example 2: WETH → ETH Swap (Unwrapping)\n');
    await getWethSwapTransaction(
      WETH_ADDRESS, 
      ETH_ADDRESS, 
      WETH_AMOUNT_IN_WEI, 
      WALLET_ADDRESS, 
      SLIPPAGE_PERCENT
    );
    
    // Show approval transaction example
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('🔐 WETH Approval Transaction Example:\n');
    const approvalData = getWethApprovalData('0x111111125421cA6dc452d289314280a0f8842A65'); // 1inch router v5
    console.log('Approval Transaction Data:');
    console.log(JSON.stringify(approvalData, null, 2));
    
    console.log('\n✨ Process completed successfully!');
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  getWethSwapTransaction,
  getWethApprovalData,
  WETH_ADDRESS,
  USDC_ADDRESS,
  ETH_ADDRESS
};

// Execute the script if run directly
if (require.main === module) {
  main();
}
