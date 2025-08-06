console.log('=== SCRIPT.JS LOADED ===');

// State management - MUST BE FIRST
let currentTimeFilter = 'new';
let currentCategory = 'all';
let redditEnabled = true;
let youtubeEnabled = true;
let currentData = [];

// Initialize data service
let dataService;

// Check if Firebase is ready
function initializeDataService() {
    console.log('Checking for Firebase...', typeof window.db);
    if (window.db) {
        dataService = new DataService();
        console.log('DataService initialized with Firebase');
        // Trigger initial data fetch
        fetchAndDisplayData();
    } else {
        console.log('Firebase not ready, retrying in 100ms...');
        // Retry in 100ms if Firebase isn't ready yet
        setTimeout(initializeDataService, 100);
    }
}

// Start initialization immediately
console.log('Starting initialization...');
initializeDataService();

// Chart configuration
const ctx = document.getElementById('performanceChart').getContext('2d');

// Time labels for 24 hours
const labels = Array.from({length: 24}, (_, i) => {
    const hour = i % 12 || 12;
    const period = i < 12 ? 'AM' : 'PM';
    return `${hour}${period}`;
});

// Chart instance
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: []
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                titleColor: '#ff6b35',
                bodyColor: '#ffffff',
                borderColor: '#ff6b35',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: '#2a2a2a',
                    drawBorder: false
                },
                ticks: {
                    color: '#666',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: '#2a2a2a',
                    drawBorder: false
                },
                ticks: {
                    color: '#666',
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        return value.toFixed(0);
                    }
                }
            }
        }
    }
});

