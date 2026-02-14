async function handleSeed() {
    console.log('🎯 Trigger Spike button clicked!');
    const btn = document.getElementById('btn-seed');
    if (!btn) {
        console.error('❌ Button not found!');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader"></i> Sending 1000 events...';
    btn.disabled = true;

    try {
        console.time('Event Generation');
        console.log('📡 Sending 1000 events in parallel (FAST MODE)...');

        const eventTypes = ['purchase', 'click', 'view'];
        const products = ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005'];

        const promises = [];

        // Generate ALL 1000 events at once for maximum speed
        for (let i = 0; i < 1000; i++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const userId = `user_${Math.floor(Math.random() * 100)}`;
            const productId = products[Math.floor(Math.random() * products.length)];
            const amount = eventType === 'purchase' ? (Math.random() * 5000 + 500).toFixed(2) : 0;

            const eventData = {
                productId,
                ...(eventType === 'purchase' && { amount: parseFloat(amount) })
            };

            const mutation = `mutation{trackEvent(userId:"${userId}",eventType:"${eventType}",data:"${JSON.stringify(eventData).replace(/"/g, '\\"')}")}`;

            promises.push(
                fetch(GATEWAY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: mutation })
                }).then(r => r.json())
            );
        }

        // Wait for all 1000 at once
        const results = await Promise.all(promises);

        const successCount = results.filter(r => r.data?.trackEvent).length;
        console.timeEnd('Event Generation');
        console.log(`✅ ${successCount}/1000 events sent successfully!`);

        btn.innerHTML = '<i data-lucide="check"></i> Done!';
        if (window.lucide) window.lucide.createIcons();

        // Refresh dashboard
        await fetchData();

    } catch (error) {
        console.error('❌ Failed:', error);
        btn.innerHTML = '<i data-lucide="x"></i> Failed';
        if (window.lucide) window.lucide.createIcons();
    } finally {
        setTimeout(() => {
            btn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
            btn.disabled = false;
        }, 2000);
    }
}
