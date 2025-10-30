/**
 * Flow Diagram Visualization Module
 * Creates a Sankey-style flow diagram showing conversation patterns
 */

const VizFlow = {
    /**
     * Render flow diagram for a person's conversation patterns
     */
    render(container, personName, data) {
        if (!d3 || !container || !data) {
            console.warn('Flow diagram: Missing dependencies');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Get person's messages
        const personData = data.byPerson[personName];
        if (!personData || !personData.messages) {
            container.innerHTML = '<div class="no-data">No data available for flow diagram</div>';
            return;
        }
        
        // Prepare flow data - get userIdentity from window.appData
        const userIdentity = window.appData?.userIdentity || data.userIdentity;
        const flowData = this.prepareFlowData(personData.messages, userIdentity);
        
        if (flowData.nodes.length === 0 || flowData.links.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough data to create flow diagram</div>';
            return;
        }
        
        // Create SVG with fallback dimensions
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const containerWidth = container.clientWidth || 800;
        const width = Math.max(containerWidth - margin.left - margin.right, 400);
        const height = 400 - margin.top - margin.bottom;
        
        // Verify dimensions are valid
        if (!width || width <= 0 || isNaN(width)) {
            container.innerHTML = '<div class="no-data">Unable to render flow: invalid container dimensions</div>';
            return;
        }
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create simplified flow visualization
        this.renderSimplifiedFlow(svg, flowData, width, height);
    },
    
    /**
     * Prepare flow data from messages
     */
    prepareFlowData(messages, userIdentity) {
        const hourBuckets = {
            'Night (12AM-6AM)': { start: 0, end: 6 },
            'Morning (6AM-12PM)': { start: 6, end: 12 },
            'Afternoon (12PM-6PM)': { start: 12, end: 18 },
            'Evening (6PM-12AM)': { start: 18, end: 24 }
        };
        
        const dayTypes = {
            'Weekday': [1, 2, 3, 4, 5],
            'Weekend': [0, 6]
        };
        
        // Count messages by time period and day type
        const flows = {};
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp);
            const hour = date.getHours();
            const day = date.getDay();
            
            // Determine time period
            let timePeriod = '';
            for (const [period, range] of Object.entries(hourBuckets)) {
                if (hour >= range.start && hour < range.end) {
                    timePeriod = period;
                    break;
                }
            }
            
            // Determine day type
            const dayType = dayTypes['Weekend'].includes(day) ? 'Weekend' : 'Weekday';
            
            // Determine sender type
            const senderType = msg.sender_name === userIdentity ? 'You' : 'Them';
            
            // Create flow key
            const flowKey = `${dayType}|${timePeriod}|${senderType}`;
            flows[flowKey] = (flows[flowKey] || 0) + 1;
        });
        
        // Create nodes and links
        const nodes = [];
        const nodeMap = {};
        let nodeId = 0;
        
        // Add nodes for day types
        for (const dayType of Object.keys(dayTypes)) {
            nodeMap[dayType] = nodeId;
            nodes.push({ id: nodeId++, name: dayType, type: 'day' });
        }
        
        // Add nodes for time periods
        for (const period of Object.keys(hourBuckets)) {
            nodeMap[period] = nodeId;
            nodes.push({ id: nodeId++, name: period, type: 'time' });
        }
        
        // Add nodes for sender types
        nodeMap['You'] = nodeId;
        nodes.push({ id: nodeId++, name: 'You', type: 'sender' });
        nodeMap['Them'] = nodeId;
        nodes.push({ id: nodeId++, name: 'Them', type: 'sender' });
        
        // Create links
        const links = [];
        
        for (const [flowKey, count] of Object.entries(flows)) {
            const [dayType, timePeriod, senderType] = flowKey.split('|');
            
            // Day -> Time link
            links.push({
                source: nodeMap[dayType],
                target: nodeMap[timePeriod],
                value: count
            });
            
            // Time -> Sender link
            links.push({
                source: nodeMap[timePeriod],
                target: nodeMap[senderType],
                value: count
            });
        }
        
        return { nodes, links };
    },
    
    /**
     * Render simplified flow visualization
     */
    renderSimplifiedFlow(svg, data, width, height) {
        // Create three columns for the flow
        const columnWidth = width / 4;
        const nodeHeight = 40;
        const nodeSpacing = 20;
        
        // Position nodes in columns
        const columns = {
            day: [],
            time: [],
            sender: []
        };
        
        data.nodes.forEach(node => {
            if (node.type === 'day') columns.day.push(node);
            else if (node.type === 'time') columns.time.push(node);
            else if (node.type === 'sender') columns.sender.push(node);
        });
        
        // Calculate positions
        const positions = {};
        
        // Day column (left)
        let yOffset = (height - (columns.day.length * (nodeHeight + nodeSpacing))) / 2;
        columns.day.forEach((node, i) => {
            positions[node.id] = {
                x: columnWidth / 2,
                y: yOffset + i * (nodeHeight + nodeSpacing),
                width: columnWidth * 0.8,
                height: nodeHeight
            };
        });
        
        // Time column (middle)
        yOffset = (height - (columns.time.length * (nodeHeight + nodeSpacing))) / 2;
        columns.time.forEach((node, i) => {
            positions[node.id] = {
                x: columnWidth * 1.5,
                y: yOffset + i * (nodeHeight + nodeSpacing),
                width: columnWidth * 0.8,
                height: nodeHeight
            };
        });
        
        // Sender column (right)
        yOffset = (height - (columns.sender.length * (nodeHeight + nodeSpacing))) / 2;
        columns.sender.forEach((node, i) => {
            positions[node.id] = {
                x: columnWidth * 2.5,
                y: yOffset + i * (nodeHeight + nodeSpacing),
                width: columnWidth * 0.8,
                height: nodeHeight
            };
        });
        
        // Aggregate links by source-target pairs
        const linkMap = new Map();
        data.links.forEach(link => {
            const key = `${link.source}-${link.target}`;
            if (linkMap.has(key)) {
                linkMap.get(key).value += link.value;
            } else {
                linkMap.set(key, { ...link });
            }
        });
        
        const aggregatedLinks = Array.from(linkMap.values());
        
        // Get max value for opacity scaling
        const maxValue = d3.max(aggregatedLinks, d => d.value) || 1;
        
        // Draw links (render first so they appear behind nodes)
        const linkGroup = svg.append('g').attr('class', 'links');
        
        aggregatedLinks.forEach(link => {
            const sourcePos = positions[link.source];
            const targetPos = positions[link.target];
            
            if (!sourcePos || !targetPos) return;
            
            // Skip links with no data
            if (link.value === 0) return;
            
            // Calculate opacity and width based on value
            const opacity = 0.3 + (link.value / maxValue) * 0.5;
            const strokeWidth = 3 + (link.value / maxValue) * 12;
            
            // Create curved path
            const path = d3.path();
            const x1 = sourcePos.x + sourcePos.width / 2;
            const y1 = sourcePos.y + sourcePos.height / 2;
            const x2 = targetPos.x - targetPos.width / 2;
            const y2 = targetPos.y + targetPos.height / 2;
            const midX = (x1 + x2) / 2;
            
            path.moveTo(x1, y1);
            path.bezierCurveTo(midX, y1, midX, y2, x2, y2);
            
            // Use hardcoded color for better compatibility
            const linkColor = '#667eea'; // Purple color
            
            const linkPath = linkGroup.append('path')
                .attr('d', path.toString())
                .attr('class', 'flow-link')
                .attr('stroke', linkColor)
                .attr('stroke-width', strokeWidth)
                .attr('stroke-opacity', opacity)
                .attr('fill', 'none')
                .attr('stroke-linecap', 'round')
                .style('cursor', 'pointer');
            
            // Add tooltip
            linkPath.append('title')
                .text(`${link.value.toLocaleString()} messages`);
            
            // Add hover effect
            linkPath.on('mouseover', function() {
                d3.select(this)
                    .attr('stroke', '#f093fb') // Brighter pink on hover
                    .attr('stroke-opacity', Math.min(opacity + 0.3, 1))
                    .attr('stroke-width', strokeWidth + 2);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke', linkColor)
                    .attr('stroke-opacity', opacity)
                    .attr('stroke-width', strokeWidth);
            });
            
            // Debug logging
            if (aggregatedLinks.indexOf(link) === 0) {
                console.log('First link rendered:', {
                    source: link.source,
                    target: link.target,
                    value: link.value,
                    strokeWidth,
                    opacity,
                    path: path.toString()
                });
            }
        });
        
        // Draw nodes (render after links so they appear on top)
        const nodeGroup = svg.append('g').attr('class', 'nodes');
        
        data.nodes.forEach(node => {
            const pos = positions[node.id];
            if (!pos) return;
            
            const nodeG = nodeGroup.append('g')
                .attr('transform', `translate(${pos.x - pos.width / 2},${pos.y})`)
                .style('cursor', 'pointer');
            
            // Node rectangle with shadow
            nodeG.append('rect')
                .attr('class', 'flow-node')
                .attr('width', pos.width)
                .attr('height', pos.height)
                .attr('rx', 8)
                .attr('fill', this.getNodeColor(node.type))
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
            
            // Node label
            nodeG.append('text')
                .attr('class', 'flow-node-label')
                .attr('x', pos.width / 2)
                .attr('y', pos.height / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('fill', '#fff')
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .text(node.name);
            
            // Add hover effect
            nodeG.on('mouseover', function() {
                d3.select(this).select('rect')
                    .attr('stroke-width', 3)
                    .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .attr('stroke-width', 2)
                    .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
            });
        });
        
        // Add legend
        this.addFlowLegend(svg, width, height);
    },
    
    /**
     * Get color for node type
     */
    getNodeColor(type) {
        const colors = {
            day: '#667eea',      // Purple
            time: '#f093fb',     // Pink
            sender: '#4facfe'    // Blue
        };
        return colors[type] || colors.day;
    },
    
    /**
     * Add legend to flow diagram
     */
    addFlowLegend(svg, width, height) {
        const legendData = [
            { label: 'Day Type', color: '#667eea' },
            { label: 'Time Period', color: '#f093fb' },
            { label: 'Sender', color: '#4facfe' }
        ];
        
        const legend = svg.append('g')
            .attr('class', 'flow-legend')
            .attr('transform', `translate(10, ${height - 80})`);
        
        legendData.forEach((item, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);
            
            legendItem.append('rect')
                .attr('width', 20)
                .attr('height', 20)
                .attr('rx', 4)
                .attr('fill', item.color);
            
            legendItem.append('text')
                .attr('x', 30)
                .attr('y', 15)
                .attr('fill', 'var(--text-primary)')
                .attr('font-size', '12px')
                .text(item.label);
        });
    }
};

// Make globally available
window.VizFlow = VizFlow;
