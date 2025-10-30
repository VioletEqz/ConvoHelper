/**
 * Visualization Utilities Module
 * Shared utility functions for D3-based visualizations
 */

const VizUtils = {
    /**
     * Create a responsive SVG container
     */
    createSvg(container, width, height, margin = { top: 20, right: 20, bottom: 30, left: 40 }) {
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);
        
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        return { svg, g, width, height, margin };
    },
    
    /**
     * Create scales for time-based data
     */
    createTimeScales(data, width, height) {
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([height, 0]);
        
        return { xScale, yScale };
    },
    
    /**
     * Create axes
     */
    createAxes(g, xScale, yScale, height, xLabel, yLabel) {
        // X axis
        const xAxis = g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
        
        if (xLabel) {
            xAxis.append('text')
                .attr('class', 'axis-label')
                .attr('x', xScale.range()[1] / 2)
                .attr('y', 35)
                .text(xLabel);
        }
        
        // Y axis
        const yAxis = g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale));
        
        if (yLabel) {
            yAxis.append('text')
                .attr('class', 'axis-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', -yScale.range()[0] / 2)
                .attr('y', -35)
                .text(yLabel);
        }
        
        return { xAxis, yAxis };
    },
    
    /**
     * Add tooltip functionality
     */
    createTooltip(container) {
        return d3.select(container)
            .append('div')
            .attr('class', 'viz-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background', 'var(--bg-secondary)')
            .style('border', '1px solid var(--border-color)')
            .style('border-radius', '8px')
            .style('padding', '8px 12px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('z-index', '1000');
    },
    
    /**
     * Show tooltip
     */
    showTooltip(tooltip, content, event) {
        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
        
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    },
    
    /**
     * Hide tooltip
     */
    hideTooltip(tooltip) {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    },
    
    /**
     * Format date for display
     */
    formatDate(date) {
        return d3.timeFormat('%b %d, %Y')(date);
    },
    
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toLocaleString();
    },
    
    /**
     * Get color from CSS variable
     */
    getColor(varName) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(varName).trim();
    },
    
    /**
     * Create color scale
     */
    createColorScale(domain) {
        return d3.scaleOrdinal()
            .domain(domain)
            .range([
                this.getColor('--color-primary'),
                this.getColor('--color-secondary'),
                this.getColor('--color-success'),
                this.getColor('--color-warning'),
                this.getColor('--color-danger'),
                this.getColor('--color-info')
            ]);
    },
    
    /**
     * Add zoom behavior
     */
    addZoom(svg, g, xScale, yScale, onZoom) {
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .extent([[0, 0], [svg.attr('width'), svg.attr('height')]])
            .translateExtent([[0, 0], [svg.attr('width'), svg.attr('height')]])
            .on('zoom', (event) => {
                const newX = event.transform.rescaleX(xScale);
                const newY = event.transform.rescaleY(yScale);
                onZoom(newX, newY, event.transform);
            });
        
        svg.call(zoom);
        
        return zoom;
    },
    
    /**
     * Add brush for selection
     */
    addBrush(g, width, height, onBrush) {
        const brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on('end', onBrush);
        
        const brushGroup = g.append('g')
            .attr('class', 'brush')
            .call(brush);
        
        return { brush, brushGroup };
    },
    
    /**
     * Animate element entrance
     */
    animateEntrance(selection, delay = 0) {
        selection
            .style('opacity', 0)
            .transition()
            .duration(500)
            .delay(delay)
            .style('opacity', 1);
    },
    
    /**
     * Create legend
     */
    createLegend(container, items) {
        const legend = d3.select(container)
            .append('div')
            .attr('class', 'viz-legend')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('gap', '12px')
            .style('margin-top', '16px');
        
        items.forEach(item => {
            const legendItem = legend.append('div')
                .attr('class', 'legend-item')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '6px');
            
            legendItem.append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('background-color', item.color)
                .style('border-radius', '2px');
            
            legendItem.append('span')
                .style('font-size', '12px')
                .text(item.label);
        });
        
        return legend;
    },
    
    /**
     * Clear visualization container
     */
    clear(container) {
        d3.select(container).selectAll('*').remove();
    },
    
    /**
     * Responsive resize handler
     */
    onResize(callback, debounce = 250) {
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(callback, debounce);
        });
    },
    
    /**
     * Calculate responsive dimensions
     */
    getResponsiveDimensions(container, aspectRatio = 0.5) {
        const width = container.clientWidth;
        const height = Math.max(300, width * aspectRatio);
        return { width, height };
    }
};

// Make globally available
window.VizUtils = VizUtils;
