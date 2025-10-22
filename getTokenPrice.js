// Node.js v18+ has native fetch support
// No additional dependencies required
require('dotenv').config();

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'X-API-Key': process.env.MORALIS_API_KEY
  },
};

fetch('https://deep-index.moralis.io/api/v2.2/erc20/0xf222b0e892f419c35e61892cddf0a8ec190c4b9d/price?chain=eth', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));