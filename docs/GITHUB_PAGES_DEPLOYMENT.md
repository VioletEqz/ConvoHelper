# 🚀 GitHub Pages Deployment Guide

Complete guide for deploying ConvoHelper to GitHub Pages.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Git installed on your system
- ✅ GitHub account created
- ✅ Basic familiarity with command line

---

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in details:
   - **Repository name**: `convo-helper` (or your preferred name)
   - **Description**: "Conversation Analytics Tool - Standalone Edition"
   - **Visibility**: **Public** (required for free GitHub Pages)
   - ❌ **Do NOT** check "Initialize with README"
3. Click **"Create repository"**

### Step 2: Push Your Code

Open terminal in your project directory and run:

```bash
# Navigate to project directory
cd /home/misa/Workshop/ConvoHelper/standalone

# Initialize git (if not already done)
git init

# Create .gitignore file
cat > .gitignore << EOF
node_modules/
.DS_Store
*.log
.vscode/
EOF

# Stage all files
git add .

# Make initial commit
git commit -m "Initial commit: ConvoHelper Standalone Edition with smart identity selection and heatmaps"

# Add remote (REPLACE YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/convo-helper.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/convo-helper`
2. Click **"Settings"** tab (top right)
3. In left sidebar, click **"Pages"**
4. Under **"Source"**:
   - Branch: Select `main`
   - Folder: Select `/ (root)`
5. Click **"Save"**

### Step 4: Access Your Live Site

- Wait 2-3 minutes for GitHub to build your site
- Your site will be live at: `https://YOUR_USERNAME.github.io/convo-helper/`
- GitHub will show a green success message with the URL

---

## 🔄 Updating Your Site

After making changes to your code:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add new feature: XYZ"

# Push to GitHub
git push

# GitHub Pages will automatically rebuild (2-3 minutes)
```

---

## 🛠️ Troubleshooting

### Problem: Site shows 404 error

**Solutions:**
1. Verify `index.html` is in the root directory (not in a subfolder)
2. Check GitHub Pages is enabled in Settings → Pages
3. Wait 5 minutes after enabling (initial build takes longer)
4. Check the Actions tab for build status

### Problem: JavaScript not working

**Solutions:**
1. Open browser developer console (F12) to check for errors
2. Verify all script paths are correct in `index.html`
3. Ensure all files are committed: `git status`
4. Check that file paths use forward slashes: `js/app.js` not `js\app.js`

### Problem: Resources not loading (CSS, JS, images)

**Solutions:**
1. Use relative paths (no absolute paths like `/home/...`)
2. Verify file structure matches your HTML references
3. Check file names are case-sensitive on GitHub Pages
4. Ensure all files are pushed to GitHub: `git push`

### Problem: Changes not appearing

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Wait 5 minutes for GitHub Pages to rebuild
3. Check Actions tab for deployment status
4. Verify commit was pushed: `git log origin/main`

---

## 🎨 Custom Domain (Optional)

If you want to use your own domain (e.g., `convohelper.com`):

### 1. Purchase Domain

Buy from any registrar:
- Namecheap (recommended)
- GoDaddy
- Google Domains
- Cloudflare

### 2. Configure GitHub Pages

1. In GitHub repository → Settings → Pages
2. Under "Custom domain", enter: `convohelper.com`
3. Click "Save"
4. Check "Enforce HTTPS" (after DNS propagates)

### 3. Configure DNS Records

In your domain registrar's DNS settings, add:

#### For Apex Domain (convohelper.com):
```
Type: A
Host: @
Value: 185.199.108.153

Type: A
Host: @
Value: 185.199.109.153

Type: A
Host: @
Value: 185.199.110.153

Type: A
Host: @
Value: 185.199.111.153
```

#### For WWW Subdomain (www.convohelper.com):
```
Type: CNAME
Host: www
Value: YOUR_USERNAME.github.io
```

### 4. Wait for DNS Propagation

- DNS changes take 1-48 hours (usually < 1 hour)
- Check status: https://www.whatsmydns.net/

---

## 🔐 Security Best Practices

### 1. Enable HTTPS

- GitHub Pages provides free HTTPS automatically
- Always check "Enforce HTTPS" in Pages settings

### 2. Protect Sensitive Data

- ❌ Never commit sensitive data (API keys, passwords, personal info)
- ✅ Use `.gitignore` for sensitive files
- ✅ Keep example data generic

### 3. Review Before Publishing

```bash
# Check what will be committed
git status

# Review changes
git diff

# If you accidentally committed sensitive data:
git reset --soft HEAD~1  # Undo last commit (keeps changes)
```

---

## 📊 Monitoring Your Site

### Check Deployment Status

1. Go to repository → **Actions** tab
2. See deployment history and build logs
3. Green checkmark = successful deployment
4. Red X = failed deployment (click for details)

### View Traffic

1. Go to repository → **Insights** tab
2. Click **Traffic** in left sidebar
3. See visitor counts, referring sites, popular content

---

## 🚀 Performance Tips

### 1. Optimize for GitHub Pages

Your standalone edition is already optimized:
- ✅ No build process required
- ✅ All assets are static files
- ✅ Libraries loaded from local files

### 2. File Size Considerations

GitHub Pages limits:
- Maximum file size: 100 MB
- Maximum repository size: 1 GB (soft limit)
- Maximum sites: Unlimited

### 3. Caching

GitHub Pages automatically caches:
- HTML files: 10 minutes
- CSS/JS files: 1 hour
- Other assets: 1 hour

To force users to get new version:
- Clear cache or use hard refresh
- Or version your files (e.g., `app.v2.js`)

---

## 📝 Git Commands Reference

### Essential Commands

```bash
# Check status
git status

# View history
git log --oneline

# Create branch
git checkout -b feature-name

# Switch branches
git checkout main

# Merge branch
git merge feature-name

# Delete branch
git branch -d feature-name

# Undo changes (not committed)
git checkout -- filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View remote
git remote -v

# Pull latest changes
git pull

# Push changes
git push
```

---

## 🎓 Next Steps

After deployment:

1. ✅ Test your live site thoroughly
2. ✅ Share the URL with others
3. ✅ Add README.md with project description
4. ✅ Create GitHub releases for versions
5. ✅ Set up issue tracking for feedback
6. ✅ Add CONTRIBUTING.md if open source

---

## 💡 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Documentation](https://git-scm.com/doc)
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## ❓ FAQ

**Q: Can I use a private repository?**
A: Yes, but requires GitHub Pro, Team, or Enterprise. Free accounts can only use public repos for GitHub Pages.

**Q: Can I password protect my site?**
A: GitHub Pages doesn't support authentication. Consider using Vercel or Netlify for password protection.

**Q: Can I use server-side code?**
A: No, GitHub Pages only serves static files. Your standalone edition works perfectly as it's pure HTML/CSS/JS.

**Q: How do I delete my GitHub Pages site?**
A: Settings → Pages → Source → Select "None" → Save

**Q: Can I have multiple GitHub Pages sites?**
A: Yes! Each repository can have its own GitHub Pages site.

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Search [GitHub Community Forum](https://github.community/)
3. Check [GitHub Status](https://www.githubstatus.com/)
4. Review repository Actions tab for deployment logs

---

**Good luck with your deployment! 🎉**
