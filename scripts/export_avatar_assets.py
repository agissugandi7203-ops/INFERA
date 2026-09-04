import json
import os
import sys
from PIL import Image
from psd_tools import PSDImage

PSD_PATH = r'd:\PROJECT ARIEF\HealthAthon BPJS\Anime.psd'
OUTPUT_DIR = r'd:\PROJECT ARIEF\HealthAthon BPJS\apps\web\public\avatar'
SCALE = 0.40

os.makedirs(OUTPUT_DIR, exist_ok=True)

print('Loading PSD: ' + PSD_PATH + '...')
psd = PSDImage.open(PSD_PATH)
print('PSD loaded! Dimensions: ' + str(psd.size))

for l in psd.descendants():
    l.visible = True

def find_layer_by_path(path_parts):
    curr = psd
    for p in path_parts:
        found = False
        for c in curr:
            if c.name.strip().lower() == p.strip().lower():
                curr = c
                found = True
                break
        if not found:
            matches = [l for l in curr.descendants() if l.name.strip().lower() == p.strip().lower()]
            if matches:
                curr = matches[0]
            else:
                return None
    return curr

def find_layer_anywhere(name):
    matches = [l for l in psd.descendants() if l.name.strip().lower() == name.strip().lower()]
    return matches[0] if matches else None

PARTS_SPEC = [
    # 1. Back Hair (behind body)
    ('b_hair_long', 'any', 'b.hair long', 'b_hair', True, 10),

    # 2. Body & Lower Limbs
    ('tight_r', 'any', 'tight right', 'body', True, 2),
    ('tight_l', 'any', 'tight left', 'body', True, 3),
    ('legs_l', 'any', 'legs leftt', 'body', True, 4),
    ('legs_r', 'any', 'legs right', 'body', True, 5),
    ('shoulder_r', 'any', 'right shoulder ', 'body', True, 10),
    ('sleeve_r', 'any', 'r.sleeve 1', 'body', True, 11),
    ('shoulder_l', 'any', 'left shoulder ', 'body', True, 12),
    ('sleeve_l', 'any', 'l.sleeve 1', 'body', True, 13),
    ('arm_l', 'any', 'arm left', 'body', True, 14),
    ('arm_r', 'any', 'arm right ', 'body', True, 15),
    ('hand_l', 'any', 'hand left', 'body', True, 16),
    ('hand_r', 'any', 'hand right', 'body', True, 17),
    ('body_base', 'any', 'body', 'body', True, 20),
    ('skirt_1', 'any', 'skirt 1', 'body', True, 30),
    ('cb_1', 'any', 'cb. 1', 'body', True, 40),

    # 3. Head Base & Features
    ('head_base', 'special_head', 'head', 'head', True, 10),
    ('ear_l', 'any', 'ear left', 'head', True, 12),
    ('ear_r', 'any', 'ear right', 'head', True, 13),
    ('nose', 'any', 'nose', 'head', True, 15),

    # 4. Eyes Left (articulated)
    ('eye_l_white', 'path', ['eyes left', 'w.space'], 'eye_l', True, 20),
    ('eye_l_eyeball', 'path', ['eyes left', 'eyeball'], 'eye_l', True, 21),
    ('eye_l_pupil', 'path', ['eyes left', 'pupil'], 'eye_l', True, 22),
    ('eye_l_spark1', 'path', ['eyes left', 'spark 1'], 'eye_l', True, 23),
    ('eye_l_spark2', 'path', ['eyes left', 'spark 2'], 'eye_l', True, 24),
    ('eye_l_lash_b', 'path', ['eyes left', 'b. lash'], 'eye_l', True, 25),
    ('eye_l_lash_u', 'path', ['eyes left', 'up.lash'], 'eye_l', True, 26),

    # 5. Eyes Right (articulated)
    ('eye_r_white', 'path', ['eyes right', 'w.space'], 'eye_r', True, 20),
    ('eye_r_eyeball', 'path', ['eyes right', 'eyeball'], 'eye_r', True, 21),
    ('eye_r_pupil', 'path', ['eyes right', 'pupil'], 'eye_r', True, 22),
    ('eye_r_spark1', 'path', ['eyes right', 'spark 1'], 'eye_r', True, 23),
    ('eye_r_spark2', 'path', ['eyes right', 'spark 2'], 'eye_r', True, 24),
    ('eye_r_lash_b', 'path', ['eyes right', 'b. lash'], 'eye_r', True, 25),
    ('eye_r_lash_u', 'path', ['eyes right', 'up.lash'], 'eye_r', True, 26),

    # 6. Eyebrows: Split individually to prevent double/quad eyebrows
    # 6. Eyebrows: Split individually to prevent double/quad eyebrows (on top of hair bangs)
    ('eyebrow_l', 'special_eyebrow_l', 'r. eye brow ', 'head', True, 85),
    ('eyebrow_r', 'special_eyebrow_r', 'l. eye brow ', 'head', True, 85),

    # 7. Mouth: Closed Smile (Default) + Unified Open (Speaking)
    ('mouth_closed', 'any', 'Lapisan 173', 'mouth', True, 32),
    ('mouth_open', 'special_mouth_open', 'mouth', 'mouth', False, 33),

    # 8. Emotion Overlays (on top of hair bangs)
    ('mouth_3', 'path', ['expression', '3 mouth'], 'mouth', False, 38),
    ('mouth_uncomfortable', 'path', ['expression', 'm.uncomfortable'], 'mouth', False, 39),
    ('exp_shock', 'path', ['expression', 'shock'], 'head', False, 86),
    ('exp_uncomfortable', 'path', ['expression', 'uncomfortable'], 'head', False, 86),
    ('exp_dark', 'path', ['expression', 's.dark'], 'head', False, 11),
    ('exp_mad', 'path', ['expression', 's.mad'], 'head', False, 11),

    # 9. Hair & Hair Accessory
    ('mid_hair', 'any', 'mid.hair', 'head', True, 50),
    ('f_hair_3', 'any', 'f.hair 3', 'head', True, 60),
    ('f_hair_2', 'any', 'f.hair 2', 'head', True, 70),
    ('f_hair_1_2', 'any', 'f.hair 1.2', 'head', True, 75),
    ('f_hair_1', 'any', 'f.hair 1', 'head', True, 80),
    ('acc_h1', 'any', 'acc h1', 'head', True, 90),
]

