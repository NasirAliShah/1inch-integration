/**
 * 1inch API Swap Transaction with Aerodrome DEX Support
 * Purpose: Enhanced swap functionality with specific DEX routing control
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const CHAIN_ID = 1; // Ethereum Mainnet (change to 8453 for Base network where Aerodrome is native)
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const RDX_TOKEN_ADDRESS = '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d';

// Swap Configuration
const AMOUNT_IN_WEI = '100000000000000'; // 0.0001 ETH
const WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f';
const SLIPPAGE_PERCENT = '5';

/**
 * Available DEX protocols for routing
 * Note: Aerodrome is primarily on Base network (Chain ID 8453)
 */
const AVAILABLE_PROTOCOLS = {
  // Major DEXs on Ethereum
  UNISWAP_V2: 'UNISWAP_V2',
  UNISWAP_V3: 'UNISWAP_V3',
  SUSHISWAP: 'SUSHISWAP',
  CURVE: 'CURVE',
  BALANCER: 'BALANCER',
  PANCAKESWAP: 'PANCAKESWAP',
  
  // Aerodrome (mainly on Base)
  AERODROME: 'AERODROME',
  
  // Other popular DEXs
  KYBER: 'KYBER',
  BANCOR: 'BANCOR',
  DODO: 'DODO',
  ONEINCH_LP: 'ONEINCH_LP',
};

/**
 * DEX Configuration Presets
 */
const DEX_PRESETS = {
  ALL_MAJOR: [
    AVAILABLE_PROTOCOLS.UNISWAP_V2,
    AVAILABLE_PROTOCOLS.UNISWAP_V3,
    AVAILABLE_PROTOCOLS.SUSHISWAP,
    AVAILABLE_PROTOCOLS.CURVE,
    AVAILABLE_PROTOCOLS.BALANCER,
  ],
  
  WITH_AERODROME: [
    AVAILABLE_PROTOCOLS.UNISWAP_V2,
    AVAILABLE_PROTOCOLS.UNISWAP_V3,
    AVAILABLE_PROTOCOLS.SUSHISWAP,
    AVAILABLE_PROTOCOLS.CURVE,
    AVAILABLE_PROTOCOLS.BALANCER,
    AVAILABLE_PROTOCOLS.AERODROME,
  ],
  
  AERODROME_ONLY: [
    AVAILABLE_PROTOCOLS.AERODROME,
  ],
  
  UNISWAP_FAMILY: [
    AVAILABLE_PROTOCOLS.UNISWAP_V2,
    AVAILABLE_PROTOCOLS.UNISWAP_V3,
    AVAILABLE_PROTOCOLS.SUSHISWAP,
  ],
};

/**
 * Enhanced swap function with DEX selection
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap in wei
 * @param {string} fromAddress - Wallet address
 * @param {string} slippage - Slippage tolerance
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Swap transaction data
 */
async function getSwapTransactionWithDEX(fromToken, toToken, amount, fromAddress, slippage, options = {}) {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file. Please add your API key.');
    }

    // Configure DEX protocols
    const {
      protocols = DEX_PRESETS.WITH_AERODROME,
      excludeProtocols = [],
      enableAerodrome = true,
      maxSplits = 4,
      gasPrice = 'fast',
    } = options;

    // Build protocols string
    let protocolsString = '';
    if (protocols && protocols.length > 0) {
      protocolsString = protocols.join(',');
    }

    // Build exclude protocols string
    let excludeProtocolsString = '';
    if (excludeProtocols && excludeProtocols.length > 0) {
      excludeProtocolsString = excludeProtocols.join(',');
    }

    // Construct API parameters
    const params = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: amount,
      from: fromAddress,
      origin: fromAddress,
      slippage: slippage,
      includeTokensInfo: true,
      includeProtocols: true,
      includeGas: true,
    });

    // Add protocol filtering
    if (protocolsString) {
      params.append('protocols', protocolsString);
    }
    if (excludeProtocolsString) {
      params.append('excludeProtocols', excludeProtocolsString);
    }

    // Add advanced parameters
    if (maxSplits) {
      params.append('parts', maxSplits.toString());
    }
    if (gasPrice) {
      params.append('gasPrice', gasPrice);
    }

    const url = `${ONEINCH_API_BASE_URL}/${CHAIN_ID}/swap?${params.toString()}`;

    console.log('🔄 Fetching swap transaction with DEX routing...\n');
    console.log(`📊 Swap Configuration:`);
    console.log(`   From: ${fromToken === ETH_ADDRESS ? 'ETH' : fromToken}`);
    console.log(`   To: ${toToken}`);
    console.log(`   Amount: ${amount} wei (${amount / 1e18} ETH)`);
    console.log(`   Wallet: ${fromAddress}`);
    console.log(`   Slippage: ${slippage}%`);
    console.log(`   Enabled DEXs: ${protocolsString || 'All available'}`);
    console.log(`   Aerodrome Enabled: ${enableAerodrome ? 'Yes' : 'No'}`);
    if (excludeProtocolsString) {
      console.log(`   Excluded DEXs: ${excludeProtocolsString}`);
    }
    console.log(`\n🔗 API URL: ${url}\n`);

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; 1inch-integration/1.0)',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
    }

    const data = await response.json();

    // Display enhanced swap information
    displayEnhancedSwapTransaction(data, { protocols: protocolsString });

    return data;

  } catch (error) {
    console.error('❌ Error fetching swap transaction:', error.message);
    throw error;
  }
}

/**
 * Enhanced display function with DEX routing information
 * @param {Object} swapData - Swap transaction response
 * @param {Object} config - Configuration used for the swap
 */
