import Chart from 'chart.js/auto';

// Configuration
const HOSTNAME = window.location.hostname;
const GATEWAY_URL = `http://${HOSTNAME}:4000/graphql`;
const QUERY_SERVICE_URL = `http://${HOSTNAME}:3003/analytics`;

// State
let revenueChart = null;
let distChart = null;
let cachedData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Icons - check if global exists
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Charts
    initCharts();

    // Initial Fetch
    fetchData();

    // Polling - Every 5 seconds for live updates
    setInterval(fetchData, 5000);

    // Listeners
    const seedBtn = document.getElementById('btn-seed');
    const resetBtn = document.getElementById('btn-reset');
    const dateNow = document.getElementById('display-date');

    if (dateNow) {
        const now = new Date();
        dateNow.innerText = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    console.log('🔧 Button elements:', { seedBtn, resetBtn });

    if (seedBtn) {
        seedBtn.addEventListener('click', handleSeed);
        console.log('✅ Seed button listener attached');
    } else {
        console.error('❌ Seed button not found!');
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
        console.log('✅ Reset button listener attached');
    }

    const searchBtn = document.getElementById('btn-search');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
        console.log('✅ Search button listener attached');
    }
});

// Global function for clickable usernames
window.quickSearch = (userId) => {
    const input = document.getElementById('search-userId');
    if (input) {
        input.value = userId;
        handleSearch();
        // Scroll to search section
        document.querySelector('.search-section').scrollIntoView({ behavior: 'smooth' });
    }
};

