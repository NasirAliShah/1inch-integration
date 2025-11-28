/**
 * Get 1inch quotes for all provided addresses on Base network
 * Using the same token configuration as getSwapTransaction.js
 */

require('dotenv').config();

// API Configuration for Base Network
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453; // Base Mainnet Chain ID
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token addresses (matching your getSwapTransaction.js pattern)
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base (equivalent to USDC on ETH)

// Your 6 addresses
const ADDRESSES_TO_CHECK = [
    { label: "Main Address", address: "0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb" },
    { label: "Address 1", address: "0x4b6104755afb5da4581b81c552da3a25608c73b8" },
    { label: "Address 2", address: "0xb316e2469e32e4c782533d8dace9f70b2ad88557" },
    { label: "Address 3", address: "0xfc48314ad4ad5bd36a84e8307b86a68a01d95d9c" },
    { label: "Address 4", address: "0x7f0e9971d3320521fc88f863e173a4cddbb051ba" },
    { label: "Address 5", address: "0xba5e66fb16944da22a62ea4fd70ad02008744460" }
];

// Swap configuration (matching getSwapTransaction.js)
const AMOUNT_IN_WEI = '1000000000000000'; // 0.01 ETH (same as your config)
const SLIPPAGE_PERCENT = '1'; // 1% slippage

/**
 * Get quote for a specific address
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address  
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Address to get quote for
 * @returns {Promise<Object>} Quote data
 */
async function getQuoteForAddress(fromToken, toToken, amount, fromAddress) {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        const params = new URLSearchParams({
            src: fromToken,
            dst: toToken,
            amount: amount,
            from: fromAddress, // Include the from address to get accurate balance info
            includeTokensInfo: true,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${params.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData,
                address: fromAddress
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data,
            address: fromAddress
        };

    } catch (error) {
        return {
            success: false,
            error: { message: error.message },
            address: fromAddress
        };
    }
}

/**
 * Get swap transaction for a specific address
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address  
 * @param {string} amount - Amount to swap
 * @param {string} fromAddress - Address to create swap for
 * @returns {Promise<Object>} Swap transaction data
 */
async function getSwapForAddress(fromToken, toToken, amount, fromAddress) {
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
            slippage: SLIPPAGE_PERCENT,
            includeTokensInfo: true,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${params.toString()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData,
                address: fromAddress
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data,
            address: fromAddress
        };

    } catch (error) {
        return {
            success: false,
            error: { message: error.message },
            address: fromAddress
        };
    }
}

/**
 * Format and display quote results
 * @param {Object} result - Quote result object
 * @param {string} label - Address label
 */
function displayQuoteResult(result, label) {
    console.log(`\n📊 ${label}: ${result.address}`);
    console.log('━'.repeat(60));
    
    if (!result.success) {
        console.log(`❌ Error: ${result.error.description || result.error.message || 'Unknown error'}`);
        
        // Check for balance information in error
        if (result.error.meta) {
            const balanceMeta = result.error.meta.find(m => m.type === 'fromTokenBalance');
            if (balanceMeta) {
                const balance = parseFloat(balanceMeta.value) / 1e18;
                console.log(`💰 ETH Balance: ${balance} ETH`);
            }
        }
        return;
    }

    const data = result.data;
    
    // Extract amounts and token info
    const fromAmount = parseFloat(AMOUNT_IN_WEI) / 1e18;
    const toAmount = parseFloat(data.toAmount || data.dstAmount || '0');
    const toDecimals = data.toToken?.decimals || data.dstToken?.decimals || 6; // USDC has 6 decimals
    const toAmountFormatted = toAmount / Math.pow(10, toDecimals);
    
    console.log(`✅ Quote Success!`);
    console.log(`💰 Send: ${fromAmount} ETH`);
    console.log(`💵 Receive: ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 6 })} USDC`);
    
    // Calculate rate
    if (toAmountFormatted > 0) {
        const rate = toAmountFormatted / fromAmount;
        console.log(`📈 Rate: 1 ETH = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`);
    }
    
    // Gas estimate
    if (data.gas) {
        console.log(`⛽ Gas Estimate: ${parseInt(data.gas).toLocaleString()}`);
    }
    
    // Protocol info
    if (data.protocols && data.protocols.length > 0) {
        console.log(`🔀 Via: ${data.protocols.length} protocol(s)`);
    }
}

