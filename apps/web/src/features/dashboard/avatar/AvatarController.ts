import gsap from 'gsap';
import { CharacterModel } from './CharacterModel';

export type CharacterEmotion =
  | 'normal'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'confused'
  | 'thinking'
  | 'listening'
  | 'speaking';

export class AvatarController {
  private model: CharacterModel;
  private currentEmotion: CharacterEmotion = 'normal';

  // Animation Timing
  private time = 0;
  private nextBlink = 2.8;
  private isBlinking = false;
  private blinkProgress = 0;

  // Eye Saccades (natural micro glances)
  private saccadeTimer = 3.0;
  private saccadeOffsetX = 0;
  private saccadeOffsetY = 0;

  // Speaking & Mouth Animation State
  private mouthOpenAmount = 0;
  private targetMouthOpen = 0;
  private speakingFlapTime = 0;

  // Initial Transform Baselines (for zero-residual absolute resetting)
  private browLInitX = 0;
  private browLInitY = 0;
  private browRInitX = 0;
  private browRInitY = 0;

  private pupilLInitX = 0;
  private pupilLInitY = 0;
  private pupilRInitX = 0;
  private pupilRInitY = 0;

  private headInitX = 0;
  private headInitY = 0;

  private bHairInitX = 0;
  private bHairInitY = 0;

  private armLInitY = 0;
  private armRInitY = 0;
  private handLInitY = 0;
  private handRInitY = 0;
  private sleeveLInitY = 0;
  private sleeveRInitY = 0;

  private fHair1InitX = 0;
  private fHair2InitX = 0;
  private fHair3InitX = 0;
  private fHair12InitX = 0;

  constructor(model: CharacterModel) {
    this.model = model;
    this.saveInitialTransforms();
    this.applyMouthVisual('closed');
    this.setNormalEyesVisible(true);
  }

  private saveInitialTransforms(): void {
    const browL = this.model.getSprite('eyebrow_l');
    if (browL) {
      // Set pivot to center for clean rotation
      browL.anchor.set(0.5, 0.5);
      browL.position.x += browL.width / 2;
      browL.position.y += browL.height / 2;
      this.browLInitX = browL.position.x;
      this.browLInitY = browL.position.y;
    }

    const browR = this.model.getSprite('eyebrow_r');
    if (browR) {
      browR.anchor.set(0.5, 0.5);
      browR.position.x += browR.width / 2;
      browR.position.y += browR.height / 2;
      this.browRInitX = browR.position.x;
      this.browRInitY = browR.position.y;
    }

    const pupilL = this.model.getSprite('eye_l_pupil');
    if (pupilL) {
      this.pupilLInitX = pupilL.position.x;
      this.pupilLInitY = pupilL.position.y;
    }

    const pupilR = this.model.getSprite('eye_r_pupil');
    if (pupilR) {
      this.pupilRInitX = pupilR.position.x;
      this.pupilRInitY = pupilR.position.y;
    }

    this.headInitX = this.model.headContainer.position.x;
    this.headInitY = this.model.headContainer.position.y;

    const bHair = this.model.getSprite('b_hair_long');
    if (bHair) {
      this.bHairInitX = bHair.position.x;
      this.bHairInitY = bHair.position.y;
    }

    const armL = this.model.getSprite('arm_l');
    if (armL) this.armLInitY = armL.position.y;

    const armR = this.model.getSprite('arm_r');
    if (armR) this.armRInitY = armR.position.y;

    const handL = this.model.getSprite('hand_l');
    if (handL) this.handLInitY = handL.position.y;

    const handR = this.model.getSprite('hand_r');
    if (handR) this.handRInitY = handR.position.y;

    const sleeveL = this.model.getSprite('sleeve_l');
    if (sleeveL) this.sleeveLInitY = sleeveL.position.y;

    const sleeveR = this.model.getSprite('sleeve_r');
    if (sleeveR) this.sleeveRInitY = sleeveR.position.y;

    const f1 = this.model.getSprite('f_hair_1');
    if (f1) this.fHair1InitX = f1.position.x;

    const f2 = this.model.getSprite('f_hair_2');
    if (f2) this.fHair2InitX = f2.position.x;

    const f3 = this.model.getSprite('f_hair_3');
    if (f3) this.fHair3InitX = f3.position.x;

    const f12 = this.model.getSprite('f_hair_1_2');
    if (f12) this.fHair12InitX = f12.position.x;

    // Anchor open mouth at top lip center so scaling down closes toward upper lip
    const mouthOpen = this.model.getSprite('mouth_open');
    if (mouthOpen) {
      mouthOpen.anchor.set(0.5, 0.1);
      mouthOpen.position.x += mouthOpen.width / 2;
    }
  }

