/**
 * Charts Module
 * Handles Chart.js visualization
 */

const Charts = {
    instances: {},
    
    /**
     * Create timeline chart (messages over time)
     * @param {string} canvasId - Canvas element ID
     * @param {Object} messagesByDate - Messages grouped by date
     */
    createTimelineChart(canvasId, messagesByDate) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        // Prepare data
        const sortedDates = Object.keys(messagesByDate).sort();
        const labels = sortedDates.map(key => {
            const date = messagesByDate[key].date;
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        const data = sortedDates.map(key => messagesByDate[key].count);
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Messages',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    /**
     * Create distribution pie chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} topConversations - Top conversations data
     * @param {number} limit - Number of top conversations to show
     */
    createDistributionChart(canvasId, topConversations, limit = 5) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const top = topConversations.slice(0, limit);
        const labels = top.map(c => c.name);
        const data = top.map(c => c.count);
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
            '#00f2fe', '#fa709a', '#fee140', '#30cfd0', '#330867'
        ];
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },
    
    /**
     * Create monthly bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} byMonth - Messages by month data
     */
    createMonthlyChart(canvasId, byMonth) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = byMonth.map(m => `${m.monthName} ${m.year}`);
        const data = byMonth.map(m => m.count);
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Messages',
                    data: data,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    /**
     * Create hourly activity chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} byHour - Messages by hour (0-23)
     */
    createHourlyChart(canvasId, byHour) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Messages',
                    data: byHour,
                    backgroundColor: '#4facfe'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    /**
     * Destroy all chart instances
     */
    destroyAll() {
        for (const id in this.instances) {
            this.instances[id].destroy();
        }
        this.instances = {};
    },
    
    // ========================================
    // ENHANCED ANALYTICS - NEW CHART TYPES
    // ========================================
    
    /**
     * Create day of week bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} dayData - Count for each day (length 7)
     */
    createDayOfWeekChart(canvasId, dayData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Messages',
                    data: dayData,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    /**
     * Create time of day chart (4 blocks)
     * @param {string} canvasId - Canvas element ID
     * @param {Object} timeBlocks - Time block distribution {morning, afternoon, evening, night}
     */
    createTimeOfDayChart(canvasId, timeBlocks) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = ['🌅 Morning\n(5-11)', '☀️ Afternoon\n(12-17)', '🌆 Evening\n(18-22)', '🌙 Night\n(23-4)'];
        const data = [
            timeBlocks.morning,
            timeBlocks.afternoon,
            timeBlocks.evening,
            timeBlocks.night
        ];
        const colors = ['#ffd93d', '#f093fb', '#4facfe', '#764ba2'];
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },
    
    /**
     * Create content type distribution chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} contentData - Content type counts and percentages
     */
    createContentTypeChart(canvasId, contentData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const labels = ['💬 Text', '🔗 Links', '📷 Media', '😊 Stickers', '⚪ Empty'];
        const data = [
            contentData.counts.text,
            contentData.counts.link,
            contentData.counts.media,
            contentData.counts.sticker || 0,
            contentData.counts.empty
        ];
        const colors = ['#667eea', '#4facfe', '#f093fb', '#ffd93d', '#cccccc'];
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },
    
    /**
     * Create message length distribution chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} lengthData - Length distribution data
     */
    createLengthDistributionChart(canvasId, lengthData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        // Handle both 'counts' (from overview) and 'distribution' (from individual) property names
        const lengths = lengthData.counts || lengthData.distribution;
        
        if (!lengths) {
            console.error('Invalid lengthData structure:', lengthData);
            return;
        }
        
        const labels = ['Short (1-5)', 'Medium (6-20)', 'Long (21+)'];
        const data = [
            lengths.short,
            lengths.medium,
            lengths.long
        ];
        const colors = ['#ffd93d', '#f093fb', '#667eea'];
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },
    
    /**
     * Create balance score horizontal bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} balanceScores - Array of balance score objects
     * @param {number} limit - Number to show
     */
    createBalanceScoreChart(canvasId, balanceScores, limit = 10) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const top = balanceScores.slice(0, limit);
        const labels = top.map(s => s.name);
        const data = top.map(s => s.score);
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance Score',
                    data: data,
                    backgroundColor: '#4facfe'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    },
    
    /**
     * Create density score horizontal bar chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} densityScores - Array of density score objects
     * @param {number} limit - Number to show
     */
    createDensityScoreChart(canvasId, densityScores, limit = 10) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        const top = densityScores.slice(0, limit);
        const labels = top.map(s => s.name);
        const data = top.map(s => parseFloat(s.percentage));
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Density %',
                    data: data,
                    backgroundColor: '#f093fb'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    },
    
    /**
     * Create comparative multi-series chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} compareData - Comparison data with multiple series
     * @param {string} type - Chart type (bar, line)
     */
    createComparativeChart(canvasId, compareData, type = 'bar') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        this.instances[canvasId] = new Chart(ctx, {
            type: type,
            data: compareData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },
    
    /**
     * Create sparkline (mini line chart for trends)
     * @param {string} canvasId - Canvas element ID
     * @param {Array} data - Array of data points
     * @param {string} color - Line color
     */
    createSparkline(canvasId, data, color = '#667eea') {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        if (this.instances[canvasId]) {
            this.instances[canvasId].destroy();
        }
        
        this.instances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => ''),
                datasets: [{
                    data: data,
                    borderColor: color,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
};
