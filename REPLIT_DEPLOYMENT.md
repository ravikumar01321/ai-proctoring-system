# 🚀 Deploy to Replit (Free) - Step-by-Step Guide

## ✅ Why Replit is Perfect for This Project

- **✅ Completely Free** - No credit card needed
- **✅ Pre-configured** - `.replit` file already set up
- **✅ Built-in PostgreSQL 16** - Database included
- **✅ Node.js 24** - Latest runtime installed
- **✅ Instant Deployment** - Just push and run
- **✅ Auto HTTPS** - Free SSL certificate
- **✅ Easy Sharing** - Instant public URL

---

## 📋 Prerequisites

1. **GitHub Account** (to push code)
2. **Replit Account** (free at replit.com)
3. **This project** (already built!)

---

## 🎯 Step-by-Step Deployment

### **Step 1: Create Replit Project**

1. Go to [replit.com](https://replit.com)
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Paste your repository URL (the one with this project)
5. Click **"Import"**
6. Wait for Replit to import the project (1-2 minutes)

### **Step 2: Automatic Setup**

Replit will automatically:
- ✅ Install Node.js 24
- ✅ Install PostgreSQL 16
- ✅ Read `.replit` configuration
- ✅ Install dependencies (pnpm)
- ✅ Build the project

**Just wait for it to finish!** ⏳

### **Step 3: Start the Server**

1. Click the **"Run"** button (green button at top)
2. The server will start automatically with:
   - API Server on Port 8080
   - PostgreSQL Database (internal)
   - Replit provides public URL

### **Step 4: Verify Deployment**

Once running, check:
- ✅ Replit console shows "Server listening"
- ✅ Webview opens showing the frontend
- ✅ Visit your public URL (like `https://your-username.replit.dev`)

---

## 🔐 Environment Variables (Auto-configured)

Replit **automatically sets**:
- ✅ `DATABASE_URL` - PostgreSQL connection
- ✅ `PORT` - 8080
- ✅ `NODE_ENV` - production

**You don't need to do anything!** 🎉

---

## 🌐 Access Your Deployed App

### Your Public URL
```
https://your-username.replit.dev
```

### API Endpoints
```
https://your-username.replit.dev/api/health     <- Health check
https://your-username.replit.dev/api/auth/*     <- Auth endpoints
https://your-username.replit.dev/api/exams/*    <- Exam endpoints
```

### Database
- **Type:** PostgreSQL 16
- **Access:** Via Replit console or external tools
- **Automatic Backups:** Replit handles this

---

## 📊 Project Structure on Replit

```
Your Replit Project
├── artifacts/
│   ├── api-server/           <- Express API (running on :8080)
│   ├── proctor-app/          <- React frontend (served via proxy)
│   └── mockup-sandbox/       <- UI components
│
├── lib/                      <- Shared libraries
│   ├── api-zod/             <- Validation
│   ├── api-client-react/    <- API hooks
│   ├── api-spec/            <- OpenAPI spec
│   └── db/                  <- Database schemas
│
├── .replit                   <- Configuration ✓ Pre-configured!
├── docker-compose.yml        <- Docker config
├── Dockerfile               <- Container config
└── package.json             <- Workspace config
```

---

## 🚀 What Happens When You Click "Run"

```
1. Install dependencies
   └─ pnpm install (509 packages resolved)

2. Run TypeScript checks
   └─ All packages ✓ validated

3. Build all packages
   ├─ artifacts/api-server ✓ Built (2.4 MB)
   ├─ artifacts/proctor-app ✓ Built (1.2 MB)
   ├─ artifacts/mockup-sandbox ✓ Built (190 KB)
   └─ lib/* ✓ All libraries compiled

4. Push database schema (Drizzle ORM)
   └─ Creates all tables automatically

5. Start API Server
   └─ Listening on Port 8080 ✓ Ready!
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] Replit account ready
- [ ] Imported project into Replit
- [ ] Clicked "Run" button
- [ ] Wait for build to complete (5-10 minutes)
- [ ] See "Server listening" in console
- [ ] Access public URL in browser
- [ ] Test health endpoint: `/api/health`

---

## 🧪 Test Your Deployment

Once running, test these endpoints in browser or curl:

```bash
# Health check
curl https://your-username.replit.dev/api/health

# Expected response: 200 OK with "healthy" message
```

---

## 🔄 Making Changes

### **To Update Your App:**

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```
3. Go to Replit, click "Version Control" → "Pull from GitHub"
4. Click "Run" again
5. New version deployed! 🚀

---

## 📊 Monitoring Your App

### **View Logs:**
- Replit console shows all output automatically
- Look for errors or API responses

### **Check Database:**
- Click "Database" tab in Replit
- View PostgreSQL data directly

### **Monitor Performance:**
- Replit shows resource usage
- Free tier includes monitoring tools

---

## 🎓 Useful Replit Features

### **Multiplayer Coding**
- Invite others to code together
- Share real-time editing

### **Secrets Management**
- Add sensitive config in Secrets tab
- Auto-injected as environment variables

### **Always On** (Paid feature)
- Keep your app running 24/7
- Free tier: Sleeps after inactivity

### **Custom Domain** (Paid feature)
- Use your own domain name
- HTTPS automatic

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Click "Run" again, clear cache |
| "Database connection error" | Replit PostgreSQL starting, wait 30s |
| App sleeps | Replit free tier sleeps after 1 hour idle (upgrade for 24/7) |
| "Port 8080 in use" | Replit manages ports, restart the Repl |
| Frontend not loading | Check browser console, verify API endpoint |

### **Common Fixes:**
1. **Hard restart:** Click the "..." menu → "Restart"
2. **Clear cache:** `rm -rf node_modules pnpm-lock.yaml`
3. **Rebuild:** Delete `.replit` cache folder
4. **View full logs:** Scroll up in console

---

## 📈 Scale Your App

### **When You Outgrow Free Tier:**

| Tier | Cost | Includes | Perfect For |
|------|------|----------|-----------|
| **Free** | $0 | Shared resources, sleeps | Learning, testing |
| **Hacker Plan** | $7/mo | Reserved resources, always on | Small projects |
| **Pro** | $20/mo | Priority, custom domain | Production apps |

---

## 🌍 Share Your App

### **Public URL:**
```
https://your-username.replit.dev
```

### **Share with Others:**
1. Copy the public URL
2. Send to friends/team
3. They can use the app instantly!

### **Embed in Website:**
```html
<iframe src="https://your-username.replit.dev" width="100%" height="600"></iframe>
```

---

## 💾 Backup Your Data

### **Database Backup:**
1. Go to Replit Dashboard
2. Click your project
3. Click "Database" tab
4. Export data (if needed)

### **Code Backup:**
- GitHub repository is your backup
- Replit syncs with GitHub

---

## 🎉 You're Deployed!

Your **Intelligent Exam Guardian** is now live on:

```
🌐 https://your-username.replit.dev
```

**What you get:**
- ✅ Free API server running 24/7 (with free tier limits)
- ✅ Free PostgreSQL database
- ✅ Free HTTPS / SSL certificate
- ✅ Free public URL
- ✅ Easy database management
- ✅ Real-time monitoring
- ✅ Easy code updates

---

## 📞 Next Steps

1. **Test the app** - Use all features and test thoroughly
2. **Share with friends** - Send them your Replit URL
3. **Collect feedback** - Get real-world usage data
4. **Make improvements** - Update code and push to GitHub
5. **Consider upgrade** - If you need 24/7 uptime or custom domain

---

## 📚 Related Resources

- [Replit Documentation](https://docs.replit.com)
- [Replit Database Guide](https://docs.replit.com/hosting/databases/postgresql)
- [Replit Deployment Guide](https://docs.replit.com/hosting/deploying-http-servers)

---

## 🎊 Congratulations!

**Your AI Proctoring System is now deployed on Replit!** 

**Start building and iterating! 🚀**