  public update(deltaMs: number): void {
    if (!this.model.isLoaded) return;

    const dt = Math.min(deltaMs / 1000, 0.1);
    this.time += dt;

    // 1. Lively, Noticeable Breathing Physics (chest expansion & vertical heave)
    const breathSpeed = 1.6;
    const breathRaw = Math.sin(this.time * breathSpeed);
    const breath = Math.sign(breathRaw) * Math.pow(Math.abs(breathRaw), 0.85);

    this.model.bodyContainer.position.y = breath * 2.4;
    this.model.bodyContainer.scale.x = 1.0 + breath * 0.005;

    // 2. Active Head Drift & Tilt
    const headDrift = Math.sin(this.time * 1.0);
    const headTilt = Math.cos(this.time * 0.8);

    if (this.currentEmotion !== 'thinking' && this.currentEmotion !== 'confused') {
      this.model.headContainer.rotation = headTilt * 0.018;
      this.model.headContainer.position.x = this.headInitX + headDrift * 1.6;
      this.model.headContainer.position.y = this.headInitY + breath * 2.4;
    }

    // 3. Realistic Arms & Hands Floating Secondary Lag
    const armPhase = this.time * 1.6 - 0.7;
    const armDrift = Math.sin(armPhase);

    const armL = this.model.getSprite('arm_l');
    if (armL) armL.position.y = this.armLInitY + armDrift * 2.0;

    const armR = this.model.getSprite('arm_r');
    if (armR) armR.position.y = this.armRInitY + armDrift * 2.0;

    const handL = this.model.getSprite('hand_l');
    if (handL) handL.position.y = this.handLInitY + Math.sin(armPhase - 0.35) * 2.6;

    const handR = this.model.getSprite('hand_r');
    if (handR) handR.position.y = this.handRInitY + Math.sin(armPhase - 0.35) * 2.6;

    const sleeveL = this.model.getSprite('sleeve_l');
    if (sleeveL) sleeveL.position.y = this.sleeveLInitY + breath * 1.6;

    const sleeveR = this.model.getSprite('sleeve_r');
    if (sleeveR) sleeveR.position.y = this.sleeveRInitY + breath * 1.6;

    // 4. Hair Secondary Inertia & Spring Physics
    const bHair = this.model.getSprite('b_hair_long');
    if (bHair) {
      const bHairLag = Math.sin(this.time * 1.3 - 0.5) * 3.2;
      bHair.position.x = this.bHairInitX + bHairLag;
      bHair.position.y = this.bHairInitY + breath * 1.8;
      bHair.rotation = Math.sin(this.time * 1.3 - 0.7) * 0.018;
    }

    const f1 = this.model.getSprite('f_hair_1');
    if (f1) f1.position.x = this.fHair1InitX + Math.sin(this.time * 2.3) * 1.8;

    const f2 = this.model.getSprite('f_hair_2');
    if (f2) f2.position.x = this.fHair2InitX - Math.sin(this.time * 2.0 + 0.4) * 1.6;

    const f3 = this.model.getSprite('f_hair_3');
    if (f3) f3.position.x = this.fHair3InitX + Math.sin(this.time * 2.5 - 0.3) * 1.3;

    const f12 = this.model.getSprite('f_hair_1_2');
    if (f12) f12.position.x = this.fHair12InitX + Math.sin(this.time * 2.1 + 0.6) * 1.1;

    // 5. Blinking & Eye Micro-Saccades
    this.updateBlinking(dt);
    this.updateEyeSaccades(dt);

    // 6. Conversational Mouth Animation & Flapping
    this.updateMouthAnimation(dt);
  }

