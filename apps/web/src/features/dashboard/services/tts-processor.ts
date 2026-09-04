export const VOICE_DEFAULT_ID = 'GgFtkxszsIQcD4MYvQax';
export const VOICE_SECONDARY_ID = '0csCu4D7iyBsmlVlf9Iu';

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
}

export const BASE_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.62,
  similarity_boost: 0.78,
  style: 0.05,
  use_speaker_boost: true,
  speed: 0.96,
};

export interface VoiceExpression {
  type: string;
  style?: string;
  intensity: number; // 0.0 - 1.0
  target?: string;
}

export interface VoiceEmphasis {
  text: string;
  intensity: number;
}

export interface VoicePause {
  after: string;
  duration_ms: number;
}

export interface VoiceProsody {
  energy?: number;
  pitch?: number;
  speed?: number;
}

export interface VoiceExpressionMetadata {
  text: string;
  emotion: string;
  expressions?: VoiceExpression[];
  emphasis?: VoiceEmphasis[];
  pauses?: VoicePause[];
  prosody?: VoiceProsody;
}

export class TTSProcessor {
  /**
   * Translates Voice Expression Metadata into bounded ElevenLabs parameters.
   * Ensures the voice sounds lively, expressive, and natural without distortion.
   */
  public static computeVoiceSettings(
    metadata?: VoiceExpressionMetadata | null
  ): ElevenLabsVoiceSettings {
    const settings: ElevenLabsVoiceSettings = { ...BASE_VOICE_SETTINGS };

    if (!metadata) {
      return settings;
    }

    let stabilityDelta = 0;
    let styleDelta = 0;
    let speedMultiplier = 1.0;

    // 1. Process Expressions (laugh, chuckle, sigh, whisper, surprised, happy, sad, playful, calm, excited)
    if (metadata.expressions && Array.isArray(metadata.expressions)) {
      for (const expr of metadata.expressions) {
        const type = (expr.type || '').toLowerCase();
        const intensity = Math.max(0, Math.min(1, expr.intensity ?? 0.5));

        switch (type) {
          case 'laugh':
          case 'chuckle':
            // Lower stability for vocal variety, higher style for chuckle cadence
            stabilityDelta -= 0.12 * intensity;
            styleDelta += 0.18 * intensity;
            speedMultiplier += 0.04 * intensity;
            break;

          case 'excited':
          case 'playful':
            stabilityDelta -= 0.10 * intensity;
            styleDelta += 0.15 * intensity;
            speedMultiplier += 0.03 * intensity;
            break;

          case 'surprised':
          case 'surprise':
            stabilityDelta -= 0.08 * intensity;
            styleDelta += 0.12 * intensity;
            speedMultiplier += 0.02 * intensity;
            break;

          case 'whisper':
            // High stability for quiet consistency, lower style
            stabilityDelta += 0.06 * intensity;
            styleDelta -= 0.03 * intensity;
            speedMultiplier -= 0.04 * intensity;
            break;

          case 'sigh':
          case 'sad':
            stabilityDelta += 0.05 * intensity;
            styleDelta += 0.04 * intensity;
            speedMultiplier -= 0.05 * intensity;
            break;

          case 'calm':
            stabilityDelta += 0.08 * intensity;
            styleDelta -= 0.02 * intensity;
            speedMultiplier -= 0.02 * intensity;
            break;

          case 'happy':
            styleDelta += 0.08 * intensity;
            break;

          default:
            break;
        }
      }
    }

    // 2. Process Prosody (energy, speed, pitch)
    if (metadata.prosody) {
      const { energy, speed } = metadata.prosody;

      if (typeof speed === 'number' && !isNaN(speed)) {
        // Clamp speed ratio around 0.85 - 1.15
        const boundedSpeedRatio = Math.max(0.85, Math.min(1.15, speed));
        speedMultiplier *= boundedSpeedRatio;
      }

      if (typeof energy === 'number' && !isNaN(energy)) {
        if (energy > 0.7) {
          styleDelta += (energy - 0.7) * 0.2;
          stabilityDelta -= (energy - 0.7) * 0.1;
        } else if (energy < 0.4) {
          stabilityDelta += (0.4 - energy) * 0.1;
          speedMultiplier -= (0.4 - energy) * 0.05;
        }
      }
    }

    // 3. Apply changes and clamp within natural, pleasant ranges
    // Base stability: 0.62 -> clamped between 0.42 and 0.78
    settings.stability = Math.max(0.42, Math.min(0.78, BASE_VOICE_SETTINGS.stability + stabilityDelta));

    // Base style: 0.05 -> clamped between 0.01 and 0.32 (prevents unnatural audio artifacts)
    settings.style = Math.max(0.01, Math.min(0.32, BASE_VOICE_SETTINGS.style + styleDelta));

    // Base speed: 0.96 -> clamped between 0.86 and 1.12
    settings.speed = Math.max(0.86, Math.min(1.12, BASE_VOICE_SETTINGS.speed * speedMultiplier));

    // Round for clean HTTP payloads
    settings.stability = Number(settings.stability.toFixed(2));
    settings.style = Number(settings.style.toFixed(2));
    settings.speed = Number(settings.speed.toFixed(2));

    return settings;
  }

  /**
   * Prepares clean speech text, applying natural punctuation pauses based on metadata
   */
  public static prepareTextForTTS(
    rawText: string,
    metadata?: VoiceExpressionMetadata | null
  ): string {
    let clean = rawText
      .replace(/[*_#`~\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!metadata) {
      return clean;
    }

    // Apply natural punctuation pauses if specified
    if (metadata.pauses && Array.isArray(metadata.pauses)) {
      for (const pause of metadata.pauses) {
        if (pause.after && pause.duration_ms >= 140) {
          const target = pause.after.trim();
          if (clean.includes(target)) {
            // Replace target with natural breathing punctuation if not already followed by punctuation
            const regex = new RegExp(`(${escapeRegExp(target)})(?![.,?!…])`, 'g');
            clean = clean.replace(regex, `$1... `);
          }
        }
      }
    }

    return clean.replace(/\s+/g, ' ').trim();
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
