/**
 * Check Aerodrome Token Swap Information
 * Purpose: Test if token 0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb can be swapped via 1inch
 * Token has pair on Aerodrome DEX
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453; // Base Mainnet (Aerodrome is on Base)
const API_KEY = process.env.ONE_INCH_API_KEY;

// Token Addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // Native ETH
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base
const TARGET_TOKEN = '0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb'; // Token to test

// Test Configuration
const TEST_AMOUNT = '1000000000000000'; // 0.001 ETH
const WALLET_ADDRESS = '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f';

/**
 * Test token swap availability
 * @param {string} fromToken - Source token address
 * @param {string} toToken - Destination token address
 * @param {string} amount - Amount to swap
 * @param {string} testName - Name for the test
 * @returns {Promise<Object>} Test result
 */
async function testTokenSwap(fromToken, toToken, amount, testName) {
    try {
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found in .env file');
        }

        console.log(`🔍 Testing: ${testName}`);
        console.log(`   From: ${fromToken}`);
        console.log(`   To: ${toToken}`);
        console.log(`   Amount: ${amount} wei\n`);

        // First try quote
        const quoteParams = new URLSearchParams({
            src: fromToken,
            dst: toToken,
            amount: amount,
            from: WALLET_ADDRESS,
            includeProtocols: true
        });

        const quoteUrl = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${quoteParams.toString()}`;
        
        const quoteResponse = await fetch(quoteUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!quoteResponse.ok) {
            const errorData = await quoteResponse.json();
            console.log(`   ❌ Quote failed: ${errorData.description || errorData.error}`);
            return { 
                success: false, 
                error: errorData,
                testName,
                step: 'quote'
            };
        }

        const quoteData = await quoteResponse.json();
        console.log(`   ✅ Quote successful!`);
        
        // Display quote information
        displayQuoteInfo(quoteData, testName);

        // Try swap transaction
        const swapParams = new URLSearchParams({
            src: fromToken,
            dst: toToken,
            amount: amount,
            from: WALLET_ADDRESS,
            origin: WALLET_ADDRESS,
            slippage: '5', // 5% slippage for potentially less liquid tokens
            includeProtocols: true,
            includeTokensInfo: true
        });

        const swapUrl = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${swapParams.toString()}`;
        
        const swapResponse = await fetch(swapUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!swapResponse.ok) {
            const errorData = await swapResponse.json();
            console.log(`   ❌ Swap failed: ${errorData.description || errorData.error}`);
            return { 
                success: false, 
                error: errorData,
                testName,
                step: 'swap',
                quoteData
            };
        }

        const swapData = await swapResponse.json();
        console.log(`   ✅ Swap transaction generated!`);
        
        // Display swap information
        displaySwapInfo(swapData, testName);

        return { 
            success: true, 
            quoteData, 
            swapData,
            testName
        };

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { 
            success: false, 
            error: error.message,
            testName
        };
    }
}

/**
 * Display quote information
 * @param {Object} quoteData - Quote response data
 * @param {string} testName - Test name
 */
function displayQuoteInfo(quoteData, testName) {
    console.log(`\n   📊 ${testName} - Quote Details:`);
    
    if (quoteData.dstAmount) {
        const dstAmount = quoteData.dstAmount;
        console.log(`      Expected Output: ${dstAmount} wei`);
        
        // Try to format the amount (assume 18 decimals if not specified)
        const decimals = quoteData.toToken?.decimals || quoteData.dstToken?.decimals || 18;
        const formattedAmount = parseFloat(dstAmount) / Math.pow(10, decimals);
        console.log(`      Formatted: ${formattedAmount.toLocaleString('en-US', { maximumFractionDigits: 8 })}`);
    }

    if (quoteData.protocols && quoteData.protocols.length > 0) {
        console.log(`      Available Protocols: ${quoteData.protocols.length}`);
        
        // Check for Aerodrome specifically
        const protocolNames = [];
        quoteData.protocols.forEach(routePart => {
            if (Array.isArray(routePart)) {
                routePart.forEach(step => {
                    if (Array.isArray(step)) {
                        step.forEach(protocol => {
                            if (protocol.name) protocolNames.push(protocol.name);
                        });
                    } else if (step && step.name) {
                        protocolNames.push(step.name);
                    }
                });
            } else if (routePart && routePart.name) {
                protocolNames.push(routePart.name);
            }
        });

        const uniqueProtocols = [...new Set(protocolNames)];
        console.log(`      Protocols: ${uniqueProtocols.join(', ')}`);
        
        if (uniqueProtocols.some(p => p.toLowerCase().includes('aerodrome'))) {
            console.log(`      🎯 AERODROME DETECTED!`);
        }
    }

    if (quoteData.gas) {
        console.log(`      Estimated Gas: ${parseInt(quoteData.gas).toLocaleString()}`);
    }

    console.log('');
}

