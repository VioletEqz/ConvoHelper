/**
 * Word Cloud Visualization Module
 * Creates an interactive word cloud from conversation messages
 * Supports bilingual (English + Vietnamese) text with n-gram extraction
 */

const VizWordCloud = {
    stopWords: null,
    
    async loadStopWords() {
        if (this.stopWords) return this.stopWords;
        
        try {
            const response = await fetch('data/stopwords.txt');
            const text = await response.text();
            this.stopWords = new Set(
                text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'))
            );
            return this.stopWords;
        } catch (error) {
            console.warn('Failed to load stopwords, using defaults:', error);
            this.stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it']);
            return this.stopWords;
        }
    },
    
    async render(container, personName, data, options = {}) {
        if (!d3 || !container || !data) {
            console.warn('Word cloud: Missing dependencies');
            return;
        }
        
        container.innerHTML = '';
        
        const personData = data.byPerson[personName];
        if (!personData || !personData.messages) {
            container.innerHTML = '<div class="no-data">No data available</div>';
            return;
        }
        
        await this.loadStopWords();
        
        const words = this.extractWords(personData.messages, options);
        if (words.length === 0) {
            container.innerHTML = '<div class="no-data">Not enough text data</div>';
            return;
        }
        
        this.createWordCloud(container, words, options);
    },
    
    normalizeVietnamese(text) {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    
    /**
     * Extract n-grams from a word array
     * @param {Array} words - Array of words
     * @param {number} n - Size of n-gram (2, 3, 4, etc.)
     * @returns {Array} Array of n-grams
     */
    extractNGrams(words, n) {
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    },
    
    extractWords(messages, options = {}) {
        const minWordLength = options.minWordLength || 2;
        const maxWords = options.maxWords || 100;
        const includePhrases = options.includePhrases !== false;
        const ngramSize = options.ngramSize || 2;
        const minPhraseOccurrence = options.minPhraseOccurrence || 3;
        
        const wordCounts = new Map();
        const phraseCounts = new Map();
        
        // Process only text messages
        const textMessages = messages.filter(msg => msg.type === 'text' && msg.content);
        
        textMessages.forEach(msg => {
            // Normalize Vietnamese text
            const normalized = this.normalizeVietnamese(msg.content);
            
            // Extract words
            const words = normalized
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length >= minWordLength && !this.stopWords.has(w));
            
            // Count individual words
            words.forEach(word => {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            });
            
            // Extract and count n-grams
            if (includePhrases && words.length >= ngramSize) {
                const ngrams = this.extractNGrams(words, ngramSize);
                ngrams.forEach(phrase => {
                    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
                });
            }
        });
        
        // Convert to array and sort
        const wordArray = Array.from(wordCounts.entries())
            .map(([text, count]) => ({ text, count, type: 'word' }));
        
        const phraseArray = Array.from(phraseCounts.entries())
            .filter(([_, count]) => count >= minPhraseOccurrence)
            .map(([text, count]) => ({ text, count, type: 'phrase' }));
        
        // Combine and sort by count
        const combined = [...wordArray, ...phraseArray]
            .sort((a, b) => b.count - a.count)
            .slice(0, maxWords);
        
        return combined;
    },
    
    createWordCloud(container, words, options = {}) {
        const width = container.clientWidth || 800;
        const height = 400;
        
        const maxCount = d3.max(words, d => d.count);
        const minCount = d3.min(words, d => d.count);
        
        const fontSize = d3.scaleLinear()
            .domain([minCount, maxCount])
            .range([12, 60]);
        
        const colorScale = d3.scaleSequential()
            .domain([minCount, maxCount])
            .interpolator(d3.interpolateBlues);
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('overflow', 'hidden');
        
        const g = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);
        
        const tooltip = VizUtils.createTooltip(container);
        
        // Initialize positions randomly but within bounds
        words.forEach(d => {
            d.x = (Math.random() - 0.5) * (width * 0.8);
            d.y = (Math.random() - 0.5) * (height * 0.8);
        });
        
        const simulation = d3.forceSimulation(words)
            .force('charge', d3.forceManyBody().strength(-30))
            .force('center', d3.forceCenter(0, 0).strength(0.05))
            .force('collision', d3.forceCollide().radius(d => fontSize(d.count) + 4))
            .force('x', d3.forceX(0).strength(0.1))
            .force('y', d3.forceY(0).strength(0.1))
            .on('tick', ticked);
        
        const texts = g.selectAll('text')
            .data(words)
            .enter()
            .append('text')
            .text(d => d.text)
            .attr('font-size', d => fontSize(d.count))
            .attr('fill', d => colorScale(d.count))
            .attr('font-weight', d => d.type === 'phrase' ? 'bold' : 'normal')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('font-weight', 'bold')
                    .attr('fill', VizUtils.getColor('--color-primary'));
                
                const typeLabel = d.type === 'phrase' ? 'Phrase' : 'Word';
                VizUtils.showTooltip(tooltip, `<strong>${d.text}</strong><br>${typeLabel}: ${d.count} times`, event);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('font-weight', d.type === 'phrase' ? 'bold' : 'normal')
                    .attr('fill', colorScale(d.count));
                
                VizUtils.hideTooltip(tooltip);
            });
        
        function ticked() {
            // Constrain positions to stay within SVG bounds
            const padding = 20;
            const halfWidth = width / 2 - padding;
            const halfHeight = height / 2 - padding;
            
            words.forEach(d => {
                // Estimate text width based on font size
                const textWidth = d.text.length * fontSize(d.count) * 0.6;
                const textHeight = fontSize(d.count);
                
                // Clamp x position
                d.x = Math.max(-halfWidth + textWidth / 2, 
                              Math.min(halfWidth - textWidth / 2, d.x));
                
                // Clamp y position
                d.y = Math.max(-halfHeight + textHeight / 2,
                              Math.min(halfHeight - textHeight / 2, d.y));
            });
            
            texts
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }
    }
};

window.VizWordCloud = VizWordCloud;
