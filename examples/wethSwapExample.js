/**
 * Example: How to swap WETH received from contract operations
 * 
 * This example shows how to use the WETH swap functionality
 * when your contract gives you WETH and you want to swap it for other tokens
 */

const { getWethSwapTransaction, getWethApprovalData, WETH_ADDRESS, USDC_ADDRESS } = require('../scripts/getWethSwapTransaction');

// Example configuration
const EXAMPLE_CONFIG = {
  walletAddress: '0xB3bB9c6DB830A99eacBac9B969b1cFbf44ba4b9f',
  wethAmount: '500000000000000000', // 0.5 WETH
  slippage: '1' // 1% slippage
};

/**
 * Example 1: Swap WETH to USDC
 * Use case: Your contract gave you WETH, now you want USDC
 */
async function swapWethToUsdc() {
  console.log('📝 Example 1: Swapping WETH to USDC\n');
  
  try {
    const swapData = await getWethSwapTransaction(
      WETH_ADDRESS,
      USDC_ADDRESS,
      EXAMPLE_CONFIG.wethAmount,
      EXAMPLE_CONFIG.walletAddress,
      EXAMPLE_CONFIG.slippage
    );
    
    console.log('✅ Swap data generated successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Approve WETH spending (if needed)');
    console.log('   2. Execute the swap transaction');
    
    return swapData;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

/**
 * Example 2: Get approval transaction for WETH
 * This is needed before any WETH swap
 */
function getWethApprovalExample() {
  console.log('📝 Example 2: Getting WETH Approval Transaction\n');
  
  // 1inch Router V5 address
  const oneInchRouter = '0x111111125421cA6dc452d289314280a0f8842A65';
  
  const approvalTx = getWethApprovalData(oneInchRouter);
  
  console.log('🔐 WETH Approval Transaction:');
  console.log(`   To: ${approvalTx.to} (WETH Contract)`);
  console.log(`   Data: ${approvalTx.data}`);
  console.log(`   Value: ${approvalTx.value} ETH`);
  console.log(`   Gas Limit: ${approvalTx.gasLimit}`);
  
  console.log('\n📋 Steps to execute approval:');
  console.log('   1. Sign this transaction first');
  console.log('   2. Wait for confirmation');
  console.log('   3. Then execute your swap transaction');
  
  return approvalTx;
}

/**
 * Example 3: Complete workflow for WETH swap
 */
async function completeWethSwapWorkflow() {
  console.log('📝 Example 3: Complete WETH Swap Workflow\n');
  
  try {
    // Step 1: Get approval transaction
    console.log('Step 1: Preparing WETH approval...');
    const approvalTx = getWethApprovalExample();
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Step 2: Get swap transaction
    console.log('Step 2: Preparing WETH swap...');
    const swapTx = await swapWethToUsdc();
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    console.log('🎯 Summary:');
    console.log('   • Approval transaction prepared');
    console.log('   • Swap transaction prepared');
    console.log('   • Ready to execute both transactions');
    
    return { approvalTx, swapTx };
    
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
  }
}

/**
 * Run examples
 */
async function runExamples() {
  console.log('🚀 WETH Swap Examples\n');
  console.log('=' * 80 + '\n');
  
  // Run the complete workflow example
  await completeWethSwapWorkflow();
  
  console.log('\n✨ Examples completed!');
}

// Export for use in other files
module.exports = {
  swapWethToUsdc,
  getWethApprovalExample,
  completeWethSwapWorkflow
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