// Update ranking table and mobile layout
function updateTable(data) {
    // Update desktop table
    const tbody = document.querySelector('.ranking-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        // Take top 20 items
        const topItems = data.slice(0, 20);
        
        topItems.forEach(item => {
            const row = document.createElement('tr');
            
            // Format category name
            const categoryDisplay = item.category.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            // Get post count based on source
            let postCount = '0';
            if (item.source === 'reddit') {
                postCount = item.postCount || item.redditPosts || '0';
            } else if (item.source === 'youtube') {
                postCount = item.videoCount || item.youtubeVideos || '0';
            } else if (item.source === 'combined') {
                postCount = (item.redditPosts || 0) + (item.youtubeVideos || 0);
            } else if (item.source === 'ph') {
                postCount = item.votes || '0';
            }
            
            // Get velocity (all sources should have this)
            const velocity = item.velocity ? item.velocity.toFixed(1) : '0.0';
            
            row.innerHTML = `
                <td>${item.rank}</td>
                <td>${item.name}</td>
                <td>${categoryDisplay}</td>
                <td class="post-count">${postCount}</td>
                <td class="velocity">${velocity}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Update mobile card layout
    updateMobileLayout(data);
}

// Create mobile card layout
function updateMobileLayout(data) {
    // Find or create mobile container
    let mobileContainer = document.querySelector('.mobile-ranking');
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-ranking';
        
        // Insert after the ranking table
        const rankingTable = document.querySelector('.ranking-table');
        if (rankingTable && rankingTable.parentNode) {
            rankingTable.parentNode.insertBefore(mobileContainer, rankingTable.nextSibling);
        }
    }
    
    mobileContainer.innerHTML = '';
    
    // Take top 20 items
    const topItems = data.slice(0, 20);
    
    topItems.forEach(item => {
        // Format category name
        const categoryDisplay = item.category.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        // Get post count based on source
        let postCount = '0';
        if (item.source === 'reddit') {
            postCount = item.postCount || item.redditPosts || '0';
        } else if (item.source === 'youtube') {
            postCount = item.videoCount || item.youtubeVideos || '0';
        } else if (item.source === 'combined') {
            postCount = (item.redditPosts || 0) + (item.youtubeVideos || 0);
        } else if (item.source === 'ph') {
            postCount = item.votes || '0';
        }
        
        // Get velocity (all sources should have this)
        const velocity = item.velocity ? item.velocity.toFixed(1) : '0.0';
        
        const mobileCard = document.createElement('div');
        mobileCard.className = 'mobile-item';
        mobileCard.innerHTML = `
            <div class="mobile-item-header">
                <div class="mobile-rank">${item.rank}</div>
                <div class="mobile-name">${item.name}</div>
                <div class="mobile-category">${categoryDisplay}</div>
            </div>
            <div class="mobile-metrics">
                <div class="mobile-metric">
                    <span class="mobile-metric-label">Post Count</span>
                    <span class="mobile-metric-value mobile-post-count">${postCount}</span>
                </div>
                <div class="mobile-metric">
                    <span class="mobile-metric-label">Velocity</span>
                    <span class="mobile-metric-value mobile-velocity">${velocity}</span>
                </div>
            </div>
        `;
        
        mobileContainer.appendChild(mobileCard);
    });
}

// Update chart with top 3 items
function updateChart(data) {
    const top3 = data.slice(0, 3);
    
    // Generate mock time series data based on velocity
    const datasets = top3.map((item, index) => {
        const baseValue = item.velocity || 100;
        const volatility = baseValue * 0.1;
        const data = [];
        let value = baseValue;
        
        for (let i = 0; i < 24; i++) {
            value += (Math.random() - 0.5) * volatility;
            data.push(value);
        }
        
        const colors = ['#ff6b35', '#ff8f65', '#ffb399'];
        
        return {
            label: item.name,
            data: data,
            borderColor: colors[index],
            backgroundColor: `${colors[index]}1a`,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: colors[index],
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        };
    });
    
    chart.data.datasets = datasets;
    chart.update();
    
    // Update legend
    updateLegend(top3);
}

// Update legend
function updateLegend(items) {
    const legendContainer = document.querySelector('.chart-legend');
    if (!legendContainer) {
        console.error('Legend container not found');
        return;
    }
    
    legendContainer.innerHTML = '';
    
    const colors = ['#ff6b35', '#ff8f65', '#ffb399'];
    
    items.forEach((item, index) => {
        const legendItem = document.createElement('span');
        legendItem.className = 'legend-item';
        legendItem.setAttribute('data-line', `line${index + 1}`);
        legendItem.innerHTML = `
            <span class="legend-color" style="background: ${colors[index]}"></span>
            ${item.name}
        `;
        
        // Toggle dataset visibility on click
        legendItem.addEventListener('click', function() {
            const dataset = chart.data.datasets[index];
            dataset.hidden = !dataset.hidden;
            this.style.opacity = dataset.hidden ? '0.3' : '1';
            chart.update();
        });
        
        legendContainer.appendChild(legendItem);
    });
}

// Fetch and display data
async function fetchAndDisplayData() {
    if (!dataService) {
        console.error('DataService not initialized yet');
        return;
    }
    
    let data = [];
    
    // Show loading state
    const tbody = document.querySelector('.ranking-table tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
    
    try {
        console.log(`Fetching data for filter: ${currentTimeFilter}, category: ${currentCategory}`);
        
        if (currentTimeFilter === 'new') {
            // Fetch Product Hunt data
            console.log('Fetching Product Hunt hot items...');
            data = await dataService.fetchHotItems();
            console.log(`PH data received: ${data.length} items`);
        } else {
            // Determine time window
            const timeWindow = parseInt(currentTimeFilter.replace('d', ''));
            console.log(`=== DATA FETCH DEBUG ===`);
            console.log(`Time filter: ${currentTimeFilter} -> Parsed window: ${timeWindow}`);
            console.log(`Category: ${currentCategory}`);
            console.log(`Reddit enabled: ${redditEnabled}, YouTube enabled: ${youtubeEnabled}`);
            
            if (redditEnabled && youtubeEnabled) {
                // Fetch combined data
                console.log('🔄 Fetching combined data (both platforms)');
                data = await dataService.fetchCombinedData(timeWindow, currentCategory);
            } else if (redditEnabled && !youtubeEnabled) {
                // Fetch Reddit only
                console.log('🔴 Fetching Reddit data only');
                data = await dataService.fetchRedditData(timeWindow, currentCategory);
            } else if (!redditEnabled && youtubeEnabled) {
                // Fetch YouTube only
                console.log('🟡 === STARTING YOUTUBE-ONLY FETCH ===');
                console.log(`🟡 redditEnabled: ${redditEnabled}, youtubeEnabled: ${youtubeEnabled}`);
                console.log(`🟡 Calling dataService.fetchYoutubeData(${timeWindow}, "${currentCategory}")`);
                
                if (!dataService || !dataService.fetchYoutubeData) {
                    console.error('❌ DataService or fetchYoutubeData method not available!');
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #f44336;">DataService error</td></tr>';
                    return;
                }
                
                data = await dataService.fetchYoutubeData(timeWindow, currentCategory);
                console.log(`🟡 YouTube data result:`, data);
                console.log(`🟡 YouTube data length: ${data ? data.length : 'null/undefined'}`);
                console.log(`🟡 YouTube data type: ${typeof data}`);
            } else {
                // No platform selected
                console.log('❌ No platforms selected');
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">Please select at least one platform</td></tr>';
                return;
            }
        }
        
        console.log(`Data fetched: ${data.length} items`);
        
        if (data.length === 0) {
            console.log('No data returned from Firebase');
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No data available</td></tr>';
            return;
        }
        
        currentData = data;
        console.log('Updating table with data...');
        updateTable(data);
        console.log('Updating chart with data...');
        updateChart(data);
        console.log('Update complete');
        
    } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.message, error.code);
        console.error('Full error object:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #f44336;">Error: ${error.message || 'Failed to load data'}</td></tr>`;
    }
}

// Time filter functionality
const timeButtons = document.querySelectorAll('.time-btn');
const platformFilters = document.querySelector('.platform-filters');

timeButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all time buttons
        timeButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        currentTimeFilter = this.dataset.period;
        
        // Show/hide platform filters
        if (currentTimeFilter === 'new') {
            platformFilters.style.display = 'none';
        } else {
            platformFilters.style.display = 'flex';
        }
        
        fetchAndDisplayData();
    });
});

