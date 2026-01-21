# Discord Activity Implementation Checklist

Use this checklist to implement and test Discord Activities for your Kick watch party bot.

## Prerequisites ✅

- [ ] Discord bot is working
- [ ] Watch parties work via `!kick watchparty`
- [ ] Node.js and npm installed
- [ ] Git repository set up

## Phase 1: Discord Developer Portal Setup (5 minutes)

### Step 1: Enable Activities
- [ ] Go to https://discord.com/developers/applications
- [ ] Select your application (same one as your bot)
- [ ] Click **Activities** in left sidebar
- [ ] Click **Enable Activities** button
- [ ] Copy your **Application ID** (save this!)

### Step 2: Configure URL Mappings

**For Local Testing:**
- [ ] In Activities section, add URL mapping:
  - Target: `/`
  - Prefix: `/`
  - URL: `http://localhost:3001`
- [ ] Save changes

**For Production (do this later):**
- [ ] Update URL mapping to Railway URL
- [ ] Format: `https://your-app-name.up.railway.app`

## Phase 2: Code Setup (3 minutes)

### Step 1: Environment Configuration
- [ ] Open `discord-bot/.env` file
- [ ] Add this line:
  ```env
  DISCORD_ACTIVITY_ID=YOUR_APPLICATION_ID_HERE
  ```
- [ ] Replace `YOUR_APPLICATION_ID_HERE` with the ID you copied
- [ ] Save file

### Step 2: Install Dependencies (if not done)
```bash
cd discord-bot
npm install
```
- [ ] Dependencies installed successfully

### Step 3: Build Project
```bash
npm run build
```
- [ ] Build completed without errors
- [ ] Check for any TypeScript errors

## Phase 3: Local Testing (10 minutes)

### Step 1: Start Bot
```bash
npm start
```
- [ ] Bot starts without errors
- [ ] Console shows: "Discord SDK ready!"
- [ ] Console shows: "Activity slash commands registered!"

### Step 2: Verify Slash Command Registration
- [ ] Open Discord
- [ ] Join your test server
- [ ] Type `/activity` in any channel
- [ ] Command appears in autocomplete
  - **Note:** May take up to 1 hour for global commands
  - **Tip:** Restart Discord client if not appearing

### Step 3: Test Activity Launch
- [ ] Join a voice channel in Discord
- [ ] Run command: `/activity realglitchdyeet`
  - Replace with any Kick streamer
- [ ] Bot replies with activity information
- [ ] Click the activity URL
- [ ] Activity opens (may need to approve localhost in browser)

### Step 4: Verify Activity Functionality
Inside the activity:
- [ ] Kick stream loads and plays
- [ ] Your Discord username appears automatically
- [ ] Chat messages work
- [ ] Viewer count updates
- [ ] Kick chat tab loads

### Step 5: Test with Multiple Users
- [ ] Have friend join same voice channel
- [ ] Friend runs same `/activity` command
- [ ] Both see each other in viewer count
- [ ] Chat messages sync between users
- [ ] Points tracking works for both

## Phase 4: Production Deployment (15 minutes)

### Step 1: Update Discord Developer Portal
- [ ] Go back to Activities section
- [ ] Update URL mapping to Railway URL:
  ```
  https://your-app-name.up.railway.app
  ```
- [ ] Save changes

### Step 2: Set Railway Environment Variables
- [ ] Go to Railway dashboard
- [ ] Select your Discord bot project
- [ ] Go to **Variables** tab
- [ ] Add variable:
  ```
  DISCORD_ACTIVITY_ID=your_application_id
  ```
- [ ] Verify `PUBLIC_URL` is set to Railway URL
- [ ] Save variables

### Step 3: Deploy to Railway
```bash
git add .
git commit -m "Add Discord Activity support"
git push
```
- [ ] Code pushed to git
- [ ] Railway detects changes
- [ ] Railway builds project
- [ ] Railway deploys successfully
- [ ] Check Railway logs for errors

### Step 4: Verify Production Deployment
- [ ] Check Railway logs:
  - [ ] "Discord bot logged in"
  - [ ] "Activity slash commands registered"
  - [ ] No errors in logs
- [ ] Bot is online in Discord

### Step 5: Test in Production
- [ ] Join voice channel
- [ ] Run `/activity <streamer>`
- [ ] Activity opens in Discord
- [ ] Everything works as in local testing

## Phase 5: User Testing (20 minutes)

### Test Scenarios

**Scenario 1: Basic Activity**
- [ ] User joins voice channel
- [ ] User runs `/activity realglitchdyeet`
- [ ] Activity opens inside Discord
- [ ] Stream plays correctly
- [ ] Chat works

**Scenario 2: Relay Mode**
- [ ] Run `/activity bbjess relay:true`
- [ ] Send message in activity chat
- [ ] Verify message appears in Kick chat
- [ ] Check for `[Watch Party]` prefix

