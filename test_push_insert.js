const db = require('./config/db');

async function testSub() {
  try {
    const customer_phone = '0123456789';
    const endpoint = 'https://example.com/endpoint/' + Date.now();
    const p256dh = 'test-p256dh';
    const auth = 'test-auth';

    console.log('--- TESTING SUBSCRIBE ---');
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    await db.query(
        'INSERT INTO push_subscriptions (customer_phone, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
        [customer_phone, endpoint, p256dh, auth]
    );
    console.log('✅ TEST SUCCESSFUL');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
  } finally {
    process.exit();
  }
}

testSub();
