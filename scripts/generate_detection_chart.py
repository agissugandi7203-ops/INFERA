import os
from PIL import Image, ImageDraw, ImageFont

# Canvas dimensions: 1100 x 860 for ultra-crisp slide graphic
W, H = 1100, 860

# Exact palette matching the user's slide template
BG_DARK = (105, 58, 24)       # #693a18 Outer dark leather brown
CARD_BG = (255, 237, 225)     # #ffede1 Warm ivory/cream card background
TEXT_TITLE = (115, 55, 18)    # #733712 Deep brown serif
TEXT_MUTED = (165, 115, 85)   # #a57355 Soft warm gray/brown
GRID_LINE = (238, 212, 196)   # #eed4c4 Faint grid line
CARD_BORDER = (245, 220, 205) # Card border

COLOR_UNDETECTED = (177, 119, 75)  # #b1774b Terracotta Light Brown (Tak Terdeteksi - Bawah)
COLOR_UNCERTAIN  = (138, 81, 38)   # #8a5126 Deep Chocolate Brown (Model Tidak Yakin - Tengah)
COLOR_DETECTED   = (242, 169, 70)  # #f2a946 Warm Amber Orange (Berhasil Terdeteksi - Kubah Atas)

im = Image.new("RGBA", (W, H), BG_DARK)
draw = ImageDraw.Draw(im)

# 1. Outer rounded container (Card)
pad_x = 24
pad_y = 24
card_box = [pad_x, pad_y, W - pad_x, H - pad_y]
draw.rounded_rectangle(card_box, radius=42, fill=CARD_BG, outline=CARD_BORDER, width=2)

# Load System Fonts
try:
    font_title = ImageFont.truetype("georgiab.ttf", 44)
    font_subtitle = ImageFont.truetype("georgia.ttf", 17)
    font_legend = ImageFont.truetype("arialbd.ttf", 15)
    font_axis = ImageFont.truetype("arial.ttf", 15)
    font_axis_bold = ImageFont.truetype("arialbd.ttf", 16)
    font_val = ImageFont.truetype("arialbd.ttf", 18)
    font_badge = ImageFont.truetype("arialbd.ttf", 13)
    font_banner_bold = ImageFont.truetype("arialbd.ttf", 14)
    font_banner_text = ImageFont.truetype("arial.ttf", 13)
except Exception:
    font_title = font_subtitle = font_legend = font_axis = font_axis_bold = font_val = font_badge = font_banner_bold = font_banner_text = ImageFont.load_default()

# 2. Header: Title & Subtitle
draw.text((64, 52), "Trial & Error", font=font_title, fill=TEXT_TITLE)
draw.text((66, 104), "Tingkat Akurasi Deteksi AI INFERA per Kategori Risiko Peserta (Uji Sampel)", font=font_subtitle, fill=TEXT_MUTED)

# 3. Legend (3 Status Deteksi Sesuai Permintaan User)
# Bottom to Top: Tak Terdeteksi -> Model Tidak Yakin -> Berhasil Terdeteksi
legend_items = [
    ("Tak Terdeteksi (Lolos)", COLOR_UNDETECTED),
    ("Model Tidak Yakin (Perlu Review Auditor)", COLOR_UNCERTAIN),
    ("Berhasil Terdeteksi (Flagged)", COLOR_DETECTED),
]

legend_y = 152
total_leg_w = sum(draw.textbbox((0, 0), txt, font=font_legend)[2] + 40 for txt, _ in legend_items)
leg_start_x = (W - total_leg_w) // 2

cur_x = leg_start_x
for label, color in legend_items:
    draw.ellipse([cur_x, legend_y + 1, cur_x + 15, legend_y + 16], fill=color)
    draw.text((cur_x + 24, legend_y), label, font=font_legend, fill=TEXT_TITLE)
    cur_x += draw.textbbox((0, 0), label, font=font_legend)[2] + 46

# 4. Chart Plot Area
plot_left = 110
plot_right = W - 70
plot_top = 225
plot_bottom = 650
plot_h = plot_bottom - plot_top
plot_w = plot_right - plot_left

# Horizontal Gridlines (0 to 60, step 10)
for val in range(0, 70, 10):
    y = plot_bottom - int((val / 60) * plot_h)
    draw.line([plot_left, y, plot_right, y], fill=GRID_LINE, width=1)
    label = str(val)
    bbox = draw.textbbox((0, 0), label, font=font_axis)
    tw = bbox[2] - bbox[0]
    draw.text((plot_left - tw - 16, y - 9), label, font=font_axis, fill=TEXT_MUTED)

# 5. Data Bars (3 Modus Risiko Peserta)
columns_data = [
    {
        "category": "Pemalsuan Identitas",
        "detail": "Diskordansi Gender & NIK",
        "values": [8, 12, 16],  # Tak Terdeteksi: 8, Tidak Yakin: 12, Terdeteksi: 16 -> Total 36
    },
    {
        "category": "Penyalahgunaan Kartu",
        "detail": "Impossible Travel Lintas RS",
        "values": [12, 16, 20], # Tak Terdeteksi: 12, Tidak Yakin: 16, Terdeteksi: 20 -> Total 48
    },
    {
        "category": "Pelayanan Tidak Perlu",
        "detail": "Doctor Shopping & PRB",
        "values": [16, 20, 24], # Tak Terdeteksi: 16, Tidak Yakin: 20, Terdeteksi: 24 -> Total 60
    },
]

