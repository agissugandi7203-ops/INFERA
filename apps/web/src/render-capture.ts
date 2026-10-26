import { Application } from 'pixi.js';
import { CharacterModel } from './features/dashboard/avatar/CharacterModel';
import { AvatarController } from './features/dashboard/avatar/AvatarController';

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

async function init() {
  const statusEl = document.getElementById('status')!;
  const progressEl = document.getElementById('progress')!;

  const urlParams = new URLSearchParams(window.location.search);
  const totalSeconds = parseFloat(urlParams.get('seconds') || '30');
  const fps = parseInt(urlParams.get('fps') || '30', 10);
  const totalFrames = Math.round(totalSeconds * fps);

  statusEl.innerText = `Setting up PixiJS (Resolution: 800x1000, Total frames: ${totalFrames})...`;

  const VIRTUAL_WIDTH = 800;
  const VIRTUAL_HEIGHT = 1000;

  const app = new Application();
  await app.init({
    width: VIRTUAL_WIDTH,
    height: VIRTUAL_HEIGHT,
    backgroundAlpha: 0,
    antialias: true,
    resolution: 1,
    preference: 'webgl',
    preserveDrawingBuffer: true,
  });

  document.body.appendChild(app.canvas);

  statusEl.innerText = 'Loading character assets (manifest & atlas)...';
  const model = new CharacterModel();
  await model.load(
    '/avatar/character-manifest.json',
    '/avatar/character-atlas.png'
  );

  const controller = new AvatarController(model) as any;

  // Exact framing from AvatarCanvas.tsx
  const fitScale = 1.18;
  model.rootContainer.scale.set(fitScale);
  model.rootContainer.position.x = VIRTUAL_WIDTH / 2 - 562 * fitScale;
  model.rootContainer.position.y = 65 - 180 * fitScale;

  app.stage.addChild(model.rootContainer);

  // Read saved baselines from controller
  const headInitX = controller.headInitX;
  const headInitY = controller.headInitY;
  const bHairInitX = controller.bHairInitX;
  const bHairInitY = controller.bHairInitY;
  const armLInitY = controller.armLInitY;
  const armRInitY = controller.armRInitY;
  const handLInitY = controller.handLInitY;
  const handRInitY = controller.handRInitY;
  const sleeveLInitY = controller.sleeveLInitY;
  const sleeveRInitY = controller.sleeveRInitY;
  const fHair1InitX = controller.fHair1InitX;
  const fHair2InitX = controller.fHair2InitX;
  const fHair3InitX = controller.fHair3InitX;
  const fHair12InitX = controller.fHair12InitX;
  const pupilLInitX = controller.pupilLInitX;
  const pupilLInitY = controller.pupilLInitY;
  const pupilRInitX = controller.pupilRInitX;
  const pupilRInitY = controller.pupilRInitY;
  const browLInitX = controller.browLInitX;
  const browLInitY = controller.browLInitY;
  const browRInitX = controller.browRInitX;
  const browRInitY = controller.browRInitY;

  // Harmonically tuned frequencies to guarantee 100% mathematical seamless looping at T = 30s
  const T = totalSeconds;
  const wb = (8 * 2 * Math.PI) / T;   // ~1.675 rad/s (breathing & chest, ~3.75s period)
  const whd = (5 * 2 * Math.PI) / T;  // ~1.047 rad/s (head sway drift)
  const wht = (4 * 2 * Math.PI) / T;  // ~0.838 rad/s (head tilt)
  const whb = (6 * 2 * Math.PI) / T;  // ~1.257 rad/s (back hair inertia)
  const wf1 = (11 * 2 * Math.PI) / T; // ~2.304 rad/s (bangs 1)
  const wf2 = (10 * 2 * Math.PI) / T; // ~2.094 rad/s (bangs 2)
  const wf3 = (12 * 2 * Math.PI) / T; // ~2.513 rad/s (bangs 3)
  const wf12 = (10 * 2 * Math.PI) / T;// ~2.094 rad/s (side bang)

  // Natural blink timestamps (in seconds)
  // Phase 1 (Normal): 3.0s, 7.0s
  // Phase 2 (Happy): 13.5s, 17.5s
  // Phase 3 (Thinking): 23.5s, 27.5s
  const blinkTimestamps = [3.0, 7.0, 13.5, 17.5, 23.5, 27.5];
  const BLINK_DURATION = 0.16; // 160ms anime blink

  // Sprites references
  const armL = model.getSprite('arm_l');
  const armR = model.getSprite('arm_r');
  const handL = model.getSprite('hand_l');
  const handR = model.getSprite('hand_r');
  const sleeveL = model.getSprite('sleeve_l');
  const sleeveR = model.getSprite('sleeve_r');
  const bHair = model.getSprite('b_hair_long');
  const f1 = model.getSprite('f_hair_1');
  const f2 = model.getSprite('f_hair_2');
  const f3 = model.getSprite('f_hair_3');
  const f12 = model.getSprite('f_hair_1_2');
  const pupilL = model.getSprite('eye_l_pupil');
  const pupilR = model.getSprite('eye_r_pupil');
  const browL = model.getSprite('eyebrow_l');
  const browR = model.getSprite('eyebrow_r');
  const mouthClosed = model.getSprite('mouth_closed');
  const mouth3 = model.getSprite('mouth_3');
  const mouthOpen = model.getSprite('mouth_open');
  const mouthUncomfortable = model.getSprite('mouth_uncomfortable');

  if (mouthOpen) mouthOpen.visible = false;
  if (mouthUncomfortable) mouthUncomfortable.visible = false;

  statusEl.innerText = 'Starting multi-expression 30s frame capture (10s Normal -> 10s Happy -> 10s Thinking)...';
  const startTime = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const t = (frame / fps); // Current time in seconds (0.000 to 29.967)

    // ==========================================
    // 1. EMOTION LOGIC (Changes every 10 seconds)
    // 0.0s - 10.0s : NORMAL (Idle, calm, attentive)
    // 10.0s - 20.0s: HAPPY (Warm, smiling :3 mouth, happy eyes)
    // 20.0s - 30.0s: THINKING (Deep pensive AI analysis gaze)
    // ==========================================
    let targetBrowL_Y = browLInitY;
    let targetBrowL_Rot = 0;
    let targetBrowR_Y = browRInitY;
    let targetBrowR_Rot = 0;
    let targetEyeBaseScaleY = 1.0;
    let targetHeadTiltOffset = 0;
    let targetPupilX = 0;
    let targetPupilY = 0;
    let activeMouth: 'closed' | 'mouth_3' = 'closed';

    if (t < 9.6) {
      // Pure Normal (0s - 9.6s)
      targetBrowL_Y = browLInitY;
      targetBrowL_Rot = 0;
      targetBrowR_Y = browRInitY;
      targetBrowR_Rot = 0;
      targetEyeBaseScaleY = 1.0;
      targetHeadTiltOffset = 0;
      targetPupilX = 0;
      targetPupilY = 0;
      activeMouth = 'closed';
    } else if (t < 10.0) {
      // Transition Normal -> Happy (9.6s - 10.0s, 0.4s smooth ease)
      const p = smoothstep(9.6, 10.0, t);
      targetBrowL_Y = lerp(browLInitY, browLInitY - 5, p);
      targetBrowL_Rot = lerp(0, 0.06, p);
      targetBrowR_Y = lerp(browRInitY, browRInitY - 5, p);
      targetBrowR_Rot = lerp(0, -0.06, p);
      targetEyeBaseScaleY = lerp(1.0, 0.76, p);
      targetHeadTiltOffset = lerp(0, 0.035, p);
      targetPupilX = 0;
      targetPupilY = 0;
      activeMouth = p >= 0.5 ? 'mouth_3' : 'closed';
    } else if (t < 19.6) {
      // Pure Happy (10.0s - 19.6s)
      targetBrowL_Y = browLInitY - 5;
      targetBrowL_Rot = 0.06;
      targetBrowR_Y = browRInitY - 5;
      targetBrowR_Rot = -0.06;
      targetEyeBaseScaleY = 0.76;
      targetHeadTiltOffset = 0.035;
      targetPupilX = 0;
      targetPupilY = 0;
      activeMouth = 'mouth_3';
    } else if (t < 20.0) {
      // Transition Happy -> Thinking (19.6s - 20.0s, 0.4s smooth ease)
      const p = smoothstep(19.6, 20.0, t);
      targetBrowL_Y = lerp(browLInitY - 5, browLInitY - 3, p);
      targetBrowL_Rot = lerp(0.06, -0.05, p);
      targetBrowR_Y = lerp(browRInitY - 5, browRInitY - 2, p);
      targetBrowR_Rot = lerp(-0.06, 0.05, p);
      targetEyeBaseScaleY = lerp(0.76, 1.0, p);
      targetHeadTiltOffset = lerp(0.035, 0.05, p);
      targetPupilX = lerp(0, 2.5, p);
      targetPupilY = lerp(0, -2.5, p);
      activeMouth = p >= 0.5 ? 'closed' : 'mouth_3';
    } else if (t < 29.5) {
      // Pure Thinking (20.0s - 29.5s)
      targetBrowL_Y = browLInitY - 3;
      targetBrowL_Rot = -0.05;
      targetBrowR_Y = browRInitY - 2;
      targetBrowR_Rot = 0.05;
      targetEyeBaseScaleY = 1.0;
      targetHeadTiltOffset = 0.05;
      targetPupilX = 2.5;
      targetPupilY = -2.5;
      activeMouth = 'closed';
    } else {
      // Smooth Transition Thinking -> Normal (29.5s - 30.0s) for 100% seamless loop!
      const p = smoothstep(29.5, 30.0, t);
      targetBrowL_Y = lerp(browLInitY - 3, browLInitY, p);
      targetBrowL_Rot = lerp(-0.05, 0, p);
      targetBrowR_Y = lerp(browRInitY - 2, browRInitY, p);
      targetBrowR_Rot = lerp(0.05, 0, p);
      targetEyeBaseScaleY = 1.0;
      targetHeadTiltOffset = lerp(0.05, 0, p);
      targetPupilX = lerp(2.5, 0, p);
      targetPupilY = lerp(-2.5, 0, p);
      activeMouth = 'closed';
    }

    // Apply Mouth sprite visibility
    if (mouthClosed) mouthClosed.visible = (activeMouth === 'closed');
    if (mouth3) mouth3.visible = (activeMouth === 'mouth_3');

    // Apply Eyebrows
    if (browL) {
      browL.position.y = targetBrowL_Y;
      browL.rotation = targetBrowL_Rot;
    }
    if (browR) {
      browR.position.y = targetBrowR_Y;
      browR.rotation = targetBrowR_Rot;
    }

    // ==========================================
    // 2. BREATHING & SKELETAL MOVEMENT
    // ==========================================
    const breathRaw = Math.sin(t * wb);
    const breath = Math.sign(breathRaw) * Math.pow(Math.abs(breathRaw), 0.85);

    model.bodyContainer.position.y = breath * 2.4;
    model.bodyContainer.scale.x = 1.0 + breath * 0.005;

    // Head drift & tilt (including emotion offset)
    const headDrift = Math.sin(t * whd);
    const headTilt = Math.cos(t * wht);
    model.headContainer.rotation = headTilt * 0.018 + targetHeadTiltOffset;
    model.headContainer.position.x = headInitX + headDrift * 1.6;
    model.headContainer.position.y = headInitY + breath * 2.4;

    // Arms & hands secondary lag
    const armPhase = t * wb - 0.7;
    const armDrift = Math.sin(armPhase);

    if (armL) armL.position.y = armLInitY + armDrift * 2.0;
    if (armR) armR.position.y = armRInitY + armDrift * 2.0;
    if (handL) handL.position.y = handLInitY + Math.sin(armPhase - 0.35) * 2.6;
    if (handR) handR.position.y = handRInitY + Math.sin(armPhase - 0.35) * 2.6;
    if (sleeveL) sleeveL.position.y = sleeveLInitY + breath * 1.6;
    if (sleeveR) sleeveR.position.y = sleeveRInitY + breath * 1.6;

    // Hair secondary inertia & spring physics
    if (bHair) {
      const bHairLag = Math.sin(t * whb - 0.5) * 3.2;
      bHair.position.x = bHairInitX + bHairLag;
      bHair.position.y = bHairInitY + breath * 1.8;
      bHair.rotation = Math.sin(t * whb - 0.7) * 0.018;
    }

    if (f1) f1.position.x = fHair1InitX + Math.sin(t * wf1) * 1.8;
    if (f2) f2.position.x = fHair2InitX - Math.sin(t * wf2 + 0.4) * 1.6;
    if (f3) f3.position.x = fHair3InitX + Math.sin(t * wf3 - 0.3) * 1.3;
    if (f12) f12.position.x = fHair12InitX + Math.sin(t * wf12 + 0.6) * 1.1;

    // ==========================================
    // 3. EYE BLINKING & GLANCES
    // ==========================================
    let blinkMult = 1.0;
    for (const bTime of blinkTimestamps) {
      const dtBlink = t - bTime;
      if (dtBlink >= 0 && dtBlink < BLINK_DURATION) {
        const progress = dtBlink / BLINK_DURATION;
        blinkMult = Math.max(0.05, 1.0 - Math.sin(progress * Math.PI));
        break;
      }
    }
    model.eyeLContainer.scale.y = targetEyeBaseScaleY * blinkMult;
    model.eyeRContainer.scale.y = targetEyeBaseScaleY * blinkMult;

    // Pupil Saccades (subtle glancing in normal/thinking)
    let saccadeX = 0;
    let saccadeY = 0;
    if (targetPupilX === 0 && targetPupilY === 0) {
      // Subtle glance in normal mode
      saccadeX = Math.sin(t * ((3 * 2 * Math.PI) / T)) * 0.8 + Math.sin(t * ((7 * 2 * Math.PI) / T)) * 0.4;
      saccadeY = (Math.cos(t * ((2 * 2 * Math.PI) / T)) - 1) * 0.3;
    }

    if (pupilL) {
      pupilL.position.x = pupilLInitX + targetPupilX + saccadeX;
      pupilL.position.y = pupilLInitY + targetPupilY + saccadeY;
    }
    if (pupilR) {
      pupilR.position.x = pupilRInitX + targetPupilX + saccadeX;
      pupilR.position.y = pupilRInitY + targetPupilY + saccadeY;
    }

    // Render WebGL frame
    app.render();

    // Convert canvas to PNG blob
    const blob = await new Promise<Blob | null>((resolve) => {
      app.canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) {
      throw new Error(`Failed to capture blob for frame ${frame}`);
    }

    // Send binary data directly to local capture server
    const res = await fetch(`http://localhost:5174/api/frame?index=${frame}&total=${totalFrames}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: blob,
    });

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status} on frame ${frame}`);
    }

    // Update progress display
    const percent = (((frame + 1) / totalFrames) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const fpsRate = ((frame + 1) / ((Date.now() - startTime) / 1000)).toFixed(1);
    progressEl.innerText = `Frame ${frame + 1} / ${totalFrames} (${percent}%) - ${fpsRate} fps - Elapsed: ${elapsed}s`;
  }

  statusEl.innerText = 'All frames captured successfully! Finalizing...';
  await fetch('http://localhost:5174/api/done', { method: 'POST' });
}

init().catch((err) => {
  console.error(err);
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.innerText = 'Render Error: ' + err.message;
});