extracted_sprites = []
print('Extracting layers...')

for part_id, stype, target, parent, default_vis, z_idx in PARTS_SPEC:
    if stype == 'special_head':
        layer = find_layer_anywhere('head')
        for c in layer.descendants():
            if c.name == 'Lapisan 166':
                c.visible = False
            else:
                c.visible = True
        img = layer.composite()
        bbox = img.getbbox()
        cropped_img = img.crop(bbox)
        orig_x = layer.bbox[0] + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    elif stype == 'special_eyebrow_l':
        # Character right / viewer left eyebrow from 'r. eye brow '
        layer = find_layer_anywhere('r. eye brow ')
        raw_img = layer.composite()
        crop_vl = raw_img.crop((0, 0, 160, raw_img.height))
        bbox = crop_vl.getbbox()
        cropped_img = crop_vl.crop(bbox)
        orig_x = layer.bbox[0] + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    elif stype == 'special_eyebrow_r':
        # Character left / viewer right eyebrow from 'l. eye brow '
        layer = find_layer_anywhere('l. eye brow ')
        raw_img = layer.composite()
        crop_vr = raw_img.crop((160, 0, raw_img.width, raw_img.height))
        bbox = crop_vr.getbbox()
        cropped_img = crop_vr.crop(bbox)
        orig_x = layer.bbox[0] + 160 + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    elif stype == 'special_mouth_open':
        # Unified open mouth composite
        layer = find_layer_anywhere('mouth')
        for c in layer.descendants():
            c.visible = True
        raw_img = layer.composite()
        bbox = raw_img.getbbox()
        cropped_img = raw_img.crop(bbox)
        orig_x = layer.bbox[0] + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    elif stype == 'path':
        layer = find_layer_by_path(target)
        if not layer:
            print('Warning: Path layer ' + str(target) + ' not found!')
            continue
        img = layer.composite()
        bbox = img.getbbox()
        if not bbox: continue
        cropped_img = img.crop(bbox)
        orig_x = layer.bbox[0] + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    else:
        layer = find_layer_anywhere(target)
        if not layer:
            print('Warning: Layer ' + str(target) + ' not found!')
            continue
        img = layer.composite()
        bbox = img.getbbox()
        if not bbox: continue
        cropped_img = img.crop(bbox)
        orig_x = layer.bbox[0] + bbox[0]
        orig_y = layer.bbox[1] + bbox[1]

    crop_w, crop_h = cropped_img.size
    scaled_w = max(1, int(round(crop_w * SCALE)))
    scaled_h = max(1, int(round(crop_h * SCALE)))
    scaled_x = int(round(orig_x * SCALE))
    scaled_y = int(round(orig_y * SCALE))

    resized_img = cropped_img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    extracted_sprites.append({
        'id': part_id,
        'name': target if isinstance(target, str) else target[-1],
        'image': resized_img,
        'w': scaled_w,
        'h': scaled_h,
        'canvas_x': scaled_x,
        'canvas_y': scaled_y,
        'parent': parent,
        'default_visible': default_vis,
        'z_index': z_idx,
    })
    print(f'Extracted: {part_id:20} -> {scaled_w:3}x{scaled_h:3} at ({scaled_x:4}, {scaled_y:4})')

