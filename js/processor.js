/**
 * Processor Module
 * Handles message clustering by weeks and grouping into months
 */

const Processor = {
    /**
     * Get user identity with fallback logic
     * If the selected identity doesn't exist in the conversation participants, use the first sender
     * @param {Array} messages - Array of messages to check
     * @returns {string} The identity to use for "you"
     */
    getUserIdentity(messages) {
        const userIdentity = window.appData?.userIdentity;
        
        if (!userIdentity) {
            return 'you'; // Fallback to default
        }
        
        // Check if the selected identity exists in this conversation
        const senders = new Set(messages.map(m => m.from));
        
        if (senders.has(userIdentity)) {
            return userIdentity;
        }
        
        // If not, use the first sender as fallback
        return messages.length > 0 ? messages[0].from : 'you';
    },
    
    /**
     * Process conversations - cluster by weeks and group into months
     * @param {Object} conversations - Conversations object from Parser
     * @returns {Object} Processed data with clustering
     */
    processConversations(conversations) {
        const processed = {};
        
        for (const person in conversations) {
            const messages = conversations[person];
            
            // Sort messages by timestamp
            messages.sort((a, b) => a.timestamp - b.timestamp);
            
            // Cluster by weeks
            const weekClusters = this.clusterByWeeks(messages);
            
            // Group weeks into months
            const monthGroups = this.groupIntoMonths(weekClusters);
            
            processed[person] = {
                messages: messages,
                totalMessages: messages.length,
                weekClusters: weekClusters,
                monthGroups: monthGroups,
                firstMessage: messages[0],
                lastMessage: messages[messages.length - 1]
            };
        }
        
        return processed;
    },
    
    /**
     * Cluster messages by ISO weeks
     * @param {Array} messages - Array of parsed messages
     * @returns {Object} Messages clustered by week
     */
    clusterByWeeks(messages) {
        const weeks = {};
        
        for (const msg of messages) {
            const key = `${msg.year}-W${String(msg.week).padStart(2, '0')}`;
            
            if (!weeks[key]) {
                weeks[key] = {
                    year: msg.year,
                    week: msg.week,
                    messages: [],
                    count: 0,
                    dateRange: null
                };
            }
            
            weeks[key].messages.push(msg);
            weeks[key].count++;
        }
        
        // Calculate date ranges for each week
        for (const key in weeks) {
            const weekData = weeks[key];
            const range = Parser.getWeekDateRange(weekData.year, weekData.week);
            weekData.dateRange = range;
        }
        
        return weeks;
    },
    
    /**
     * Group week clusters into months
     * @param {Object} weekClusters - Week clusters object
     * @returns {Object} Weeks grouped by month
     */
    groupIntoMonths(weekClusters) {
        const months = {};
        
        for (const weekKey in weekClusters) {
            const week = weekClusters[weekKey];
            
            // Use the first message of the week to determine the month
            if (week.messages.length > 0) {
                const firstMsg = week.messages[0];
                const monthKey = `${firstMsg.year}-${String(firstMsg.month + 1).padStart(2, '0')}`;
                
                if (!months[monthKey]) {
                    months[monthKey] = {
                        year: firstMsg.year,
                        month: firstMsg.month,
                        weeks: [],
                        totalMessages: 0,
                        monthName: this.getMonthName(firstMsg.month)
                    };
                }
                
                months[monthKey].weeks.push({
                    key: weekKey,
                    ...week
                });
                months[monthKey].totalMessages += week.count;
            }
        }
        
        // Sort weeks within each month
        for (const monthKey in months) {
            months[monthKey].weeks.sort((a, b) => {
                return a.year === b.year ? a.week - b.week : a.year - b.year;
            });
        }
        
        return months;
    },
    
    /**
     * Get month name from month index
     * @param {number} monthIndex - Month index (0-11)
     * @returns {string} Month name
     */
    getMonthName(monthIndex) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex];
    },
    
    /**
     * Get all unique participants from conversations
     * @param {Object} conversations - Conversations object
     * @returns {Array} Array of participant names
     */
    getParticipants(conversations) {
        return Object.keys(conversations);
    },
    
    /**
     * Sort participants by message count
     * @param {Object} processed - Processed conversations
     * @returns {Array} Sorted array of {name, count} objects
     */
    sortParticipantsByCount(processed) {
        const participants = [];
        
        for (const person in processed) {
            participants.push({
                name: person,
                count: processed[person].totalMessages
            });
        }
        
        participants.sort((a, b) => b.count - a.count);
        
        return participants;
    },
    
    /**
     * Get date range for all conversations
     * @param {Object} processed - Processed conversations
     * @returns {Object} Overall date range
     */
    getDateRange(processed) {
        let earliest = null;
        let latest = null;
        
        for (const person in processed) {
            const data = processed[person];
            
            if (!earliest || data.firstMessage.timestamp < earliest) {
                earliest = data.firstMessage.timestamp;
            }
            
            if (!latest || data.lastMessage.timestamp > latest) {
                latest = data.lastMessage.timestamp;
            }
        }
        
        return {
            start: new Date(earliest),
            end: new Date(latest)
        };
    },
    
    /**
     * Get total message count across all conversations
     * @param {Object} processed - Processed conversations
     * @returns {number} Total message count
     */
    getTotalMessageCount(processed) {
        let total = 0;
        
        for (const person in processed) {
            total += processed[person].totalMessages;
        }
        
        return total;
    },
    
    /**
     * Calculate message distribution percentages
     * @param {Object} processed - Processed conversations
     * @returns {Object} Distribution percentages by person
     */
    calculateDistribution(processed) {
        const total = this.getTotalMessageCount(processed);
        const distribution = {};
        
        for (const person in processed) {
            const count = processed[person].totalMessages;
            distribution[person] = {
                count: count,
                percentage: ((count / total) * 100).toFixed(1)
            };
        }
        
        return distribution;
    },
    
    /**
     * Get messages by date (for timeline chart)
     * @param {Object} processed - Processed conversations
     * @returns {Object} Messages grouped by date
     */
    getMessagesByDate(processed) {
        const byDate = {};
        
        for (const person in processed) {
            const messages = processed[person].messages;
            
            for (const msg of messages) {
                const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
                
                if (!byDate[dateKey]) {
                    byDate[dateKey] = {
                        date: new Date(msg.year, msg.month, msg.day),
                        count: 0
                    };
                }
                
                byDate[dateKey].count++;
            }
        }
        
        return byDate;
    },
    
    /**
     * Get messages by hour (for activity chart)
     * @param {Array} messages - Array of messages
     * @returns {Array} Count for each hour (0-23)
     */
    getMessagesByHour(messages) {
        const byHour = new Array(24).fill(0);
        
        for (const msg of messages) {
            byHour[msg.hour]++;
        }
        
        return byHour;
    },
    
    /**
     * Get messages by month (for monthly chart)
     * @param {Object} monthGroups - Month groups from processed data
     * @returns {Array} Array of {month, count} objects
     */
    getMessagesByMonth(monthGroups) {
        const result = [];
        
        // Sort month keys chronologically
        const sortedKeys = Object.keys(monthGroups).sort();
        
        for (const key of sortedKeys) {
            const month = monthGroups[key];
            result.push({
                key: key,
                year: month.year,
                month: month.month,
                monthName: month.monthName,
                count: month.totalMessages
            });
        }
        
        return result;
    },
    
    /**
     * Calculate average messages per day
     * @param {Object} processed - Processed data for a person
     * @returns {number} Average messages per day
     */
    calculateAveragePerDay(processed) {
        const firstDate = processed.firstMessage.date;
        const lastDate = processed.lastMessage.date;
        const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) || 1;
        
        return (processed.totalMessages / daysDiff).toFixed(1);
    },
    
    /**
     * Find most active month
     * @param {Object} monthGroups - Month groups
     * @returns {Object} Most active month data
     */
    findMostActiveMonth(monthGroups) {
        let mostActive = null;
        let maxCount = 0;
        
        for (const key in monthGroups) {
            const month = monthGroups[key];
            if (month.totalMessages > maxCount) {
                maxCount = month.totalMessages;
                mostActive = month;
            }
        }
        
        return mostActive;
    },
    
    // ========================================
    // ENHANCED ANALYTICS - NEW FUNCTIONS
    // ========================================
    
    /**
     * Get messages by day of week (0=Sunday, 6=Saturday)
     * @param {Array} messages - Array of messages
     * @returns {Array} Count for each day (length 7)
     */
    getMessagesByDayOfWeek(messages) {
        const byDay = new Array(7).fill(0);
        
        for (const msg of messages) {
            const date = new Date(msg.timestamp);
            const dayOfWeek = date.getDay();
            byDay[dayOfWeek]++;
        }
        
        return byDay;
    },
    
    /**
     * Get messages by time of day blocks
     * @param {Array} messages - Array of messages
     * @returns {Object} Count for each time block
     */
    getTimeOfDayDistribution(messages) {
        const distribution = {
            morning: 0,    // 5-11
            afternoon: 0,  // 12-17
            evening: 0,    // 18-22
            night: 0       // 23-4
        };
        
        for (const msg of messages) {
            const hour = msg.hour;
            if (hour >= 5 && hour <= 11) {
                distribution.morning++;
            } else if (hour >= 12 && hour <= 17) {
                distribution.afternoon++;
            } else if (hour >= 18 && hour <= 22) {
                distribution.evening++;
            } else {
                distribution.night++;
            }
        }
        
        return distribution;
    },
    
    /**
     * Calculate response times between message exchanges
     * @param {Array} messages - Array of messages (must have 'from' field)
     * @returns {Object} Response time statistics
     */
    calculateResponseTimes(messages) {
        if (messages.length === 0) {
            return { yourAverage: 0, theirAverage: 0, yourMedian: 0, theirMedian: 0 };
        }
        
        const userIdentity = this.getUserIdentity(messages);
        const responseTimes = {
            you: [],
            them: []
        };
        
        for (let i = 1; i < messages.length; i++) {
            const prevMsg = messages[i - 1];
            const currMsg = messages[i];
            
            // Check if this is a response (different senders)
            if (prevMsg.from !== currMsg.from) {
                const timeDiff = (currMsg.timestamp - prevMsg.timestamp) / (1000 * 60); // minutes
                
                if (currMsg.from === userIdentity) {
                    responseTimes.you.push(timeDiff);
                } else {
                    responseTimes.them.push(timeDiff);
                }
            }
        }
        
        const avgYou = responseTimes.you.length > 0 
            ? responseTimes.you.reduce((a, b) => a + b, 0) / responseTimes.you.length 
            : 0;
        const avgThem = responseTimes.them.length > 0
            ? responseTimes.them.reduce((a, b) => a + b, 0) / responseTimes.them.length
            : 0;
        
        return {
            yourAverage: avgYou,
            theirAverage: avgThem,
            yourMedian: this.calculateMedian(responseTimes.you),
            theirMedian: this.calculateMedian(responseTimes.them)
        };
    },
    
    /**
     * Calculate median of an array
     * @param {Array} arr - Array of numbers
     * @returns {number} Median value
     */
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    },
    
    /**
     * Detect message bursts (rapid exchanges)
     * @param {Array} messages - Array of messages
     * @returns {Array} Array of burst objects
     */
    detectMessageBursts(messages) {
        const bursts = [];
        const BURST_THRESHOLD = 30; // minutes
        const MIN_BURST_SIZE = 5; // messages
        
        let currentBurst = [];
        
        for (let i = 0; i < messages.length; i++) {
            if (currentBurst.length === 0) {
                currentBurst.push(messages[i]);
                continue;
            }
            
            const lastMsg = currentBurst[currentBurst.length - 1];
            const timeDiff = (messages[i].timestamp - lastMsg.timestamp) / (1000 * 60); // minutes
            
            if (timeDiff <= BURST_THRESHOLD) {
                currentBurst.push(messages[i]);
            } else {
                if (currentBurst.length >= MIN_BURST_SIZE) {
                    bursts.push({
                        start: currentBurst[0].date,
                        end: currentBurst[currentBurst.length - 1].date,
                        messageCount: currentBurst.length,
                        duration: (currentBurst[currentBurst.length - 1].timestamp - currentBurst[0].timestamp) / (1000 * 60)
                    });
                }
                currentBurst = [messages[i]];
            }
        }
        
        // Check last burst
        if (currentBurst.length >= MIN_BURST_SIZE) {
            bursts.push({
                start: currentBurst[0].date,
                end: currentBurst[currentBurst.length - 1].date,
                messageCount: currentBurst.length,
                duration: (currentBurst[currentBurst.length - 1].timestamp - currentBurst[0].timestamp) / (1000 * 60)
            });
        }
        
        return bursts;
    },
    
    /**
     * Calculate conversation gaps and streaks
     * @param {Array} messages - Array of messages
     * @returns {Object} Gaps and streaks data
     */
    calculateGapsAndStreaks(messages) {
        if (messages.length === 0) {
            return { longestGap: 0, currentStreak: 0, longestStreak: 0, gaps: [] };
        }
        
        const gaps = [];
        let currentStreak = 1;
        let longestStreak = 1;
        let tempStreak = 1;
        
        // Get unique dates
        const uniqueDates = new Set();
        for (const msg of messages) {
            const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
            uniqueDates.add(dateKey);
        }
        
        const sortedDates = Array.from(uniqueDates).sort();
        
        // Calculate gaps between consecutive messages
        for (let i = 1; i < messages.length; i++) {
            const gapDays = (messages[i].timestamp - messages[i - 1].timestamp) / (1000 * 60 * 60 * 24);
            if (gapDays > 1) {
                gaps.push({
                    start: messages[i - 1].date,
                    end: messages[i].date,
                    days: Math.floor(gapDays)
                });
            }
        }
        
        // Calculate streaks (consecutive days with messages)
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
                tempStreak = 1;
            }
        }
        
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        
        // Current streak (from last message to today)
        const lastDate = messages[messages.length - 1].date;
        const today = new Date();
        const daysSinceLastMsg = (today - lastDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastMsg <= 1) {
            // Count backwards for current streak
            for (let i = sortedDates.length - 1; i > 0; i--) {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
                
                if (dayDiff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        } else {
            currentStreak = 0;
        }
        
        const longestGap = gaps.length > 0 ? Math.max(...gaps.map(g => g.days)) : 0;
        
        return {
            longestGap: longestGap,
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            gaps: gaps.sort((a, b) => b.days - a.days).slice(0, 5) // Top 5 gaps
        };
    },
    
    /**
     * Calculate conversation initiator score
     * @param {Array} messages - Array of messages
     * @returns {Object} Initiator statistics
     */
    calculateInitiatorScore(messages) {
        if (messages.length === 0) {
            return { youInitiated: 0, themInitiated: 0, yourPercentage: 0, theirPercentage: 0 };
        }
        
        const GAP_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        const userIdentity = this.getUserIdentity(messages);
        
        let youInitiated = 0;
        let themInitiated = 0;
        
        for (let i = 1; i < messages.length; i++) {
            const timeDiff = messages[i].timestamp - messages[i - 1].timestamp;
            
            if (timeDiff > GAP_THRESHOLD) {
                // This is a new conversation start
                if (messages[i].from === userIdentity) {
                    youInitiated++;
                } else {
                    themInitiated++;
                }
            }
        }
        
        // First message is always an initiation
        if (messages.length > 0) {
            if (messages[0].from === userIdentity) {
                youInitiated++;
            } else {
                themInitiated++;
            }
        }
        
        const total = youInitiated + themInitiated;
        
        return {
            youInitiated: youInitiated,
            themInitiated: themInitiated,
            yourPercentage: total > 0 ? ((youInitiated / total) * 100).toFixed(1) : 0,
            theirPercentage: total > 0 ? ((themInitiated / total) * 100).toFixed(1) : 0
        };
    },
    
    /**
     * Find peak activity times
     * @param {Object} processed - Processed conversations data
     * @returns {Object} Peak activity information
     */
    findPeakActivity(processed) {
        const allMessages = [];
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        const weekCounts = {};
        const monthCounts = {};
        const dateCounts = {};
        
        for (const person in processed) {
            const messages = processed[person].messages;
            allMessages.push(...messages);
            
            for (const msg of messages) {
                hourCounts[msg.hour]++;
                dayCounts[new Date(msg.timestamp).getDay()]++;
                
                const weekKey = `${msg.year}-W${String(msg.week).padStart(2, '0')}`;
                weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
                
                const monthKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}`;
                monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                
                const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
                dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
            }
        }
        
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
        
        const peakWeekKey = Object.keys(weekCounts).reduce((a, b) => 
            weekCounts[a] > weekCounts[b] ? a : b, Object.keys(weekCounts)[0]);
        
        const peakMonthKey = Object.keys(monthCounts).reduce((a, b) => 
            monthCounts[a] > monthCounts[b] ? a : b, Object.keys(monthCounts)[0]);
        
        const peakDateKey = Object.keys(dateCounts).reduce((a, b) => 
            dateCounts[a] > dateCounts[b] ? a : b, Object.keys(dateCounts)[0]);
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return {
            peakHour: {
                hour: peakHour,
                count: hourCounts[peakHour],
                label: `${peakHour}:00`
            },
            peakDay: {
                day: peakDay,
                count: dayCounts[peakDay],
                label: dayNames[peakDay]
            },
            peakWeek: {
                week: peakWeekKey,
                count: weekCounts[peakWeekKey]
            },
            peakMonth: {
                month: peakMonthKey,
                count: monthCounts[peakMonthKey]
            },
            peakDate: {
                date: peakDateKey,
                count: dateCounts[peakDateKey]
            }
        };
    },
    
    /**
     * Calculate message velocity (messages per hour during active periods)
     * @param {Array} messages - Array of messages
     * @returns {number} Average messages per hour
     */
    calculateMessageVelocity(messages) {
        if (messages.length === 0) return 0;
        
        // Group messages by date
        const messagesByDate = {};
        for (const msg of messages) {
            const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
            if (!messagesByDate[dateKey]) {
                messagesByDate[dateKey] = [];
            }
            messagesByDate[dateKey].push(msg);
        }
        
        // Calculate active hours per day and messages
        let totalActiveHours = 0;
        let totalMessages = 0;
        
        for (const dateKey in messagesByDate) {
            const dayMessages = messagesByDate[dateKey];
            const uniqueHours = new Set(dayMessages.map(m => m.hour));
            totalActiveHours += uniqueHours.size;
            totalMessages += dayMessages.length;
        }
        
        return totalActiveHours > 0 ? (totalMessages / totalActiveHours).toFixed(2) : 0;
    },
    
    /**
     * Categorize conversations by activity level
     * @param {Object} processed - Processed conversations
     * @returns {Object} Categorized conversations
     */
    categorizeByActivity(processed) {
        const now = Date.now();
        const DAY_MS = 1000 * 60 * 60 * 24;
        
        const categories = {
            active: [],     // Last message within 30 days
            recent: [],     // Last message 30-90 days
            dormant: []     // Last message > 90 days
        };
        
        for (const person in processed) {
            const lastMessageTime = processed[person].lastMessage.timestamp;
            const daysSinceLastMessage = (now - lastMessageTime) / DAY_MS;
            
            const entry = {
                name: person,
                daysSince: Math.floor(daysSinceLastMessage),
                lastMessage: processed[person].lastMessage.date
            };
            
            if (daysSinceLastMessage <= 30) {
                categories.active.push(entry);
            } else if (daysSinceLastMessage <= 90) {
                categories.recent.push(entry);
            } else {
                categories.dormant.push(entry);
            }
        }
        
        return categories;
    },
    
    /**
     * Calculate conversation balance score
     * @param {Array} messages - Array of messages with 'from' field
     * @returns {Object} Balance statistics
     */
    calculateBalanceScore(messages) {
        if (messages.length === 0) {
            return { score: 0, yourPercentage: 0, theirPercentage: 0, youCount: 0, themCount: 0 };
        }
        
        const userIdentity = this.getUserIdentity(messages);
        let youCount = 0;
        let themCount = 0;
        
        for (const msg of messages) {
            if (msg.from === userIdentity) {
                youCount++;
            } else {
                themCount++;
            }
        }
        
        const total = youCount + themCount;
        if (total === 0) return { score: 0, yourPercentage: 0, theirPercentage: 0, youCount: 0, themCount: 0 };
        
        const yourPercentage = (youCount / total) * 100;
        const theirPercentage = (themCount / total) * 100;
        
        // Balance score: 100 = perfectly balanced (50/50), 0 = completely one-sided
        const score = 100 - (Math.abs(50 - yourPercentage) * 2);
        
        return {
            score: score.toFixed(1),
            yourPercentage: yourPercentage.toFixed(1),
            theirPercentage: theirPercentage.toFixed(1),
            youCount: youCount,
            themCount: themCount
        };
    },
    
    /**
     * Calculate conversation consistency score
     * @param {Array} messages - Array of messages
     * @returns {Object} Consistency statistics
     */
    calculateConsistencyScore(messages) {
        if (messages.length === 0) return { score: 0, stdDev: 0 };
        
        // Group by date
        const messagesByDate = {};
        for (const msg of messages) {
            const dateKey = `${msg.year}-${String(msg.month + 1).padStart(2, '0')}-${String(msg.day).padStart(2, '0')}`;
            messagesByDate[dateKey] = (messagesByDate[dateKey] || 0) + 1;
        }
        
        const counts = Object.values(messagesByDate);
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower standard deviation = more consistent
        // Convert to 0-100 score where 100 is most consistent
        const maxStdDev = mean; // Worst case scenario
        const score = maxStdDev > 0 ? Math.max(0, 100 - (stdDev / maxStdDev * 100)) : 100;
        
        return {
            score: score.toFixed(1),
            stdDev: stdDev.toFixed(2),
            avgPerDay: mean.toFixed(1)
        };
    }
};
