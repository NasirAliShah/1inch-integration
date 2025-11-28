/**
 * Debug Rebalance Error
 * Purpose: Analyze why the rebalance function is failing
 */

require('dotenv').config();

// API Configuration
const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453;
const API_KEY = process.env.ONE_INCH_API_KEY;

// Addresses from your error
const CONTRACT_ADDRESS = '0x7074b20072E4addDA01Cb738D2E705a5f784cbF2'; // Your basket contract
const SENDER_ADDRESS = '0x0fF019f527aDCF3d24A90086A5B0ed52eCE80fA8';   // User who called rebalance
const WRONG_CALLER = '0x8c864d0c8e476bf9eb9d620c10e1296fb0e2f940';     // Wrong address in 1inch call

// Token addresses
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const PACA_TOKEN = '0x3639e6f4c224ebd1bf6373c3d97917d33e0492bb';

// Amount from decoded transaction
const SWAP_AMOUNT = '25159036922944'; // ~0.000025 ETH

/**
 * Test the correct 1inch API call
 */
async function testCorrectSwapCall() {
    try {
        console.log('🔧 Testing CORRECT 1inch API call...\n');
        
        if (!API_KEY) {
            throw new Error('ONE_INCH_API_KEY not found');
        }

        // Use the CORRECT contract address
        const params = new URLSearchParams({
            src: ETH_ADDRESS,
            dst: PACA_TOKEN,
            amount: SWAP_AMOUNT,
            from: CONTRACT_ADDRESS,        // ✅ Use actual contract address
            origin: SENDER_ADDRESS,       // ✅ Use actual user address
            slippage: '5',
            includeTokensInfo: true,
            includeProtocols: true
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/swap?${params.toString()}`;
        
        console.log('📊 Correct Parameters:');
        console.log(`   From (Contract): ${CONTRACT_ADDRESS}`);
        console.log(`   Origin (User): ${SENDER_ADDRESS}`);
        console.log(`   Amount: ${SWAP_AMOUNT} wei (${SWAP_AMOUNT / 1e18} ETH)`);
        console.log(`   Source: ETH`);
        console.log(`   Destination: PACA\n`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.log('❌ Correct call also failed:');
            console.log(JSON.stringify(errorData, null, 2));
            
            // Check if it's a balance issue
            if (errorData.description && errorData.description.includes('balance')) {
                console.log('\n💡 DIAGNOSIS: Balance Issue');
                console.log(`   The contract ${CONTRACT_ADDRESS} doesn't have enough ETH`);
                console.log(`   Required: ${SWAP_AMOUNT} wei (${SWAP_AMOUNT / 1e18} ETH)`);
                console.log(`   Actual: 0 wei (according to error)`);
            }
            
            return { success: false, error: errorData };
        }

        const data = await response.json();
        console.log('✅ Correct call succeeded!');
        console.log('📋 Transaction data generated successfully');
        
        return { success: true, data };

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Compare wrong vs correct addresses
 */
function compareAddresses() {
    console.log('🔍 ADDRESS COMPARISON ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('❌ WRONG (from failed transaction):');
    console.log(`   Caller/From: ${WRONG_CALLER}`);
    console.log(`   This address was used in 1inch call but doesn't have ETH\n`);
    
    console.log('✅ CORRECT (should be used):');
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   User: ${SENDER_ADDRESS}`);
    console.log(`   Contract should have ETH and execute the swap\n`);
    
    console.log('🔧 SOLUTION:');
    console.log('   1. Use contract address as "from" in 1inch API');
    console.log('   2. Use user address as "origin" in 1inch API');
    console.log('   3. Ensure contract has sufficient ETH balance');
    console.log('   4. Contract must call 1inch router with correct transaction data\n');
}

/**
 * Generate corrected transaction data
 */
async function generateCorrectedTransaction() {
    console.log('🛠️  GENERATING CORRECTED TRANSACTION DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const result = await testCorrectSwapCall();
    
    if (result.success) {
        console.log('✅ Corrected transaction data:');
        console.log(JSON.stringify(result.data.tx, null, 2));
        
        console.log('\n📋 Key differences from failed transaction:');
        console.log(`   ✅ "from" should be: ${CONTRACT_ADDRESS}`);
        console.log(`   ✅ "origin" should be: ${SENDER_ADDRESS}`);
        console.log(`   ✅ Contract must have ETH balance`);
        
    } else {
        console.log('❌ Still failing - likely balance issue');
        console.log('💡 Contract needs to have ETH before calling 1inch');
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('🚀 DEBUGGING REBALANCE ERROR\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Step 1: Compare addresses
        compareAddresses();
        
        // Step 2: Test correct API call
        await generateCorrectedTransaction();
        
        console.log('\n🎯 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('The main issue is likely:');
        console.log('1. Wrong "from" address in 1inch API call');
        console.log('2. Contract insufficient ETH balance');
        console.log('3. Need to use contract address as caller, not random address');
        
        console.log('\n✨ Debug analysis completed!');
        
    } catch (error) {
        console.error('💥 Fatal Error:', error.message);
    }
}

// Execute
if (require.main === module) {
    main();
}

module.exports = {
    testCorrectSwapCall,
    CONTRACT_ADDRESS,
    SENDER_ADDRESS
};
