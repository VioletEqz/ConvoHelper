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
        // Group messages by date
        const messagesByDate = new Map();
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp_ms);
            const dateStr = d3.timeFormat('%Y-%m-%d')(date);
            
            messagesByDate.set(dateStr, (messagesByDate.get(dateStr) || 0) + 1);
        });
        
        // Convert to array format
        const data = [];
        messagesByDate.forEach((count, dateStr) => {
            data.push({
                date: new Date(dateStr),
                count: count
            });
        });
        
        // Sort by date
        data.sort((a, b) => a.date - b.date);
        
        return data;
    },
    
    /**
     * Create calendar heatmap visualization
     */
    createCalendar(container, data) {
        // Calculate dimensions
        const cellSize = 15;
        const cellPadding = 2;
        const weekDays = 7;
        const margin = { top: 40, right: 20, bottom: 20, left: 60 };
        
        // Get date range
        const minDate = d3.min(data, d => d.date);
        const maxDate = d3.max(data, d => d.date);
        
        // Calculate number of weeks
        const startWeek = d3.timeWeek.floor(minDate);
        const endWeek = d3.timeWeek.ceil(maxDate);
        const numWeeks = d3.timeWeek.count(startWeek, endWeek);
        
        // Calculate SVG dimensions
        const width = Math.min(container.clientWidth - margin.left - margin.right, numWeeks * (cellSize + cellPadding));
        const height = weekDays * (cellSize + cellPadding);
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create color scale
        const maxCount = d3.max(data, d => d.count) || 1;
        const colorScale = d3.scaleSequential()
            .domain([0, maxCount])
            .interpolator(d3.interpolateBlues);
        
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
                return count > 0 ? colorScale(count) : '#eee';
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
        
        // Add day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        svg.selectAll('.day-label')
            .data(dayLabels)
            .enter()
            .append('text')
            .attr('class', 'day-label')
            .attr('x', -10)
            .attr('y', (d, i) => i * (cellSize + cellPadding) + cellSize / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('font-size', '10px')
            .attr('fill', 'var(--text-secondary)')
            .text(d => d);
        
        // Add month labels
        const months = d3.timeMonths(startWeek, endWeek);
        svg.selectAll('.month-label')
            .data(months)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('x', d => d3.timeWeek.count(startWeek, d) * (cellSize + cellPadding))
            .attr('y', -10)
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .attr('fill', 'var(--text-primary)')
            .text(d => d3.timeFormat('%b %Y')(d));
        
        // Add legend
        this.createLegend(container, colorScale, maxCount);
    },
    
    /**
     * Create color legend
     */
    createLegend(container, colorScale, maxCount) {
        const legendContainer = d3.select(container)
            .append('div')
            .attr('class', 'calendar-legend')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px')
            .style('margin-top', '20px')
            .style('font-size', '12px');
        
        legendContainer.append('span')
            .text('Less')
            .style('color', 'var(--text-secondary)');
        
        // Create legend squares
        const legendSquares = 5;
        for (let i = 0; i < legendSquares; i++) {
            const value = (maxCount / (legendSquares - 1)) * i;
            
            legendContainer.append('div')
                .style('width', '15px')
                .style('height', '15px')
                .style('background-color', value > 0 ? colorScale(value) : '#eee')
                .style('border', '1px solid var(--border-color)')
                .style('border-radius', '2px');
        }
        
        legendContainer.append('span')
            .text('More')
            .style('color', 'var(--text-secondary)');
    }
};

// Make globally available
window.VizCalendar = VizCalendar;
