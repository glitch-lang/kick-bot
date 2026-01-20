// Test webhook subscription
const axios = require('axios');

const RAILWAY_URL = 'https://web-production-56232.up.railway.app';
const BOT_TOKEN = '317457251|wdqQy3KrAlfQaBwdkolSTTITJQLIuUf8GTiHfx6Z';

async function testWebhook() {
  console.log('🧪 Testing webhook setup...\n');
  
  // Test 1: Check if server is reachable
  try {
    console.log('1️⃣ Testing server health...');
    const health = await axios.get(`${RAILWAY_URL}/health`);
    console.log('   ✅ Server is online:', health.data);
  } catch (error) {
    console.error('   ❌ Server health check failed:', error.message);
    return;
  }
  
  // Test 2: Check if webhook endpoint exists
  try {
    console.log('\n2️⃣ Testing webhook endpoint...');
    const webhook = await axios.post(`${RAILWAY_URL}/webhooks/kick`, {
      test: 'ping'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('   ✅ Webhook endpoint is accessible');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ Webhook endpoint exists (signature required)');
    } else {
      console.error('   ❌ Webhook test failed:', error.response?.status, error.response?.data);
    }
  }
  
  // Test 3: Try to list event subscriptions
  try {
    console.log('\n3️⃣ Testing Kick EventSub API...');
    const response = await axios.get('https://api.kick.com/public/v1/events/subscriptions', {
      headers: {
        'Authorization': `Bearer ${BOT_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    console.log('   ✅ EventSub API is accessible');
    console.log('   📋 Active subscriptions:', response.data);
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error('   ❌ EventSub API error:', status);
    console.error('   Error data:', JSON.stringify(data, null, 2));
    
    if (status === 404) {
      console.log('\n   ⚠️  ISSUE FOUND: Kick\'s EventSub API endpoint does not exist (404)');
      console.log('   💡 This means Kick has not implemented EventSub webhooks yet.');
      console.log('   💡 The bot can only use Pusher WebSocket (which is also not working).');
    } else if (status === 401) {
      console.log('\n   ⚠️  Token authentication issue');
    }
  }
  
  console.log('\n📊 Test complete!');
}

testWebhook().catch(console.error);
