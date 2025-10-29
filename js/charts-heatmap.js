/**
 * Heatmap Charts Module
 * Specialized charts for activity heatmaps
 */

const ChartsHeatmap = {
    /**
     * Create hour-day-week heatmap
     * Shows message activity by hour of day (0-23) and day of week (Sun-Sat)
     * @param {string} canvasId - Canvas element ID
     * @param {Array} messages - Array of messages
     */
    createHourDayWeekHeatmap(canvasId, messages) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if any
        if (window.heatmapCharts && window.heatmapCharts[canvasId]) {
            window.heatmapCharts[canvasId].destroy();
        }
        
        // Initialize data structure: 7 days x 24 hours
        const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
        
        // Count messages for each hour-day combination
        for (const msg of messages) {
            const date = new Date(msg.timestamp);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            const hour = date.getHours();
            heatmapData[dayOfWeek][hour]++;
        }
        
        // Find max value for color scaling
        const maxValue = Math.max(...heatmapData.flat());
        
        // Prepare data for Chart.js matrix format
        const chartData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const value = heatmapData[day][hour];
                chartData.push({
                    x: hour,
                    y: dayNames[day],
                    v: value
                });
            }
        }
        
        const chart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Messages',
                    data: chartData.map(d => ({
                        x: d.x,
                        y: dayNames.indexOf(d.y),
                        r: maxValue > 0 ? Math.max(3, (d.v / maxValue) * 20) : 3,
                        value: d.v
                    })),
                    backgroundColor: chartData.map(d => {
                        if (d.v === 0) return 'rgba(100, 100, 100, 0.1)';
                        const intensity = maxValue > 0 ? d.v / maxValue : 0;
                        return `rgba(102, 126, 234, ${0.2 + intensity * 0.8})`;
                    }),
                    borderColor: chartData.map(d => {
                        if (d.v === 0) return 'rgba(100, 100, 100, 0.2)';
                        return 'rgba(102, 126, 234, 0.8)';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0].raw;
                                return `${dayNames[point.y]} ${point.x}:00`;
                            },
                            label: function(context) {
                                return `${context.raw.value} messages`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: 23.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return value + ':00';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 6.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return dayNames[Math.round(value)] || '';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Day of Week'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
        
        // Store chart instance
        if (!window.heatmapCharts) window.heatmapCharts = {};
        window.heatmapCharts[canvasId] = chart;
    },
    
    /**
     * Create month-day heatmap
     * Shows message activity by day of month (1-31) and month
     * @param {string} canvasId - Canvas element ID
     * @param {Array} messages - Array of messages
     */
    createMonthDayHeatmap(canvasId, messages) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if any
        if (window.heatmapCharts && window.heatmapCharts[canvasId]) {
            window.heatmapCharts[canvasId].destroy();
        }
        
        // Get unique months from messages
        const monthsSet = new Set();
        for (const msg of messages) {
            const date = new Date(msg.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthsSet.add(monthKey);
        }
        
        const months = Array.from(monthsSet).sort();
        
        // Initialize data structure: months x 31 days
        const heatmapData = {};
        months.forEach(month => {
            heatmapData[month] = Array(31).fill(0);
        });
        
        // Count messages for each month-day combination
        for (const msg of messages) {
            const date = new Date(msg.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const day = date.getDate() - 1; // 0-indexed
            if (heatmapData[monthKey]) {
                heatmapData[monthKey][day]++;
            }
        }
        
        // Find max value for color scaling
        const maxValue = Math.max(...Object.values(heatmapData).flat());
        
        // Prepare data for Chart.js
        const chartData = [];
        months.forEach((month, monthIndex) => {
            for (let day = 0; day < 31; day++) {
                const value = heatmapData[month][day];
                chartData.push({
                    x: day + 1,
                    y: monthIndex,
                    v: value,
                    month: month
                });
            }
        });
        
        const chart = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Messages',
                    data: chartData.map(d => ({
                        x: d.x,
                        y: d.y,
                        r: maxValue > 0 ? Math.max(2, (d.v / maxValue) * 15) : 2,
                        value: d.v,
                        month: d.month
                    })),
                    backgroundColor: chartData.map(d => {
                        if (d.v === 0) return 'rgba(100, 100, 100, 0.1)';
                        const intensity = maxValue > 0 ? d.v / maxValue : 0;
                        return `rgba(118, 75, 162, ${0.2 + intensity * 0.8})`;
                    }),
                    borderColor: chartData.map(d => {
                        if (d.v === 0) return 'rgba(100, 100, 100, 0.2)';
                        return 'rgba(118, 75, 162, 0.8)';
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                const point = context[0].raw;
                                return `${point.month} - Day ${point.x}`;
                            },
                            label: function(context) {
                                return `${context.raw.value} messages`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0.5,
                        max: 31.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Math.round(value);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Day of Month'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: months.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const index = Math.round(value);
                                return months[index] || '';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
        
        // Store chart instance
        if (!window.heatmapCharts) window.heatmapCharts = {};
        window.heatmapCharts[canvasId] = chart;
    },
    
    /**
     * Utility: Get color based on intensity
     * @param {number} value - Value to color
     * @param {number} maxValue - Maximum value for scaling
     * @returns {string} RGBA color string
     */
    getHeatmapColor(value, maxValue) {
        if (value === 0) return 'rgba(200, 200, 200, 0.2)';
        
        const intensity = maxValue > 0 ? value / maxValue : 0;
        
        // Gradient from light purple to dark purple
        const r = Math.floor(102 + (118 - 102) * intensity);
        const g = Math.floor(126 + (75 - 126) * intensity);
        const b = Math.floor(234 + (162 - 234) * intensity);
        const a = 0.3 + intensity * 0.7;
        
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
};
