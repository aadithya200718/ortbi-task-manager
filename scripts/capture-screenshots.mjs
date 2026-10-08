import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const outDir = process.env.ORBIT_SCREENSHOT_DIR || 'd:/orbit-task managment/docs/screenshots/taste-final';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureScreen(pageUrl, filename, width = 1440, height = 900, token = null) {
  console.log(`Navigating to ${pageUrl} (${width}x${height}) -> ${filename}...`);
  const target = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((res) => ws.onopen = res);

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1.5,
    mobile: width < 600,
  });

  if (token) {
    // Navigate to origin first to set sessionStorage reliably
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
    await new Promise(r => setTimeout(r, 600));
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `sessionStorage.setItem('orbit_access_token', ${JSON.stringify(token)});`,
    });
  }

  await sendCDP(ws, 'Page.navigate', { url: pageUrl });
  await new Promise(r => setTimeout(r, 2600));
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); document.querySelectorAll('*').forEach((element) => { if (element.scrollLeft) element.scrollLeft = 0; });`,
  });
  await new Promise(r => setTimeout(r, 100));
  const { data } = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, buf);
  console.log(`Saved: ${filePath}`);

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
}

async function run() {
  console.log('Spawning headless Chrome...');
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:/temp/chrome-profile',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version').then(r => r.json());
      if (res.Browser) {
        ready = true;
        console.log(`Chrome ready: ${res.Browser}`);
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!ready) {
    chrome.kill();
    throw new Error('Chrome failed to start CDP listener on port 9222');
  }

  try {
    // 1. Desktop 1440px Auth
    await captureScreen('http://localhost:3000/login', 'desktop_login.png', 1440, 900);
    await captureScreen('http://localhost:3000/register', 'desktop_register.png', 1440, 900);

    // 2. Authenticate demo account with real data
    const email = `showcase_${Date.now()}@orbit.local`;
    const regRes = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ahmad Nur Fauzi',
        email,
        password: 'Password123!',
      }),
    }).then(r => r.json());

    const token = regRes.accessToken;
    console.log('Registered demo user with token:', !!token);

    // 3. Create Projects
    const proj1 = await fetch('http://localhost:4000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Product Development',
        description: 'Transforming ideas into impactful solutions through research, design, and innovation.',
        status: 'IN_PROGRESS',
        startDate: '2026-05-01',
        endDate: '2026-10-30',
      }),
    }).then(r => r.json());

    const proj2 = await fetch('http://localhost:4000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Website Redesign',
        description: 'Complete overhaul of customer-facing web presence with modern motion design.',
        status: 'IN_PROGRESS',
        startDate: '2026-06-01',
        endDate: '2026-11-15',
      }),
    }).then(r => r.json());

    const projId = proj1.id;

    // 4. Create Tasks for Product Development
    await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId: projId,
        name: 'Design team planning & sprint sync',
        description: 'Creating a seamless mobile app flow and review component tokens.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2026-10-20',
      }),
    });

    await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId: projId,
        name: 'Design Assets Export',
        description: 'Export all icon sets and vector components for mobile.',
        priority: 'LOW',
        status: 'COMPLETED',
        dueDate: '2026-10-15',
      }),
    });

    await fetch('http://localhost:4000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId: projId,
        name: 'Marketing Campaign Launch',
        description: 'Prepare landing page copy and social media assets.',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: '2026-10-25',
      }),
    });

    if (proj2.id) {
      await fetch('http://localhost:4000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: proj2.id,
          name: 'Build authentication flow with 52/48 split',
          description: 'Verify desktop split layout and mobile responsive collapsible container.',
          priority: 'HIGH',
          status: 'COMPLETED',
          dueDate: '2026-10-18',
        }),
      });
    }

    // 5. Desktop 1440px Screenshots
    await captureScreen('http://localhost:3000/dashboard', 'desktop_dashboard.png', 1440, 900, token);
    await captureScreen('http://localhost:3000/projects', 'desktop_projects.png', 1440, 900, token);
    if (projId) {
      await captureScreen(`http://localhost:3000/projects/${projId}`, 'desktop_project_detail.png', 1440, 900, token);
    }
    await captureScreen('http://localhost:3000/tasks', 'desktop_tasks.png', 1440, 900, token);

    // 6. Mobile 390px Screenshots
    await captureScreen('http://localhost:3000/login', 'mobile_login.png', 390, 844);
    await captureScreen('http://localhost:3000/dashboard', 'mobile_dashboard.png', 390, 844, token);
    await captureScreen('http://localhost:3000/projects', 'mobile_projects.png', 390, 844, token);
    await captureScreen('http://localhost:3000/tasks', 'mobile_tasks.png', 390, 844, token);

    // 7. Responsive inspection widths
    await captureScreen('http://localhost:3000/dashboard', 'responsive_430_dashboard.png', 430, 900, token);
    await captureScreen('http://localhost:3000/dashboard', 'responsive_1024_dashboard.png', 1024, 900, token);
    await captureScreen('http://localhost:3000/dashboard', 'responsive_1366_dashboard.png', 1366, 900, token);
    await captureScreen('http://localhost:3000/dashboard', 'responsive_1920_dashboard.png', 1920, 1080, token);

    // 8. Tablet 768px Screenshot
    await captureScreen('http://localhost:3000/dashboard', 'tablet_dashboard.png', 768, 1024, token);

    console.log('ALL SCREENSHOTS CAPTURED WITH LIVE DATA!');
  } finally {
    chrome.kill();
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
