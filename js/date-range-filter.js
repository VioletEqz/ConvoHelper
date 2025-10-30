/**
 * Date Range Filter Module
 * Handles timezone selection and date range filtering
 */

const DateRangeFilter = {
    activeFilter: null,
    currentTimezone: 'auto',
    
    init() {
        this.setupTimezoneSelector();
        this.setupFilterButtons();
        this.setupDatePickers();
    },
    
    /**
     * Setup timezone selector with common timezones
     */
    setupTimezoneSelector() {
        const select = document.getElementById('timezone-select');
        if (!select) return;
        
        const timezones = [
            { value: 'auto', label: 'Auto (GMT+0)', offset: 0 },
            { value: 'gmt-12', label: 'GMT-12', offset: -12 },
            { value: 'gmt-11', label: 'GMT-11', offset: -11 },
            { value: 'gmt-10', label: 'GMT-10 (Hawaii)', offset: -10 },
            { value: 'gmt-9', label: 'GMT-9 (Alaska)', offset: -9 },
            { value: 'gmt-8', label: 'GMT-8 (PST)', offset: -8 },
            { value: 'gmt-7', label: 'GMT-7 (MST)', offset: -7 },
            { value: 'gmt-6', label: 'GMT-6 (CST)', offset: -6 },
            { value: 'gmt-5', label: 'GMT-5 (EST)', offset: -5 },
            { value: 'gmt-4', label: 'GMT-4 (AST)', offset: -4 },
            { value: 'gmt-3', label: 'GMT-3 (BRT)', offset: -3 },
            { value: 'gmt-2', label: 'GMT-2', offset: -2 },
            { value: 'gmt-1', label: 'GMT-1', offset: -1 },
            { value: 'gmt+0', label: 'GMT+0 (UTC)', offset: 0 },
            { value: 'gmt+1', label: 'GMT+1 (CET)', offset: 1 },
            { value: 'gmt+2', label: 'GMT+2 (EET)', offset: 2 },
            { value: 'gmt+3', label: 'GMT+3 (MSK)', offset: 3 },
            { value: 'gmt+4', label: 'GMT+4 (GST)', offset: 4 },
            { value: 'gmt+5', label: 'GMT+5', offset: 5 },
            { value: 'gmt+6', label: 'GMT+6', offset: 6 },
            { value: 'gmt+7', label: 'GMT+7 (ICT)', offset: 7 },
            { value: 'gmt+8', label: 'GMT+8 (SGT)', offset: 8 },
            { value: 'gmt+9', label: 'GMT+9 (JST)', offset: 9 },
            { value: 'gmt+10', label: 'GMT+10 (AEST)', offset: 10 },
            { value: 'gmt+11', label: 'GMT+11', offset: 11 },
            { value: 'gmt+12', label: 'GMT+12 (NZST)', offset: 12 }
        ];
        
        select.innerHTML = timezones.map(tz => 
            `<option value="${tz.value}">${tz.label}</option>`
        ).join('');
        
        select.addEventListener('change', (e) => {
            this.currentTimezone = e.target.value;
            this.applyTimezone();
        });
    },
    
    /**
     * Apply timezone conversion to all displayed dates
     */
    applyTimezone() {
        const offset = this.getTimezoneOffset();
        // Store offset for use in other modules
        window.convoHelper = window.convoHelper || {};
        window.convoHelper.timezoneOffset = offset;
        
        // Re-render current view with new timezone
        if (window.currentPerson) {
            // Re-render individual stats
            if (typeof StatsIndividual !== 'undefined') {
                StatsIndividual.renderStats(window.currentPerson);
            }
        } else {
            // Re-render overview stats
            if (typeof StatsGeneral !== 'undefined') {
                StatsGeneral.renderStats();
            }
        }
        
        UI.showToast(`Timezone changed to ${this.currentTimezone.toUpperCase()}`);
    },
    
    /**
     * Get timezone offset in hours
     */
    getTimezoneOffset() {
        if (this.currentTimezone === 'auto') return 0;
        const match = this.currentTimezone.match(/gmt([+-]\d+)/);
        return match ? parseInt(match[1]) : 0;
    },
    
    /**
     * Setup filter view buttons
     */
    setupFilterButtons() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    },
    
    /**
     * Switch between filter views
     */
    switchView(view) {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide appropriate selectors
        const periodSelector = document.getElementById('period-selector');
        const customRange = document.getElementById('custom-range');
        
        periodSelector.classList.toggle('hidden', view === 'all' || view === 'custom');
        customRange.classList.toggle('hidden', view !== 'custom');
        
        if (view === 'all') {
            this.clearFilter();
        } else if (view === 'month' || view === 'week') {
            this.populatePeriodSelector(view);
        }
    },
    
    /**
     * Populate period selector with months or weeks
     */
    populatePeriodSelector(type) {
        const select = document.getElementById('period-select');
        const data = window.processedData;
        
        if (!data) return;
        
        if (type === 'month') {
            const months = Object.keys(data.byMonth || {}).sort().reverse();
            select.innerHTML = '<option value="">Select month...</option>' +
                months.map(month => {
                    const date = new Date(month + '-01');
                    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                    return `<option value="${month}">${label}</option>`;
                }).join('');
        } else if (type === 'week') {
            const weeks = [];
            Object.values(data.byPerson || {}).forEach(person => {
                Object.keys(person.byWeek || {}).forEach(week => {
                    if (!weeks.includes(week)) weeks.push(week);
                });
            });
            weeks.sort().reverse();
            
            select.innerHTML = '<option value="">Select week...</option>' +
                weeks.map(week => {
                    const [year, weekNum] = week.split('-W');
                    return `<option value="${week}">Week ${weekNum}, ${year}</option>`;
                }).join('');
        }
        
        select.onchange = () => {
            if (select.value) {
                this.applyFilter(type, select.value);
            }
        };
    },
    
    /**
     * Setup date pickers for custom range
     */
    setupDatePickers() {
        // Quick preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Apply button
        const applyBtn = document.getElementById('apply-range');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const start = document.getElementById('range-start').value;
                const end = document.getElementById('range-end').value;
                
                if (start && end) {
                    this.applyFilter('custom', { start, end });
                } else {
                    UI.showToast('Please select both start and end dates');
                }
            });
        }
        
        // Clear filter button
        const clearBtn = document.getElementById('clear-filter');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    },
    
    /**
     * Apply date preset
     */
    applyPreset(preset) {
        const now = new Date();
        let start = new Date();
        
        switch(preset) {
            case '7':
                start.setDate(now.getDate() - 7);
                break;
            case '30':
                start.setDate(now.getDate() - 30);
                break;
            case '90':
                start.setDate(now.getDate() - 90);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
        }
        
        const startStr = start.toISOString().split('T')[0];
        const endStr = now.toISOString().split('T')[0];
        
        document.getElementById('range-start').value = startStr;
        document.getElementById('range-end').value = endStr;
        
        this.applyFilter('custom', { start: startStr, end: endStr });
    },
    
    /**
     * Apply filter and update display
     */
    applyFilter(type, value) {
        this.activeFilter = { type, value };
        
        // Update active filter indicator
        const indicator = document.getElementById('active-filter');
        const description = document.getElementById('filter-description');
        
        let filterText = '';
        if (type === 'month') {
            const date = new Date(value + '-01');
            filterText = `Showing: ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
        } else if (type === 'week') {
            const [year, week] = value.split('-W');
            filterText = `Showing: Week ${week}, ${year}`;
        } else if (type === 'custom') {
            filterText = `Showing: ${value.start} to ${value.end}`;
        }
        
        description.textContent = filterText;
        indicator.classList.remove('hidden');
        
        // Re-render stats with filter
        this.refreshStats();
    },
    
    /**
     * Clear active filter
     */
    clearFilter() {
        this.activeFilter = null;
        
        // Hide indicator
        document.getElementById('active-filter').classList.add('hidden');
        
        // Reset to "All Time"
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'all');
        });
        
        document.getElementById('period-selector').classList.add('hidden');
        document.getElementById('custom-range').classList.add('hidden');
        
        // Re-render stats without filter
        this.refreshStats();
    },
    
    /**
     * Refresh stats display with current filter
     */
    refreshStats() {
        if (window.currentPerson) {
            if (typeof StatsIndividual !== 'undefined') {
                StatsIndividual.renderStats(window.currentPerson);
            }
        } else {
            if (typeof StatsGeneral !== 'undefined') {
                StatsGeneral.renderStats();
            }
        }
    },
    
    /**
     * Filter messages based on active filter
     */
    filterMessages(messages) {
        if (!this.activeFilter || !messages) return messages;
        
        const { type, value } = this.activeFilter;
        
        return messages.filter(msg => {
            const date = new Date(msg.timestamp_ms);
            
            if (type === 'month') {
                const msgMonth = date.toISOString().substring(0, 7);
                return msgMonth === value;
            } else if (type === 'week') {
                const msgWeek = this.getWeekString(date);
                return msgWeek === value;
            } else if (type === 'custom') {
                const msgDate = date.toISOString().split('T')[0];
                return msgDate >= value.start && msgDate <= value.end;
            }
            
            return true;
        });
    },
    
    /**
     * Get week string from date (YYYY-Www)
     */
    getWeekString(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DateRangeFilter.init());
} else {
    DateRangeFilter.init();
}
