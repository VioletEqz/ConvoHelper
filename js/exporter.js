/**
 * Exporter Module
 * Handles exporting conversations to Markdown files
 */

const Exporter = {
    /**
     * Export selected weeks to Markdown files (zipped)
     * @param {string} personName - Person name
     * @param {Object} processedData - Processed data for person
     * @param {Array} selectedWeeks - Array of selected week keys
     * @returns {Promise<Blob>} ZIP file blob
     */
    async exportToZip(personName, processedData, selectedWeeks) {
        const zip = new JSZip();
        const weekClusters = processedData.weekClusters;
        
        for (const weekKey of selectedWeeks) {
            const week = weekClusters[weekKey];
            if (!week) continue;
            
            const markdown = this.generateWeekMarkdown(personName, week);
            const filename = `${personName}_${weekKey}.md`;
            zip.file(filename, markdown);
        }
        
        return await zip.generateAsync({ type: 'blob' });
    },
    
    /**
     * Generate Markdown for a single week
     * @param {string} personName - Person name
     * @param {Object} week - Week data
     * @returns {string} Markdown content
     */
    generateWeekMarkdown(personName, week) {
        const { year, week: weekNum, messages, dateRange } = week;
        
        let md = `# Conversation Export: ${personName}\n\n`;
        md += `**Week**: ${weekNum} (${year})\n`;
        md += `**Total Messages**: ${messages.length}\n`;
        md += `**Date Range**: ${Parser.formatDateRange(dateRange.start, dateRange.end)}\n\n`;
        md += `---\n\n`;
        md += `## Messages\n\n`;
        
        // Group messages by date
        const byDate = {};
        for (const msg of messages) {
            const dateKey = Parser.formatDate(msg.date);
            if (!byDate[dateKey]) {
                byDate[dateKey] = [];
            }
            byDate[dateKey].push(msg);
        }
        
        // Write messages grouped by date
        for (const date in byDate) {
            md += `### ${date}\n\n`;
            
            for (const msg of byDate[date]) {
                const time = `${String(msg.hour).padStart(2, '0')}:${String(msg.date.getMinutes()).padStart(2, '0')}:${String(msg.date.getSeconds()).padStart(2, '0')}`;
                md += `**${time}** - [**${msg.from}**]: `;
                md += `${msg.content}\n`;
            }
        }
        
        md += `---\n\n`;
        md += `## Statistics\n\n`;
        md += `- **Total Messages**: ${messages.length}\n`;
        
        // Count by sender
        const bySender = {};
        for (const msg of messages) {
            bySender[msg.from] = (bySender[msg.from] || 0) + 1;
        }
        for (const sender in bySender) {
            const percentage = ((bySender[sender] / messages.length) * 100).toFixed(1);
            md += `- **Messages from ${sender}**: ${bySender[sender]} (${percentage}%)\n`;
        }
        
        // Count types (already classified by parser during parsing stage)
        const types = { text: 0, link: 0, media: 0, sticker: 0, empty: 0 };
        for (const msg of messages) {
            types[msg.type] = (types[msg.type] || 0) + 1;
        }
        md += `- **Text Messages**: ${types.text}\n`;
        md += `- **Links**: ${types.link}\n`;
        md += `- **Media (Photos/Videos)**: ${types.media}\n`;
        md += `- **Stickers**: ${types.sticker}\n`;
        if (types.empty > 0) {
            md += `- **Empty Messages**: ${types.empty}\n`;
        }
        
        // Average per day
        const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)) || 1;
        md += `- **Average messages per day**: ${(messages.length / days).toFixed(1)}\n`;
        
        md += `\n---\n\n`;
        md += `*Exported by ConvoHelper Standalone Edition*\n`;
        md += `*Export Date: ${new Date().toLocaleDateString()}*\n`;
        
        return md;
    },
    
    /**
     * Download a blob as a file
     * @param {Blob} blob - File blob
     * @param {string} filename - Download filename
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Generate preview of export
     * @param {string} personName - Person name
     * @param {Object} processedData - Processed data
     * @param {Array} selectedWeeks - Selected week keys
     * @returns {string} HTML preview
     */
    generatePreview(personName, processedData, selectedWeeks) {
        if (selectedWeeks.length === 0) {
            return '<p>No weeks selected</p>';
        }
        
        const weekClusters = processedData.weekClusters;
        const firstWeek = weekClusters[selectedWeeks[0]];
        
        if (!firstWeek) {
            return '<p>Invalid selection</p>';
        }
        
        const markdown = this.generateWeekMarkdown(personName, firstWeek);
        
        // Use marked.js to convert to HTML if available, otherwise show raw
        if (typeof marked !== 'undefined') {
            return marked.parse(markdown);
        }
        
        return `<pre>${markdown}</pre>`;
    }
};
