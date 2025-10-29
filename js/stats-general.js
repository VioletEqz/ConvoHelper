/**
 * Stats General Module
 * Generates statistics for overview/general page
 */

const StatsGeneral = {
    /**
     * Generate enhanced overview statistics with new metrics
     * @param {Object} processed - All processed conversations
     * @returns {Object} Enhanced overview stats
     */
    generateEnhancedOverviewStats(processed) {
        const basicStats = Stats.generateOverviewStats(processed);
        
        // Collect all messages for global analysis
        const allMessages = [];
        for (const person in processed) {
            allMessages.push(...processed[person].messages);
        }
        
        return {
            ...basicStats,
            dayOfWeekDistribution: Processor.getMessagesByDayOfWeek(allMessages),
            peakActivity: Processor.findPeakActivity(processed),
            conversationBalanceScores: this.calculateAllBalanceScores(processed),
            conversationDensityScores: this.calculateAllDensityScores(processed),
            activityCategories: Processor.categorizeByActivity(processed),
            contentTypeDistribution: this.calculateGlobalContentDistribution(allMessages),
            messageLengthDistribution: this.calculateGlobalLengthDistribution(allMessages),
            messageVelocity: Processor.calculateMessageVelocity(allMessages)
        };
    },
    
    /**
     * Calculate balance scores for all conversations
     * @param {Object} processed - Processed conversations
     * @returns {Array} Sorted array of balance scores
     */
    calculateAllBalanceScores(processed) {
        const scores = [];
        
        for (const person in processed) {
            const balance = Processor.calculateBalanceScore(processed[person].messages);
            scores.push({
                name: person,
                score: parseFloat(balance.score),
                yourPercentage: parseFloat(balance.yourPercentage),
                theirPercentage: parseFloat(balance.theirPercentage)
            });
        }
        
        return scores.sort((a, b) => b.score - a.score);
    },
    
    /**
     * Calculate density scores for all conversations
     * @param {Object} processed - Processed conversations
     * @returns {Array} Sorted array of density scores
     */
    calculateAllDensityScores(processed) {
        const scores = [];
        let maxDensity = 0;
        
        // First pass: calculate raw densities
        for (const person in processed) {
            const data = processed[person];
            const daysDiff = Math.ceil((data.lastMessage.date - data.firstMessage.date) / (1000 * 60 * 60 * 24)) || 1;
            const density = data.totalMessages / daysDiff;
            
            if (density > maxDensity) maxDensity = density;
            
            scores.push({
                name: person,
                density: density,
                messagesPerDay: density.toFixed(2)
            });
        }
        
        // Second pass: calculate percentages
        for (const score of scores) {
            score.percentage = maxDensity > 0 ? ((score.density / maxDensity) * 100).toFixed(1) : 0;
        }
        
        return scores.sort((a, b) => b.density - a.density);
    },
    
    /**
     * Calculate global content type distribution
     * @param {Array} messages - All messages
     * @returns {Object} Content distribution with percentages
     */
    calculateGlobalContentDistribution(messages) {
        const types = { text: 0, link: 0, media: 0, sticker: 0, empty: 0 };
        
        for (const msg of messages) {
            if (types[msg.type] !== undefined) {
                types[msg.type]++;
            } else {
                types.text++;
            }
        }
        
        const total = messages.length;
        
        return {
            counts: types,
            percentages: {
                text: ((types.text / total) * 100).toFixed(1),
                link: ((types.link / total) * 100).toFixed(1),
                media: ((types.media / total) * 100).toFixed(1),
                sticker: ((types.sticker / total) * 100).toFixed(1),
                empty: ((types.empty / total) * 100).toFixed(1)
            }
        };
    },
    
    /**
     * Calculate global message length distribution
     * @param {Array} messages - All messages
     * @returns {Object} Length distribution
     */
    calculateGlobalLengthDistribution(messages) {
        const lengths = { short: 0, medium: 0, long: 0 };
        
        for (const msg of messages) {
            if (msg.type === 'text' && msg.content) {
                const wordCount = msg.content.trim().split(/\s+/).length;
                
                if (wordCount <= 5) {
                    lengths.short++;
                } else if (wordCount <= 20) {
                    lengths.medium++;
                } else {
                    lengths.long++;
                }
            }
        }
        
        const total = lengths.short + lengths.medium + lengths.long;
        
        return {
            counts: lengths,
            percentages: {
                short: total > 0 ? ((lengths.short / total) * 100).toFixed(1) : 0,
                medium: total > 0 ? ((lengths.medium / total) * 100).toFixed(1) : 0,
                long: total > 0 ? ((lengths.long / total) * 100).toFixed(1) : 0
            }
        };
    }
};
