import { Container, Sprite, Texture, Rectangle, Assets } from 'pixi.js';

export interface CharacterFrame {
  frame: { x: number; y: number; w: number; h: number };
  canvasOffset: { x: number; y: number };
  parent: 'body' | 'head' | 'b_hair' | 'eye_l' | 'eye_r' | 'mouth';
  defaultVisible: boolean;
  zIndex: number;
}

export interface CharacterManifest {
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  atlas: {
    image: string;
    size: { w: number; h: number };
  };
  anchors: {
    head: { x: number; y: number };
    eye_l: { x: number; y: number };
    eye_r: { x: number; y: number };
    mouth: { x: number; y: number };
    body: { x: number; y: number };
  };
  frames: Record<string, CharacterFrame>;
}

export class CharacterModel {
  public rootContainer: Container;
  public bHairContainer: Container;
  public bodyContainer: Container;
  public headContainer: Container;
  public eyeLContainer: Container;
  public eyeRContainer: Container;
  public mouthContainer: Container;

  public manifest: CharacterManifest | null = null;
  public sprites: Map<string, Sprite> = new Map();
  public isLoaded = false;

  constructor() {
    this.rootContainer = new Container();
    this.rootContainer.label = 'character_root';
    this.rootContainer.sortableChildren = true;

    // 1. Back Hair Layer (zIndex 10 - behind body)
    this.bHairContainer = new Container();
    this.bHairContainer.label = 'b_hair_container';
    this.bHairContainer.zIndex = 10;
    this.rootContainer.addChild(this.bHairContainer);

    // 2. Body Layer (zIndex 20 - clothes, limbs, torso)
    this.bodyContainer = new Container();
    this.bodyContainer.label = 'body_container';
    this.bodyContainer.zIndex = 20;
    this.bodyContainer.sortableChildren = true;
    this.rootContainer.addChild(this.bodyContainer);

    // 3. Head Layer (zIndex 30 - in front of collar & body)
    this.headContainer = new Container();
    this.headContainer.label = 'head_container';
    this.headContainer.zIndex = 30;
    this.headContainer.sortableChildren = true;
    this.rootContainer.addChild(this.headContainer);

    // Sub-containers inside head for animation
    this.eyeLContainer = new Container();
    this.eyeLContainer.label = 'eye_l_container';
    this.eyeLContainer.zIndex = 20;
    this.eyeLContainer.sortableChildren = true;
    this.headContainer.addChild(this.eyeLContainer);

    this.eyeRContainer = new Container();
    this.eyeRContainer.label = 'eye_r_container';
    this.eyeRContainer.zIndex = 20;
    this.eyeRContainer.sortableChildren = true;
    this.headContainer.addChild(this.eyeRContainer);

    this.mouthContainer = new Container();
    this.mouthContainer.label = 'mouth_container';
    this.mouthContainer.zIndex = 25;
    this.mouthContainer.sortableChildren = true;
    this.headContainer.addChild(this.mouthContainer);
  }

  public async load(
    manifestUrl = '/avatar/character-manifest.json',
    atlasUrl = '/avatar/character-atlas.png'
  ): Promise<void> {
    const res = await fetch(manifestUrl);
    if (!res.ok) throw new Error('Failed to fetch character manifest: ' + res.statusText);
    this.manifest = (await res.json()) as CharacterManifest;

    // Reset Pixi Assets cache to prevent reusing a destroyed texture on React re-mount
    try {
      Assets.cache.reset();
    } catch {
      // ignore
    }

    const atlasTexture = await Assets.load<Texture>(atlasUrl);

    const { anchors, frames } = this.manifest;

    // Set pivot and position to the anatomical anchor points for head and face
    this.headContainer.position.set(anchors.head.x, anchors.head.y);
    this.headContainer.pivot.set(anchors.head.x, anchors.head.y);

    this.eyeLContainer.position.set(anchors.eye_l.x, anchors.eye_l.y);
    this.eyeLContainer.pivot.set(anchors.eye_l.x, anchors.eye_l.y);

    this.eyeRContainer.position.set(anchors.eye_r.x, anchors.eye_r.y);
    this.eyeRContainer.pivot.set(anchors.eye_r.x, anchors.eye_r.y);

    this.mouthContainer.position.set(anchors.mouth.x, anchors.mouth.y);
    this.mouthContainer.pivot.set(anchors.mouth.x, anchors.mouth.y);

    // Build sprites
    for (const [id, data] of Object.entries(frames)) {
      const rect = new Rectangle(data.frame.x, data.frame.y, data.frame.w, data.frame.h);
      const subTexture = new Texture({
        source: atlasTexture.source,
        frame: rect,
      });

      const sprite = new Sprite(subTexture);
      sprite.label = id;
      sprite.zIndex = data.zIndex;
      sprite.visible = data.defaultVisible;
      sprite.position.set(data.canvasOffset.x, data.canvasOffset.y);

      // Route to designated parent container
      if (data.parent === 'b_hair') {
        this.bHairContainer.addChild(sprite);
      } else if (data.parent === 'body') {
        this.bodyContainer.addChild(sprite);
      } else if (data.parent === 'eye_l') {
        this.eyeLContainer.addChild(sprite);
      } else if (data.parent === 'eye_r') {
        this.eyeRContainer.addChild(sprite);
      } else if (data.parent === 'mouth') {
        this.mouthContainer.addChild(sprite);
      } else {
        // default to head container
        this.headContainer.addChild(sprite);
      }

      this.sprites.set(id, sprite);
    }

    this.isLoaded = true;
  }

  public getSprite(id: string): Sprite | undefined {
    return this.sprites.get(id);
  }

  public setVisible(id: string, visible: boolean): void {
    const s = this.sprites.get(id);
    if (s) s.visible = visible;
  }

  public destroy(): void {
    this.sprites.forEach((sprite) => {
      try {
        sprite.destroy({ texture: false });
      } catch {
        // ignore
      }
    });
    this.sprites.clear();
    try {
      this.rootContainer.destroy({ children: true });
    } catch {
      // ignore
    }
  }
}
