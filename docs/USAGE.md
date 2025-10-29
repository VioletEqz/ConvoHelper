# 📖 ConvoHelper Usage Guide

A comprehensive guide to using ConvoHelper Standalone Edition.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Data](#uploading-data)
3. [Processing Conversations](#processing-conversations)
4. [Understanding Statistics](#understanding-statistics)
5. [Individual Analysis](#individual-analysis)
6. [Exporting Data](#exporting-data)
7. [Tips & Tricks](#tips--tricks)

---

## 🚀 Getting Started

### Opening the Application

**Option 1: Direct Open**
```bash
# Simply double-click index.html
# Or right-click → Open With → Browser
```

**Option 2: Local Server (Recommended)**
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Then visit: http://localhost:8080
```

### First Launch

When you first open ConvoHelper, you'll see:
- A clean, gradient-themed interface
- A large upload area in the center
- Instructions for uploading your data

---

## 📁 Uploading Data

### Method 1: Drag & Drop

1. Locate your conversation JSON file
2. Drag it over the upload area
3. The area will highlight when ready
4. Drop the file
5. Wait for validation message

### Method 2: File Picker

1. Click the **"Choose File"** button
2. Navigate to your JSON file
3. Select it and click Open
4. Wait for validation message

### Validation

After upload, you'll see:
```
✅ your_file.json uploaded (2.4 MB)
📊 Found 5 conversations, 31,140 messages
```

If there's an error:
```
❌ Invalid file format. Please check DATA_FORMAT.md
```

### Supported Files

- **Format**: JSON only
- **Size**: Up to 50MB recommended
- **Structure**: Must match the expected format (see DATA_FORMAT.md)

---

## ⚙️ Processing Conversations

### Starting Processing

1. After successful upload, click **"Process Data"**
2. You'll see a progress indicator:
   ```
   Progress: ████████████░░░░░ 75%
   
   📝 Parsing messages...
   🔄 Clustering by weeks...
   📅 Grouping into months...
   📊 Generating statistics...
   ```

### Processing Steps

The application performs these steps automatically:

1. **Parse JSON**: Read and validate the data structure
2. **Extract Messages**: Pull all messages from all conversations
3. **Cluster by Weeks**: Group messages into ISO weeks
4. **Group by Months**: Organize weeks into months
5. **Calculate Statistics**: Generate all metrics
6. **Prepare Charts**: Set up visualization data

### Processing Time

- **Small files** (<5MB): 1-2 seconds
- **Medium files** (5-20MB): 5-10 seconds
- **Large files** (20-50MB): 30-60 seconds

---

## 📊 Understanding Statistics

### Overview Page

After processing, you'll land on the **Overview Statistics** page.

#### Top Section
```
📊 Overview Statistics

💬 Total Messages: 31,140
👥 Total Conversations: 5
📅 Date Range: Jan 1 - Oct 29, 2025
```

#### Messages Over Time Chart
- **Type**: Line chart
- **Shows**: Daily or weekly message trends
- **Purpose**: Visualize conversation activity over time
- **Interaction**: Hover to see exact values

#### Top Conversations
```
🏆 Top Conversations (Click to view details):

👤 tuyt.nhy_       31,140 msgs  ████████
👤 iam_quiin_       5,428 msgs  █
👤 hailuu0166       1,135 msgs  ▌
```

**Two ways to explore**:
1. Click any name → Goes to individual page
2. Use dropdown at top → Select person

#### Message Distribution Chart
- **Type**: Pie chart
- **Shows**: Percentage breakdown by person
- **Colors**: Each person gets a unique color

---

## 👤 Individual Analysis

### Navigating to Individual Page

**Method 1**: Click a name in the Top 10 list
**Method 2**: Use the dropdown selector at the top

### Individual Statistics Display

```
👤 tuyt.nhy_

📊 Quick Stats:
• Total Messages: 31,140 💬
• Percentage: 78.5% of all messages
• Avg per Day: 85.3 messages
• Most Active: October 2025 🔥
• First Message: Jan 1, 2025
• Latest Message: Oct 29, 2025
```

### Charts Available

#### 1. Messages by Month
- **Type**: Bar chart
- **Shows**: Monthly message count
- **Colors**: Gradient from purple to pink
- **Use**: Identify most active months

#### 2. Activity by Hour
- **Type**: Heatmap/Bar chart
- **Shows**: Messages sent each hour (0-23)
- **Use**: See when you're most active

#### 3. Timeline View
```
📅 Timeline (Click to preview):

📦 October 2025 (12,450 msgs) [▼]
   └─ 📅 Week 42 (Oct 16-22) 350 msgs
   └─ 📅 Week 43 (Oct 23-29) 412 msgs
   └─ 📅 Week 44 (Oct 30-Nov 5) 298 msgs

📦 November 2025 (8,920 msgs) [▶]
```

- Click month to expand/collapse
- Shows hierarchical week structure
- Displays message counts

### Switching Between People

Use the dropdown at the top:
```
[← Overview] View: [tuyt.nhy_ ▼]
                    ├─ tuyt.nhy_
                    ├─ iam_quiin_
                    ├─ hailuu0166
                    └─ ...
```

---

## 💾 Exporting Data

### Starting Export

From the Individual page, click:
```
[💾 Export This Conversation]
```

### Export Page Interface

```
💾 Export: tuyt.nhy_

Select what to export:

📅 By Month (click to expand weeks):
☑ 📦 October 2025 (1,060 msgs) [▼]
   ☑ Week 42 (Oct 16-22) - 350 msgs
   ☑ Week 43 (Oct 23-29) - 412 msgs
   ☐ Week 44 (Oct 30-Nov 5) - 298 msgs
```

### Selection Methods

**1. Select Entire Month**
- Check the month checkbox
- Automatically selects all weeks in that month

**2. Select Individual Weeks**
- Expand month by clicking [▼]
- Check/uncheck specific weeks

**3. Mix and Match**
- Select weeks from different months
- Create custom date ranges

### Export Options

```
Export Options:
• Format: ● Markdown  ○ HTML
• Files:  ● Separate  ○ Combined
```

- **Format**: Currently Markdown (HTML coming soon)
- **Files**: 
  - **Separate**: One file per week
  - **Combined**: All in one file

### Export Summary

```
📊 Selection Summary:
• 2 weeks selected
• 762 total messages
• Will create 2 files
```

### Downloading

**Single File**:
- Click **"Download"**
- File downloads immediately
- Named: `person-2025-W42.md`

**Multiple Files**:
- Click **"Download ZIP"**
- All files packaged into ZIP
- Named: `person-export-2025-10-29.zip`

### Preview

Click **"Preview Markdown"** to see:
- How the export will look
- Message formatting
- Date/time stamps
- Before downloading

---

## 💡 Tips & Tricks

### Performance

1. **Large Files**: Close other browser tabs to free memory
2. **Processing**: Don't switch tabs during processing
3. **Exports**: Export smaller chunks for faster processing

### Navigation

1. **Breadcrumbs**: Use back arrows to navigate
2. **Keyboard**: Arrow keys to navigate charts
3. **Scroll**: Smooth scroll to sections

### Data Management

1. **Backup**: Keep original JSON file safe
2. **Multiple Files**: Process different time periods separately
3. **Organization**: Export by month for better organization

### Viewing Exports

1. **Markdown Viewers**: Use VS Code, Typora, or any Markdown editor
2. **GitHub**: Upload to GitHub for pretty rendering
3. **Convert**: Use Pandoc to convert to PDF/HTML

### Troubleshooting

**Problem**: Charts not showing
**Solution**: Refresh page, check browser console

**Problem**: Export fails
**Solution**: Try exporting fewer weeks at once

**Problem**: File won't upload
**Solution**: Validate JSON format with DATA_FORMAT.md

---

## 🎯 Workflow Example

Here's a typical workflow:

1. **Upload**: Drag `my_conversations.json` to upload area
2. **Validate**: Check validation message shows correct counts
3. **Process**: Click "Process Data", wait for completion
4. **Overview**: View general statistics and charts
5. **Explore**: Click top conversation (e.g., "tuyt.nhy_")
6. **Analyze**: Review individual charts and timeline
7. **Select**: Expand October, check Week 42 and 43
8. **Preview**: Click "Preview" to see how it looks
9. **Export**: Click "Download ZIP"
10. **Open**: Unzip and view Markdown files

---

## 🔧 Advanced Usage

### Custom Date Ranges

1. Navigate to Individual page
2. Expand multiple months
3. Select specific weeks across months
4. Export creates chronological files

### Comparing Conversations

1. View Person A statistics
2. Note key metrics
3. Switch to Person B using dropdown
4. Compare charts side-by-side (open in new tab)

### Data Analysis

1. Export raw Markdown
2. Import into data analysis tools
3. Run custom analysis
4. Visualize in other ways

---

## 📞 Need Help?

- Check the **README.md** for general info
- Review **DATA_FORMAT.md** for format issues
- Look at **examples/** for sample data
- Check browser console for error messages

---

**Happy analyzing! 🎉**

*Last updated: October 2025*
