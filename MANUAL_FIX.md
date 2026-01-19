# Manual Registration Fix

If the automatic user info retrieval is failing, you can manually complete registration:

## Option 1: Check Server Logs

The server terminal will show detailed information about:
- Which endpoints were tried
- What error codes were returned
- The token introspection response

**Look for lines like:**
- "Trying user info endpoint: ..."
- "User info error for ..."
- "Token introspection response: ..."

## Option 2: Test Token Manually

1. Get the access token from server logs (it will be logged)
2. Test it manually in browser console or Postman:

```javascript
// Replace YOUR_TOKEN with token from logs
fetch('https://kick.com/api/v1/user', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

## Option 3: Verify Scopes

Make sure in your Kick app settings:
1. Go to https://dev.kick.com
2. Find your app
3. Check that `user:read` scope is:
   - ✅ Enabled in app settings
   - ✅ Included in OAuth request (check server logs)
   - ✅ Granted by user during authorization

## Option 4: Check API Documentation

Kick's API might have changed. Check:
- https://docs.kick.com
- https://dev.kick.com for latest API docs
- Look for "Get Current User" or "User Info" endpoint

## What to Share

If you want help debugging, share from server logs:
1. Token introspection response (full JSON)
2. Error messages from each endpoint attempt
3. Status codes (401, 403, 404, etc.)
4. Any response data that was returned

This will help identify the correct endpoint or fix the issue.