/**
 * Format and display swap transaction result
 * @param {Object} result - Swap result object
 * @param {string} label - Address label
 */
function displaySwapResult(result, label) {
    console.log(`\n🔄 ${label} - Swap Transaction`);
    console.log('━'.repeat(60));
    
    if (!result.success) {
        console.log(`❌ Swap Error: ${result.error.description || result.error.message || 'Unknown error'}`);
        
        // Check for balance information in error
        if (result.error.meta) {
            const balanceMeta = result.error.meta.find(m => m.type === 'fromTokenBalance');
            if (balanceMeta) {
                const balance = parseFloat(balanceMeta.value) / 1e18;
                console.log(`💰 Current ETH Balance: ${balance} ETH`);
                console.log(`📋 Required: ${parseFloat(AMOUNT_IN_WEI) / 1e18} ETH`);
            }
        }
        return;
    }

    console.log(`✅ Swap Transaction Created Successfully!`);
    console.log(`📋 Transaction ready for signing and execution`);
    
    if (result.data.tx) {
        console.log(`🏦 To Contract: ${result.data.tx.to}`);
        console.log(`💰 Value: ${result.data.tx.value} wei`);
        console.log(`⛽ Gas Limit: ${parseInt(result.data.tx.gas).toLocaleString()}`);
    }
}

/**
 * Main function to get quotes and swaps for all addresses
 */
async function main() {
    console.log('🌐 1inch Base Network - Multi-Address Quote & Swap Analysis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Configuration:`);
    console.log(`   Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
    console.log(`   From: ETH (Native)`);
    console.log(`   To: USDC (${USDC_BASE_ADDRESS})`);
    console.log(`   Amount: ${parseFloat(AMOUNT_IN_WEI) / 1e18} ETH`);
    console.log(`   Slippage: ${SLIPPAGE_PERCENT}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 1: Get quotes for all addresses
    console.log('📈 STEP 1: Getting Quotes for All Addresses\n');
    
    const quoteResults = [];
    for (const addressInfo of ADDRESSES_TO_CHECK) {
        console.log(`🔍 Getting quote for ${addressInfo.label}...`);
        const result = await getQuoteForAddress(
            ETH_ADDRESS, 
            USDC_BASE_ADDRESS, 
            AMOUNT_IN_WEI, 
            addressInfo.address
        );
        result.label = addressInfo.label;
        quoteResults.push(result);
        
        displayQuoteResult(result, addressInfo.label);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 2: Get swap transactions for addresses with successful quotes
    console.log('\n\n🔄 STEP 2: Creating Swap Transactions for Valid Addresses\n');
    
    const successfulQuotes = quoteResults.filter(r => r.success);
    console.log(`📋 Found ${successfulQuotes.length} addresses with successful quotes\n`);
    
    if (successfulQuotes.length === 0) {
        console.log('⚠️ No addresses have sufficient balance or valid quotes');
        console.log('💡 This is normal for test addresses without ETH balance on Base network');
        return;
    }

    for (const quoteResult of successfulQuotes) {
        console.log(`🔄 Creating swap transaction for ${quoteResult.label}...`);
        const swapResult = await getSwapForAddress(
            ETH_ADDRESS,
            USDC_BASE_ADDRESS,
            AMOUNT_IN_WEI,
            quoteResult.address
        );
        swapResult.label = quoteResult.label;
        
        displaySwapResult(swapResult, quoteResult.label);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successful Quotes: ${successfulQuotes.length}/${ADDRESSES_TO_CHECK.length}`);
    console.log(`❌ Failed Quotes: ${ADDRESSES_TO_CHECK.length - successfulQuotes.length}/${ADDRESSES_TO_CHECK.length}`);
    
    if (successfulQuotes.length > 0) {
        console.log('\n🎯 Addresses with valid quotes:');
        successfulQuotes.forEach(r => {
            console.log(`   • ${r.label}: ${r.address}`);
        });
    }
    
    console.log('\n✨ Analysis completed!');
}

// Execute if run directly
if (require.main === module) {
    main().catch(error => {
        console.error('\n💥 Fatal Error:', error.message);
        process.exit(1);
    });
}

// Export for use in other modules
module.exports = {
    getQuoteForAddress,
    getSwapForAddress,
    ADDRESSES_TO_CHECK,
    ETH_ADDRESS,
    USDC_BASE_ADDRESS,
    AMOUNT_IN_WEI
};
