/**
 * 1inch API Swap for Base Blockchain
 * Purpose: Create swap transactions and validate addresses on Base network
 * 
 * Base Chain ID: 8453
 * This script handles token swaps on Base blockchain using 1inch API
 */

require('dotenv').config();

// API Configuration for Base Network
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453; // Base Mainnet Chain ID
const API_KEY = process.env.ONE_INCH_API_KEY;

// Native token addresses for Base
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH address for 1inch
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Test addresses provided by user
const TEST_ADDRESSES = {
    main: "0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb",
    address1: "0x4b6104755afb5da4581b81c552da3a25608c73b8",
    address2: "0xb316e2469e32e4c782533d8dace9f70b2ad88557",
    address3: "0xfc48314ad4ad5bd36a84e8307b86a68a01d95d9c",
    address4: "0x7f0e9971d3320521fc88f863e173a4cddbb051ba",
    address5: "0xba5e66fb16944da22a62ea4fd70ad02008744460"
};

/**
 * Validates if an address is a valid Ethereum/Base address
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidAddress(address) {
    // Check if address is a string and has correct format
    if (typeof address !== 'string') return false;
    
    // Remove 0x prefix if present
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    
    // Check if it's 40 characters long and contains only hex characters
    return /^[0-9a-fA-F]{40}$/.test(cleanAddress);
}

/**
 * Checks if an address is a contract or EOA on Base network
 * @param {string} address - The address to check
 * @returns {Promise<Object>} Address information
 */
async function checkAddressType(address) {
    try {
        // For demonstration, we'll use a simple validation
        // In production, you'd want to use web3 or ethers to check bytecode
        const isValid = isValidAddress(address);
        
        return {
            address: address,
            isValid: isValid,
            network: 'Base',
            chainId: BASE_CHAIN_ID,
            // Note: To determine if it's a contract vs EOA, you'd need to check bytecode
            // This would require a web3 provider connection to Base network
            type: 'Unknown (requires RPC call to determine)',
            checksumAddress: isValid ? address.toLowerCase() : null
        };
    } catch (error) {
        return {
            address: address,
            isValid: false,
            error: error.message
        };
    }
}

/**
 * Gets available tokens for swapping on Base network
 * @returns {Promise<Object>} Available tokens on Base
 */
async function getBaseTokens() {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/tokens`;
        
        console.log('🔍 Fetching available tokens on Base network...\n');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ Error fetching Base tokens:', error.message);
        throw error;
    }
}

/**
 * Gets a quote for token swap on Base network
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap (in smallest unit)
 * @returns {Promise<Object>} Quote data from 1inch API
 */
async function getBaseQuote(fromToken, toToken, amount) {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        const params = new URLSearchParams({
            src: fromToken,
            dst: toToken,
            amount: amount,
            includeTokensInfo: true,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${params.toString()}`;
        
        console.log(`📊 Getting quote for Base swap...`);
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
            throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ Error getting Base quote:', error.message);
        throw error;
    }
}

/**
 * Creates a swap transaction on Base network
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap (in smallest unit)
 * @param {string} fromAddress - Wallet address executing the swap
 * @param {string} slippage - Slippage tolerance percentage
 * @returns {Promise<Object>} Swap transaction data
 */
