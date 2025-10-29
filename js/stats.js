/**
 * Stats Module
 * Generates statistics for conversations
 */

const Stats = {
    /**
     * Generate comprehensive statistics for a person
     * @param {Object} processedData - Processed data for one person
     * @param {number} totalMessages - Total messages across all conversations
     * @returns {Object} Statistics object
     */
    generatePersonStats(processedData, totalMessages) {
        const messages = processedData.messages;
        const monthGroups = processedData.monthGroups;
        
        return {
            totalMessages: processedData.totalMessages,
            percentage: ((processedData.totalMessages / totalMessages) * 100).toFixed(1),
            avgPerDay: Processor.calculateAveragePerDay(processedData),
            dateRange: {
                start: processedData.firstMessage.date,
                end: processedData.lastMessage.date
            },
            messageTypes: this.countMessageTypes(messages),
            byMonth: Processor.getMessagesByMonth(monthGroups),
            byHour: Processor.getMessagesByHour(messages),
            mostActiveMonth: Processor.findMostActiveMonth(monthGroups),
            linkCount: this.countLinks(messages),
            mediaCount: this.countMedia(messages),
            wordCount: this.countWords(messages)
        };
    },
    
    /**
     * Count message types
     * @param {Array} messages - Array of messages
     * @returns {Object} Count by type
     */
    countMessageTypes(messages) {
        const types = { text: 0, link: 0, media: 0, sticker: 0, empty: 0 };
        
        for (const msg of messages) {
            if (types[msg.type] !== undefined) {
                types[msg.type]++;
            } else {
                // Fallback for unknown types
                types.text++;
            }
        }
        
        return types;
    },
    
    /**
     * Count links in messages
     * @param {Array} messages - Array of messages
     * @returns {number} Link count
     */
    countLinks(messages) {
        return messages.filter(m => m.type === 'link').length;
    },
    
    /**
     * Count media in messages
     * @param {Array} messages - Array of messages
     * @returns {number} Media count
     */
    countMedia(messages) {
        return messages.filter(m => m.type === 'media').length;
    },
    
    /**
     * Count words in text messages
     * @param {Array} messages - Array of messages
     * @returns {number} Approximate word count
     */
    countWords(messages) {
        let wordCount = 0;
        
        for (const msg of messages) {
            if (msg.type === 'text' && msg.content) {
                wordCount += msg.content.trim().split(/\s+/).length;
            }
        }
        
        return wordCount;
    },
    
    /**
     * Generate overview statistics for all conversations
     * @param {Object} processed - All processed conversations
     * @returns {Object} Overview stats
     */
    generateOverviewStats(processed) {
        const totalMessages = Processor.getTotalMessageCount(processed);
        const dateRange = Processor.getDateRange(processed);
        const distribution = Processor.calculateDistribution(processed);
        const sorted = Processor.sortParticipantsByCount(processed);
        
        return {
            totalMessages: totalMessages,
            totalConversations: Object.keys(processed).length,
            dateRange: dateRange,
            distribution: distribution,
            topConversations: sorted,
            messagesByDate: Processor.getMessagesByDate(processed)
        };
    }
};