print('Total extracted sprites: ' + str(len(extracted_sprites)))

# 2048 x 2048 shelf packing
ATLAS_W = 2048
ATLAS_H = 2048
PADDING = 4

extracted_sprites.sort(key=lambda s: s['h'], reverse=True)

atlas_img = Image.new('RGBA', (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
current_x = PADDING
current_y = PADDING
shelf_height = 0

frames_manifest = {}

for s in extracted_sprites:
    w, h = s['w'], s['h']
    if current_x + w + PADDING > ATLAS_W:
        current_x = PADDING
        current_y += shelf_height + PADDING
        shelf_height = 0

    if current_y + h + PADDING > ATLAS_H:
        print(f'Warning: Expanding atlas height')
        ATLAS_H = 4096
        expanded = Image.new('RGBA', (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
        expanded.paste(atlas_img, (0, 0))
        atlas_img = expanded

    atlas_img.paste(s['image'], (current_x, current_y))

    frames_manifest[s['id']] = {
        'frame': {'x': current_x, 'y': current_y, 'w': w, 'h': h},
        'canvasOffset': {'x': s['canvas_x'], 'y': s['canvas_y']},
        'parent': s['parent'],
        'defaultVisible': s['default_visible'],
        'zIndex': s['z_index']
    }

    current_x += w + PADDING
    shelf_height = max(shelf_height, h)

atlas_path = os.path.join(OUTPUT_DIR, 'character-atlas.png')
atlas_img.save(atlas_path, 'PNG', optimize=True)
print('Atlas saved to: ' + atlas_path)

# Anatomical Eyebrow anchors for rotation around their center
brow_l_center_x = int(round((1245 + 53) * SCALE))
brow_l_center_y = int(round((755 + 8) * SCALE))
brow_r_center_x = int(round((1459 + 54) * SCALE))
brow_r_center_y = int(round((755 + 8) * SCALE))

manifest_data = {
    'canvasWidth': int(round(psd.size[0] * SCALE)),
    'canvasHeight': int(round(psd.size[1] * SCALE)),
    'scale': SCALE,
    'atlas': {
        'image': 'character-atlas.png',
        'size': {'w': atlas_img.size[0], 'h': atlas_img.size[1]}
    },
    'anchors': {
        'head': {'x': int(round(1405 * SCALE)), 'y': int(round(1020 * SCALE))}, # neck pivot
        'eye_l': {'x': int(round(1288 * SCALE)), 'y': int(round(825 * SCALE))},
        'eye_r': {'x': int(round(1522 * SCALE)), 'y': int(round(825 * SCALE))},
        'eyebrow_l': {'x': brow_l_center_x, 'y': brow_l_center_y},
        'eyebrow_r': {'x': brow_r_center_x, 'y': brow_r_center_y},
        'mouth': {'x': int(round(1405 * SCALE)), 'y': int(round(980 * SCALE))},
        'body': {'x': int(round(1405 * SCALE)), 'y': int(round(1700 * SCALE))}
    },
    'frames': frames_manifest
}

manifest_path = os.path.join(OUTPUT_DIR, 'character-manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest_data, f, indent=2)

print('Manifest saved to: ' + manifest_path)
print('ALL ASSETS EXPORTED SUCCESSFULLY!')
