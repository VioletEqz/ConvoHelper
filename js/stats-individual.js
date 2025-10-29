/**
 * Stats Individual Module
 * Generates statistics for individual person pages
 */

const StatsIndividual = {
    /**
     * Generate enhanced statistics for a person
     * @param {Object} processedData - Processed data for one person
     * @param {number} totalMessages - Total messages across all conversations
     * @returns {Object} Enhanced statistics object
     */
    generateEnhancedPersonStats(processedData, totalMessages) {
        const basicStats = Stats.generatePersonStats(processedData, totalMessages);
        const messages = processedData.messages;
        
        return {
            ...basicStats,
            // Timing & Response Patterns
            responseTimes: Processor.calculateResponseTimes(messages),
            initiatorScore: Processor.calculateInitiatorScore(messages),
            messageBursts: Processor.detectMessageBursts(messages),
            dayOfWeekPreference: Processor.getMessagesByDayOfWeek(messages),
            timeOfDayPreference: Processor.getTimeOfDayDistribution(messages),
            
            // Engagement & Consistency
            gapsAndStreaks: Processor.calculateGapsAndStreaks(messages),
            consistencyScore: Processor.calculateConsistencyScore(messages),
            balanceScore: Processor.calculateBalanceScore(messages),
            
            // Content Analysis
            contentTypeBreakdown: this.getDetailedContentBreakdown(messages),
            questionRatio: this.calculateQuestionRatio(messages),
            messageLengthProfile: this.calculateMessageLengthProfile(messages),
            
            // Historical & Milestones
            mostActiveDay: this.findMostActiveDay(messages),
            milestones: this.calculateMilestones(processedData),
            activityTrend: this.calculateActivityTrend(processedData.monthGroups)
        };
    },
    
    /**
     * Get detailed content breakdown for a person
     * @param {Array} messages - Messages array
     * @returns {Object} Detailed content statistics
     */
    getDetailedContentBreakdown(messages) {
        const breakdown = Stats.countMessageTypes(messages);
        const total = messages.length;
        
        return {
            counts: breakdown,
            percentages: {
                text: ((breakdown.text / total) * 100).toFixed(1),
                link: ((breakdown.link / total) * 100).toFixed(1),
                media: ((breakdown.media / total) * 100).toFixed(1),
                sticker: ((breakdown.sticker / total) * 100).toFixed(1),
                empty: ((breakdown.empty / total) * 100).toFixed(1)
            }
        };
    },
    
    /**
     * Calculate question ratio
     * @param {Array} messages - Messages array
     * @returns {Object} Question statistics
     */
    calculateQuestionRatio(messages) {
        let questionCount = 0;
        let textMessageCount = 0;
        
        for (const msg of messages) {
            if (msg.type === 'text' && msg.content) {
                textMessageCount++;
                if (msg.content.includes('?')) {
                    questionCount++;
                }
            }
        }
        
        return {
            questionCount: questionCount,
            textMessageCount: textMessageCount,
            percentage: textMessageCount > 0 ? ((questionCount / textMessageCount) * 100).toFixed(1) : 0
        };
    },
    
    /**
     * Calculate message length profile
     * @param {Array} messages - Messages array
     * @returns {Object} Length profile statistics
     */
    calculateMessageLengthProfile(messages) {
        const lengths = { short: 0, medium: 0, long: 0 };
        let totalWords = 0;
        let textMessageCount = 0;
        
        for (const msg of messages) {
            if (msg.type === 'text' && msg.content) {
                const wordCount = msg.content.trim().split(/\s+/).length;
                totalWords += wordCount;
                textMessageCount++;
                
                if (wordCount <= 5) {
                    lengths.short++;
                } else if (wordCount <= 20) {
                    lengths.medium++;
                } else {
                    lengths.long++;
                }
            }
        }
        
        const avgWordsPerMessage = textMessageCount > 0 ? (totalWords / textMessageCount).toFixed(1) : 0;
        const total = lengths.short + lengths.medium + lengths.long;
        
        return {
            avgWordsPerMessage: avgWordsPerMessage,
            distribution: lengths,
            percentages: {
                short: total > 0 ? ((lengths.short / total) * 100).toFixed(1) : 0,
                medium: total > 0 ? ((lengths.medium / total) * 100).toFixed(1) : 0,
                long: total > 0 ? ((lengths.long / total) * 100).toFixed(1) : 0
            }
        };
    },
    
    /**
     * Find most active single day
     * @param {Array} messages - Messages array
     * @returns {Object} Most active day information
     */
    findMostActiveDay(messages) {
        const dayCounts = {};
        
        for (const msg of messages) {
            const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
            dayCounts[dateKey] = (dayCounts[dateKey] || 0) + 1;
        }
        
        let maxDate = null;
        let maxCount = 0;
        
        for (const dateKey in dayCounts) {
            if (dayCounts[dateKey] > maxCount) {
                maxCount = dayCounts[dateKey];
                maxDate = dateKey;
            }
        }
        
        return {
            date: maxDate ? new Date(maxDate) : null,
            count: maxCount,
            dateString: maxDate
        };
    },
    
    /**
     * Calculate milestones
     * @param {Object} processedData - Processed data for a person
     * @returns {Array} Array of milestone objects
     */
    calculateMilestones(processedData) {
        const milestones = [];
        const messages = processedData.messages;
        
        // First message
        if (messages.length > 0) {
            milestones.push({
                type: 'first',
                date: messages[0].date,
                message: 'First message',
                icon: '🎉'
            });
        }
        
        // Message count milestones
        const countMilestones = [100, 500, 1000, 5000, 10000];
        for (const milestone of countMilestones) {
            if (messages.length >= milestone) {
                const milestoneMsg = messages[milestone - 1];
                milestones.push({
                    type: 'count',
                    date: milestoneMsg.date,
                    message: `${milestone.toLocaleString()}th message`,
                    icon: '💯'
                });
            }
        }
        
        // Anniversary milestones (yearly)
        const firstDate = messages[0].date;
        const lastDate = messages[messages.length - 1].date;
        const yearsDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365);
        
        for (let year = 1; year <= Math.floor(yearsDiff); year++) {
            const anniversaryDate = new Date(firstDate);
            anniversaryDate.setFullYear(anniversaryDate.getFullYear() + year);
            
            milestones.push({
                type: 'anniversary',
                date: anniversaryDate,
                message: `${year} year${year > 1 ? 's' : ''} of conversation`,
                icon: '🎂'
            });
        }
        
        // Sort by date
        milestones.sort((a, b) => a.date - b.date);
        
        return milestones;
    },
    
    /**
     * Calculate activity trend
     * @param {Object} monthGroups - Month groups data
     * @returns {Object} Trend information
     */
    calculateActivityTrend(monthGroups) {
        const sortedKeys = Object.keys(monthGroups).sort();
        
        if (sortedKeys.length < 6) {
            return {
                trend: 'insufficient_data',
                percentage: 0,
                direction: 'stable'
            };
        }
        
        // Compare last 3 months to previous 3 months
        const lastThreeKeys = sortedKeys.slice(-3);
        const prevThreeKeys = sortedKeys.slice(-6, -3);
        
        let lastThreeTotal = 0;
        let prevThreeTotal = 0;
        
        for (const key of lastThreeKeys) {
            lastThreeTotal += monthGroups[key].totalMessages;
        }
        
        for (const key of prevThreeKeys) {
            prevThreeTotal += monthGroups[key].totalMessages;
        }
        
        const percentageChange = prevThreeTotal > 0 
            ? ((lastThreeTotal - prevThreeTotal) / prevThreeTotal * 100).toFixed(1)
            : 0;
        
        let direction = 'stable';
        if (Math.abs(percentageChange) > 10) {
            direction = percentageChange > 0 ? 'up' : 'down';
        }
        
        return {
            trend: direction,
            percentage: Math.abs(percentageChange),
            lastThreeTotal: lastThreeTotal,
            prevThreeTotal: prevThreeTotal,
            direction: direction
        };
    }
};
