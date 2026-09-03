#!/usr/bin/env python3
"""Download real-life photos for kindergarten science section.
Uses DIRECT Wikimedia Commons URLs (not thumbnails) + other free sources.
Resizes to 400x400 with Pillow.
"""

import os, sys, time
from PIL import Image
from io import BytesIO

sys.path.insert(0, '/root/.venv/lib/python3.14/site-packages')
import requests

OUT_DIR = '/root/kindergarten-classroom/images/science'
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
}

# DIRECT Wikimedia Commons URLs (not /thumb/) — will resize with Pillow
# Format: { id: url }
IMAGES = {
    # === Level 1: Weather ===
    'sun': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    'rain': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Rain_on_leaf.jpg',
    'snow': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Snowflake_300um_LTSEM%2C_130304.jpg',
    'wind': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Wind_vane%2C_Hopetoun_House.jpg',
    'cloud': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Clouds_over_the_Atlantic_Ocean.jpg',
    'rainbow': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Rainbow1.jpg',
    'thunder': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Gorgona_beleuchtet_vom_Blitz.jpg',
    'ice': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Iceberg_in_the_Arctic_with_its_underside_exposed.jpg',

    # === Level 2: Space ===
    'moon': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
    'star': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Starfield_on_the_road_to_La_Silla.jpg',
    'earth': 'https://upload.wikimedia.org/wikipedia/commons/c/cb/The_Blue_Marble_%28remastered%29.jpg',
    'planet': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
    'comet': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Comet_Hale-Bopp_1997_4.jpg',
    'galaxy': 'https://upload.wikimedia.org/wikipedia/commons/c/c3/NGC_4414_%28NASA-med%29.jpg',
    'rocket': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Ariane_5ES_with_Galileo_satellites.jpg',
    'satellite': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Hubble_Space_Telescope.jpg',

    # === Level 3: Plants ===
    'flower': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Sunflower_from_Silesia2.jpg',
    'tree': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Bald_cypress%2C_Taxodium_distichum.jpg',
    'seed': 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Sunflower_seeds.jpg',
    'leaf': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Leaf_1_web.jpg',
    'root': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Crop_roots.jpg',
    'grass': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Grass_Green_Web.jpg',
    'mushroom': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Amanita_muscaria_3_vlieckje.jpg',
    'cactus': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Echinopsis_pachanoi_prm.jpg',

    # === Level 4: Body Parts ===
    'eye': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Eye_detailed_image.jpg',
    'ear': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Ear-NH.jpg',
    'nose': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Profil_face.jpg',
    'hand': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Hand_of_boy.jpg',
    'foot': 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Foot_Anatomy.jpg',
    'heart': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Heart_nih.jpg',
    'tooth': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Teeth.jpg',
    'bone': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Long_bone_diagram.svg',

    # === Level 5: Animals ===
    'frog': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Rana_temporaria_-_side.jpg',
    'snake': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Naja_naja_005.jpg',
    'whale': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/About_to_Breach_%2826075320352%29.jpg',
    'eagle': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/About_to_Launch_%2825498483722%29.jpg',
    'fish': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg',
    'ant': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ants_killing_a_caterpillar.jpg',
    'bee': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/European_honey_bee_extracts_nectar.jpg',
    'owl': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Bubo_virginianus_06.jpg',

    # === Level 6: Seasons & Earth ===
    'spring': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Cherry_blossoms_at_Mount_Yoshino_02.jpg',
    'summer': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Sun_at_the_Beach.jpg',
    'autumn': 'https://upload.wikimedia.org/wikipedia/commons/1/11/AutumnLeaves.jpg',
    'winter': 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Winterland.jpg',
    'ocean': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Ocean_Sunset.jpg',
    'river': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/River_with_Fish.jpg',
    'mountain': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg',
    'volcano': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Mount_St_Helens_before_and_after.jpg',

    # === Level 7: Sounds & States ===
    'hot': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Erta_Ale_lava_lake.jpg',
    'cold': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Frozen_falls.jpg',
    'wet': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Droplets_on_a_leaf.jpg',
    'dry': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg',
    'loud': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Thunerdome.jpg',
    'quiet': 'https://upload.wikimedia.org/wikipedia/commons/2/25/Library_-_Pair_of_reading_glasses_on_top_of_a_book.jpg',
    'soft': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Cotton_ball.jpg',
    'hard': 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Pumice_stone.jpg',

    # === Level 8: Shapes & Colors ===
    'circle': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Circle-black-border.svg',
    'square': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Square_black_border.svg',
    'triangle': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Triangle_black_border.svg',
    'rectangle': 'https://upload.wikimedia.org/wikipedia/commons/7/77/Rectangle_black_border.svg',
    'red': 'https://upload.wikimedia.org/wikipedia/commons/6/60/Red_apples.jpg',
    'blue': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Blue_turquoise_sky.jpg',
    'yellow': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Sunflower_from_Silesia2.jpg',
    'green': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Grass_Green_Web.jpg',

    # === Level 9: Magnets ===
    'magnet_paperclip': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Paper_clips.jpg',
    'magnet_rubber': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Rubber_duck_on_water.jpg',
    'magnet_spoon': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Spoons.jpg',
    'magnet_wood': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Grainwewood.jpg',
    'magnet_nail': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Common_nail.jpg',
    'magnet_eraser': 'https://upload.wikimedia.org/wikipedia/commons/5/55/Pencil_and_eraser.jpg',
    'magnet_coin': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/US_One_Cent_Obv.png',
    'magnet_fabric': 'https://upload.wikimedia.org/wikipedia/commons/6/60/Fabric_at_Gamma_Production.jpg',

    # === Level 10: Push and Pull ===
    'push_door': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cabinet_drawer.jpg',
    'pull_drawer': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cabinet_drawer.jpg',
    'push_ball': 'https://upload.wikimedia.org/wikipedia/commons/2/25/Young_football_player.jpg',
    'pull_cart': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Shopping_cart.jpg',
    'push_swing': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Swing_at_playground.jpg',
    'pull_rope': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Tug_of_war.jpg',
    'push_button': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Elevator_buttons.jpg',
    'pull_zipper': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Zipper.jpg',

    # === Level 11: Materials ===
    'rock_solid': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Rocks_and_sand.jpg',
    'water_liquid': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Tsunami_by_hokusai_19th_century.jpg',
    'air_gas': 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Clouds_over_the_Atlantic_Ocean.jpg',
    'ice_solid': 'https://upload.wikimedia.org/wikipedia/commons/6/62/Ice_cubes_in_glass.jpg',
    'juice_liquid': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Orange_juice_glass.jpg',
    'steam_gas': 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Steam.jpg',
    'sand_solid': 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Golde33443.jpg',
    'milk_liquid': 'https://upload.wikimedia.org/wikipedia/commons/2/21/Glass_of_milk_%28with_background%29.jpg',

    # === Level 12: Survival ===
    'fish_water': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Amphiprion_ocellaris_%28Clown_anemonefish%29_in_Heteractis_magnifica_%28Sea_anemone%29.jpg',
    'plant_sun': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Sunflower.jpg',
    'bird_air': 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Swallow_flying_2.jpg',
    'bear_food': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Ursus_arctos_horribilis.jpg',
    'tree_water': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/24701-nature-702.jpg',
    'flower_sun': 'https://upload.wikimedia.org/wikipedia/commons/0/09/Poppy_flower.jpg',
    'fish_air': 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Amphiprion_percula.jpg',
    'baby_food': 'https://upload.wikimedia.org/wikipedia/commons/6/66/Baby_eating.jpg',
}

