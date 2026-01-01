"""
Extract Region 3 (Central Luzon) location data from philippines_full_locations.json
Region 3 includes: Aurora, Bataan, Bulacan, Nueva Ecija, Pampanga, Tarlac, Zambales
"""
import json
from pathlib import Path
from typing import Dict, List, Any


REGION3_PROVINCES = [
    'Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 
    'Pampanga', 'Tarlac', 'Zambales'
]


def extract_region3_data(
    input_file: Path,
    output_file: Path
) -> Dict[str, Any]:
    """
    Extract Region 3 provinces and their municipalities/barangays from the full location data.
    
    Args:
        input_file: Path to philippines_full_locations.json
        output_file: Path to save the extracted Region 3 data
        
    Returns:
        Dictionary containing Region 3 location data
    """
    print(f"Reading location data from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        all_locations = json.load(f)
    
    region3_data = {}
    total_municipalities = 0
    total_barangays = 0
    
    for province_name in REGION3_PROVINCES:
        if province_name in all_locations:
            province_data = all_locations[province_name]
            region3_data[province_name] = province_data
            
            # Count municipalities and barangays
            if isinstance(province_data, dict):
                municipalities = list(province_data.keys())
                total_municipalities += len(municipalities)
                for mun_name, barangays in province_data.items():
                    if isinstance(barangays, list):
                        total_barangays += len(barangays)
            elif isinstance(province_data, list):
                # Some provinces might be structured differently
                total_municipalities += len(province_data)
            
            mun_count = len(province_data) if isinstance(province_data, dict) else 'N/A'
            print(f"  [OK] {province_name}: {mun_count} municipalities")
        else:
            print(f"  [NOT FOUND] {province_name}: NOT FOUND in location data")
    
    # Save extracted data
    print(f"\nSaving Region 3 data to {output_file}...")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(region3_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SUCCESS] Extraction complete!")
    print(f"  - Provinces: {len(region3_data)}")
    print(f"  - Total Municipalities: {total_municipalities}")
    print(f"  - Total Barangays: {total_barangays}")
    
    return region3_data


def get_province_slug(province_name: str) -> str:
    """Convert province name to URL-friendly slug."""
    return province_name.lower().replace(' ', '-')


def get_municipality_slug(municipality_name: str) -> str:
    """Convert municipality name to URL-friendly slug."""
    return municipality_name.lower().replace(' ', '-').replace("'", '')


if __name__ == '__main__':
    # Get project root (3 levels up from this file)
    project_root = Path(__file__).parent.parent.parent.parent.resolve()
    
    input_file = project_root / 'data' / 'locations' / 'philippines_full_locations.json'
    output_file = project_root / 'data' / 'locations' / 'region3_locations.json'
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        exit(1)
    
    extract_region3_data(input_file, output_file)

