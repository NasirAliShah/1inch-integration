/**
 * Basic 1inch Transaction Data Decoder
 * Purpose: Decode transaction data from command line hash input
 * 
 * Usage: node basicDecoder.js <transaction_hash>
 * Example: node basicDecoder.js 0x07ed2379000000000000...
 */

// Common 1inch function signatures
const FUNCTION_SIGNATURES = {
  '0x07ed2379': 'swap(address,address,address,address,address,uint256,uint256,uint256,bytes)',
  '0x12aa3caf': 'swap(address,(address,address,address,address,uint256,uint256,uint256),bytes,bytes)',
  '0x84bd6d29': 'clipperSwap(address,address,uint256,uint256)',
  '0x2e95b6c8': 'unoswap(address,uint256,uint256,bytes32[])',
  '0x0502b1c5': 'unoswap(address,uint256,uint256,uint256)',
  '0x7c025200': 'swap(address,(address,address,address,address,uint256,uint256,uint256,uint256),bytes,bytes)',
};

/**
 * Decodes 1inch transaction data
 * @param {string} data - The hex-encoded transaction data
 * @returns {Object} Decoded transaction information
 */
function decodeTransactionData(data) {
  try {
    if (!data || !data.startsWith('0x')) {
      throw new Error('Invalid transaction data format. Must start with 0x');
    }

    // Extract function selector (first 4 bytes / 8 hex characters)
    const functionSelector = data.slice(0, 10);
    const functionName = FUNCTION_SIGNATURES[functionSelector] || 'Unknown Function';
    
    console.log('🔍 TRANSACTION DATA DECODER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📋 Function Selector: ${functionSelector}`);
    console.log(`📋 Function Signature: ${functionName}\n`);
    
    // Remove function selector to get parameters
    const parametersData = data.slice(10);
    
    console.log(`📊 Raw Parameters Data:`);
    console.log(`   Length: ${parametersData.length / 2} bytes`);
    console.log(`   Hex: ${parametersData.slice(0, 100)}${parametersData.length > 100 ? '...' : ''}\n`);

    // Decode based on function type
    if (functionSelector === '0x07ed2379') {
      return decodeSwapFunction(parametersData);
    } else {
      return decodeGenericParameters(parametersData);
    }

  } catch (error) {
    console.error('❌ Error decoding transaction data:', error.message);
    return null;
  }
}

/**
 * Decodes the standard swap function (0x07ed2379)
 * swap(address,address,address,address,address,uint256,uint256,uint256,bytes)
 */
function decodeSwapFunction(parametersData) {
  console.log('🔄 DECODING SWAP FUNCTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // First 8 parameters are fixed-size (32 bytes each)
  const fixedParams = [];
  for (let i = 0; i < 8 * 64; i += 64) {
    const param = parametersData.slice(i, i + 64);
    if (param.length === 64) {
      fixedParams.push(param);
    }
  }

  // Handle bytes parameter (9th parameter) - it's dynamic
  let bytesData = '';
  if (fixedParams.length >= 8 && fixedParams[7]) {
    try {
      const bytesOffset = parseInt(fixedParams[7], 16) * 2; // Convert to hex position
      if (bytesOffset < parametersData.length) {
        const bytesLengthHex = parametersData.slice(bytesOffset, bytesOffset + 64);
        const bytesLength = parseInt(bytesLengthHex, 16) * 2; // Length in hex chars
        bytesData = parametersData.slice(bytesOffset + 64, bytesOffset + 64 + bytesLength);
      }
    } catch (e) {
      // If bytes parsing fails, continue without it
    }
  }

  // Decode each parameter based on swap function signature
  const decoded = {
    caller: fixedParams[0] ? '0x' + fixedParams[0].slice(24) : 'N/A',
    srcToken: fixedParams[1] ? '0x' + fixedParams[1].slice(24) : 'N/A',
    dstToken: fixedParams[2] ? '0x' + fixedParams[2].slice(24) : 'N/A',
    srcReceiver: fixedParams[3] ? '0x' + fixedParams[3].slice(24) : 'N/A',
    dstReceiver: fixedParams[4] ? '0x' + fixedParams[4].slice(24) : 'N/A',
    amount: fixedParams[5] ? BigInt('0x' + fixedParams[5]).toString() : '0',
    minReturnAmount: fixedParams[6] ? BigInt('0x' + fixedParams[6]).toString() : '0',
    flags: fixedParams[7] ? BigInt('0x' + fixedParams[7]).toString() : '0',
    bytesData: bytesData
  };

  // Display decoded parameters
  console.log(`1️⃣  Caller Address:        ${decoded.caller}`);
  console.log(`2️⃣  Source Token:          ${decoded.srcToken}`);
  console.log(`3️⃣  Destination Token:     ${decoded.dstToken}`);
  console.log(`4️⃣  Source Receiver:       ${decoded.srcReceiver}`);
  console.log(`5️⃣  Destination Receiver:  ${decoded.dstReceiver}`);
  console.log(`6️⃣  Amount:                ${decoded.amount} wei`);
  console.log(`7️⃣  Min Return Amount:     ${decoded.minReturnAmount} wei`);
  console.log(`8️⃣  Flags:                 ${decoded.flags}`);
  console.log(`9️⃣  Bytes Data Length:     ${bytesData.length / 2} bytes`);
  if (bytesData.length > 0) {
    console.log(`🔟  Bytes Data:            0x${bytesData.slice(0, 100)}${bytesData.length > 100 ? '...' : ''}`);
  }

  // Convert amounts to readable format (assuming 18 decimals)
  console.log('\n💰 HUMAN READABLE AMOUNTS:');
  const inputAmountEth = Number(decoded.amount) / (10**18);
  const minOutputTokens = Number(decoded.minReturnAmount) / (10**18);
  
  console.log(`   Input Amount:  ${inputAmountEth} tokens`);
  console.log(`   Min Output:    ${minOutputTokens.toLocaleString('en-US', { maximumFractionDigits: 6 })} tokens`);

  // Calculate exchange rate
  if (inputAmountEth > 0) {
    const exchangeRate = minOutputTokens / inputAmountEth;
    console.log(`   Exchange Rate: 1 input = ${exchangeRate.toLocaleString('en-US', { maximumFractionDigits: 2 })} output`);
  }

  return decoded;
}

/**
 * Decodes parameters for unknown functions
 */
function decodeGenericParameters(parametersData) {
  console.log('🔧 GENERIC PARAMETER DECODER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const params = [];
  for (let i = 0; i < parametersData.length; i += 64) {
    const param = parametersData.slice(i, i + 64);
    if (param.length === 64) {
      params.push(param);
    }
  }

  params.forEach((param, index) => {
    const asAddress = '0x' + param.slice(24);
    const asUint = BigInt('0x' + param).toString();
    
    console.log(`Parameter ${index + 1}:`);
    console.log(`   Raw Hex:    0x${param}`);
    console.log(`   As Address: ${asAddress}`);
    console.log(`   As Uint:    ${asUint}`);
    console.log('');
  });

  return { parameters: params };
}

/**
 * Main function
 */
function main() {
  // Get transaction hash from command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Error: No transaction hash provided\n');
    console.log('Usage: node basicDecoder.js <transaction_hash>');
    console.log('Example: node basicDecoder.js 0x07ed2379000000000000...\n');
    process.exit(1);
  }

  const transactionHash = args[0];
  
  console.log('🚀 Starting Basic Transaction Decoder...\n');
  console.log(`📋 Input Hash: ${transactionHash.slice(0, 50)}${transactionHash.length > 50 ? '...' : ''}\n`);
  
  const decoded = decodeTransactionData(transactionHash);
  
  if (decoded) {
    console.log('\n✅ Decoding completed successfully!');
  } else {
    console.log('\n❌ Decoding failed!');
    process.exit(1);
  }
}

// Export functions for use in other files
module.exports = {
  decodeTransactionData,
  decodeSwapFunction,
  decodeGenericParameters
};

// Run if called directly
if (require.main === module) {
  main();
}