**Scenario 3: Two-way Chat**
- [ ] Activity has two-way chat enabled
- [ ] Send message in Kick chat
- [ ] Verify message appears in activity
- [ ] Messages show correct username/color

**Scenario 4: Multiple Viewers**
- [ ] 3+ users join same activity
- [ ] All see each other in viewer count
- [ ] Chat syncs across all users
- [ ] Points tracked for everyone

**Scenario 5: Mobile Test**
- [ ] Open Discord on mobile
- [ ] Join voice channel
- [ ] Launch activity
- [ ] Verify works on mobile

## Phase 6: Troubleshooting Common Issues

### Issue: Slash command not appearing
- [ ] Wait 1 hour (global commands propagate slowly)
- [ ] Restart Discord client
- [ ] Check bot is online in Discord
- [ ] Verify slash commands registered in logs

### Issue: Activity shows blank screen
- [ ] Check browser console for errors
- [ ] Verify URL mapping is correct
- [ ] Check PUBLIC_URL environment variable
- [ ] Test URL directly in browser

### Issue: Cannot create invite
- [ ] Verify bot has CREATE_INSTANT_INVITE permission
- [ ] Check DISCORD_ACTIVITY_ID is correct
- [ ] Ensure Activities enabled in portal
- [ ] Try different voice channel

### Issue: Discord SDK not initializing
- [ ] Check DISCORD_CLIENT_ID is accessible
- [ ] Verify Activity URL has correct parent domain
- [ ] Check browser console for SDK errors
- [ ] Ensure running inside Discord (not external browser)

### Issue: Build errors
- [ ] Run `npm install` again
- [ ] Check all dependencies installed
- [ ] Verify TypeScript version
- [ ] Check for syntax errors in modified files

## Phase 7: Documentation & Communication

### Internal Documentation
- [ ] Document Activity commands for team
- [ ] Create user guide for Discord members
- [ ] Document any custom configurations
- [ ] Note known issues/limitations

### User Communication
- [ ] Announce new feature in Discord
- [ ] Share `/activity` command
- [ ] Provide example usage
- [ ] Gather user feedback

### Example Announcement:
```
🎉 **NEW FEATURE: Discord Activities!**

Watch Kick streams together without leaving Discord!

**How to use:**
1. Join a voice channel
2. Run `/activity <streamer>` (e.g., `/activity bbjess`)
3. Click "Start Activity"
4. Watch together inside Discord!

**Benefits:**
✅ No external browser needed
✅ Auto-filled username
✅ Synchronized viewing
✅ Points tracking
✅ Two-way chat

Try it now! 🎬
```

## Phase 8: Monitoring & Maintenance

### Daily Monitoring (First Week)
- [ ] Check Railway logs daily
- [ ] Monitor for errors
- [ ] Track usage metrics
- [ ] Gather user feedback

### Weekly Tasks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Update documentation as needed
- [ ] Plan improvements based on feedback

### Monthly Tasks
- [ ] Review Discord SDK updates
- [ ] Update dependencies
- [ ] Optimize performance
- [ ] Add requested features

## Success Metrics

You'll know it's working when:
- ✅ Users can launch activities from voice channels
- ✅ Activities load inside Discord without errors
- ✅ Usernames auto-fill from Discord
- ✅ Multiple users can join same activity
- ✅ Chat syncs in real-time
- ✅ Points tracking works
- ✅ No errors in Railway logs

## Optional Enhancements (Future)

- [ ] Custom Activity artwork
- [ ] Rich Presence integration
- [ ] Voice channel member sync
- [ ] In-Activity polls
- [ ] Multi-stream viewing
- [ ] Picture-in-picture mode
- [ ] Custom emotes/reactions

## Final Checks

Before marking complete:
- [ ] All checklist items above completed
- [ ] Tested with multiple users
- [ ] Tested on mobile
- [ ] No errors in production logs
- [ ] Users can successfully use `/activity`
- [ ] Documentation updated
- [ ] Team trained on new feature

---

## Quick Reference

**Start bot locally:**
```bash
cd discord-bot
npm start
```

**Deploy to Railway:**
```bash
git add .
git commit -m "Update"
git push
```

**Test command:**
```
/activity realglitchdyeet
```

**Check logs:**
- Local: Terminal output
- Railway: Railway dashboard → Logs

**Documentation:**
- Quick Start: `QUICK_START_ACTIVITY.md`
- Detailed Setup: `DISCORD_ACTIVITY_SETUP.md`
- Technical Docs: `README_ACTIVITIES.md`

---

**Status:** [ ] Not Started | [ ] In Progress | [ ] Testing | [ ] Complete

**Completion Date:** ____________

**Notes:**
_________________________________________
_________________________________________
_________________________________________
