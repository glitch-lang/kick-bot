# Railway Health Check Configuration

## ✅ Current Status

Your server is starting successfully! The logs show:
- ✅ Server running on http://0.0.0.0:8080
- ✅ Database initialized
- ✅ Bot started
- ✅ Health check available at /health

## 🔍 Why Railway Sends SIGTERM

Railway sends SIGTERM when:
1. **Health check fails** - Railway can't reach /health
2. **Deployment restart** - Railway is redeploying
3. **Resource limits** - Memory/CPU limits exceeded
4. **Normal shutdown** - Railway is stopping the service

## ✅ Health Check Endpoints

Your app has these health check endpoints:
- `/health` - Simple "OK" response (Railway default)
- `/api/health` - Detailed health info

Both respond immediately (no async operations).

## 🔧 Railway Settings to Check

### 1. Health Check Path
Railway Dashboard → Your Service → Settings → Health Check

**Should be set to:**
- Path: `/health`
- Port: `8080` (or your PORT env var)
- Interval: `30s` (default)

### 2. Restart Policy
Railway Dashboard → Your Service → Settings → Restart Policy

**Should be:**
- `ON_FAILURE` (restart on crash)
- Or `ALWAYS` (always restart)

### 3. Resource Limits
Railway Dashboard → Your Service → Settings → Resources

**Check:**
- Memory limit (should be at least 512MB)
- CPU limit

## 🆘 If SIGTERM Keeps Happening

### Option 1: Check Railway Logs
Look for errors before SIGTERM:
- Memory errors
- Timeout errors
- Health check failures

### Option 2: Test Health Endpoint
Visit: `https://web-production-56232.up.railway.app/health`

Should return: `OK`

### Option 3: Check Railway Metrics
Railway Dashboard → Metrics
- Check CPU usage
- Check memory usage
- Check if hitting limits

## ✅ Current Fix

The code now:
- ✅ Handles SIGTERM gracefully (5 second grace period)
- ✅ Health checks respond immediately
- ✅ Server starts before database/bot initialization
- ✅ All errors are non-fatal

**The server should stay running now!**

---

**If Railway still stops it, check Railway Settings → Health Check configuration!**
