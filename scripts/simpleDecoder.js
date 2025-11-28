/**
 * Simple Transaction Data Decoder
 * Purpose: Decode transaction data without any token information
 * 
 * This script focuses purely on decoding the raw transaction data structure
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
 * Decodes transaction data without token information
 * @param {string} data - The hex-encoded transaction data
 * @returns {Object} Decoded transaction structure
 */
function decodeTransactionData(data) {
  try {
    if (!data || !data.startsWith('0x')) {
      throw new Error('Invalid transaction data format');
    }

    // Extract function selector (first 4 bytes / 8 hex characters)
    const functionSelector = data.slice(0, 10);
    const functionName = FUNCTION_SIGNATURES[functionSelector] || 'Unknown Function';
    
    console.log('🔍 SIMPLE TRANSACTION DECODER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📋 Function Selector: ${functionSelector}`);
    console.log(`📋 Function Signature: ${functionName}\n`);
    
    // Remove function selector to get parameters
    const parametersData = data.slice(10);
    
    console.log(`📊 Raw Parameters Data:`);
    console.log(`   Length: ${parametersData.length / 2} bytes`);
    console.log(`   Hex: ${parametersData}\n`);

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
 * Decodes the standard swap function (0x07ed2379) - data only
 * swap(address,address,address,address,address,uint256,uint256,uint256,bytes)
 */
function decodeSwapFunction(parametersData) {
  console.log('🔄 DECODING SWAP FUNCTION DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // For dynamic types like bytes, we need to handle offsets
  // First 8 parameters are fixed-size (32 bytes each)
  const fixedParams = [];
  for (let i = 0; i < 8 * 64; i += 64) {
    fixedParams.push(parametersData.slice(i, i + 64));
  }

  // The 9th parameter (bytes) is dynamic - its value is an offset
  const bytesOffset = parseInt(fixedParams[8], 16) * 2; // Convert to hex position
  const bytesLengthHex = parametersData.slice(bytesOffset, bytesOffset + 64);
  const bytesLength = parseInt(bytesLengthHex, 16) * 2; // Length in hex chars
  const bytesData = parametersData.slice(bytesOffset + 64, bytesOffset + 64 + bytesLength);

  // Decode each parameter - pure data without token context
  const decoded = {
    address1: '0x' + fixedParams[0]?.slice(24), // address (last 20 bytes)
    address2: '0x' + fixedParams[1]?.slice(24), // address
    address3: '0x' + fixedParams[2]?.slice(24), // address
    address4: '0x' + fixedParams[3]?.slice(24), // address
    address5: '0x' + fixedParams[4]?.slice(24), // address
    amount1: fixedParams[5] ? BigInt('0x' + fixedParams[5]).toString() : '0', // uint256
    amount2: fixedParams[6] ? BigInt('0x' + fixedParams[6]).toString() : '0', // uint256
    flags: fixedParams[7] ? BigInt('0x' + fixedParams[7]).toString() : '0', // uint256
    bytesOffset: parseInt(fixedParams[8], 16), // offset to bytes data
    bytesData: bytesData // actual bytes data
  };

  // Display decoded parameters without token context
  console.log(`1️⃣  Address 1:             ${decoded.address1}`);
  console.log(`2️⃣  Address 2:             ${decoded.address2}`);
  console.log(`3️⃣  Address 3:             ${decoded.address3}`);
  console.log(`4️⃣  Address 4:             ${decoded.address4}`);
  console.log(`5️⃣  Address 5:             ${decoded.address5}`);
  console.log(`6️⃣  Amount 1:              ${decoded.amount1} wei`);
  console.log(`7️⃣  Amount 2:              ${decoded.amount2} wei`);
  console.log(`8️⃣  Flags:                 ${decoded.flags}`);
  console.log(`9️⃣  Bytes Offset:          ${decoded.bytesOffset} (position ${decoded.bytesOffset * 2} in hex)`);
  console.log(`🔟  Bytes Data Length:     ${bytesData.length / 2} bytes`);
  console.log(`1️⃣1️⃣  Bytes Data:            0x${bytesData.slice(0, 100)}${bytesData.length > 100 ? '...' : ''}`);

  // Show raw numeric values
  console.log('\n📊 RAW NUMERIC VALUES:');
  console.log(`   Amount 1 (wei):  ${decoded.amount1}`);
  console.log(`   Amount 2 (wei):  ${decoded.amount2}`);
  console.log(`   Flags Value:     ${decoded.flags}`);

  return decoded;
}

/**
 * Decodes parameters for unknown functions - data only
 */
function decodeGenericParameters(parametersData) {
  console.log('🔧 GENERIC PARAMETER DECODER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const params = [];
  for (let i = 0; i < parametersData.length; i += 64) {
    const param = parametersData.slice(i, i + 64);
    if (param.length === 64) { // Only add complete 32-byte parameters
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
 * Main function to decode transaction data
 */
function main() {
  // Example transaction data - replace with your own
  const transactionData = "0x07ed23790000000000000000000000008c864d0c8e476bf9eb9d620c10e1296fb0e2f9400000000000000000000000003639e6f4c224ebd1bf6373c3d97917d33e0492bb000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000008c864d0c8e476bf9eb9d620c10e1296fb0e2f940000000000000000000000000737a1d93502b76b70576ddbea84f7cb86d4915cf0000000000000000000000000000000000000000000000001ff16a72fd4799ec00000000000000000000000000000000000000000000000000000064435bf3e800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000013900000000000000000000000000000000000000011b0001050000c900004e00a0744c8c093639e6f4c224ebd1bf6373c3d97917d33e0492bb90cbe4bdd538d6e9b379bff5fe72c3d67a521de5000000000000000000000000000000000000000000000000001888415e74b1de0c203639e6f4c224ebd1bf6373c3d97917d33e0492bbac9fc647d92d8f7a7f8b81e8d4c5ab8b53e955716ae4071198002dc6c0ac9fc647d92d8f7a7f8b81e8d4c5ab8b53e9557100000000000000000000000000000000000000000000000000000063c260a2ec3639e6f4c224ebd1bf6373c3d97917d33e0492bb4101420000000000000000000000000000000000000600042e1a7d4d0000000000000000000000000000000000000000000000000000000000000000c061111111125421ca6dc452d289314280a0f8842a6500000000000000396637c0";

  console.log('🚀 Starting Simple Transaction Data Decoder...\n');
  
  const decoded = decodeTransactionData(transactionData);
  
  console.log('\n✨ Decoding completed!\n');
  
  return decoded;
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