/**
 * Display swap information
 * @param {Object} swapData - Swap response data
 * @param {string} testName - Test name
 */
function displaySwapInfo(swapData, testName) {
    console.log(`   🔄 ${testName} - Swap Transaction:`);
    
    if (swapData.tx) {
        console.log(`      To Contract: ${swapData.tx.to}`);
        console.log(`      Gas Limit: ${parseInt(swapData.tx.gas).toLocaleString()}`);
        console.log(`      Value: ${swapData.tx.value} wei`);
    }

    if (swapData.protocols && swapData.protocols.length > 0) {
        console.log(`      Routing Protocols: ${swapData.protocols.length}`);
    }

    console.log('');
}

/**
 * Check if token exists in 1inch token list
 * @returns {Promise<boolean>} Whether token is listed
 */
async function checkTokenListing() {
    try {
        console.log('🔍 Checking if token is listed in 1inch token database...\n');
        
        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/tokens`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('❌ Failed to fetch token list');
            return false;
        }

        const data = await response.json();
        const tokenInfo = data.tokens[TARGET_TOKEN.toLowerCase()];
        
        if (tokenInfo) {
            console.log('✅ Token is listed in 1inch database!');
            console.log(`   Name: ${tokenInfo.name}`);
            console.log(`   Symbol: ${tokenInfo.symbol}`);
            console.log(`   Decimals: ${tokenInfo.decimals}`);
            if (tokenInfo.logoURI) {
                console.log(`   Logo: ${tokenInfo.logoURI}`);
            }
            console.log('');
            return true;
        } else {
            console.log('❌ Token is NOT listed in 1inch database');
            console.log('   This means it might still be tradeable but without metadata\n');
            return false;
        }

    } catch (error) {
        console.log(`❌ Error checking token listing: ${error.message}\n`);
        return false;
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🚀 Aerodrome Token Swap Analysis\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 Token Information:`);
        console.log(`   Target Token: ${TARGET_TOKEN}`);
        console.log(`   Network: Base (Chain ID: ${BASE_CHAIN_ID})`);
        console.log(`   Test Amount: ${TEST_AMOUNT} wei (${TEST_AMOUNT / 1e18} ETH)`);
        console.log(`   Wallet: ${WALLET_ADDRESS}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Step 1: Check if token is listed
        const isListed = await checkTokenListing();

        // Step 2: Test different swap scenarios
        const testScenarios = [
            {
                from: ETH_ADDRESS,
                to: TARGET_TOKEN,
                amount: TEST_AMOUNT,
                name: 'ETH → Target Token'
            },
            {
                from: TARGET_TOKEN,
                to: ETH_ADDRESS,
                amount: '1000000000000000000', // 1 token (assuming 18 decimals)
                name: 'Target Token → ETH'
            },
            {
                from: USDC_ADDRESS,
                to: TARGET_TOKEN,
                amount: '1000000', // 1 USDC (6 decimals)
                name: 'USDC → Target Token'
            },
            {
                from: TARGET_TOKEN,
                to: USDC_ADDRESS,
                amount: '1000000000000000000', // 1 token
                name: 'Target Token → USDC'
            }
        ];

        const results = [];
        
        for (const scenario of testScenarios) {
            console.log('━'.repeat(60));
            const result = await testTokenSwap(
                scenario.from,
                scenario.to,
                scenario.amount,
                scenario.name
            );
            results.push(result);
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Summary
        console.log('\n🎯 SUMMARY RESULTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`✅ Successful swaps: ${successful.length}/${results.length}`);
        console.log(`❌ Failed swaps: ${failed.length}/${results.length}`);
        
        if (successful.length > 0) {
            console.log('\n✅ Working swap directions:');
            successful.forEach(result => {
                console.log(`   • ${result.testName}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ Failed swap directions:');
            failed.forEach(result => {
                console.log(`   • ${result.testName}: ${result.error?.description || result.error}`);
            });
        }

        // Check for Aerodrome usage
        const aerodromeUsed = successful.some(result => {
            if (!result.quoteData?.protocols) return false;
            const protocolNames = JSON.stringify(result.quoteData.protocols).toLowerCase();
            return protocolNames.includes('aerodrome');
        });

        if (aerodromeUsed) {
            console.log('\n🎯 AERODROME DEX IS BEING USED FOR ROUTING! ✅');
        } else {
            console.log('\n⚠️  Aerodrome DEX not detected in routing (might use other DEXs)');
        }

        console.log('\n✨ Analysis completed!');

    } catch (error) {
        console.error('\n💥 Fatal Error:', error.message);
        process.exit(1);
    }
}

// Execute the script
if (require.main === module) {
    main();
}

module.exports = {
    testTokenSwap,
    checkTokenListing,
    TARGET_TOKEN
};