  private updateBlinking(dt: number): void {
    if (!this.isBlinking) {
      this.nextBlink -= dt;
      if (this.nextBlink <= 0) {
        this.isBlinking = true;
        this.blinkProgress = 0;
        this.nextBlink = 2.2 + Math.random() * 3.2;
      }
    } else {
      this.blinkProgress += dt * 9.0;
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.model.eyeLContainer.scale.y = 1.0;
        this.model.eyeRContainer.scale.y = 1.0;
      } else {
        const eyeScale = Math.max(0.05, 1.0 - Math.sin(this.blinkProgress));
        if (this.currentEmotion !== 'happy' && this.currentEmotion !== 'surprised' && this.currentEmotion !== 'confused') {
          this.model.eyeLContainer.scale.y = eyeScale;
          this.model.eyeRContainer.scale.y = eyeScale;
        }
      }
    }
  }

  private updateEyeSaccades(dt: number): void {
    this.saccadeTimer -= dt;
    if (this.saccadeTimer <= 0) {
      this.saccadeOffsetX = (Math.random() - 0.5) * 1.6;
      this.saccadeOffsetY = (Math.random() - 0.5) * 1.0;
      this.saccadeTimer = 2.0 + Math.random() * 3.0;
    }

    if (this.currentEmotion !== 'thinking' && this.currentEmotion !== 'surprised' && this.currentEmotion !== 'confused') {
      const pupilL = this.model.getSprite('eye_l_pupil');
      const pupilR = this.model.getSprite('eye_r_pupil');

      if (pupilL) {
        pupilL.position.x += (this.pupilLInitX + this.saccadeOffsetX - pupilL.position.x) * Math.min(1, dt * 7);
        pupilL.position.y += (this.pupilLInitY + this.saccadeOffsetY - pupilL.position.y) * Math.min(1, dt * 7);
      }
      if (pupilR) {
        pupilR.position.x += (this.pupilRInitX + this.saccadeOffsetX - pupilR.position.x) * Math.min(1, dt * 7);
        pupilR.position.y += (this.pupilRInitY + this.saccadeOffsetY - pupilR.position.y) * Math.min(1, dt * 7);
      }
    }
  }

  private updateMouthAnimation(dt: number): void {
    if (this.currentEmotion === 'speaking') {
      // Continuous conversational speech tempo (~2.2 syllables/sec)
      this.speakingFlapTime += dt * 5.2;

      // Continuous harmonic articulation wave that stays cleanly within the speaking state
      const rawWave = Math.sin(this.speakingFlapTime) * 0.45 + Math.sin(this.speakingFlapTime * 0.45) * 0.35 + 0.2;
      const wave = Math.max(0.1, Math.min(0.85, rawWave));

      // Combine with external TTS open amount if provided
      const targetScale = Math.max(0.12, Math.min(0.85, wave * 0.6 + Math.max(this.targetMouthOpen, 0.1) * 0.4));

      // Smooth interpolation so movement is seamlessly connected without cuts or snaps
      this.mouthOpenAmount += (targetScale - this.mouthOpenAmount) * Math.min(1, dt * 12);

      // Always keep speaking mouth active continuously throughout speaking — never cuts back to mouth_closed!
      this.applyMouthVisual('open', this.mouthOpenAmount);
    } else if (this.currentEmotion === 'happy') {
      this.applyMouthVisual('mouth_3');
    } else if (this.currentEmotion === 'confused') {
      this.applyMouthVisual('mouth_uncomfortable');
    } else {
      // Idle / Normal / Sad / Angry / etc.
      this.mouthOpenAmount += (this.targetMouthOpen - this.mouthOpenAmount) * Math.min(1, dt * 14);
      if (this.mouthOpenAmount > 0.08) {
        this.applyMouthVisual('open', this.mouthOpenAmount);
      } else {
        this.applyMouthVisual('closed');
      }
    }
  }

  public setMouthOpen(open: number): void {
    this.targetMouthOpen = Math.max(0, Math.min(1, open));
  }

  /**
   * Strictly mutually-exclusive mouth visual switcher.
   * Exactly ONE mouth element is visible at any given moment.
   */
  private applyMouthVisual(mode: 'closed' | 'open' | 'mouth_3' | 'mouth_uncomfortable', openScale = 1.0): void {
    const mouthClosed = this.model.getSprite('mouth_closed');
    const mouthOpen = this.model.getSprite('mouth_open');
    const mouth3 = this.model.getSprite('mouth_3');
    const mouthUncomfortable = this.model.getSprite('mouth_uncomfortable');

    if (mouthClosed) mouthClosed.visible = false;
    if (mouthOpen) mouthOpen.visible = false;
    if (mouth3) mouth3.visible = false;
    if (mouthUncomfortable) mouthUncomfortable.visible = false;

    switch (mode) {
      case 'open':
        if (mouthOpen) {
          mouthOpen.visible = true;
          mouthOpen.scale.y = Math.max(0.25, Math.min(1.0, openScale));
          mouthOpen.scale.x = 1.0 + openScale * 0.05;
        }
        break;

      case 'mouth_3':
        if (mouth3) {
          mouth3.visible = true;
          mouth3.alpha = 1;
        }
        break;

      case 'mouth_uncomfortable':
        if (mouthUncomfortable) {
          mouthUncomfortable.visible = true;
          mouthUncomfortable.alpha = 1;
        }
        break;

      case 'closed':
      default:
        if (mouthClosed) {
          mouthClosed.visible = true;
          mouthClosed.alpha = 1;
        }
        break;
    }
  }

  /**
   * Toggles normal detailed eye containers on or off.
   * Completely hides eye whites, lashes, and pupils when special emotion eyes (shock/uncomfortable) are active.
   */
  private setNormalEyesVisible(visible: boolean): void {
    this.model.eyeLContainer.visible = visible;
    this.model.eyeRContainer.visible = visible;
  }

  public setEmotion(emotion: CharacterEmotion, duration = 0.32): void {
    this.currentEmotion = emotion;

    const browL = this.model.getSprite('eyebrow_l');
    const browR = this.model.getSprite('eyebrow_r');
    const pupilL = this.model.getSprite('eye_l_pupil');
    const pupilR = this.model.getSprite('eye_r_pupil');

    const expMad = this.model.getSprite('exp_mad');
    const expDark = this.model.getSprite('exp_dark');
    const expShock = this.model.getSprite('exp_shock');
    const expUncomfortable = this.model.getSprite('exp_uncomfortable');

    // 1. Kill any pending tweens to prevent transition clashes
    const targets = [
      browL,
      browR,
      pupilL,
      pupilR,
      expMad,
      expDark,
      expShock,
      expUncomfortable,
      this.model.headContainer,
      this.model.eyeLContainer.scale,
      this.model.eyeRContainer.scale,
    ];
    targets.forEach((t) => {
      if (t) gsap.killTweensOf(t);
    });

    // 2. Hide all emotion overlays by default
    [expMad, expDark, expShock, expUncomfortable].forEach((s) => {
      if (s) {
        s.visible = false;
        s.alpha = 0;
      }
    });

    // 3. Reset normal eyes and pupil positions to absolute baseline
    this.setNormalEyesVisible(true);
    if (pupilL) gsap.to(pupilL, { x: this.pupilLInitX, y: this.pupilLInitY, duration, overwrite: 'auto' });
    if (pupilR) gsap.to(pupilR, { x: this.pupilRInitX, y: this.pupilRInitY, duration, overwrite: 'auto' });

    // 4. Configure each emotion with single clean eyebrows and exclusive eyes
    switch (emotion) {
      case 'happy': {
        this.applyMouthVisual('mouth_3');
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 5, rotation: 0.06, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 5, rotation: -0.06, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 0.76, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 0.76, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0.035, duration, overwrite: 'auto' });
        this.setMouthOpen(0);
        break;
      }

      case 'sad': {
        this.applyMouthVisual('closed');
        // Both eyebrows tilt gently down outward
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 2, rotation: -0.16, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 2, rotation: 0.16, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 0.86, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 0.86, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: -0.025, duration, overwrite: 'auto' });
        if (expDark) {
          expDark.visible = true;
          gsap.to(expDark, { alpha: 0.55, duration, overwrite: 'auto' });
        }
        this.setMouthOpen(0);
        break;
      }

      case 'angry': {
        this.applyMouthVisual('closed');
        // Both eyebrows slant down inward fiercely
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY + 4, rotation: 0.22, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY + 4, rotation: -0.22, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 0.9, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 0.9, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0, duration, overwrite: 'auto' });
        if (expMad) {
          expMad.visible = true;
          gsap.to(expMad, { alpha: 1, duration, overwrite: 'auto' });
        }
        this.setMouthOpen(0);
        break;
      }

      case 'surprised': {
        // HIDE normal eyes so only shocked circular eyes show! (No double eyes!)
        this.setNormalEyesVisible(false);
        this.applyMouthVisual('open', 0.7);

        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 9, rotation: 0, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 9, rotation: 0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });

        if (expShock) {
          expShock.visible = true;
          expShock.alpha = 1;
        }
        this.setMouthOpen(0.7);
        break;
      }

      case 'confused': {
        // HIDE normal eyes so only uncomfortable squint eyes show! (No double eyes!)
        this.setNormalEyesVisible(false);
        this.applyMouthVisual('mouth_uncomfortable');

        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 5, rotation: 0.12, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY + 2, rotation: -0.15, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: -0.065, duration, overwrite: 'auto' });

        if (expUncomfortable) {
          expUncomfortable.visible = true;
          expUncomfortable.alpha = 1;
        }
        this.setMouthOpen(0);
        break;
      }

      case 'thinking': {
        this.applyMouthVisual('closed');
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 3, rotation: -0.05, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 2, rotation: 0.05, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0.05, duration, overwrite: 'auto' });

        // Absolute glance shift
        if (pupilL) gsap.to(pupilL, { x: this.pupilLInitX + 2.5, y: this.pupilLInitY - 2.5, duration, overwrite: 'auto' });
        if (pupilR) gsap.to(pupilR, { x: this.pupilRInitX + 2.5, y: this.pupilRInitY - 2.5, duration, overwrite: 'auto' });
        this.setMouthOpen(0);
        break;
      }

      case 'listening': {
        this.applyMouthVisual('closed');
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 2, rotation: 0, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 2, rotation: 0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0.025, duration, overwrite: 'auto' });
        this.setMouthOpen(0);
        break;
      }

      case 'speaking': {
        this.applyMouthVisual('open', 0.6);
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY - 2, rotation: 0, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY - 2, rotation: 0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0.015, duration, overwrite: 'auto' });
        break;
      }

      case 'normal':
      default: {
        this.applyMouthVisual('closed');
        if (browL) gsap.to(browL, { x: this.browLInitX, y: this.browLInitY, rotation: 0, duration, overwrite: 'auto' });
        if (browR) gsap.to(browR, { x: this.browRInitX, y: this.browRInitY, rotation: 0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeLContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.eyeRContainer.scale, { x: 1.0, y: 1.0, duration, overwrite: 'auto' });
        gsap.to(this.model.headContainer, { rotation: 0, duration, overwrite: 'auto' });
        this.setMouthOpen(0);
        break;
      }
    }
  }

  public getEmotion(): CharacterEmotion {
    return this.currentEmotion;
  }
}
