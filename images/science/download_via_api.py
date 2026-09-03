#!/usr/bin/env python3
"""Download science images using Wikimedia REST API (proper endpoint).
Falls back to direct URLs with exponential backoff.
"""

import os, sys, time, json, re
from io import BytesIO
from PIL import Image

sys.path.insert(0, '/root/.venv/lib/python3.14/site-packages')
import requests

OUT_DIR = '/root/kindergarten-classroom/images/science'
os.makedirs(OUT_DIR, exist_ok=True)

UA = 'KindergartenApp/1.0 (educational; contact: admin@kindergarten-app.local)'

# Wikimedia Commons search terms mapped to item IDs
# We'll search Commons API for each, get a direct URL, then download
SEARCH_TERMS = {
    # Level 1 — Weather
    'sun': 'sun star photo',
    'rain': 'rain drops photo',
    'snow': 'snowflake macro photo',
    'wind': 'wind blowing trees photo',
    'cloud': 'cumulus clouds photo',
    'rainbow': 'rainbow sky photo',
    'thunder': 'lightning storm photo',
    'ice': 'ice cube photo',
    # Level 2 — Space
    'moon': 'full moon photo',
    'star': 'stars night sky photo',
    'earth': 'planet earth photo',
    'planet': 'saturn planet photo',
    'comet': 'comet photo',
    'galaxy': 'spiral galaxy photo',
    'rocket': 'rocket launch photo',
    'satellite': 'hubble telescope photo',
    # Level 3 — Plants
    'flower': 'sunflower photo',
    'tree': 'tree nature photo',
    'seed': 'seeds photo',
    'leaf': 'green leaf photo',
    'root': 'plant roots photo',
    'grass': 'green grass photo',
    'mushroom': 'mushroom red photo',
    'cactus': 'cactus desert photo',
    # Level 4 — Body Parts
    'eye': 'human eye closeup',
    'ear': 'human ear photo',
    'nose': 'human face profile',
    'hand': 'human hand photo',
    'foot': 'human foot photo',
    'heart': 'human heart anatomy',
    'tooth': 'teeth smile photo',
    'bone': 'skeleton bone photo',
    # Level 5 — Animals
    'frog': 'green frog photo',
    'snake': 'snake photo',
    'whale': 'whale ocean photo',
    'eagle': 'eagle bird photo',
    'fish': 'clownfish photo',
    'ant': 'ant insect photo',
    'bee': 'honey bee photo',
    'owl': 'owl bird photo',
    # Level 6 — Seasons & Earth
    'spring': 'cherry blossom spring photo',
    'summer': 'summer beach photo',
    'autumn': 'autumn leaves photo',
    'winter': 'winter snow photo',
    'ocean': 'ocean waves photo',
    'river': 'river nature photo',
    'mountain': 'mountain landscape photo',
    'volcano': 'volcano eruption photo',
    # Level 7 — Sounds & States
    'hot': 'fire flame photo',
    'cold': 'ice frozen waterfall photo',
    'wet': 'water droplets leaf photo',
    'dry': 'desert sand dunes photo',
    'loud': 'thunder lightning photo',
    'quiet': 'library books quiet photo',
    'soft': 'cotton ball soft photo',
    'hard': 'rock stone photo',
    # Level 8 — Shapes & Colors
    'circle': 'circle shape photo',
    'square': 'square shape building photo',
    'triangle': 'triangle shape roof photo',
    'rectangle': 'rectangle shape door photo',
    'red': 'red apples photo',
    'blue': 'blue sky photo',
    'yellow': 'yellow sunflower photo',
    'green': 'green nature leaf photo',
    # Level 9 — Magnets
    'magnet_paperclip': 'paper clips photo',
    'magnet_rubber': 'rubber duck photo',
    'magnet_spoon': 'metal spoons photo',
    'magnet_wood': 'wood texture photo',
    'magnet_nail': 'metal nail photo',
    'magnet_eraser': 'pencil eraser photo',
    'magnet_coin': 'coin metal photo',
    'magnet_fabric': 'fabric textile photo',
    # Level 10 — Push and Pull
    'push_door': 'door handle photo',
    'pull_drawer': 'drawer furniture photo',
    'push_ball': 'soccer ball kick photo',
    'pull_cart': 'shopping cart photo',
    'push_swing': 'playground swing photo',
    'pull_rope': 'tug of war rope photo',
    'push_button': 'button press photo',
    'pull_zipper': 'zipper jacket photo',
    # Level 11 — Materials
    'rock_solid': 'rocks stones photo',
    'water_liquid': 'water splash photo',
    'air_gas': 'clouds sky air photo',
    'ice_solid': 'ice cubes glass photo',
    'juice_liquid': 'orange juice glass photo',
    'steam_gas': 'steam kettle photo',
    'sand_solid': 'sand beach photo',
    'milk_liquid': 'milk glass photo',
    # Level 12 — Survival
    'fish_water': 'fish underwater photo',
    'plant_sun': 'plant sunlight photo',
    'bird_air': 'bird flying sky photo',
    'bear_food': 'bear nature photo',
    'tree_water': 'tree river water photo',
    'flower_sun': 'flower sunlight photo',
    'fish_air': 'fish bowl photo',
    'baby_food': 'baby eating food photo',
}

