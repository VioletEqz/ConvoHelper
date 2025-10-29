/**
 * UI Module
 * Handles UI state and interactions
 */

const UI = {
    currentPage: 'upload',
    currentPerson: null,
    selectedWeeks: new Set(),
    
    /**
     * Navigate to a page
     * @param {string} pageName - Page name (upload, processing, overview, individual, export)
     */
    navigateTo(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
        }
    },
    
    /**
     * Show toast message
     * @param {string} message - Message to display
     */
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },
    
    /**
     * Update progress bar
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} text - Progress text
     */
    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText && text) {
            progressText.textContent = text;
        }
    },
    
    /**
     * Update processing step status
     * @param {string} step - Step name
     * @param {string} status - Status (active, complete)
     */
    updateStep(step, status) {
        const stepEl = document.querySelector(`.step[data-step="${step}"]`);
        if (!stepEl) return;
        
        stepEl.classList.remove('active', 'complete');
        stepEl.classList.add(status);
        
        const icon = stepEl.querySelector('.step-icon');
        if (status === 'complete') {
            icon.textContent = '✅';
        }
    },
    
    /**
     * Populate overview page
     * @param {Object} stats - Overview statistics
     */
    populateOverview(stats) {
        // Update stat cards
        document.getElementById('stat-total-messages').textContent = 
            stats.totalMessages.toLocaleString();
        document.getElementById('stat-total-convos').textContent = 
            stats.totalConversations;
        document.getElementById('stat-date-range').textContent = 
            `${Parser.formatDate(stats.dateRange.start)} - ${Parser.formatDate(stats.dateRange.end)}`;
        
        // Create timeline chart
        Charts.createTimelineChart('chart-timeline', stats.messagesByDate);
        
        // Create distribution chart
        Charts.createDistributionChart('chart-distribution', stats.topConversations);
        
        // Populate top conversations list
        this.populateTopConversations(stats.topConversations);
        
        // Populate person jumper
        this.populatePersonJumper(stats.topConversations);
        
        // Populate enhanced analytics if available
        if (window.appData.enhancedOverviewStats) {
            this.populateEnhancedOverview(window.appData.enhancedOverviewStats);
        }
    },
    
    /**
     * Populate enhanced overview analytics
     * @param {Object} enhanced - Enhanced stats
     */
    populateEnhancedOverview(enhanced) {
        // Day of week chart
        Charts.createDayOfWeekChart('chart-day-of-week', enhanced.dayOfWeekDistribution);
        
        // Peak activity stats
        const peak = enhanced.peakActivity;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        document.getElementById('peak-hour').textContent = `${peak.peakHour.hour}:00`;
        document.getElementById('peak-day').textContent = dayNames[peak.peakDay.day];
        document.getElementById('peak-month').textContent = peak.peakMonth.month;
        const velocity = typeof enhanced.messageVelocity === 'number' || typeof enhanced.messageVelocity === 'string'
            ? parseFloat(enhanced.messageVelocity).toFixed(1)
            : (enhanced.messageVelocity?.avgPerHour || 0).toFixed(1);
        document.getElementById('msg-velocity').textContent = `${velocity}/hr`;
        
        // Content types chart
        Charts.createContentTypeChart('chart-content-types', enhanced.contentTypeDistribution);
        
        // Message lengths chart
        Charts.createLengthDistributionChart('chart-msg-lengths', enhanced.messageLengthDistribution);
        
        // Balance scores chart
        Charts.createBalanceScoreChart('chart-balance', enhanced.conversationBalanceScores.slice(0, 10));
        
        // Density scores chart
        Charts.createDensityScoreChart('chart-density', enhanced.conversationDensityScores.slice(0, 10));
        
        // Heatmaps - collect all messages from processed data
        const allMessages = [];
        for (const person in window.appData.processed) {
            allMessages.push(...window.appData.processed[person].messages);
        }
        ChartsHeatmap.createHourDayWeekHeatmap('chart-heatmap-hour-day', allMessages);
        ChartsHeatmap.createMonthDayHeatmap('chart-heatmap-month-day', allMessages);
        
        // Activity categories
        this.populateActivityCategories(enhanced.activityCategories);
    },
    
    /**
     * Populate activity categories
     * @param {Object} categories - Activity categories
     */
    populateActivityCategories(categories) {
        const container = document.getElementById('activity-categories');
        container.innerHTML = '';
        
        const categoryConfig = [
            { key: 'active', title: '🔥 Active', subtitle: 'Messaged in last 7 days', color: '#4CAF50' },
            { key: 'recent', title: '⏰ Recent', subtitle: 'Messaged in last 30 days', color: '#FF9800' },
            { key: 'dormant', title: '💤 Dormant', subtitle: 'No messages in 30+ days', color: '#9E9E9E' }
        ];
        
        categoryConfig.forEach(config => {
            const list = categories[config.key];
            const names = list.map(item => item.name || item);
            const div = document.createElement('div');
            div.className = 'activity-category';
            div.innerHTML = `
                <h4 style="color: ${config.color}">${config.title}</h4>
                <p class="category-subtitle">${config.subtitle}</p>
                <p class="category-count">${list.length} conversation${list.length !== 1 ? 's' : ''}</p>
                <div class="category-list">${names.slice(0, 5).join(', ')}${names.length > 5 ? ` +${names.length - 5} more` : ''}</div>
            `;
            container.appendChild(div);
        });
    },
    
    /**
     * Populate top conversations list
     * @param {Array} topConversations - Sorted conversations
     */
    populateTopConversations(topConversations) {
        const container = document.getElementById('top-conversations');
        container.innerHTML = '';
        
        const maxCount = topConversations[0]?.count || 1;
        const top10 = topConversations.slice(0, 10);
        
        top10.forEach((conv, index) => {
            const percentage = (conv.count / maxCount) * 100;
            
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.innerHTML = `
                <div class="conversation-rank">${index + 1}</div>
                <div class="conversation-name">${conv.name}</div>
                <div class="conversation-count">${conv.count.toLocaleString()} msgs</div>
                <div class="conversation-bar">
                    <div class="conversation-bar-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.viewPerson(conv.name);
            });
            
            container.appendChild(item);
        });
    },
    
    /**
     * Populate person jumper dropdown
     * @param {Array} conversations - Conversations list
     */
    populatePersonJumper(conversations) {
        const jumper = document.getElementById('person-jumper');
        jumper.innerHTML = '<option value="">Jump to person...</option>';
        
        conversations.forEach(conv => {
            const option = document.createElement('option');
            option.value = conv.name;
            option.textContent = `${conv.name} (${conv.count})`;
            jumper.appendChild(option);
        });
        
        jumper.classList.remove('hidden');
    },
    
    /**
     * View individual person page
     * @param {string} personName - Person name
     */
    viewPerson(personName) {
        this.currentPerson = personName;
        this.navigateTo('individual');
        
        const data = window.appData.processed[personName];
        const stats = Stats.generatePersonStats(data, window.appData.overviewStats.totalMessages);
        const enhancedStats = StatsIndividual.generateEnhancedPersonStats(data, window.appData.overviewStats.totalMessages);
        
        // Update header
        document.getElementById('individual-name').textContent = `👤 ${personName}`;
        
        // Update stats
        document.getElementById('ind-total-messages').textContent = 
            stats.totalMessages.toLocaleString();
        document.getElementById('ind-percentage').textContent = 
            `${stats.percentage}%`;
        document.getElementById('ind-avg-day').textContent = 
            stats.avgPerDay;
        
        // Create charts
        Charts.createMonthlyChart('chart-by-month', stats.byMonth);
        Charts.createHourlyChart('chart-by-hour', stats.byHour);
        
        // Populate enhanced individual stats
        this.populateEnhancedIndividual(enhancedStats);
        
        // Populate timeline
        this.populateTimeline(data.monthGroups);
        
        // Populate person switcher
        this.populatePersonSwitcher();
    },
    
    /**
     * Populate enhanced individual statistics
     * @param {Object} enhanced - Enhanced stats
     */
    populateEnhancedIndividual(enhanced) {
        console.log('Populating enhanced individual stats:', enhanced);
        
        // Response times
        if (enhanced.responseTimes) {
            const rt = enhanced.responseTimes;
            document.getElementById('your-avg-response').textContent = 
                `${Math.round(rt.yourAverage)} min`;
            document.getElementById('their-avg-response').textContent = 
                `${Math.round(rt.theirAverage)} min`;
        }
        
        // Balance score
        if (enhanced.balanceScore) {
            const balance = enhanced.balanceScore;
            document.getElementById('balance-score').textContent = `${balance.score}%`;
            document.getElementById('you-percentage').textContent = `${balance.yourPercentage}%`;
            document.getElementById('them-percentage').textContent = `${balance.theirPercentage}%`;
        }
        
        // Initiator score
        if (enhanced.initiatorScore) {
            const init = enhanced.initiatorScore;
            document.getElementById('you-initiated').textContent = `${init.yourPercentage}%`;
            document.getElementById('them-initiated').textContent = `${init.theirPercentage}%`;
        }
        
        // Streaks
        if (enhanced.gapsAndStreaks) {
            const gs = enhanced.gapsAndStreaks;
            document.getElementById('current-streak').textContent = `${gs.currentStreak} days`;
            document.getElementById('longest-streak').textContent = `${gs.longestStreak} days`;
            document.getElementById('longest-gap').textContent = `${gs.longestGap} days`;
        }
        
        // Message length profile
        if (enhanced.messageLengthProfile) {
            const mlp = enhanced.messageLengthProfile;
            document.getElementById('avg-words').textContent = mlp.avgWordsPerMessage;
        }
        
        // Activity trend
        if (enhanced.activityTrend) {
            const trend = enhanced.activityTrend;
            const trendEmoji = trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️';
            document.getElementById('activity-trend').textContent = 
                `${trendEmoji} ${trend.direction === 'stable' ? 'Stable' : trend.percentage + '% ' + trend.direction}`;
        }
        
        // Create additional charts
        if (enhanced.dayOfWeekPreference) {
            Charts.createDayOfWeekChart('chart-ind-day-of-week', enhanced.dayOfWeekPreference);
        }
        
        if (enhanced.contentTypeBreakdown) {
            Charts.createContentTypeChart('chart-ind-content-types', enhanced.contentTypeBreakdown);
        }
        
        if (enhanced.messageLengthProfile) {
            Charts.createLengthDistributionChart('chart-ind-msg-lengths', enhanced.messageLengthProfile);
        }
        
        // Populate milestones
        if (enhanced.milestones) {
            this.populateMilestones(enhanced.milestones);
        }
        
        // Populate message bursts
        if (enhanced.messageBursts) {
            this.populateMessageBursts(enhanced.messageBursts);
        }
    },
    
    /**
     * Populate milestones list
     * @param {Array} milestones - Milestones array
     */
    populateMilestones(milestones) {
        const container = document.getElementById('milestones-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show last 5 milestones
        const recentMilestones = milestones.slice(-5).reverse();
        
        recentMilestones.forEach(milestone => {
            const item = document.createElement('div');
            item.className = 'milestone-item';
            item.innerHTML = `
                <span class="milestone-icon">${milestone.icon}</span>
                <div class="milestone-info">
                    <div class="milestone-message">${milestone.message}</div>
                    <div class="milestone-date">${Parser.formatDate(milestone.date)}</div>
                </div>
            `;
            container.appendChild(item);
        });
    },
    
    /**
     * Populate message bursts
     * @param {Array} bursts - Message bursts array
     */
    populateMessageBursts(bursts) {
        const container = document.getElementById('message-bursts-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show top 5 bursts by message count
        const topBursts = bursts.sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
        
        if (topBursts.length === 0) {
            container.innerHTML = '<p class="no-data">No significant message bursts detected</p>';
            return;
        }
        
        topBursts.forEach(burst => {
            const item = document.createElement('div');
            item.className = 'burst-item';
            item.innerHTML = `
                <div class="burst-count">${burst.messageCount} msgs</div>
                <div class="burst-info">
                    <div class="burst-duration">${Math.round(burst.duration)} minutes</div>
                    <div class="burst-date">${Parser.formatDate(burst.start)}</div>
                </div>
            `;
            container.appendChild(item);
        });
    },
    
    /**
     * Populate timeline
     * @param {Object} monthGroups - Month groups data
     */
    populateTimeline(monthGroups) {
        const container = document.getElementById('timeline-container');
        container.innerHTML = '';
        
        const sortedKeys = Object.keys(monthGroups).sort().reverse();
        
        sortedKeys.forEach(monthKey => {
            const month = monthGroups[monthKey];
            
            const monthEl = document.createElement('div');
            monthEl.className = 'timeline-month';
            
            const header = document.createElement('div');
            header.className = 'timeline-month-header';
            header.innerHTML = `
                <span class="timeline-expand">▶</span>
                <span class="timeline-month-name">${month.monthName} ${month.year}</span>
                <span class="timeline-month-count">${month.totalMessages} messages</span>
            `;
            
            const weeksContainer = document.createElement('div');
            weeksContainer.className = 'timeline-weeks';
            
            month.weeks.forEach(week => {
                const weekEl = document.createElement('div');
                weekEl.className = 'timeline-week';
                weekEl.innerHTML = `
                    <strong>Week ${week.week}</strong>: ${week.count} messages
                    (${Parser.formatDateRange(week.dateRange.start, week.dateRange.end)})
                `;
                weeksContainer.appendChild(weekEl);
            });
            
            header.addEventListener('click', () => {
                monthEl.classList.toggle('expanded');
            });
            
            monthEl.appendChild(header);
            monthEl.appendChild(weeksContainer);
            container.appendChild(monthEl);
        });
    },
    
    /**
     * Populate person switcher dropdown
     */
    populatePersonSwitcher() {
        const switcher = document.getElementById('person-switcher');
        switcher.innerHTML = '<option value="">Select person...</option>';
        
        const sorted = window.appData.overviewStats.topConversations;
        sorted.forEach(conv => {
            const option = document.createElement('option');
            option.value = conv.name;
            option.textContent = conv.name;
            if (conv.name === this.currentPerson) {
                option.selected = true;
            }
            switcher.appendChild(option);
        });
    },
    
    /**
     * Navigate to export page for current person
     */
    gotoExport() {
        if (!this.currentPerson) return;
        
        this.navigateTo('export');
        this.selectedWeeks.clear();
        
        document.getElementById('export-person-name').textContent = 
            `Exporting: ${this.currentPerson}`;
        
        const data = window.appData.processed[this.currentPerson];
        this.populateExportTimeline(data.monthGroups);
        this.updateExportSummary();
    },
    
    /**
     * Populate export timeline with checkboxes
     * @param {Object} monthGroups - Month groups data
     */
    populateExportTimeline(monthGroups) {
        const container = document.getElementById('export-timeline');
        container.innerHTML = '';
        
        const sortedKeys = Object.keys(monthGroups).sort().reverse();
        
        sortedKeys.forEach(monthKey => {
            const month = monthGroups[monthKey];
            
            const monthEl = document.createElement('div');
            monthEl.className = 'export-month';
            
            const monthCheckbox = `month-check-${monthKey}`;
            
            const header = document.createElement('div');
            header.className = 'export-month-header';
            header.innerHTML = `
                <input type="checkbox" class="export-checkbox month-checkbox" id="${monthCheckbox}" data-month="${monthKey}">
                <span class="export-expand">▶</span>
                <label for="${monthCheckbox}" style="flex: 1; cursor: pointer;">
                    ${month.monthName} ${month.year} (${month.totalMessages} messages)
                </label>
            `;
            
            const weeksContainer = document.createElement('div');
            weeksContainer.className = 'export-weeks';
            
            month.weeks.forEach(week => {
                const weekCheckbox = `week-check-${week.key}`;
                
                const weekEl = document.createElement('div');
                weekEl.className = 'export-week';
                weekEl.innerHTML = `
                    <input type="checkbox" class="export-checkbox week-checkbox" id="${weekCheckbox}" 
                           data-week="${week.key}" data-month="${monthKey}">
                    <label for="${weekCheckbox}" style="flex: 1; cursor: pointer;">
                        Week ${week.week}: ${week.count} messages
                    </label>
                `;
                weeksContainer.appendChild(weekEl);
            });
            
            // Toggle expand on click
            header.querySelector('.export-expand').addEventListener('click', (e) => {
                e.stopPropagation();
                monthEl.classList.toggle('expanded');
            });
            
            // Month checkbox logic
            const monthCheck = header.querySelector('.month-checkbox');
            monthCheck.addEventListener('change', (e) => {
                const weekCheckboxes = weeksContainer.querySelectorAll('.week-checkbox');
                weekCheckboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    if (e.target.checked) {
                        this.selectedWeeks.add(cb.dataset.week);
                    } else {
                        this.selectedWeeks.delete(cb.dataset.week);
                    }
                });
                this.updateExportSummary();
            });
            
            // Week checkboxes logic
            weeksContainer.querySelectorAll('.week-checkbox').forEach(weekCheck => {
                weekCheck.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedWeeks.add(e.target.dataset.week);
                    } else {
                        this.selectedWeeks.delete(e.target.dataset.week);
                        monthCheck.checked = false;
                    }
                    this.updateExportSummary();
                });
            });
            
            monthEl.appendChild(header);
            monthEl.appendChild(weeksContainer);
            container.appendChild(monthEl);
        });
    },
    
    /**
     * Update export summary statistics
     */
    updateExportSummary() {
        const data = window.appData.processed[this.currentPerson];
        const weekClusters = data.weekClusters;
        
        let totalMessages = 0;
        this.selectedWeeks.forEach(weekKey => {
            const week = weekClusters[weekKey];
            if (week) {
                totalMessages += week.count;
            }
        });
        
        document.getElementById('summary-weeks').textContent = this.selectedWeeks.size;
        document.getElementById('summary-messages').textContent = totalMessages.toLocaleString();
        document.getElementById('summary-files').textContent = this.selectedWeeks.size;
    },
    
    /**
     * Toggle theme (light/dark)
     */
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = document.querySelector('.theme-icon');
        icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    }
};
