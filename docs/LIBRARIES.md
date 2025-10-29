# Required Libraries Guide

This document explains which JavaScript libraries are needed and where to download them.

## 📚 Required Libraries

The ConvoHelper Standalone Edition requires three JavaScript libraries to be placed in the `libs/` folder:

### 1. Chart.js (v4.x)
**Purpose**: Creates beautiful, responsive charts for data visualization

**Download**:
- Visit: https://github.com/chartjs/Chart.js/releases
- Download the latest `chart.min.js` from the releases page
- Or use CDN link: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js

**Place at**: `standalone/libs/chart.min.js`

### 2. Marked.js (v10.x)
**Purpose**: Converts Markdown to HTML for export preview

**Download**:
- Visit: https://github.com/markedjs/marked/releases
- Download the latest `marked.min.js`
- Or use CDN link: https://cdn.jsdelivr.net/npm/marked@10.0.0/marked.min.js

**Place at**: `standalone/libs/marked.min.js`

### 3. JSZip (v3.x)
**Purpose**: Creates ZIP files for exporting multiple conversation files

**Download**:
- Visit: https://github.com/Stuk/jszip/releases
- Download the latest `jszip.min.js`
- Or use CDN link: https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js

**Place at**: `standalone/libs/jszip.min.js`

## 🚀 Quick Download Commands

### Using curl:
```bash
cd standalone/libs

# Download Chart.js
curl -L https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js -o chart.min.js

# Download Marked.js
curl -L https://cdn.jsdelivr.net/npm/marked@10.0.0/marked.min.js -o marked.min.js

# Download JSZip
curl -L https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js -o jszip.min.js
```

### Using wget:
```bash
cd standalone/libs

# Download Chart.js
wget https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js -O chart.min.js

# Download Marked.js
wget https://cdn.jsdelivr.net/npm/marked@10.0.0/marked.min.js -O marked.min.js

# Download JSZip
wget https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js -O jszip.min.js
```

### Using PowerShell (Windows):
```powershell
cd standalone\libs

# Download Chart.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" -OutFile "chart.min.js"

# Download Marked.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/marked@10.0.0/marked.min.js" -OutFile "marked.min.js"

# Download JSZip
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js" -OutFile "jszip.min.js"
```

## ✅ Verification

After downloading, your `libs/` folder should contain:
```
standalone/libs/
├── chart.min.js
├── marked.min.js
└── jszip.min.js
```

You can verify the files are correct by opening `index.html` in a browser - if the libraries are missing, you'll see errors in the browser console.

## 🔄 Alternative: Using CDN

If you prefer not to download files locally, you can modify `index.html` to use CDN links directly:

```html
<!-- Replace these lines in index.html -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@10.0.0/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
```

**Note**: Using CDN requires an internet connection. Local files work offline.

## 📖 License Information

- **Chart.js**: MIT License
- **Marked.js**: MIT License  
- **JSZip**: MIT/GPL License

All libraries are free and open source.