def get_commons_image_url(search_term, session):
    """Search Wikimedia Commons for an image, return the direct URL."""
    api_url = 'https://commons.wikimedia.org/w/api.php'
    params = {
        'action': 'query',
        'list': 'search',
        'srsearch': search_term,
        'srnamespace': '6',  # File namespace
        'srlimit': '5',
        'format': 'json',
    }
    try:
        r = session.get(api_url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        results = data.get('query', {}).get('search', [])
        
        for result in results:
            title = result['title']
            # Skip non-image files
            ext = title.lower().split('.')[-1]
            if ext not in ('jpg', 'jpeg', 'png', 'gif', 'svg'):
                continue
            if ext == 'svg':
                continue  # Skip SVGs
            
            # Get image info (direct URL)
            info_params = {
                'action': 'query',
                'titles': title,
                'prop': 'imageinfo',
                'iiprop': 'url|size',
                'iiurlwidth': '600',  # Request a 600px thumbnail
                'format': 'json',
            }
            r2 = session.get(api_url, params=info_params, timeout=15)
            r2.raise_for_status()
            info = r2.json()
            pages = info.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                if page_id == '-1':
                    continue
                imageinfo = page_data.get('imageinfo', [{}])[0]
                # Use thumbnail URL if available, else direct
                url = imageinfo.get('thumburl') or imageinfo.get('url')
                if url:
                    return url
    except Exception as e:
        print(f'    API error: {e}')
    return None

def download_and_resize(item_id, url, session, target_size=400):
    out_path = os.path.join(OUT_DIR, f'{item_id}.png')
    if os.path.exists(out_path):
        print(f'  SKIP  {item_id} (exists)')
        return True
    try:
        r = session.get(url, timeout=20, allow_redirects=True)
        r.raise_for_status()
        
        img = Image.open(BytesIO(r.content))
        # Make square
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
    total = len(SEARCH_TERMS)
    
    session = requests.Session()
    session.headers.update({'User-Agent': UA})
    
    # Wait for Wikimedia rate limit to cool down
    print("Waiting 30s for rate limit to cool down...")
    time.sleep(30)
    
    for i, (item_id, search_term) in enumerate(SEARCH_TERMS.items(), 1):
        out_path = os.path.join(OUT_DIR, f'{item_id}.png')
        if os.path.exists(out_path):
            skip += 1
            print(f'[{i}/{total}] SKIP  {item_id}')
            continue
        
        print(f'[{i}/{total}] {item_id} ({search_term})')
        
        # Get image URL from Commons API
        url = get_commons_image_url(search_term, session)
        if not url:
            print(f'  NO URL for {item_id}')
            fail += 1
            time.sleep(2)
            continue
        
        print(f'  URL: {url[:80]}...')
        
        if download_and_resize(item_id, url, session):
            ok += 1
        else:
            fail += 1
        
        # Respectful delay
        time.sleep(2)
    
    print(f'\n--- DONE: {ok} downloaded, {skip} skipped, {fail} failed out of {total} ---')
    print(f'Total images: {len(os.listdir(OUT_DIR))} in {OUT_DIR}')

if __name__ == '__main__':
    main()
