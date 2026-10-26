const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 5174;
const FPS = parseInt(process.env.FPS || '30', 10);
const DURATION_SEC = parseInt(process.env.DURATION || '30', 10);
const TOTAL_FRAMES = DURATION_SEC * FPS; // 900 frames for 30s @ 30fps

const OUTPUT_DIR = path.join(__dirname, '../output');
const FRAMES_DIR = path.join(OUTPUT_DIR, 'frames');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Clean old frames
console.log('Cleaning old frames in', FRAMES_DIR);
const oldFiles = fs.readdirSync(FRAMES_DIR);
for (const file of oldFiles) {
  if (file.endsWith('.png')) {
    fs.unlinkSync(path.join(FRAMES_DIR, file));
  }
}

let receivedCount = 0;
let chromeProcess = null;
let startTime = null;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/frame' && req.method === 'POST') {
    const frameIndex = parseInt(url.searchParams.get('index') || '0', 10);
    const frameFilename = `frame_${String(frameIndex).padStart(4, '0')}.png`;
    const framePath = path.join(FRAMES_DIR, frameFilename);

    const fileStream = fs.createWriteStream(framePath);
    req.pipe(fileStream);

    fileStream.on('finish', () => {
      receivedCount++;
      if (receivedCount % 50 === 0 || receivedCount === TOTAL_FRAMES) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const fpsRate = (receivedCount / ((Date.now() - startTime) / 1000)).toFixed(1);
        console.log(`[Capture] Saved frame ${receivedCount}/${TOTAL_FRAMES} (${((receivedCount/TOTAL_FRAMES)*100).toFixed(1)}%) - ${fpsRate} fps - Elapsed: ${elapsed}s`);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, saved: frameIndex }));
    });

    fileStream.on('error', (err) => {
      console.error(`Error saving frame ${frameIndex}:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  if (url.pathname === '/api/done' && req.method === 'POST') {
    console.log(`\nAll ${receivedCount} frames received! Terminating browser and compiling videos...`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, total: receivedCount }));

    if (chromeProcess) {
      try {
        console.log('Terminating Chrome headless...');
        chromeProcess.kill('SIGTERM');
      } catch (e) {
        // ignore
      }
    }

    setTimeout(() => {
      encodeVideos();
    }, 1500);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function encodeVideos() {
  console.log('\n========================================');
  console.log('STARTING FFMPEG VIDEO COMPILATION');
  console.log(`Resolution: 800x1000 | FPS: ${FPS} | Duration: ${DURATION_SEC}s`);
  console.log('========================================\n');

  const inputPattern = path.join(FRAMES_DIR, 'frame_%04d.png');
  const webmOutput = path.join(OUTPUT_DIR, 'vera_idle_30s_transparent.webm');
  const movOutput = path.join(OUTPUT_DIR, 'vera_idle_30s_transparent.mov');
  const mp4GreenOutput = path.join(OUTPUT_DIR, 'vera_idle_30s_greenscreen.mp4');

  try {
    // 1. Transparent WebM (VP9 + Alpha)
    console.log('[1/3] Encoding Transparent WebM (VP9 + Alpha)...');
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 3M -auto-alt-ref 0 "${webmOutput}"`,
      { stdio: 'inherit' }
    );
    console.log(`  -> Finished: ${webmOutput} (${(fs.statSync(webmOutput).size / 1024 / 1024).toFixed(2)} MB)`);

    // 2. Transparent Apple ProRes 4444 (MOV + Alpha)
    console.log('\n[2/3] Encoding Transparent Apple ProRes 4444 (MOV + Alpha)...');
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -vendor apl0 "${movOutput}"`,
      { stdio: 'inherit' }
    );
    console.log(`  -> Finished: ${movOutput} (${(fs.statSync(movOutput).size / 1024 / 1024).toFixed(2)} MB)`);

    // 3. Green Screen MP4 (Chroma Key #00FF00)
    console.log('\n[3/3] Encoding Green Screen MP4 (Chroma Key #00FF00)...');
    execSync(
      `ffmpeg -y -f lavfi -i color=c=0x00FF00:s=800x1000:r=${FPS} -framerate ${FPS} -i "${inputPattern}" -filter_complex "[0:v][1:v]overlay=shortest=1:format=auto[outv]" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -crf 16 -t ${DURATION_SEC} "${mp4GreenOutput}"`,
      { stdio: 'inherit' }
    );
    console.log(`  -> Finished: ${mp4GreenOutput} (${(fs.statSync(mp4GreenOutput).size / 1024 / 1024).toFixed(2)} MB)`);

    // Copy to user's Downloads folder
    const userDownloads = path.join(process.env.USERPROFILE || 'C:\\Users\\arief', 'Downloads', 'Vera_Avatar_30s');
    if (!fs.existsSync(userDownloads)) fs.mkdirSync(userDownloads, { recursive: true });

    fs.copyFileSync(webmOutput, path.join(userDownloads, 'vera_idle_30s_transparent.webm'));
    fs.copyFileSync(movOutput, path.join(userDownloads, 'vera_idle_30s_transparent.mov'));
    fs.copyFileSync(mp4GreenOutput, path.join(userDownloads, 'vera_idle_30s_greenscreen.mp4'));

    console.log('\n========================================');
    console.log('SUCCESS! ALL 30-SECOND VIDEOS GENERATED & COPIED TO:');
    console.log('Project output folder:', OUTPUT_DIR);
    console.log('User Downloads folder:', userDownloads);
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error during ffmpeg encoding:', err);
    process.exit(1);
  }
}

server.listen(PORT, () => {
  console.log(`Capture server listening on http://localhost:${PORT}`);
  console.log(`Target: ${TOTAL_FRAMES} frames (${DURATION_SEC} seconds @ ${FPS} fps)`);

  startTime = Date.now();

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_render_profile_' + Date.now());
  const captureUrl = `http://localhost:5173/render-capture.html?seconds=${DURATION_SEC}&fps=${FPS}`;

  const args = [
    '--headless=new',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    `--user-data-dir=${userDataDir}`,
    `--window-size=1000,1200`,
    captureUrl
  ];

  console.log('Launching Chrome headless to start frame capture...');
  chromeProcess = spawn(chromePath, args);

  chromeProcess.on('error', (err) => {
    console.error('Failed to spawn Chrome:', err);
    process.exit(1);
  });

  // Watchdog timeout: 5 minutes max
  setTimeout(() => {
    if (receivedCount < TOTAL_FRAMES) {
      console.error(`Timeout! Only received ${receivedCount}/${TOTAL_FRAMES} frames in 5 minutes.`);
      if (chromeProcess) try { chromeProcess.kill(); } catch (e) {}
      process.exit(1);
    }
  }, 300000);
});
