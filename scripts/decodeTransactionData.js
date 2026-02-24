/**
 * 1inch Transaction Data Decoder
 * Purpose: Decode the transaction data from 1inch swap transactions
 * 
 * This helps understand what the encoded transaction data contains
 */

require('dotenv').config();

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
      throw new Error('Invalid transaction data format');
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
 * Decodes the standard swap function (0x07ed2379)
 * swap(address,address,address,address,address,uint256,uint256,uint256,bytes)
 */
function decodeSwapFunction(parametersData) {
  console.log('🔄 DECODING SWAP FUNCTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // For dynamic types like bytes, we need to handle offsets
  // First 8 parameters are fixed-size (32 bytes each)
  const fixedParams = [];
  for (let i = 0; i < 8 * 64; i += 64) {
    fixedParams.push(parametersData.slice(i, i + 64));
  }

  // The 9th parameter (bytes) is dynamic - its value is an offset
  const bytesOffsetParam = parametersData.slice(8 * 64, 9 * 64);
  const bytesOffset = parseInt(bytesOffsetParam, 16) * 2; // Convert to hex position
  const bytesLengthHex = parametersData.slice(bytesOffset, bytesOffset + 64);
  const bytesLength = parseInt(bytesLengthHex, 16) * 2; // Length in hex chars
  const bytesData = parametersData.slice(bytesOffset + 64, bytesOffset + 64 + bytesLength);

  // Decode each parameter based on swap function signature
  const decoded = {
    caller: '0x' + fixedParams[0]?.slice(24), // address (last 20 bytes)
    srcToken: '0x' + fixedParams[1]?.slice(24), // address
    dstToken: '0x' + fixedParams[2]?.slice(24), // address
    srcReceiver: '0x' + fixedParams[3]?.slice(24), // address
    dstReceiver: '0x' + fixedParams[4]?.slice(24), // address
    amount: fixedParams[5] ? BigInt('0x' + fixedParams[5]).toString() : '0', // uint256
    minReturnAmount: fixedParams[6] ? BigInt('0x' + fixedParams[6]).toString() : '0', // uint256
    flags: fixedParams[7] ? BigInt('0x' + fixedParams[7]).toString() : '0', // uint256
    bytesOffset: parseInt(bytesOffsetParam, 16), // offset to bytes data
    bytesData: bytesData // actual bytes data
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
  console.log(`9️⃣  Bytes Offset:          ${decoded.bytesOffset} (position ${decoded.bytesOffset * 2} in hex)`);
  console.log(`🔟  Bytes Data Length:     ${bytesData.length / 2} bytes`);
  console.log(`1️⃣1️⃣  Bytes Data:            0x${bytesData.slice(0, 100)}...`);

  // Convert amounts to readable format
  console.log('\n💰 HUMAN READABLE AMOUNTS:');
  
  // Determine decimals based on token addresses
  // USDC uses 6 decimals, most other tokens use 18
  const srcTokenLower = decoded.srcToken.toLowerCase();
  const dstTokenLower = decoded.dstToken.toLowerCase();
  
  const srcDecimals = (srcTokenLower === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') ? 6 : 18;
  const dstDecimals = 18; // Default to 18 for destination token
  
  const inputAmount = Number(decoded.amount) / (10**srcDecimals);
  const minOutputAmount = Number(decoded.minReturnAmount) / (10**dstDecimals);
  
  console.log(`   Input Amount:  ${inputAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })} tokens`);
  console.log(`   Min Output:    ${minOutputAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })} tokens`);

  // Calculate exchange rate
  if (inputAmount > 0) {
    const exchangeRate = minOutputAmount / inputAmount;
    console.log(`   Exchange Rate: 1 Source Token = ${exchangeRate.toLocaleString('en-US', { maximumFractionDigits: 6 })} Destination Tokens`);
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
    params.push(param);
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
 * Analyzes token addresses and provides context
 */
function analyzeTokens(srcToken, dstToken) {
  const knownTokens = {
    // Ethereum Mainnet
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH (Native Ethereum)',
    '0xa0b86a33e6441c8c06dd2a76c88b0b8685c2c5c': 'USDC',
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
    '0xf222b0e892f419c35e61892cddf0a8ec190c4b9d': 'RDX Token',
    
    // Base Network
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC (Base)',
    '0xcc68f95cf050e769d46d8d133bf4193fcbb3f1eb': 'ALVA (Base)',
    '0x4200000000000000000000000000000000000006': 'WETH (Wrapped ETH - Base)',
    '0x990636ecb3ff04d33d92e970d3d588bf5cd8d086': 'Caller/Receiver Address',
    '0x61811e2f877c9031a1daeccea216d167a8c40d52': 'Destination Receiver Address'
  };

  console.log('\n🪙 TOKEN ANALYSIS:');
  console.log(`   Source Token:      ${knownTokens[srcToken.toLowerCase()] || 'Unknown Token'}`);
  console.log(`   Destination Token: ${knownTokens[dstToken.toLowerCase()] || 'Unknown Token'}`);
}

/**
 * Main function to decode transaction data
 */
function main() {
  // Your latest transaction data
  const transactionData = "0x07ed2379000000000000000000000000990636ecb3ff04d33d92e970d3d588bf5cd8d086000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000cc68f95cf050e769d46d8d133bf4193fcbb3f1eb000000000000000000000000990636ecb3ff04d33d92e970d3d588bf5cd8d08600000000000000000000000061811e2f877c9031a1daeccea216d167a8c40d520000000000000000000000000000000000000000000000000000000000001747000000000000000000000000000000000000000000000000024a648597beff880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002a900000000000000000000000000000000000000000000028b00025d00004e00a0744c8c09833589fcd6edb6e08f4c7c32d4f71b54bda0291390cbe4bdd538d6e9b379bff5fe72c3d67a521de5000000000000000000000000000000000000000000000000000000000000001100a007e5c0d20000000000000000000000000000000000000000000000000001eb00007b0c20833589fcd6edb6e08f4c7c32d4f71b54bda029133099a7c284610897baaa43cbdc06469e44a06ce16ae4071118002dc6c03099a7c284610897baaa43cbdc06469e44a06ce10000000000000000000000000000000000000000000000000000019daa9c2609833589fcd6edb6e08f4c7c32d4f71b54bda029135126cf77a3ba9a5ca399b7c97c74d54e5b1beb874e4342000000000000000000000000000000000000060004cac88ea90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024a648597beff8800000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000111111125421ca6dc452d289314280a0f8842a6500000000000000000000000000000000000000000000000000000000696226ae00000000000000000000000000000000000000000000000000000000000000010000000000000000000000004200000000000000000000000000000000000006000000000000000000000000cc68f95cf050e769d46d8d133bf4193fcbb3f1eb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000420dd381b31aef6683db6b902084cb0ffece40da0020d6bdbf78cc68f95cf050e769d46d8d133bf4193fcbb3f1eb111111125421ca6dc452d289314280a0f8842a650000000000000000000000000000000000000000000000396637c0";

  console.log('🚀 Starting Transaction Data Decoder...\n');
  
  const decoded = decodeTransactionData(transactionData);
  
  if (decoded && decoded.srcToken && decoded.dstToken) {
    analyzeTokens(decoded.srcToken, decoded.dstToken);
  }
  
  console.log('\n✨ Decoding completed!\n');
}

// Export functions for use in other files
module.exports = {
  decodeTransactionData,
  decodeSwapFunction,
  analyzeTokens
};

// Run if called directly
if (require.main === module) {
  main();
}
