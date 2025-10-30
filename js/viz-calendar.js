/**
 * Calendar Heatmap Visualization Module
 * Creates a GitHub-style calendar heatmap showing daily activity
 */

const VizCalendar = {
    /**
     * Render calendar heatmap for a person's activity
     */
    render(container, personName, data) {
        if (!d3 || !container || !data) {
            console.warn('Calendar heatmap: Missing dependencies');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Get person's messages
        const personData = data.byPerson[personName];
        if (!personData || !personData.messages) {
            container.innerHTML = '<div class="no-data">No data available for calendar heatmap</div>';
            return;
        }
        
        // Prepare calendar data
        const calendarData = this.prepareCalendarData(personData.messages);
        
        if (calendarData.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough data to create calendar heatmap</div>';
            return;
        }
        
        // Create calendar visualization
        this.createCalendar(container, calendarData);
    },
    
    /**
     * Prepare data for calendar heatmap
     */
    prepareCalendarData(messages) {
        // Group messages by date string, but keep Date objects
        const messagesByDate = new Map();
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp);
            
            // Validate date
            if (isNaN(date.getTime())) {
                console.warn('Invalid timestamp:', msg.timestamp);
                return;
            }
            
            // Use ISO date string as key (YYYY-MM-DD)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!messagesByDate.has(dateKey)) {
                // Store the actual date object, not a string
                messagesByDate.set(dateKey, {
                    date: new Date(year, date.getMonth(), date.getDate()), // Normalized to midnight
                    count: 0
                });
            }
            
            messagesByDate.get(dateKey).count++;
        });
        
        // Convert to array format
        const data = Array.from(messagesByDate.values());
        
        // Sort by date
        data.sort((a, b) => a.date - b.date);
        
        console.log('Calendar data prepared:', data.length, 'days, date range:', 
            data[0]?.date, 'to', data[data.length - 1]?.date);
        
        return data;
    },
    
    /**
     * Create calendar heatmap visualization
     */
    createCalendar(container, data) {
        // Add summary section
        this.createSummary(container, data);
        
        // Calculate dimensions - MUCH larger cells to fill the space!
        const cellSize = 28;
        const cellPadding = 4;
        const weekDays = 7;
        const margin = { top: 70, right: 60, bottom: 40, left: 80 };
        
        // Get date range
        const minDate = d3.min(data, d => d.date);
        const maxDate = d3.max(data, d => d.date);
        
        // Validate dates
        if (!minDate || !maxDate || isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
            console.error('Calendar: Invalid date range', minDate, maxDate);
            container.innerHTML = '<div class="no-data">Unable to render calendar: invalid date range in data</div>';
            return;
        }
        
        // Calculate number of weeks
        const startWeek = d3.timeWeek.floor(minDate);
        const endWeek = d3.timeWeek.ceil(maxDate);
        const numWeeks = d3.timeWeek.count(startWeek, endWeek);
        
        // Validate week count
        if (!numWeeks || numWeeks <= 0 || isNaN(numWeeks)) {
            console.error('Calendar: Invalid week count', numWeeks, 'from dates:', minDate, maxDate);
            container.innerHTML = '<div class="no-data">Unable to render calendar: could not calculate date range</div>';
            return;
        }
        
        // Calculate SVG dimensions with fallback
        const containerWidth = container.clientWidth || 800;
        const width = Math.min(containerWidth - margin.left - margin.right, numWeeks * (cellSize + cellPadding));
        const height = weekDays * (cellSize + cellPadding);
        
        // Verify dimensions are valid
        if (!width || width <= 0 || isNaN(width)) {
            console.error('Calendar render failed - container width:', container.clientWidth, 'numWeeks:', numWeeks, 'calculated width:', width);
            container.innerHTML = `<div class="no-data">
                Unable to render calendar: invalid dimensions<br>
                <small style="color: var(--text-secondary);">Container: ${container.clientWidth}px, Weeks: ${numWeeks}</small>
            </div>`;
            return;
        }
        
        console.log('Calendar rendering - container:', containerWidth, 'weeks:', numWeeks, 'SVG width:', width);
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create color scale - GitHub-style green gradient
        const maxCount = d3.max(data, d => d.count) || 1;
        
        // Custom green color scale for better visibility on dark background
        const colorScale = d3.scaleThreshold()
            .domain([1, Math.ceil(maxCount * 0.25), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.75), maxCount])
            .range([
                '#161b22',  // No activity (dark gray)
                '#0e4429',  // Low activity (dark green)
                '#006d32',  // Medium-low (medium green)
                '#26a641',  // Medium-high (bright green)
                '#39d353'   // High activity (very bright green)
            ]);
        
        // Create data map for quick lookup
        const dataMap = new Map();
        data.forEach(d => {
            const key = d3.timeFormat('%Y-%m-%d')(d.date);
            dataMap.set(key, d.count);
        });
        
        // Create tooltip
        const tooltip = VizUtils.createTooltip(container);
        
        // Generate all dates in range
        const allDates = d3.timeDays(startWeek, endWeek);
        
        // Draw cells
        const cells = svg.selectAll('.calendar-cell')
            .data(allDates)
            .enter()
            .append('rect')
            .attr('class', 'calendar-cell')
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('x', d => d3.timeWeek.count(startWeek, d) * (cellSize + cellPadding))
            .attr('y', d => d.getDay() * (cellSize + cellPadding))
            .attr('rx', 2)
            .attr('fill', d => {
                const key = d3.timeFormat('%Y-%m-%d')(d);
                const count = dataMap.get(key) || 0;
                return colorScale(count);
            })
            .attr('stroke', 'var(--border-color)')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                const key = d3.timeFormat('%Y-%m-%d')(d);
                const count = dataMap.get(key) || 0;
                
                d3.select(this)
                    .attr('stroke', 'var(--color-primary)')
                    .attr('stroke-width', 2);
                
                const dateStr = d3.timeFormat('%B %d, %Y')(d);
                const content = `
                    <strong>${dateStr}</strong><br>
                    ${count} message${count !== 1 ? 's' : ''}
                `;
                
                VizUtils.showTooltip(tooltip, content, event);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke', 'var(--border-color)')
                    .attr('stroke-width', 1);
                
                VizUtils.hideTooltip(tooltip);
            });
        
        // Add day labels - larger font for larger calendar
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        svg.selectAll('.day-label')
            .data(dayLabels)
            .enter()
            .append('text')
            .attr('class', 'day-label')
            .attr('x', -12)
            .attr('y', (d, i) => i * (cellSize + cellPadding) + cellSize / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('font-size', '13px')
            .attr('fill', 'var(--text-secondary)')
            .text(d => d);
        
        // Add month labels - larger and bolder
        const months = d3.timeMonths(startWeek, endWeek);
        svg.selectAll('.month-label')
            .data(months)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('x', d => d3.timeWeek.count(startWeek, d) * (cellSize + cellPadding))
            .attr('y', -15)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', 'var(--text-primary)')
            .text(d => d3.timeFormat('%b %Y')(d));
        
        // Add legend
        this.createLegend(container, colorScale, maxCount);
    },
    
    /**
     * Create summary section
     */
    createSummary(container, data) {
        const totalMessages = d3.sum(data, d => d.count);
        const avgPerDay = (totalMessages / data.length).toFixed(1);
        const maxDay = d3.max(data, d => d.count);
        const activeDays = data.filter(d => d.count > 0).length;
        
        const summaryDiv = d3.select(container)
            .append('div')
            .attr('class', 'calendar-summary')
            .style('background', 'rgba(255, 255, 255, 0.05)')
            .style('border-radius', '8px')
            .style('padding', '15px 20px')
            .style('margin-bottom', '20px')
            .style('display', 'flex')
            .style('gap', '30px')
            .style('flex-wrap', 'wrap');
        
        const stats = [
            { label: 'Total Messages', value: totalMessages.toLocaleString() },
            { label: 'Active Days', value: activeDays },
            { label: 'Avg per Day', value: avgPerDay },
            { label: 'Busiest Day', value: maxDay }
        ];
        
        stats.forEach(stat => {
            const statDiv = summaryDiv.append('div')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('gap', '4px');
            
            statDiv.append('div')
                .style('font-size', '12px')
                .style('color', 'var(--text-secondary)')
                .text(stat.label);
            
            statDiv.append('div')
                .style('font-size', '20px')
                .style('font-weight', 'bold')
                .style('color', 'var(--text-primary)')
                .text(stat.value);
        });
    },
    
    /**
     * Create color legend with actual values
     */
    createLegend(container, colorScale, maxCount) {
        const legendContainer = d3.select(container)
            .append('div')
            .attr('class', 'calendar-legend')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('gap', '12px')
            .style('margin-top', '25px')
            .style('font-size', '11px');
        
        legendContainer.append('span')
            .text('Less')
            .style('color', 'var(--text-secondary)')
            .style('margin-right', '5px');
        
        // Create legend with actual threshold values
        const thresholds = [0, 1, Math.ceil(maxCount * 0.25), Math.ceil(maxCount * 0.5), Math.ceil(maxCount * 0.75), maxCount];
        const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
        
        colors.forEach((color, i) => {
            const legendItem = legendContainer.append('div')
                .style('display', 'flex')
                .style('flex-direction', 'column')
                .style('align-items', 'center')
                .style('gap', '4px');
            
            legendItem.append('div')
                .style('width', '24px')
                .style('height', '24px')
                .style('background-color', color)
                .style('border', '1px solid rgba(255, 255, 255, 0.2)')
                .style('border-radius', '3px');
            
            // Show range for each color
            let label;
            if (i === 0) {
                label = '0';
            } else if (i === colors.length - 1) {
                label = `${thresholds[i]}+`;
            } else {
                label = `${thresholds[i]}-${thresholds[i + 1]}`;
            }
            
            legendItem.append('span')
                .style('font-size', '10px')
                .style('color', 'var(--text-secondary)')
                .text(label);
        });
        
        legendContainer.append('span')
            .text('More')
            .style('color', 'var(--text-secondary)')
            .style('margin-left', '5px');
    }
};

// Make globally available
window.VizCalendar = VizCalendar;
