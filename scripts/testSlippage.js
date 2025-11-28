/**
 * Test 1inch API Slippage Parameter
 * Purpose: Demonstrate how slippage affects minimum return amounts
 */

require('dotenv').config();
const axios = require("axios");

// API Configuration
const API_KEY = process.env.ONE_INCH_API_KEY;

// Test different slippage values
const SLIPPAGE_TESTS = [0.1, 0.5, 1, 5, 10, 50]; // Different slippage percentages

async function testSlippageEffect() {
  const baseParams = {
    src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
    dst: "0x111111111117dc0aa78b770fa6a738034120c302", // 1INCH token
    amount: "10000000000000000", // 0.01 ETH
    from: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Vitalik's address (for testing)
    // DON'T set minReturn - let slippage calculate it
  };

  console.log('🧪 Testing 1inch API Slippage Effects\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Base Parameters:`);
  console.log(`   Source: ETH`);
  console.log(`   Destination: 1INCH Token`);
  console.log(`   Amount: ${baseParams.amount} wei (0.01 ETH)`);
  console.log(`   From: ${baseParams.from}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  for (const slippage of SLIPPAGE_TESTS) {
    try {
      console.log(`🔍 Testing Slippage: ${slippage}%`);
      
      if (!API_KEY) {
        throw new Error('ONE_INCH_API_KEY not found in .env file');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        },
        params: {
          ...baseParams,
          slippage: slippage,
          // Remove minReturn to let slippage work
        },
        paramsSerializer: {
          indexes: null,
        },
      };

      const response = await axios.get("https://api.1inch.com/swap/v6.1/1/swap", config);
      const data = response.data;

      // Extract key information
      const dstAmount = data.dstAmount;
      const minReturnAmount = data.tx?.value || "N/A"; // This might be in transaction data
      
      results.push({
        slippage,
        dstAmount,
        minReturnAmount,
        gasEstimate: data.tx?.gas || "N/A"
      });

      console.log(`   ✅ Expected Amount: ${dstAmount} wei`);
      console.log(`   📉 Min Return: ${minReturnAmount}`);
      console.log(`   ⛽ Gas: ${data.tx?.gas || "N/A"}`);
      console.log('');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.description || error.message}`);
      console.log('');
    }
  }

  // Display comparison table
  displaySlippageComparison(results);
}

/**
 * Display slippage comparison table
 */
function displaySlippageComparison(results) {
  if (results.length === 0) return;

  console.log('\n📊 SLIPPAGE COMPARISON TABLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Slippage | Expected Amount    | Difference from 0.1%');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const baseAmount = results[0]?.dstAmount;

  results.forEach(result => {
    const difference = baseAmount ? 
      ((parseFloat(result.dstAmount) - parseFloat(baseAmount)) / parseFloat(baseAmount) * 100).toFixed(4) : 
      "N/A";
    
    console.log(`${result.slippage.toString().padEnd(8)} | ${result.dstAmount.padEnd(18)} | ${difference}%`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Explain the results
  console.log('💡 EXPLANATION:');
  console.log('• dstAmount (expected) should be the SAME for all slippage values');
  console.log('• Slippage affects the MINIMUM amount you\'ll accept');
  console.log('• Higher slippage = lower minimum acceptable amount');
  console.log('• The actual slippage protection happens during execution');
  console.log('• If market moves unfavorably > slippage %, transaction reverts');
}

/**
 * Test with manual minReturn calculation
 */
async function testManualMinReturn() {
  console.log('\n🔧 MANUAL MIN RETURN CALCULATION TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    if (!API_KEY) {
      throw new Error('ONE_INCH_API_KEY not found in .env file');
    }

    // First, get quote without slippage
    const quoteResponse = await axios.get("https://api.1inch.com/swap/v6.1/1/quote", {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        dst: "0x111111111117dc0aa78b770fa6a738034120c302",
        amount: "10000000000000000",
      }
    });

    const expectedAmount = quoteResponse.data.dstAmount;
    console.log(`📊 Quote (no slippage): ${expectedAmount} wei`);

    // Test different slippage calculations
    const slippageTests = [1, 5, 10];
    
    for (const slippage of slippageTests) {
      const minReturn = Math.floor(parseFloat(expectedAmount) * (100 - slippage) / 100);
      
      console.log(`\n🔍 Slippage ${slippage}%:`);
      console.log(`   Expected: ${expectedAmount} wei`);
      console.log(`   Min Return: ${minReturn} wei`);
      console.log(`   Difference: ${((parseFloat(expectedAmount) - minReturn) / parseFloat(expectedAmount) * 100).toFixed(2)}%`);

      // Test swap with calculated minReturn
      try {
        const swapResponse = await axios.get("https://api.1inch.com/swap/v6.1/1/swap", {
          params: {
            src: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            dst: "0x111111111117dc0aa78b770fa6a738034120c302",
            amount: "10000000000000000",
            from: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            slippage: slippage,
          }
        });

        console.log(`   ✅ Swap API Response: ${swapResponse.data.dstAmount} wei`);
      } catch (error) {
        console.log(`   ❌ Swap Error: ${error.response?.data?.description || error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.log(`❌ Quote Error: ${error.response?.data?.description || error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await testSlippageEffect();
    await testManualMinReturn();
    
    console.log('\n✨ Slippage testing completed!');
    console.log('\n🎯 KEY TAKEAWAYS:');
    console.log('1. dstAmount stays the same regardless of slippage');
    console.log('2. Slippage sets minimum acceptable amount during execution');
    console.log('3. Remove minReturn parameter to let slippage work automatically');
    console.log('4. Higher slippage = more tolerance for price movement');
    
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
  }
}

// Execute the test
if (require.main === module) {
  main();
}

module.exports = {
  testSlippageEffect,
  testManualMinReturn
};