bar_width = 175
col_centers = [
    plot_left + int(plot_w * 0.22),
    plot_left + int(plot_w * 0.52),
    plot_left + int(plot_w * 0.82),
]

for idx, col in enumerate(columns_data):
    cx = col_centers[idx]
    bx1 = cx - bar_width // 2
    bx2 = cx + bar_width // 2
    
    v_undetected, v_uncertain, v_detected = col["values"]
    total = v_undetected + v_uncertain + v_detected
    
    # Calculate vertical segment heights
    h1 = int((v_undetected / 60) * plot_h)
    h2 = int((v_uncertain / 60) * plot_h)
    h3 = int((v_detected / 60) * plot_h)
    
    y_base = plot_bottom
    y_m1 = y_base - h1
    y_m2 = y_m1 - h2
    y_top = y_m2 - h3
    
    # Layer 1: Tak Terdeteksi (Bottom - Terracotta)
    draw.rectangle([bx1, y_m1, bx2, y_base], fill=COLOR_UNDETECTED)
    
    # Layer 2: Model Tidak Yakin (Middle - Chocolate Brown)
    draw.rectangle([bx1, y_m2, bx2, y_m1], fill=COLOR_UNCERTAIN)
    
    # Layer 3: Berhasil Terdeteksi (Top - Warm Amber Dome)
    dome_radius = (bx2 - bx1) // 2
    dome_center_y = y_top + dome_radius
    
    if dome_center_y < y_m2:
        draw.rectangle([bx1, dome_center_y, bx2, y_m2], fill=COLOR_DETECTED)
    
    # Semicircular dome cap
    draw.pieslice([bx1, y_top, bx2, y_top + dome_radius * 2], 180, 360, fill=COLOR_DETECTED)
    
    # Numbers inside each segment
    def draw_centered_num(val_text, y_center, color=(255, 255, 255)):
        bbox = draw.textbbox((0, 0), val_text, font=font_val)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((cx - tw // 2, y_center - th // 2), val_text, font=font_val, fill=color)

    draw_centered_num(f"{v_undetected}", (y_base + y_m1) // 2)
    draw_centered_num(f"{v_uncertain}", (y_m1 + y_m2) // 2)
    draw_centered_num(f"{v_detected}", (y_m2 + y_top + dome_radius // 2) // 2)
    
    # Badge Total on Top of Dome
    total_txt = f"{total} Kasus Diuji"
    t_bbox = draw.textbbox((0, 0), total_txt, font=font_badge)
    ttw = t_bbox[2] - t_bbox[0]
    badge_pad_x = 10
    badge_pad_y = 5
    badge_y = y_top - 34
    
    draw.rounded_rectangle(
        [cx - ttw // 2 - badge_pad_x, badge_y - badge_pad_y, cx + ttw // 2 + badge_pad_x, badge_y + 18 + badge_pad_y],
        radius=12,
        fill=TEXT_TITLE,
    )
    draw.text((cx - ttw // 2, badge_y), total_txt, font=font_badge, fill=(255, 255, 255))
    
    # X-Axis Labels (Multi-line centered)
    l1 = col["category"]
    l2 = col["detail"]
    
    l1_bbox = draw.textbbox((0, 0), l1, font=font_axis_bold)
    l2_bbox = draw.textbbox((0, 0), l2, font=font_axis)
    
    draw.text((cx - (l1_bbox[2] - l1_bbox[0]) // 2, plot_bottom + 14), l1, font=font_axis_bold, fill=TEXT_TITLE)
    draw.text((cx - (l2_bbox[2] - l2_bbox[0]) // 2, plot_bottom + 38), l2, font=font_axis, fill=TEXT_MUTED)

# 6. Bottom Banner / Insight Callout
box_banner = [80, H - 114, W - 80, H - 42]
draw.rounded_rectangle(box_banner, radius=16, fill=(250, 224, 210), outline=(235, 195, 175), width=1)

line1 = "[ANALISIS CAPAIAN MODEL AI INFERA]"
line2 = "Total 60 Kasus Terdeteksi Otomatis (Akurasi Tinggi)  •  48 Kasus Butuh Audit Tambahan (Borderline)  •  36 Kasus Belum Terdeteksi"

b1 = draw.textbbox((0, 0), line1, font=font_banner_bold)
b2 = draw.textbbox((0, 0), line2, font=font_banner_text)

w1 = b1[2] - b1[0]
w2 = b2[2] - b2[0]

draw.text(((W - w1) // 2, H - 100), line1, font=font_banner_bold, fill=TEXT_TITLE)
draw.text(((W - w2) // 2, H - 74), line2, font=font_banner_text, fill=TEXT_TITLE)

# Save
out_dir = r"d:\PROJECT ARIEF\HealthAthon BPJS\output"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "chart_deteksi_infera.png")
im.save(out_path, quality=95)

# Also save directly to Downloads
dl_path = os.path.join(os.environ.get("USERPROFILE", r"C:\Users\arief"), "Downloads", "chart_deteksi_infera.png")
im.save(dl_path, quality=95)

print(f"Chart generated successfully: {out_path} and {dl_path}")
