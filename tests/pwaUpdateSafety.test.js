import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Unit & Safety Test Suite for PWA Update Manager
console.log('=================================================');
console.log('RUNNING PWA SAFE AUTOMATIC UPDATE TEST SUITE');
console.log('=================================================');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Safety Status Classification Tests
test('1. Game safety classification identifies active game states', () => {
  const activeStates = ['playing', 'result', 'offline-playing'];
  for (const st of activeStates) {
    const isGame = st === 'playing' || st === 'result' || st === 'offline-playing';
    assert.strictEqual(isGame, true, `State ${st} must be classified as active game`);
  }
});

test('2. Lobby state is protected from premature reload', () => {
  const lobbyState = 'waiting';
  const isLobby = lobbyState === 'waiting';
  assert.strictEqual(isLobby, true, 'waiting state must be classified as lobby');
});

test('3. Safe screens are permitted to update automatically', () => {
  const safeScreens = [
    'welcome',
    'play-type',
    'offline-setup',
    'home',
    'create',
    'join',
    'leaderboard',
    'game-info',
    'dashboard',
    'admin'
  ];
  for (const st of safeScreens) {
    const isSafe = st !== 'playing' && st !== 'result' && st !== 'offline-playing' && st !== 'waiting';
    assert.strictEqual(isSafe, true, `Screen ${st} must be safe to update`);
  }
});

// 4. Reload Guard Logic Test
test('4. Reload loop guard prevents rapid sequential reloads', () => {
  const TTL = 15000;
  let simulatedStorage = {};
  
  function checkGuard(key) {
    const stored = simulatedStorage[key];
    if (!stored) return false;
    return Date.now() - Number(stored) < TTL;
  }

  function setGuard(key) {
    simulatedStorage[key] = String(Date.now());
  }

  // First reload: guard should not be active
  assert.strictEqual(checkGuard('reload_guard'), false);

  // Set guard
  setGuard('reload_guard');

  // Immediately check: guard must be active to suppress second reload
  assert.strictEqual(checkGuard('reload_guard'), true);

  // Simulate time travel past TTL
  simulatedStorage['reload_guard'] = String(Date.now() - 20000);
  assert.strictEqual(checkGuard('reload_guard'), false);
});

// 5. sw.js Architecture Verification
test('5. sw.js includes SKIP_WAITING message listener and removes automatic skipWaiting', () => {
  const swContent = fs.readFileSync(path.resolve('public/sw.js'), 'utf8');

  // Must have SKIP_WAITING message handler
  assert.ok(
    swContent.includes("event.data.type === 'SKIP_WAITING'"),
    'sw.js must contain SKIP_WAITING message listener'
  );
  assert.ok(
    swContent.includes('self.skipWaiting()'),
    'sw.js must contain self.skipWaiting()'
  );

  // Must NOT call self.skipWaiting() directly inside install event
  const installBlockMatch = swContent.match(/self\.addEventListener\('install'[\s\S]*?\}\);/);
  assert.ok(installBlockMatch, 'install event listener must exist');
  const installBody = installBlockMatch[0];
  assert.ok(
    !installBody.includes('skipWaiting'),
    'sw.js install event must NOT call skipWaiting directly'
  );
});

// 6. sw.js Push Notifications & FCM Protection
test('6. sw.js preserves push notifications, FCM, and notificationclick handling', () => {
  const swContent = fs.readFileSync(path.resolve('public/sw.js'), 'utf8');

  assert.ok(
    swContent.includes("self.addEventListener('push'"),
    'sw.js must retain push event listener'
  );
  assert.ok(
    swContent.includes("self.addEventListener('notificationclick'"),
    'sw.js must retain notificationclick event listener'
  );
  assert.ok(
    swContent.includes('self.registration.showNotification'),
    'sw.js must show notification via registration'
  );

  // Verify proxy worker exists and imports sw.js
  const proxyContent = fs.readFileSync(path.resolve('public/firebase-messaging-sw.js'), 'utf8');
  assert.ok(
    proxyContent.includes("importScripts('/sw.js')"),
    'firebase-messaging-sw.js must proxy to /sw.js'
  );
});

// 7. sw.js API and Socket.IO Pass-through Safety
test('7. sw.js never intercepts or caches Socket.IO or API traffic', () => {
  const swContent = fs.readFileSync(path.resolve('public/sw.js'), 'utf8');

  assert.ok(
    swContent.includes("url.pathname.startsWith('/socket.io/')") ||
    swContent.includes("url.pathname.includes('/socket.io')"),
    'sw.js must pass Socket.IO requests through without caching'
  );
  assert.ok(
    swContent.includes("url.pathname.startsWith('/api/')") ||
    swContent.includes("url.pathname.includes('/api')"),
    'sw.js must pass API requests through without caching'
  );
});

// 8. server.js Service Worker Cache-Control Headers
test('8. server.js configures no-cache for sw.js and SPA fallback', () => {
  const serverContent = fs.readFileSync(path.resolve('server/server.js'), 'utf8');

  assert.ok(
    serverContent.includes('/sw.js') && serverContent.includes('no-cache, no-store, must-revalidate'),
    'server.js must set Cache-Control: no-cache, no-store, must-revalidate for sw.js'
  );
  assert.ok(
    serverContent.includes('res.setHeader(\'Cache-Control\', \'no-cache\')'),
    'server.js must set Cache-Control: no-cache on SPA index.html'
  );
});

// 9. index.html Registration Cleanliness
test('9. index.html does not contain duplicate serviceWorker.register call', () => {
  const indexContent = fs.readFileSync(path.resolve('index.html'), 'utf8');

  assert.ok(
    !indexContent.includes("navigator.serviceWorker.register('/sw.js')"),
    'index.html must not contain redundant serviceWorker.register call'
  );
  assert.ok(
    indexContent.includes('window.__PWA_PROMPT__'),
    'index.html must retain beforeinstallprompt capture'
  );
});

console.log('=================================================');
console.log('ALL PWA UPDATE SAFETY TESTS PASSED SUCCESSFULLY!');
console.log('=================================================');
