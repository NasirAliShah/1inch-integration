/**
 * Check supported protocols on Base network
 * This script helps identify which DEX protocols are available on Base
 */

require('dotenv').config();

const ONEINCH_API_BASE_URL = 'https://api.1inch.dev/swap/v6.0';
const BASE_CHAIN_ID = 8453;
const API_KEY = process.env.ONE_INCH_API_KEY;

/**
 * Get supported protocols on Base network
 */
async function getBaseProtocols() {
    try {
        if (!API_KEY) {
            console.log('⚠️ ONE_INCH_API_KEY not found in .env file');
            return null;
        }

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/protocols`;
        
        console.log('🔍 Fetching supported protocols on Base network...\n');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`API Error (${response.status}):`, JSON.stringify(errorData, null, 2));
            return null;
        }

        const data = await response.json();
        
        console.log('✅ Supported protocols on Base:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        if (data.protocols && Array.isArray(data.protocols)) {
            data.protocols.forEach((protocol, index) => {
                console.log(`${index + 1}. ${protocol.id} - ${protocol.title || protocol.name || 'No title'}`);
            });
            
            console.log('\n📋 Protocol IDs for API calls:');
            const protocolIds = data.protocols.map(p => p.id).join(',');
            console.log(protocolIds);
        } else {
            console.log('No protocols array found in response');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }
        
        return data;

    } catch (error) {
        console.error('❌ Error fetching Base protocols:', error.message);
        return null;
    }
}

/**
 * Test a simple quote without specifying protocols
 */
async function testSimpleQuote() {
    try {
        if (!API_KEY) {
            console.log('⚠️ Cannot test quote without API key');
            return;
        }

        const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
        const amount = '1000000000000000'; // 0.001 ETH

        const params = new URLSearchParams({
            src: ETH_ADDRESS,
            dst: USDC_BASE_ADDRESS,
            amount: amount
        });

        const url = `${ONEINCH_API_BASE_URL}/${BASE_CHAIN_ID}/quote?${params.toString()}`;
        
        console.log('\n🧪 Testing simple quote without protocols...');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Quote Error (${response.status}):`, JSON.stringify(errorData, null, 2));
        } else {
            const data = await response.json();
            console.log('✅ Quote successful!');
            console.log(`Expected output: ${data.toAmount} USDC units`);
            
            if (data.protocols) {
                console.log('\n🔀 Protocols used in this quote:');
                console.log(JSON.stringify(data.protocols, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Error testing quote:', error.message);
    }
}

async function main() {
    console.log('🌐 Base Network Protocol Check\n');
    
    // Check supported protocols
    await getBaseProtocols();
    
    // Test a simple quote
    await testSimpleQuote();
}

if (require.main === module) {
    main();
}