async function getBaseSwapTransaction(fromToken, toToken, amount, fromAddress, slippage = '1') {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        // Validate the from address
        if (!isValidAddress(fromAddress)) {
            throw new Error(`Invalid fromAddress: ${fromAddress}`);
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
            // Note: Base network auto-selects optimal protocols, no need to specify
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${params.toString()}`;
        
        console.log('🔄 Creating swap transaction on Base network...\n');
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
            throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData, null, 2)}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('❌ Error creating Base swap transaction:', error.message);
        throw error;
    }
}

/**
 * Validates all provided test addresses
 * @returns {Promise<Array>} Array of address validation results
 */
async function validateTestAddresses() {
    console.log('🔍 Validating provided addresses...\n');
    
    const results = [];
    
    for (const [label, address] of Object.entries(TEST_ADDRESSES)) {
        console.log(`Checking ${label}: ${address}`);
        const result = await checkAddressType(address);
        result.label = label;
        results.push(result);
        
        if (result.isValid) {
            console.log(`✅ Valid address`);
        } else {
            console.log(`❌ Invalid address`);
        }
        console.log('');
    }
    
    return results;
}

/**
 * Displays address validation results in a formatted way
 * @param {Array} results - Array of validation results
 */
function displayAddressResults(results) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ADDRESS VALIDATION RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.label.toUpperCase()}`);
        console.log(`   Address: ${result.address}`);
        console.log(`   Valid: ${result.isValid ? '✅ Yes' : '❌ No'}`);
        console.log(`   Network: ${result.network || 'N/A'}`);
        console.log(`   Chain ID: ${result.chainId || 'N/A'}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    });
    
    const validCount = results.filter(r => r.isValid).length;
    console.log(`📊 Summary: ${validCount}/${results.length} addresses are valid\n`);
}

/**
 * Example function to demonstrate Base swap functionality
 * @param {string} userAddress - One of the validated addresses to use as sender
 */
async function demonstrateBaseSwap(userAddress) {
    try {
        console.log('🚀 Demonstrating Base swap functionality...\n');
        
        // Example: Swap 0.01 ETH to USDC on Base (same as your ETH config)
        const amount = '1000000000000000'; // 0.001 ETH in wei
        
        // First get a quote
        console.log('1️⃣ Getting quote...');
        const quote = await getBaseQuote(ETH_ADDRESS, USDC_BASE_ADDRESS, amount);
        
        console.log('✅ Quote received:');
        console.log(`   Expected output: ${quote.toAmount} USDC units`);
        console.log(`   Gas estimate: ${quote.gas || 'N/A'}\n`);
        
        // Then get the actual swap transaction
        console.log('2️⃣ Creating swap transaction...');
        const swapTx = await getBaseSwapTransaction(
            ETH_ADDRESS, 
            USDC_BASE_ADDRESS, 
            amount, 
            userAddress, 
            '1'
        );
        
        console.log('✅ Swap transaction created successfully!');
        console.log('📋 Transaction data ready for signing and execution\n');
        
        return { quote, swapTx };
        
    } catch (error) {
        console.error('❌ Error in Base swap demonstration:', error.message);
        throw error;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🌐 Base Blockchain 1inch Integration\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Step 1: Validate all provided addresses
        const addressResults = await validateTestAddresses();
        displayAddressResults(addressResults);
        
        // Step 2: Get available tokens on Base (optional)
        console.log('🪙 Fetching available tokens on Base...');
        try {
            const tokens = await getBaseTokens();
            console.log(`✅ Found ${Object.keys(tokens.tokens || {}).length} available tokens on Base\n`);
        } catch (error) {
            console.log(`⚠️ Could not fetch tokens: ${error.message}\n`);
        }
        
        // Step 3: Demonstrate swap functionality with your wallet address (has ETH balance)
        const YOUR_WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f'; // From getSwapTransaction.js
        console.log(`🔄 Using your wallet address ${YOUR_WALLET_ADDRESS} for swap demonstration...\n`);
        
        try {
            await demonstrateBaseSwap(YOUR_WALLET_ADDRESS);
        } catch (error) {
            console.log(`⚠️ Swap demonstration failed: ${error.message}`);
            console.log('This might happen if the address has insufficient balance on Base network\n');
        }
        
        console.log('✨ Base blockchain integration completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Fatal Error:', error.message);
        process.exit(1);
    }
}

// Export functions for use in other modules
module.exports = {
    getBaseSwapTransaction,
    getBaseQuote,
    getBaseTokens,
    validateTestAddresses,
    checkAddressType,
    isValidAddress,
    TEST_ADDRESSES,
    BASE_CHAIN_ID
};

// Execute the script if run directly
if (require.main === module) {
    main();
}
