# 🗨️ ConvoHelper Standalone Edition

A lightweight, browser-based conversation analyzer that works entirely client-side. No server, no database, no authentication - just pure JavaScript magic! ✨

## 🎯 Features

- **📁 Easy Upload**: Drag & drop your conversation JSON file
- **⚡ Client-Side Processing**: All processing happens in your browser - your data never leaves your computer
- **📊 Rich Statistics**: View comprehensive statistics with beautiful charts
- **📅 Hierarchical Clustering**: Automatically cluster conversations by weeks and months
- **💾 Flexible Export**: Export selected time periods to Markdown files
- **🎨 Beautiful UI**: Vibrant, gradient-based interface with smooth animations
- **🔒 Privacy First**: No data is sent to any server - everything stays local
- **🌐 Zero Dependencies**: Just open in a browser - no installation needed!

## 🚀 Quick Start

1. **Open the Application**
   ```bash
   # Simply open index.html in your browser
   # Or use a simple HTTP server:
   python -m http.server 8080
   # Then visit: http://localhost:8080
   ```

2. **Upload Your Data**
   - Drag and drop your conversation JSON file
   - Or click "Choose File" to select it

3. **Process & Explore**
   - Click "Process Data" to analyze your conversations
   - View statistics and charts
   - Click on any person to see detailed insights

4. **Export**
   - Select time periods you want to export
   - Download as Markdown files (automatically zipped if multiple files)

## 📋 Requirements

- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **JavaScript**: Must be enabled
- **File Size**: Works best with files under 50MB

## 📊 Data Format

ConvoHelper expects JSON files in the following format:

```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {
        "Chat History with person1:": [
          {
            "Date": "2025-10-26 17:35:24",
            "From": "person1",
            "Content": "Hello!"
          }
        ],
        "Chat History with person2:": [...]
      }
    }
  }
}
```

See `DATA_FORMAT.md` for detailed specifications.

## 📖 Documentation

- **[USAGE.md](USAGE.md)** - Detailed usage guide with examples
- **[DATA_FORMAT.md](DATA_FORMAT.md)** - JSON format specification
- **[examples/](examples/)** - Sample data and output files

## 🎨 Features Overview

### Statistics & Visualizations
- **Overview Statistics**: Total messages, date ranges, top conversations
- **Interactive Charts**: Line charts, bar charts, pie charts using Chart.js
- **Individual Analysis**: Deep-dive into each conversation with activity patterns
- **Hour-by-Hour Activity**: See when you're most active

### Clustering & Export
- **Automatic Clustering**: Messages grouped by weeks, then organized into months
- **Flexible Selection**: Choose individual weeks or entire months
- **Multiple Formats**: Export as Markdown (more formats coming soon)
- **Multi-File Export**: Automatically creates ZIP when exporting multiple periods

### User Experience
- **Two-Way Navigation**: Click names in lists OR use dropdown to jump to any person
- **Smooth Transitions**: Animated page changes with no reload
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes (coming soon)

## 🔧 Technical Details

### Technologies Used
- **Vanilla JavaScript** (ES6+)
- **Chart.js** v4.x for visualizations
- **Marked.js** for Markdown preview
- **JSZip** for creating ZIP archives

### Architecture
```
index.html          Single-page application
├── css/
│   └── styles.css  Vibrant gradients & animations
├── js/
│   ├── app.js      Main application logic
│   ├── parser.js   JSON parsing
│   ├── processor.js Message processing & clustering
│   ├── stats.js    Statistics generation
│   ├── charts.js   Chart configurations
│   ├── exporter.js Export functionality
│   └── ui.js       UI state management
└── libs/
    ├── chart.min.js
    ├── marked.min.js
    └── jszip.min.js
```

## 🛡️ Privacy & Security

- ✅ **No Server**: Everything runs in your browser
- ✅ **No Database**: Data stored only in browser memory during session
- ✅ **No Network**: No data sent anywhere (except CDN libraries)
- ✅ **No Tracking**: Zero analytics or tracking
- ✅ **Open Source**: Review the code yourself!

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

This is a standalone edition - contributions welcome! Simply:
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 💡 Tips

- **Large Files**: For files over 50MB, processing may take a minute
- **Browser Tabs**: Keep the tab open during processing
- **Export Size**: Exporting many weeks creates larger ZIP files
- **Sample Data**: Try the `examples/sample_data.json` first!

## 🐛 Troubleshooting

**Q: Processing is slow**
A: Large conversation files may take time. The UI will show progress.

**Q: Can't upload file**
A: Ensure the file is valid JSON in the expected format (see DATA_FORMAT.md)

**Q: Charts not showing**
A: Make sure JavaScript is enabled and you're using a modern browser

**Q: Export not working**
A: Check browser console for errors. Try exporting fewer weeks at once.

## 🎉 Acknowledgments

Built with ❤️ using:
- Chart.js for beautiful visualizations
- Marked.js for Markdown rendering
- JSZip for archive creation

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: ✨ Stable & Ready to Use!
# ConvoHelper