// Platform toggle functionality
const platformButtons = document.querySelectorAll('.platform-btn');

platformButtons.forEach(button => {
    button.addEventListener('click', function() {
        const platform = this.dataset.platform;
        
        // Toggle active state
        this.classList.toggle('active');
        
        // Update state based on current button state
        if (platform === 'reddit') {
            redditEnabled = this.classList.contains('active');
            console.log(`Reddit toggled: ${redditEnabled}`);
        } else if (platform === 'youtube') {
            youtubeEnabled = this.classList.contains('active');
            console.log(`YouTube toggled: ${youtubeEnabled}`);
        }
        
        console.log(`Platform state - Reddit: ${redditEnabled}, YouTube: ${youtubeEnabled}`);
        fetchAndDisplayData();
    });
});

// Category dropdown functionality
const categoryDropdown = document.querySelector('.category-dropdown');
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownLabel = document.querySelector('.dropdown-label');
const dropdownItems = document.querySelectorAll('.dropdown-item');

// Toggle dropdown
dropdownToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    categoryDropdown.classList.toggle('open');
});

// Select category
dropdownItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Remove active class from all items
        dropdownItems.forEach(i => i.classList.remove('active'));
        // Add active class to selected item
        this.classList.add('active');
        
        // Update label
        dropdownLabel.textContent = this.textContent;
        
        // Close dropdown
        categoryDropdown.classList.remove('open');
        
        currentCategory = this.dataset.category;
        fetchAndDisplayData();
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', function() {
    categoryDropdown.classList.remove('open');
});

// Legend item click functionality (will be set up by updateLegend)

// Table row hover effect with momentum indicator animation
const tableRows = document.querySelectorAll('tbody tr');
tableRows.forEach(row => {
    row.addEventListener('mouseenter', function() {
        const momentum = this.querySelector('.momentum');
        if (momentum) {
            momentum.style.transform = 'scale(1.1)';
        }
    });
    
    row.addEventListener('mouseleave', function() {
        const momentum = this.querySelector('.momentum');
        if (momentum) {
            momentum.style.transform = 'scale(1)';
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide platform filters initially (since "New" is default)
    platformFilters.style.display = 'none';
    
    // Initialize platform states based on HTML classes
    const redditBtn = document.querySelector('[data-platform="reddit"]');
    const youtubeBtn = document.querySelector('[data-platform="youtube"]');
    redditEnabled = redditBtn ? redditBtn.classList.contains('active') : true;
    youtubeEnabled = youtubeBtn ? youtubeBtn.classList.contains('active') : true;
    console.log(`Initial platform state - Reddit: ${redditEnabled}, YouTube: ${youtubeEnabled}`);
    
    // Don't fetch data here - it will be triggered after Firebase initialization
    
    // Set up refresh interval
    setInterval(() => {
        if (dataService) {
            fetchAndDisplayData();
        }
    }, 60000);
});