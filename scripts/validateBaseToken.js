/**
 * Validate Base Token and Generate Swap Data
 * Purpose: Validate token addresses on Base and generate swap transaction data
 */

require('dotenv').config();

// API Configuration for Base Network
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453; // Base Mainnet Chain ID
const API_KEY = process.env.ONE_INCH_API_KEY;

// Request body from user
const REQUEST_BODY = {
    "ethAmount": "10000000000000",
    "tokenAddresses": [
        "0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb"
    ],
    "tokenWeights": [10000],
    "slippages": [100],
    "useSwapData": true,
    "walletAddress": "0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f",
    "feePercentage": 5  // 5% fee for basket creation
};

// Calculate net amount after fee deduction
const calculateNetAmount = (grossAmount, feePercentage) => {
    const grossBigInt = BigInt(grossAmount);
    const feeBigInt = (grossBigInt * BigInt(feePercentage)) / BigInt(100);
    const netBigInt = grossBigInt - feeBigInt;
    
    return {
        gross: grossAmount,
        fee: feeBigInt.toString(),
        net: netBigInt.toString()
    };
};

// Token addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const PACA_TOKEN_ADDRESS = '0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb';

/**
 * Validate token on Base network
 * @param {string} tokenAddress - Token address to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateTokenOnBase(tokenAddress) {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        // Try to get a quote to validate the token
        const params = new URLSearchParams({
            src: ETH_ADDRESS,
            dst: tokenAddress,
            amount: REQUEST_BODY.ethAmount,
            from: REQUEST_BODY.walletAddress,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${params.toString()}`;
        
        console.log(`🔍 Validating token: ${tokenAddress}`);
        console.log(`📊 Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
        console.log(`💰 ETH Amount: ${REQUEST_BODY.ethAmount} wei (${REQUEST_BODY.ethAmount / 1e18} ETH)`);
        console.log(`👤 Wallet: ${REQUEST_BODY.walletAddress}\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('❌ Token validation failed:');
            console.log(JSON.stringify(errorData, null, 2));
            return { isValid: false, error: errorData };
        }

        const data = await response.json();
        console.log('✅ Token is valid on Base network!');
        
        // Display quote information
        displayQuoteInfo(data, tokenAddress);
        
        return { isValid: true, quoteData: data };

    } catch (error) {
        console.error('❌ Error validating token:', error.message);
        return { isValid: false, error: error.message };
    }
}

/**
 * Generate swap transaction data
 * @param {string} tokenAddress - Destination token address
 * @returns {Promise<Object>} Swap transaction data
 */