function displayEnhancedSwapTransaction(swapData, config = {}) {
  console.log('✅ Enhanced Swap Transaction Generated!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 ENHANCED SWAP TRANSACTION WITH DEX ROUTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Token information
  const fromTokenAmount = swapData.fromTokenAmount || swapData.srcAmount || AMOUNT_IN_WEI;
  const toTokenAmount = swapData.toTokenAmount || swapData.dstAmount || swapData.toAmount;
  
  const fromDecimals = swapData.fromToken?.decimals || 18;
  const toDecimals = swapData.toToken?.decimals || 18;
  const fromSymbol = swapData.fromToken?.symbol || 'ETH';
  const toSymbol = swapData.toToken?.symbol || 'TOKEN';

  const fromAmountFormatted = parseFloat(fromTokenAmount) / Math.pow(10, fromDecimals);
  const toAmountFormatted = parseFloat(toTokenAmount) / Math.pow(10, toDecimals);

  console.log(`💰 Input: ${fromAmountFormatted} ${fromSymbol}`);
  console.log(`💵 Output: ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} ${toSymbol}`);
  console.log(`📊 Rate: 1 ${fromSymbol} = ${(toAmountFormatted / fromAmountFormatted).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${toSymbol}\n`);

  // DEX Routing Analysis
  console.log('🔀 DEX ROUTING ANALYSIS:');
  console.log(`   Requested DEXs: ${config.protocols || 'All available'}`);
  
  if (swapData.protocols && swapData.protocols.length > 0) {
    console.log(`   Routes Found: ${swapData.protocols.length}`);
    
    // Analyze which DEXs are actually being used
    const usedDEXs = new Set();
    swapData.protocols.forEach((routePart) => {
      if (Array.isArray(routePart)) {
        routePart.forEach((step) => {
          if (Array.isArray(step)) {
            step.forEach((protocol) => {
              if (protocol.name) usedDEXs.add(protocol.name);
            });
          } else if (step && step.name) {
            usedDEXs.add(step.name);
          }
        });
      } else if (routePart && routePart.name) {
        usedDEXs.add(routePart.name);
      }
    });
    
    console.log(`   DEXs Used: ${Array.from(usedDEXs).join(', ')}`);
    
    // Check if Aerodrome is being used
    const aerodromeUsed = Array.from(usedDEXs).some(dex => 
      dex.toLowerCase().includes('aerodrome') || dex.toLowerCase().includes('aero')
    );
    console.log(`   Aerodrome Used: ${aerodromeUsed ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n   Detailed Routing:');
    swapData.protocols.forEach((routePart, index) => {
      console.log(`   Route ${index + 1}:`);
      
      if (Array.isArray(routePart)) {
        routePart.forEach((step) => {
          if (Array.isArray(step)) {
            step.forEach((protocol) => {
              const percentage = protocol.part || 100;
              const isAerodrome = protocol.name?.toLowerCase().includes('aerodrome') || 
                                protocol.name?.toLowerCase().includes('aero');
              const marker = isAerodrome ? '🚀' : '→';
              console.log(`      ${marker} ${protocol.name} (${percentage}%)`);
            });
          } else if (step && step.name) {
            const percentage = step.part || 100;
            const isAerodrome = step.name?.toLowerCase().includes('aerodrome') || 
                              step.name?.toLowerCase().includes('aero');
            const marker = isAerodrome ? '🚀' : '→';
            console.log(`      ${marker} ${step.name} (${percentage}%)`);
          }
        });
      }
    });
  } else {
    console.log('   ⚠️  No routing information available');
  }

  // Transaction details
  if (swapData.tx) {
    console.log(`\n🔗 Transaction Details:`);
    console.log(`   To: ${swapData.tx.to}`);
    console.log(`   Value: ${swapData.tx.value} wei`);
    console.log(`   Gas: ${parseInt(swapData.tx.gas).toLocaleString()}`);
    console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Test different DEX configurations
 */
async function testDEXConfigurations() {
  console.log('🧪 Testing Different DEX Configurations...\n');
  
  const testConfigs = [
    {
      name: 'All Major DEXs',
      options: { protocols: DEX_PRESETS.ALL_MAJOR, enableAerodrome: false }
    },
    {
      name: 'With Aerodrome Included',
      options: { protocols: DEX_PRESETS.WITH_AERODROME, enableAerodrome: true }
    },
    {
      name: 'Uniswap Family Only',
      options: { protocols: DEX_PRESETS.UNISWAP_FAMILY, enableAerodrome: false }
    }
  ];

  for (const config of testConfigs) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔬 Testing: ${config.name}`);
      console.log(`${'='.repeat(60)}`);
      
      await getSwapTransactionWithDEX(
        ETH_ADDRESS,
        RDX_TOKEN_ADDRESS,
        AMOUNT_IN_WEI,
        WALLET_ADDRESS,
        SLIPPAGE_PERCENT,
        config.options
      );
      
      console.log(`✅ ${config.name} test completed\n`);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ ${config.name} test failed:`, error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Enhanced 1inch Swap with Aerodrome Support...\n');
    
    // Test with Aerodrome enabled
    await getSwapTransactionWithDEX(
      ETH_ADDRESS,
      RDX_TOKEN_ADDRESS,
      AMOUNT_IN_WEI,
      WALLET_ADDRESS,
      SLIPPAGE_PERCENT,
      {
        protocols: DEX_PRESETS.WITH_AERODROME,
        enableAerodrome: true,
        maxSplits: 4,
      }
    );
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

// Export functions
module.exports = {
  getSwapTransactionWithDEX,
  testDEXConfigurations,
  DEX_PRESETS,
  AVAILABLE_PROTOCOLS,
};

// Run if executed directly
if (require.main === module) {
  main();
}
