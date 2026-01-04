#!/usr/bin/env python3
"""
Update apps/web/src/lib/locations.ts with real database IDs from municipality_ids.json
"""

import sys
import os
import json
import re
from pathlib import Path

# Ensure project root is importable
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.resolve()

def update_locations_ts():
    # Read the exported municipality IDs
    ids_file = PROJECT_ROOT / 'data' / 'municipality_ids.json'
    if not ids_file.exists():
        print(f"ERROR: {ids_file} not found. Run export_municipality_ids.py first.")
        return
    
    with open(ids_file, 'r', encoding='utf-8') as f:
        municipality_ids = json.load(f)
    
    # Read the current locations.ts file
    locations_file = PROJECT_ROOT / 'apps' / 'web' / 'src' / 'lib' / 'locations.ts'
    if not locations_file.exists():
        print(f"ERROR: {locations_file} not found.")
        return
    
    with open(locations_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the MUNICIPALITIES_DATA section and update IDs
    # We need to match each municipality entry and replace the ID assignment
    
    # Pattern to match municipality entries in MUNICIPALITIES_DATA
    # Example: { name: 'Masinloc', slug: 'masinloc', province_id: 7 },
    pattern = r"(\s+)(\{ name: '([^']+)', slug: '([^']+)', province_id: (\d+) \},)"
    
    def replace_with_db_id(match):
        indent = match.group(1)
        full_match = match.group(2)
        name = match.group(3)
        slug = match.group(4)
        province_id = int(match.group(5))
        
        # Look up the real database ID by slug
        db_id = municipality_ids.get(slug.lower())
        if db_id:
            db_id_value = db_id['id']
            # Return the same format but we'll update the ID assignment later
            return full_match
    
    # First, let's update the ID assignment logic
    # Find the section where IDs are assigned
    id_assignment_pattern = r"(// Generate municipalities with sequential IDs\s+let municipalityId = 1\s+export const MUNICIPALITIES: Municipality\[\] = \[\s+for \(const provinceId of \[1, 2, 3, 4, 5, 6, 7\]\) \{\s+const provinceMunicipalities = MUNICIPALITIES_DATA\[provinceId\] \|\| \[\]\s+for \(const mun of provinceMunicipalities\) \{\s+MUNICIPALITIES\.push\(\{\s+id: municipalityId\+\+,)"
    
    # Better approach: Replace the ID assignment to use database IDs from the mapping
    new_id_logic = """// Generate municipalities with real database IDs
// Import the ID mapping (we'll create this inline)
const DB_MUNICIPALITY_IDS: Record<string, number> = {
""" + ',\n'.join([f'  "{slug}": {data["id"]}' for slug, data in sorted(municipality_ids.items())]) + """
}

export const MUNICIPALITIES: Municipality[] = []

for (const provinceId of [1, 2, 3, 4, 5, 6, 7]) {
  const provinceMunicipalities = MUNICIPALITIES_DATA[provinceId] || []
  for (const mun of provinceMunicipalities) {
    MUNICIPALITIES.push({
      id: DB_MUNICIPALITY_IDS[mun.slug] || 0, // Use real database ID"""
    
    # Replace the ID assignment section
    old_section = r"// Generate municipalities with sequential IDs\s+let municipalityId = 1\s+export const MUNICIPALITIES: Municipality\[\] = \[\s+for \(const provinceId of \[1, 2, 3, 4, 5, 6, 7\]\) \{\s+const provinceMunicipalities = MUNICIPALITIES_DATA\[provinceId\] \|\| \[\]\s+for \(const mun of provinceMunicipalities\) \{\s+MUNICIPALITIES\.push\(\{\s+id: municipalityId\+\+,\s+\.\.\.mun,\s+\}\)\s+\}\s+\}"
    
    new_section = new_id_logic + """,
      ...mun,
    })
  }
}"""
    
    content = re.sub(old_section, new_section, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write the updated file
    with open(locations_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n[OK] Updated {locations_file} with real database IDs")
    print(f"   Total municipalities: {len(municipality_ids)}")
    print("\n" + "=" * 64 + "\n")

if __name__ == '__main__':
    update_locations_ts()

