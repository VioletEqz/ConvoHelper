/**
 * Stats Comparative Module
 * Generates comparative analytics across conversations
 */

const StatsComparative = {
    /**
     * Generate comparative analytics across all conversations
     * @param {Object} processed - All processed conversations
     * @returns {Object} Comparative analytics data
     */
    generateComparativeAnalytics(processed) {
        return {
            rankings: this.generateRankings(processed),
            styleClusters: this.identifyStyleClusters(processed),
            overallPersonality: this.generateOverallPersonality(processed)
        };
    },
    
    /**
     * Generate rankings for various metrics
     * @param {Object} processed - Processed conversations
     * @returns {Object} Rankings by different criteria
     */
    generateRankings(processed) {
        const messageCount = Processor.sortParticipantsByCount(processed);
        const density = StatsGeneral.calculateAllDensityScores(processed);
        const balance = StatsGeneral.calculateAllBalanceScores(processed);
        const recency = [];
        
        for (const person in processed) {
            const daysSince = (Date.now() - processed[person].lastMessage.timestamp) / (1000 * 60 * 60 * 24);
            recency.push({
                name: person,
                daysSince: Math.floor(daysSince),
                lastMessage: processed[person].lastMessage.date
            });
        }
        
        recency.sort((a, b) => a.daysSince - b.daysSince);
        
        return {
            byMessageCount: messageCount,
            byDensity: density,
            byBalance: balance,
            byRecency: recency
        };
    },
    
    /**
     * Identify communication style clusters
     * @param {Object} processed - Processed conversations
     * @returns {Object} Style clusters
     */
    identifyStyleClusters(processed) {
        const clusters = {
            mediaSharers: [],
            deepThinkers: [],
            quickChatters: [],
            casualFriends: []
        };
        
        for (const person in processed) {
            const messages = processed[person].messages;
            const data = processed[person];
            
            // Calculate metrics
            const mediaRatio = (Stats.countLinks(messages) + Stats.countMedia(messages)) / messages.length;
            const avgWords = Stats.countWords(messages) / Math.max(1, messages.filter(m => m.type === 'text').length);
            const questionRatio = StatsIndividual.calculateQuestionRatio(messages).percentage / 100;
            const density = data.totalMessages / Math.ceil((data.lastMessage.date - data.firstMessage.date) / (1000 * 60 * 60 * 24));
            
            // Classify into clusters (can belong to multiple)
            if (mediaRatio > 0.2) {
                clusters.mediaSharers.push({ name: person, score: (mediaRatio * 100).toFixed(1) });
            }
            
            if (avgWords > 15 && questionRatio > 0.15) {
                clusters.deepThinkers.push({ name: person, score: avgWords.toFixed(1) });
            }
            
            if (density > 5 && avgWords < 10) {
                clusters.quickChatters.push({ name: person, score: density.toFixed(1) });
            }
            
            if (density < 1 && density > 0.1) {
                clusters.casualFriends.push({ name: person, score: density.toFixed(2) });
            }
        }
        
        return clusters;
    },
    
    /**
     * Generate overall communication personality
     * @param {Object} processed - Processed conversations
     * @returns {Object} Overall personality profile
     */
    generateOverallPersonality(processed) {
        const allMessages = [];
        let totalResponseTimes = [];
        let totalInitiations = { you: 0, total: 0 };
        
        for (const person in processed) {
            const messages = processed[person].messages;
            allMessages.push(...messages);
            
            const responseTimes = Processor.calculateResponseTimes(messages);
            if (responseTimes.yourAverage > 0) {
                totalResponseTimes.push(responseTimes.yourAverage);
            }
            
            const initiator = Processor.calculateInitiatorScore(messages);
            totalInitiations.you += initiator.youInitiated;
            totalInitiations.total += initiator.youInitiated + initiator.themInitiated;
        }
        
        const avgResponseTime = totalResponseTimes.length > 0
            ? totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length
            : 0;
        
        const initiatorPercentage = totalInitiations.total > 0
            ? (totalInitiations.you / totalInitiations.total * 100).toFixed(1)
            : 0;
        
        const dayOfWeek = Processor.getMessagesByDayOfWeek(allMessages);
        const mostActiveDay = dayOfWeek.indexOf(Math.max(...dayOfWeek));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const timeOfDay = Processor.getTimeOfDayDistribution(allMessages);
        const mostActiveTime = Object.keys(timeOfDay).reduce((a, b) => timeOfDay[a] > timeOfDay[b] ? a : b);
        
        const lengthProfile = StatsIndividual.calculateMessageLengthProfile(allMessages);
        
        return {
            avgResponseTime: avgResponseTime.toFixed(0),
            initiatorTendency: initiatorPercentage,
            mostActiveDay: dayNames[mostActiveDay],
            mostActiveTime: mostActiveTime,
            avgMessageLength: lengthProfile.avgWordsPerMessage,
            totalConversations: Object.keys(processed).length
        };
    }
};
