const axios = require("axios");
require('dotenv').config();

// RDX Token on Ethereum
const RDX_TOKEN = "0x8CEDb0680531d26e62ABdBd0F4c5428b7fDC26d5";

// Get RDX token price
async function getRDXPrice() {
  try {
    const url = `https://api.1inch.com/price/v1.1/1/${RDX_TOKEN}`;
    
    const config = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
      },
      params: {
        currency: "USD",
      },
      paramsSerializer: {
        indexes: null,
      },
      timeout: 10000,
    };
    
    const response = await axios.get(url, config);
    const price = response.data[RDX_TOKEN.toLowerCase()];
    console.log(`💰 RDX Price: $${price}`);
    return price;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

// Run it
if (require.main === module) {
  getRDXPrice();
}

module.exports = { getRDXPrice, RDX_TOKEN };
