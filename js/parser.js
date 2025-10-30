/**
 * Parser Module
 * Handles JSON parsing and validation
 */

const Parser = {
    /**
     * Parse and validate JSON data
     * @param {string} jsonString - Raw JSON string
     * @returns {Object} Parsed data object
     */
    parseJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate structure
            if (!this.validateStructure(data)) {
                throw new Error('Invalid JSON structure');
            }
            
            return data;
        } catch (error) {
            console.error('Parse error:', error);
            throw new Error(`Failed to parse JSON: ${error.message}`);
        }
    },
    
    /**
     * Validate JSON structure
     * @param {Object} data - Parsed JSON object
     * @returns {boolean} True if valid
     */
    validateStructure(data) {
        // Check required hierarchy
        if (!data['Direct Message']) {
            console.error('Missing "Direct Message" key');
            return false;
        }
        
        if (!data['Direct Message']['Direct Messages']) {
            console.error('Missing "Direct Messages" key');
            return false;
        }
        
        if (!data['Direct Message']['Direct Messages']['ChatHistory']) {
            console.error('Missing "ChatHistory" key');
            return false;
        }
        
        const chatHistory = data['Direct Message']['Direct Messages']['ChatHistory'];
        
        // Check if there are any conversations
        if (Object.keys(chatHistory).length === 0) {
            console.error('No conversations found');
            return false;
        }
        
        // Validate conversation keys
        for (const key in chatHistory) {
            if (!key.startsWith('Chat History with ') || !key.endsWith(':')) {
                console.error(`Invalid conversation key: ${key}`);
                return false;
            }
            
            if (!Array.isArray(chatHistory[key])) {
                console.error(`Conversation ${key} is not an array`);
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * Extract conversations from parsed data
     * @param {Object} data - Parsed JSON object
     * @returns {Object} Object with conversations
     */
    extractConversations(data) {
        const chatHistory = data['Direct Message']['Direct Messages']['ChatHistory'];
        const conversations = {};
        
        for (const key in chatHistory) {
            // Extract person name from key
            const personName = key.replace('Chat History with ', '').replace(':', '');
            const messages = chatHistory[key];
            
            // Validate and parse messages
            const validMessages = [];
            for (const msg of messages) {
                if (this.validateMessage(msg)) {
                    validMessages.push(this.parseMessage(msg));
                }
            }
            
            if (validMessages.length > 0) {
                conversations[personName] = validMessages;
            }
        }
        
        return conversations;
    },
    
    /**
     * Validate individual message
     * @param {Object} message - Message object
     * @returns {boolean} True if valid
     */
    validateMessage(message) {
        if (!message.Date || !message.From || message.Content === undefined) {
            return false;
        }
        return true;
    },
    
    /**
     * Parse individual message
     * @param {Object} message - Raw message object
     * @returns {Object} Parsed message with additional fields
     */
    parseMessage(message) {
        // Offset, in hours
        let timezoneOffset = window.convoHelper.timezoneOffset || 0;
        const date = new Date(message.Date.replace(' ', 'T'));
        // Apply timezone offset
        date.setHours(date.getHours() + timezoneOffset);

        const { processedContent, messageType } = this.processContent(message.Content);
        return {
            date: date,
            timestamp: date.getTime(),
            from: message.From,
            content: processedContent,
            type: messageType,
            // ISO week number
            week: this.getISOWeek(date),
            year: date.getFullYear(),
            month: date.getMonth(), // 0-11
            day: date.getDate(),
            hour: date.getHours(),
            dayOfWeek: date.getDay() // 0 (Sunday) - 6 (Saturday)
        };
    },
    
    /**
     * Detect message type based on content
     * @param {string} content - Message content
     * @returns {Object} Processed content and type
     */
    processContent(content) {
        // Replace sticker, media, and link into desired format, cleaner
        let cleanContent = content;
        const decode = str => decodeURIComponent(str);

        // 1, Sticker handling --> sticker
        // Example: "[https://media.tenor.com/HtqnVrUcTecAAAAl/plink-cat-blink.webp]" --> "[Sticker: plink-cat-blink]"
        // Example 2: "[https://media.tenor.com/YjLre9jqK4IAAAAl/h%E1%BA%A3-l%C3%A0-sao.webp]" --> "[Sticker: hả-là-sao]"
        // const stickerRegex = /\[https?:\/\/[^\]]*\/([a-zA-Z0-9-_]+)\.(webp|gif|png|jpg|jpeg)\]/g;
        const stickerRegex = /\[https?:\/\/[^\]]*\/([^\/\]]+?)\.(webp|gif|png|jpg|jpeg)\]/g;
        cleanContent = cleanContent.replace(stickerRegex, (match, p1) => {
            // try decode p1
            return `[Sticker: ${decode(p1)}]`;
        });
        // 2, Tiktok Video --> media
        // Example: "https://www.tiktokv.com/share/video/7555462846398631176/" --> "[Media: TikTok Video]"
        const tiktokRegex = /https?:\/\/(?:www\.|m\.)?tiktok(?:v)?\.com\/(?:share\/video\/|@[\w.-]+\/video\/)(\d+)(?:[/?#&].*)?/gi;
        cleanContent = cleanContent.replace(tiktokRegex, (match, p1) => {
            return `[Media: TikTok Video]`;
        });

        // 3, Link handling --> either a media (video/image) or link
        const linkRegex = /https?:\/\/[^\s]+/g;
        
        // Determine type
        if (cleanContent.trim() === '') {
            return { processedContent: '', messageType: 'empty' };
        } else if (stickerRegex.test(content)) {
            return { processedContent: cleanContent, messageType: 'sticker' };
        } else if (tiktokRegex.test(content)) {
            return { processedContent: cleanContent, messageType: 'media' };
        } else if (linkRegex.test(content)) {
            // Check if any media links were found
            const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi'];
            const links = content.match(linkRegex) || [];
            // either a media (video/image) or link
            for (const link of links) {
                for (const ext of mediaExtensions) {
                    if (link.toLowerCase().endsWith(ext)) {
                        return { processedContent: cleanContent, messageType: 'media' };
                    }
                }
            }
            // Get the base path only
            const urlObj = new URL(links[0]);
            cleanContent = "[Link: " + urlObj.hostname + urlObj.pathname + "]";
            return { processedContent: cleanContent, messageType: 'link' };
        } else {
            return { processedContent: cleanContent, messageType: 'text' };
        }
    },

    
    /**
     * Get ISO week number for a date
     * @param {Date} date - Date object
     * @returns {number} ISO week number (1-53)
     */
    getISOWeek(date) {
        const target = new Date(date.valueOf());
        const dayNr = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - target) / 604800000);
    },
    
    /**
     * Get week date range
     * @param {number} year - Year
     * @param {number} week - ISO week number
     * @returns {Object} Start and end dates
     */
    getWeekDateRange(year, week) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        
        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
        
        return {
            start: ISOweekStart,
            end: ISOweekEnd
        };
    },
    
    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    },
    
    /**
     * Format date range for display
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {string} Formatted date range
     */
    formatDateRange(start, end) {
        if (start.getFullYear() === end.getFullYear() && 
            start.getMonth() === end.getMonth()) {
            return `${this.formatDate(start)} - ${end.getDate()}`;
        }
        return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }
};