async function generateSwapData(tokenAddress) {
    try {
        const params = new URLSearchParams({
            src: ETH_ADDRESS,
            dst: tokenAddress,
            amount: REQUEST_BODY.ethAmount,
            from: REQUEST_BODY.walletAddress,
            origin: REQUEST_BODY.walletAddress,
            slippage: REQUEST_BODY.slippages[0] / 100, // Convert from basis points to percentage
            includeTokensInfo: true,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${params.toString()}`;
        
        console.log('\n🔄 Generating swap transaction data...');
        console.log(`🔗 API URL: ${url}\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('❌ Swap generation failed:');
            console.log(JSON.stringify(errorData, null, 2));
            return { success: false, error: errorData };
        }

        const data = await response.json();
        console.log('✅ Swap transaction generated successfully!');
        
        // Display swap transaction info
        displaySwapInfo(data);
        
        return { success: true, swapData: data };

    } catch (error) {
        console.error('❌ Error generating swap data:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Display quote information
 * @param {Object} quoteData - Quote data from 1inch API
 * @param {string} tokenAddress - Token address
 */
function displayQuoteInfo(quoteData, tokenAddress) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 QUOTE INFORMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Debug: Show the full response to understand the structure
    console.log('🔍 Full API Response:');
    console.log(JSON.stringify(quoteData, null, 2));
    console.log('\n');
    
    const fromAmount = quoteData.fromTokenAmount || REQUEST_BODY.ethAmount;
    
    // Try different possible field names for the output amount
    const toAmount = quoteData.toTokenAmount || 
                     quoteData.toAmount || 
                     quoteData.dstAmount ||
                     quoteData.returnAmount ||
                     quoteData.estimatedGas;
    
    console.log(`💰 You Send: ${fromAmount / 1e18} ETH`);
    
    // Check all possible amount fields
    const possibleAmountFields = [
        'toTokenAmount', 'toAmount', 'dstAmount', 'returnAmount', 
        'estimatedGas', 'quote', 'buyAmount', 'sellAmount'
    ];
    
    let foundAmount = null;
    let foundField = null;
    
    for (const field of possibleAmountFields) {
        if (quoteData[field] && quoteData[field] !== '0' && quoteData[field] !== 0) {
            foundAmount = quoteData[field];
            foundField = field;
            break;
        }
    }
    
    if (foundAmount && foundAmount !== 'undefined') {
        // Try to determine decimals from token info or assume 18
        let decimals = 18;
        if (quoteData.toToken && quoteData.toToken.decimals) {
            decimals = quoteData.toToken.decimals;
        } else if (quoteData.dstToken && quoteData.dstToken.decimals) {
            decimals = quoteData.dstToken.decimals;
        }
        
        const toAmountFormatted = parseFloat(foundAmount) / Math.pow(10, decimals);
        console.log(`💵 You Receive: ${toAmountFormatted.toLocaleString('en-US', { maximumFractionDigits: 8 })} PACA`);
        console.log(`📝 Amount found in field: ${foundField}`);
        console.log(`🔢 Raw amount: ${foundAmount}`);
        console.log(`📊 Decimals used: ${decimals}`);
        
        const rate = toAmountFormatted / (fromAmount / 1e18);
        console.log(`📈 Rate: 1 ETH = ${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} PACA`);
    } else {
        console.log(`💵 You Receive: Unable to calculate (no amount field found)`);
        console.log(`🔍 Available fields: ${Object.keys(quoteData).join(', ')}`);
    }
    
    if (quoteData.gas) {
        console.log(`⛽ Estimated Gas: ${parseInt(quoteData.gas).toLocaleString()}`);
    }
    
    if (quoteData.protocols && quoteData.protocols.length > 0) {
        console.log(`🔀 Available Protocols: ${quoteData.protocols.length}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Display swap transaction information
 * @param {Object} swapData - Swap data from 1inch API
 */
function displaySwapInfo(swapData) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SWAP TRANSACTION DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (swapData.tx) {
        console.log(`🔗 Transaction Details:`);
        console.log(`   To: ${swapData.tx.to}`);
        console.log(`   Value: ${swapData.tx.value} wei (${swapData.tx.value / 1e18} ETH)`);
        console.log(`   Gas: ${parseInt(swapData.tx.gas).toLocaleString()}`);
        if (swapData.tx.gasPrice) {
            console.log(`   Gas Price: ${parseInt(swapData.tx.gasPrice).toLocaleString()} wei`);
        }
        console.log(`   Data Length: ${swapData.tx.data.length} characters`);
    }
    
    if (swapData.protocols && swapData.protocols.length > 0) {
        console.log(`\n🔀 Routing through ${swapData.protocols.length} protocol(s)`);
    }
    
    console.log('\n📋 Raw Transaction Object:');
    console.log(JSON.stringify(swapData.tx, null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Process the request body
 */
async function processRequest() {
    try {
        console.log('🚀 Processing Base Token Validation Request\n');
        console.log('📋 Request Body:');
        console.log(JSON.stringify(REQUEST_BODY, null, 2));
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Validate each token address
        for (let i = 0; i < REQUEST_BODY.tokenAddresses.length; i++) {
            const tokenAddress = REQUEST_BODY.tokenAddresses[i];
            
            console.log(`🔍 Processing Token ${i + 1}/${REQUEST_BODY.tokenAddresses.length}`);
            console.log(`📍 Address: ${tokenAddress}`);
            console.log(`⚖️  Weight: ${REQUEST_BODY.tokenWeights[i] / 100}%`);
            console.log(`📊 Slippage: ${REQUEST_BODY.slippages[i] / 100}%\n`);
            
            // Step 1: Validate token
            const validation = await validateTokenOnBase(tokenAddress);
            
            if (validation.isValid) {
                // Step 2: Generate swap data if requested
                if (REQUEST_BODY.useSwapData) {
                    await generateSwapData(tokenAddress);
                }
            } else {
                console.log(`❌ Token ${tokenAddress} is not valid on Base network`);
                if (validation.error) {
                    console.log('Error details:', validation.error);
                }
            }
            
            console.log('\n' + '═'.repeat(80) + '\n');
        }
        
        console.log('✨ Request processing completed!');
        
    } catch (error) {
        console.error('\n💥 Fatal Error:', error.message);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    processRequest();
}

module.exports = {
    validateTokenOnBase,
    generateSwapData,
    REQUEST_BODY
};
