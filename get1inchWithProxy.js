const axios = require("axios");
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

/**
 * 1inch Price API with Proxy Support to bypass Cloudflare blocking
 */

const API_CONFIG = {
  baseUrl: "https://api.1inch.com/price/v1.1",
  chainId: 1,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    Authorization: `Bearer ${process.env.ONE_INCH_API_KEY }`,
  },
  timeout: 15000,
};

// Popular test tokens
const TEST_TOKENS = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC: "0xA0b86a33E6441c8C673f4c8e0b6b1B8c8b8f8b8c",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
};

/**
 * Create axios instance with proxy configuration
 * @param {string} proxyUrl - Proxy URL (e.g., 'http://proxy-server:port')
 * @returns {Object} Configured axios instance
 */
function createProxyAxios(proxyUrl = null) {
  const config = {
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
  };

  // Add proxy if provided
  if (proxyUrl) {
    console.log(`🔗 Using proxy: ${proxyUrl}`);
    config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    config.httpAgent = new HttpsProxyAgent(proxyUrl);
  }

  return axios.create(config);
}

/**
 * Get token price with multiple retry strategies
 * @param {string} tokenAddress - Token contract address
 * @param {string} currency - Currency (default: USD)
 * @param {string} proxyUrl - Optional proxy URL
 * @returns {Promise<Object>} Price data
 */
async function getTokenPriceWithProxy(tokenAddress, currency = "USD", proxyUrl = null) {
  const axiosInstance = createProxyAxios(proxyUrl);
  const url = `${API_CONFIG.baseUrl}/${API_CONFIG.chainId}/${tokenAddress}`;
  
  const requestConfig = {
    params: {
      currency: currency,
    },
    paramsSerializer: {
      indexes: null,
    },
  };

  try {
    console.log(`🔍 Fetching price for ${tokenAddress}${proxyUrl ? ' (via proxy)' : ''}`);
    const response = await axiosInstance.get(url, requestConfig);
    
    return {
      success: true,
      tokenAddress,
      data: response.data,
      method: proxyUrl ? 'proxy' : 'direct',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      tokenAddress,
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      },
      method: proxyUrl ? 'proxy' : 'direct',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Try multiple methods to fetch token prices
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<Object>} Best result from all methods
 */
async function fetchTokenPriceMultiMethod(tokenAddress) {
  console.log(`\n🎯 Testing multiple methods for token: ${tokenAddress}`);
  
  const methods = [
    // Method 1: Direct connection
    { name: 'Direct', proxy: null },
    
    // Method 2: Common free proxies (you can add your VPN proxy here)
    // { name: 'Proxy 1', proxy: 'http://your-proxy-server:port' },
    
    // Method 3: Different headers
    { name: 'Browser Headers', proxy: null, customHeaders: true },
  ];
  
  for (const method of methods) {
    try {
      let result;
      
      if (method.customHeaders) {
        // Try with different headers to mimic browser behavior
        const customAxios = axios.create({
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://1inch.io/',
            'Origin': 'https://1inch.io',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        const url = `${API_CONFIG.baseUrl}/${API_CONFIG.chainId}/${tokenAddress}`;
        const response = await customAxios.get(url, { params: { currency: 'USD' } });
        
        result = {
          success: true,
          tokenAddress,
          data: response.data,
          method: method.name,
          timestamp: new Date().toISOString(),
        };
      } else {
        result = await getTokenPriceWithProxy(tokenAddress, 'USD', method.proxy);
        result.method = method.name;
      }
      
      if (result.success) {
        console.log(`   ✅ ${method.name}: SUCCESS`);
        return result;
      } else {
        console.log(`   ❌ ${method.name}: ${result.error.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${method.name}: ${error.message}`);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return {
    success: false,
    tokenAddress,
    error: { message: 'All methods failed' },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Test all tokens with multiple methods
 */
async function testAllTokens() {
  console.log("🚀 Testing 1inch API with Cloudflare bypass methods");
  console.log("=".repeat(60));
  
  const results = [];
  const tokenEntries = Object.entries(TEST_TOKENS);
  
  for (let i = 0; i < tokenEntries.length; i++) {
    const [tokenName, tokenAddress] = tokenEntries[i];
    
    console.log(`\n[${i + 1}/${tokenEntries.length}] Processing ${tokenName}...`);
    
    const result = await fetchTokenPriceMultiMethod(tokenAddress);
    result.tokenName = tokenName;
    results.push(result);
    
    // Longer delay between tokens to avoid rate limiting
    if (i < tokenEntries.length - 1) {
      console.log("   ⏳ Waiting 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Display results
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL RESULTS");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log("\n🟢 SUCCESSFUL FETCHES:");
    successful.forEach(result => {
      const price = result.data?.[result.tokenAddress];
      console.log(`${result.tokenName.padEnd(6)} | $${price || 'N/A'} | Method: ${result.method}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n🔴 FAILED FETCHES:");
    failed.forEach(result => {
      console.log(`${result.tokenName.padEnd(6)} | ${result.error.message}`);
    });
  }
  
  return results;
}

/**
 * Instructions for setting up proxy
 */
function showProxyInstructions() {
  console.log("\n" + "=".repeat(60));
  console.log("🔧 PROXY SETUP INSTRUCTIONS");
  console.log("=".repeat(60));
  console.log(`
📋 To use your VPN proxy:

1. **Find your VPN proxy details:**
   - Check your VPN client settings
   - Look for HTTP/HTTPS proxy settings
   - Note the IP address and port

2. **Update the proxy configuration:**
   - Edit this file and add your proxy URL
   - Replace 'http://your-proxy-server:port' with actual values
   - Example: 'http://127.0.0.1:8080' or 'http://proxy.example.com:3128'

3. **Alternative: Use SOCKS proxy:**
   - Install: npm install socks-proxy-agent
   - Use SOCKS proxy format: 'socks5://127.0.0.1:1080'

4. **Environment variable method:**
   - Set HTTP_PROXY=http://your-proxy:port
   - Set HTTPS_PROXY=http://your-proxy:port
   - The script will automatically use these

5. **Test with curl first:**
   curl --proxy http://your-proxy:port https://api.1inch.com/price/v1.1/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2?currency=USD
`);
}

// Export functions
module.exports = {
  getTokenPriceWithProxy,
  fetchTokenPriceMultiMethod,
  testAllTokens,
  TEST_TOKENS,
};

// Run if executed directly
if (require.main === module) {
  // Check for proxy environment variables
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  if (httpProxy || httpsProxy) {
    console.log(`🔗 Detected proxy environment variables:`);
    if (httpProxy) console.log(`   HTTP_PROXY: ${httpProxy}`);
    if (httpsProxy) console.log(`   HTTPS_PROXY: ${httpsProxy}`);
  }
  
  testAllTokens()
    .then(() => {
      showProxyInstructions();
    })
    .catch(console.error);
}
