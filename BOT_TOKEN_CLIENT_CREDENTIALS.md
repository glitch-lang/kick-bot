# Bot Token: Use App Access Token (Client Credentials Flow)

## 🎯 The Issue

According to Kick's documentation, there are **2 types of tokens**:

1. **App Access Token** - Client Credentials flow (server-to-server, no user login)
2. **User Access Token** - Authorization Grant flow (requires user login)

**For the bot account, we should use App Access Token (Client Credentials flow)!**

---

## ✅ App Access Token Flow (What We Need)

### Endpoint
```
POST https://id.kick.com/oauth/token
```

### Headers
```
Content-Type: application/x-www-form-urlencoded
```

### Body
```
grant_type=client_credentials
client_id=<your_client_id>
client_secret=<your_client_secret>
```

### Response
```json
{
  "access_token": "",
  "token_type": "",
  "expires_in": ""
}
```

**No user interaction required!** Just use Client ID and Secret.

---

## 🔄 Current Problem

We're trying to use the **User Access Token flow** (Authorization Grant) for the bot, which requires:
- User to log in
- OAuth redirect
- User authorization

But for a **bot account**, we should use **App Access Token** (Client Credentials), which:
- ✅ No user login needed
- ✅ Just Client ID + Secret
- ✅ Server-to-server
- ✅ Perfect for bots

---

## 📋 What We Need to Do

### Option 1: Use App Access Token for Bot (Recommended)
- Get bot token using Client Credentials flow
- No OAuth redirect needed
- Just Client ID + Secret

### Option 2: Keep User Access Token for Streamers
- Streamers still use Authorization Grant flow
- They authorize through OAuth
- Bot uses App Access Token separately

---

## 🔧 Implementation Needed

Add a function to get App Access Token:

```typescript
async getAppAccessToken(
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  
  const response = await axios.post('https://id.kick.com/oauth/token', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
}
```

Then use this for `BOT_ACCESS_TOKEN` instead of OAuth flow!

---

**The bot should use App Access Token (Client Credentials), not User Access Token (Authorization Grant)!**
