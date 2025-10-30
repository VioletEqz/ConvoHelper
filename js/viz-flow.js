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
        
        // Prepare flow data
        const flowData = this.prepareFlowData(personData.messages, data.userIdentity);
        
        if (flowData.nodes.length === 0 || flowData.links.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough data to create flow diagram</div>';
            return;
        }
        
        // Create SVG
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        
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
            const date = new Date(msg.timestamp_ms);
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
        
        // Draw links
        const linkGroup = svg.append('g').attr('class', 'links');
        
        aggregatedLinks.forEach(link => {
            const sourcePos = positions[link.source];
            const targetPos = positions[link.target];
            
            if (!sourcePos || !targetPos) return;
            
            const opacity = 0.2 + (link.value / maxValue) * 0.6;
            
            // Create curved path
            const path = d3.path();
            const x1 = sourcePos.x + sourcePos.width / 2;
            const y1 = sourcePos.y + sourcePos.height / 2;
            const x2 = targetPos.x - targetPos.width / 2;
            const y2 = targetPos.y + targetPos.height / 2;
            const midX = (x1 + x2) / 2;
            
            path.moveTo(x1, y1);
            path.bezierCurveTo(midX, y1, midX, y2, x2, y2);
            
            linkGroup.append('path')
                .attr('d', path.toString())
                .attr('class', 'flow-link')
                .attr('stroke', getComputedStyle(document.documentElement).getPropertyValue('--color-primary'))
                .attr('stroke-width', 2 + (link.value / maxValue) * 6)
                .attr('stroke-opacity', opacity)
                .attr('fill', 'none')
                .append('title')
                .text(`${link.value} messages`);
        });
        
        // Draw nodes
        const nodeGroup = svg.append('g').attr('class', 'nodes');
        
        data.nodes.forEach(node => {
            const pos = positions[node.id];
            if (!pos) return;
            
            const nodeG = nodeGroup.append('g')
                .attr('transform', `translate(${pos.x - pos.width / 2},${pos.y})`);
            
            // Node rectangle
            nodeG.append('rect')
                .attr('class', 'flow-node')
                .attr('width', pos.width)
                .attr('height', pos.height)
                .attr('rx', 8)
                .attr('fill', this.getNodeColor(node.type));
            
            // Node label
            nodeG.append('text')
                .attr('class', 'flow-node-label')
                .attr('x', pos.width / 2)
                .attr('y', pos.height / 2)
                .attr('dy', '0.35em')
                .text(node.name);
        });
    },
    
    /**
     * Get color for node type
     */
    getNodeColor(type) {
        const colors = {
            day: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'),
            time: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary'),
            sender: getComputedStyle(document.documentElement).getPropertyValue('--color-success')
        };
        return colors[type] || colors.day;
    }
};

// Make globally available
window.VizFlow = VizFlow;