def download_and_resize(item_id, url, target_size=400):
    out_path = os.path.join(OUT_DIR, f'{item_id}.png')
    if os.path.exists(out_path):
        print(f'  SKIP  {item_id} (exists)')
        return True
    try:
        r = requests.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        # Make square: crop to center square, then resize
        w, h = img.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
        img = img.resize((target_size, target_size), Image.LANCZOS)
        img.save(out_path, 'PNG')
        
        print(f'  OK    {item_id} ({side}x{side} -> {target_size}x{target_size})')
        return True
    except Exception as e:
        print(f'  FAIL  {item_id}: {e}')
        if os.path.exists(out_path):
            os.remove(out_path)
        return False

def main():
    ok = fail = skip = 0
    total = len(IMAGES)
    
    for i, (item_id, url) in enumerate(IMAGES.items(), 1):
        print(f'[{i}/{total}] {item_id}')
        if os.path.exists(os.path.join(OUT_DIR, f'{item_id}.png')):
            skip += 1
            print(f'  SKIP  {item_id} (exists)')
            continue
        if download_and_resize(item_id, url):
            ok += 1
        else:
            fail += 1
        time.sleep(0.3)
    
    print(f'\n--- DONE: {ok} downloaded, {skip} skipped, {fail} failed out of {total} ---')

if __name__ == '__main__':
    main()
