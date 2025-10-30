const TimelineViz = {
    svg: null,
    render(containerId, personName = null) {
        const container = d3.select(`#${containerId}`);
        container.html('');
        const data = window.processedData;
        if (!data) {
            container.append('p').text('No data available');
            return;
        }
        const timelineData = this.prepareTimelineData(personName);
        const width = container.node().getBoundingClientRect().width;
        const height = 300;
        const margin = {top: 40, right: 20, bottom: 60, left: 60};
        this.svg = container.append('svg').attr('width', '100%').attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);
        const g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const title = personName ? `${personName}'s Timeline` : 'Overall Timeline';
        this.svg.append('text').attr('x', width/2).attr('y', 25)
            .attr('text-anchor', 'middle').attr('class', 'font-bold').text(title);
        const xScale = d3.scaleTime()
            .domain(d3.extent(timelineData, d => d.date))
            .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(timelineData, d => d.count)])
            .range([innerHeight, 0]);
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.count))
            .curve(d3.curveMonotoneX);
        const area = d3.area()
            .x(d => xScale(d.date))
            .y0(innerHeight)
            .y1(d => yScale(d.count))
            .curve(d3.curveMonotoneX);
        g.append('path').datum(timelineData)
            .attr('fill', 'rgba(102, 126, 234, 0.2)')
            .attr('d', area);
        g.append('path').datum(timelineData)
            .attr('fill', 'none').attr('stroke', '#667eea')
            .attr('stroke-width', 2).attr('d', line);
        const xAxis = d3.axisBottom(xScale).ticks(6);
        const yAxis = d3.axisLeft(yScale).ticks(5);
        g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis);
        g.append('g').call(yAxis);
        g.append('text').attr('x', innerWidth/2).attr('y', innerHeight + 40)
            .attr('text-anchor', 'middle').text('Date');
        g.append('text').attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight/2).attr('y', -40)
            .attr('text-anchor', 'middle').text('Messages');
        this.addExportButton(container);
    },
    prepareTimelineData(personName) {
        const data = window.processedData;
        const dailyCounts = {};
        const messages = personName ? (data.byPerson[personName]?.messages || []) : data.allMessages;
        messages.forEach(msg => {
            const date = new Date(msg.timestamp_ms).toISOString().split('T')[0];
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        return Object.entries(dailyCounts)
            .map(([dateStr, count]) => ({date: new Date(dateStr), count}))
            .sort((a,b) => a.date - b.date);
    },
    addExportButton(container) {
        container.append('button').attr('class', 'btn-secondary').style('margin-top', '10px')
            .text('Export').on('click', () => VizUtils.exportSVGtoPNG(this.svg, 'timeline.png'));
    }
};