async function handleSearch() {
    const userId = document.getElementById('search-userId').value.trim();
    const eventId = document.getElementById('search-eventId').value.trim();
    const eventType = document.getElementById('search-type').value;
    const resultsList = document.getElementById('search-results');
    const searchBtn = document.getElementById('btn-search');

    if (!userId && !eventId) {
        alert('Please enter either a User ID or an Event ID to search.');
        return;
    }

    resultsList.innerHTML = '<li class="empty-state">Searching Elasticsearch...</li>';
    searchBtn.disabled = true;
    searchBtn.innerText = 'Searching...';

    try {
        let url = `${QUERY_SERVICE_URL}/search?limit=50`;
        if (userId) url += `&userId=${userId}`;
        if (eventId) url += `&eventId=${eventId}`;
        if (eventType) url += `&eventType=${eventType}`;

        console.log(`🔍 Querying Elasticsearch: ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            resultsList.innerHTML = '';
            data.events.forEach(event => {
                const li = document.createElement('li');
                li.className = 'activity-item';
                
                const typeClass = `type-${event.eventType}`;
                const time = new Date(event.timestamp).toLocaleString();

                li.innerHTML = `
                    <div class="type-pill ${typeClass}">${event.eventType}</div>
                    <div class="activity-details">
                        <p><strong>${event.userId}</strong> on ${event.data.productId || 'system'}</p>
                        <span class="activity-time">${time} — ID: ${event.eventId}</span>
                    </div>
                `;
                resultsList.appendChild(li);
            });
        } else {
            resultsList.innerHTML = '<li class="empty-state">No results found in Elasticsearch for this User ID</li>';
        }
    } catch (error) {
        console.error('❌ Search failed:', error);
        resultsList.innerHTML = `<li class="empty-state">Search error: ${error.message}</li>`;
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerText = 'Search Engine';
    }
}

async function fetchData() {
    try {
        console.log('🔄 Fetching dashboard data...');
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        console.log(`📅 Date range: ${today} to ${nextWeekStr}`);

        // 1. Fetch Daily Metrics via GraphQL
        const gqlQuery = {
            query: `
                query {
                    dailyMetrics(startDate: "${today}", endDate: "${nextWeekStr}")
                }
            `
        };

        console.log('📡 Calling GraphQL dailyMetrics...');
        const response = await fetch(GATEWAY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify(gqlQuery)
        });

        console.log('📥 GraphQL Response status:', response.status);
        const result = await response.json();
        console.log('📦 GraphQL Result:', result);

        if (result.errors) {
            console.error('❌ GraphQL Errors:', result.errors);
            throw new Error(result.errors[0].message);
        }

        const metricsStr = result.data.dailyMetrics;
        console.log('📊 Metrics String:', metricsStr);

        const metrics = JSON.parse(metricsStr);
        console.log('📈 Parsed Metrics:', metrics);

        if (metrics && metrics.length > 0) {
            const latest = metrics[metrics.length - 1];
            console.log('✅ Latest metrics:', latest);
            updateDashboard(latest);
        } else {
            console.warn('⚠️ No metrics found, using defaults');
            updateDashboard({ totalRevenue: 0, count: 0, users: [] });
        }

        // 2. Fetch Recent Purchases via Search API (to simulate feed)
        console.log('🔍 Fetching activity feed...');
        const searchRes = await fetch(`${QUERY_SERVICE_URL}/search?limit=6&_t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        const searchData = await searchRes.json();
        console.log('📋 Activity feed data:', searchData);
        updateActivityFeed(searchData.events);

    } catch (error) {
        console.error('❌ Failed to fetch dashboard data:', error);
        console.error('Stack trace:', error.stack);
    }
}

function updateDashboard(data) {
    console.log('📊 Updating dashboard with data:', data);

    // MongoDB returns fields: totalEvents, totalRevenue, users (array)
    const revenue = data.totalRevenue || 0;
    const events = data.totalEvents || 0;  // FIXED: was data.count, should be data.totalEvents
    const activeUsers = data.users?.length || 0;

    console.log(`💰 Revenue: ${revenue}, 📦 Events: ${events}, 👥 Users: ${activeUsers}`);

    // Update Stats
    document.getElementById('val-revenue').innerText = `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('val-events').innerText = events.toLocaleString();
    document.getElementById('val-users').innerText = activeUsers.toLocaleString();

    // Update Charts
    updateCharts({
        totalRevenue: revenue,
        totalEvents: events,
        eventsByType: data.eventsByType || {}
    });
}


function initCharts() {
    const revCtx = document.getElementById('revenueChart').getContext('2d');
    const distCtx = document.getElementById('eventDistChart').getContext('2d');

    const gradient = revCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    revenueChart = new Chart(revCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cumulative Revenue',
                data: [],
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: gradient,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    distChart = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: ['Purchases', 'Views', 'Clicks', 'Others'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#94a3b8'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } } },
            cutout: '70%'
        }
    });
}

function updateCharts(data) {
    if (!revenueChart || !distChart) return;

    const currentRevenue = data.totalRevenue || 0;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Update Revenue Chart (Cumulative Line)
    // If it's the first run, initialize with a flat line at current revenue
    if (revenueChart.data.labels.length === 0) {
        revenueChart.data.labels = Array(15).fill('').map(() => '');
        revenueChart.data.datasets[0].data = Array(15).fill(currentRevenue);
    }

    // Add new data point and remove oldest
    revenueChart.data.labels.push(now);
    revenueChart.data.labels.shift();

    // Ensure the line never dips below previous value (cumulative logic)
    const lastValue = revenueChart.data.datasets[0].data[revenueChart.data.datasets[0].data.length - 1];
    const finalValue = Math.max(lastValue, currentRevenue);

    revenueChart.data.datasets[0].data.push(finalValue);
    revenueChart.data.datasets[0].data.shift();

    revenueChart.update('none'); // Smooth update

    // 2. Update Doughnut Chart (Event Distribution)
    const types = data.eventsByType || {};
    const total = data.totalEvents || 0;

    // If no data, show balanced placeholders, otherwise show real ratios
    if (total === 0) {
        distChart.data.datasets[0].data = [1, 1, 1, 1];
    } else {
        distChart.data.datasets[0].data = [
            types.purchase || 0,
            types.view || 0,
            types.click || 0,
            Math.max(0, total - (types.purchase || 0) - (types.view || 0) - (types.click || 0))
        ];
    }
    distChart.update();
}

function updateActivityFeed(events) {
    const feed = document.getElementById('activity-feed');
    if (!events || events.length === 0) return;

    feed.innerHTML = '';
    events.forEach(event => {
        const li = document.createElement('li');
        li.className = 'activity-item';

        const typeClass = `type-${event.eventType}`;
        const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        li.innerHTML = `
            <div class="type-pill ${typeClass}">${event.eventType}</div>
            <div class="activity-details">
                <p><span class="clickable-user" onclick="quickSearch('${event.userId}')">${event.userId}</span> performed ${event.eventType} on ${event.data.productId || 'system'}</p>
                <span class="activity-time">${time} — ID: ${event.eventId.substring(0, 8)}...</span>
            </div>
            ${event.eventType === 'purchase' ? `<div class="rev-val">₹${event.data.amount}</div>` : ''}
        `;
        feed.appendChild(li);
    });
}

async function handleSeed() {
    console.log('🎯 Trigger Spike button clicked!');
    const btn = document.getElementById('btn-seed');
    if (!btn) {
        console.error('❌ Button not found!');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader"></i> Seeding 100 events...';
    btn.disabled = true;

    try {
        console.log('📡 Generating 100 random events...');

        const eventTypes = ['purchase', 'click', 'view'];
        const products = ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005'];

        let successCount = 0;
        let errorCount = 0;
        const batchSize = 50;

        for (let batch = 0; batch < 2; batch++) {
            const promises = [];

            for (let i = 0; i < batchSize; i++) {
                const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const userId = `user_${Math.floor(Math.random() * 100)}`;
                const productId = products[Math.floor(Math.random() * products.length)];
                const amount = eventType === 'purchase' ? (Math.random() * 5000 + 500).toFixed(2) : 0;

                const eventData = {
                    productId,
                    ...(eventType === 'purchase' && { amount: parseFloat(amount) })
                };

                const mutation = `
                    mutation {
                        trackEvent(
                            userId: "${userId}",
                            eventType: "${eventType}",
                            data: "${JSON.stringify(eventData).replace(/"/g, '\\"')}"
                        )
                    }
                `;

                const promise = fetch(GATEWAY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    body: JSON.stringify({ query: mutation })
                })
                    .then(res => res.json())
                    .then(result => {
                        if (result.errors) {
                            console.error('GraphQL Error:', result.errors);
                            errorCount++;
                        } else if (result.data?.trackEvent) {
                            successCount++;
                        }
                    })
                    .catch(err => {
                        console.error('Fetch error:', err);
                        errorCount++;
                    });

                promises.push(promise);
            }

            await Promise.all(promises);
            console.log(`Batch ${batch + 1}/2: ${successCount} successful, ${errorCount} errors`);
            btn.innerHTML = `<i data-lucide="loader"></i> Sent ${(batch + 1) * batchSize} events...`;
            if (window.lucide) window.lucide.createIcons();
        }

        console.log(`✅ Successfully seeded ${successCount} events! (${errorCount} errors)`);
        btn.innerHTML = '<i data-lucide="check"></i> Done!';
        if (window.lucide) window.lucide.createIcons();

        // Force immediate refresh
        await fetchData();

    } catch (error) {
        console.error('❌ Seed failed:', error);
        btn.innerHTML = '<i data-lucide="x"></i> Failed';
        if (window.lucide) window.lucide.createIcons();
    } finally {
        // ALWAYS re-enable button after 2 seconds
        setTimeout(() => {
            btn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
            btn.disabled = false;
            console.log('🔓 Button re-enabled and ready');
        }, 2000);
    }
}


async function handleReset() {
    console.log('🗑️ Reset Data button clicked!');
    if (!confirm('⚠️ This will DELETE ALL data from all databases. Are you sure?')) {
        console.log('❌ User cancelled reset');
        return;
    }

    const btn = document.getElementById('btn-reset');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader"></i> Resetting...';
    btn.disabled = true;

    try {
        console.log('📡 Calling reset endpoint...');

        const response = await fetch(`${QUERY_SERVICE_URL}/reset-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        console.log('📥 Response status:', response.status);
        const result = await response.json();
        console.log('📦 Response data:', result);

        if (result.success) {
            btn.innerHTML = '<i data-lucide="check"></i> Reset Complete';
            if (window.lucide) window.lucide.createIcons();

            console.log('✅ Reset successful, refreshing dashboard...');
            // Force immediate refresh to show empty state
            setTimeout(() => {
                fetchData();
                btn.innerHTML = originalText;
                if (window.lucide) window.lucide.createIcons();
                btn.disabled = false;
            }, 1500);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Reset failed:', error);
        alert('Error: ' + error.message);
        btn.innerHTML = '<i data-lucide="x"></i> Failed';
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
            btn.disabled = false;
        }, 2000);
    }
}


