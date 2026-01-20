// Script to verify bot token scopes
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_ACCESS_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_ACCESS_TOKEN not set in .env');
  process.exit(1);
}

console.log('🔍 Verifying bot token scopes...');
console.log('Token (first 20 chars):', BOT_TOKEN.substring(0, 20) + '...\n');

// Try token introspection
async function verifyToken() {
  try {
    // Try introspection endpoint
    const introspectResponse = await axios.post(
      'https://id.kick.com/oauth/token/introspect',
      null,
      {
        headers: {
          'Authorization': `Bearer ${BOT_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log('✅ Token introspection successful!');
    console.log('Response:', JSON.stringify(introspectResponse.data, null, 2));
    
    if (introspectResponse.data.scope) {
      const scopes = introspectResponse.data.scope.split(' ');
      console.log('\n📋 Granted Scopes:');
      scopes.forEach(scope => {
        const required = ['chat:write', 'user:read', 'channel:read', 'events:subscribe'].includes(scope);
        console.log(`  ${required ? '✅' : '  '} ${scope}`);
      });
      
      const requiredScopes = ['chat:write', 'user:read', 'channel:read', 'events:subscribe'];
      const missing = requiredScopes.filter(s => !scopes.includes(s));
      
      if (missing.length > 0) {
        console.log('\n❌ Missing Required Scopes:');
        missing.forEach(scope => console.log(`  - ${scope}`));
        console.log('\n⚠️  You need to get a new token with these scopes!');
      } else {
        console.log('\n✅ All required scopes are present!');
      }
    }
  } catch (error) {
    console.error('❌ Token introspection failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    // Try to test sending a message instead
    console.log('\n🔍 Trying to test chat message endpoint...');
    try {
      const testResponse = await axios.post(
        'https://kick.com/api/v2/chat',
        {
          content: 'Test message',
          type: 'message',
        },
        {
          headers: {
            'Authorization': `Bearer ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('✅ Chat message test successful!');
    } catch (chatError) {
      console.error('❌ Chat message test failed:');
      if (chatError.response) {
        console.error('Status:', chatError.response.status);
        console.error('Data:', JSON.stringify(chatError.response.data, null, 2));
        if (chatError.response.status === 401 || chatError.response.status === 403) {
          console.error('\n⚠️  Token may be missing chat:write scope or is invalid!');
        }
      }
    }
  }
}

verifyToken();
