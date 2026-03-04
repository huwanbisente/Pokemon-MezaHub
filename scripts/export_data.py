import pandas as pd
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, '../data/Updated_PokeTables.xlsx')
xl = pd.ExcelFile(file_path)
main_df = xl.parse('Main_Table')
weakness_df = xl.parse('WeaknessChart')
moves_df = xl.parse('Move_List')
pokemon_list_df = xl.parse('PokemonList')

main_df = main_df.rename(columns={'Pokemon': 'Name'})
weakness_df = weakness_df.rename(columns={'Pokémon': 'Name'})
pokemon_list_df = pokemon_list_df.rename(columns={'Pokémon': 'Name'})

# Clean moves dataframe to create a dict of Move Name -> Type
move_type_map = {}
for _, r in moves_df.iterrows():
    if pd.notna(r.get('Move Name')):
        move_type_map[str(r['Move Name']).strip()] = str(r.get('Type', '')).strip()

# Also the move list OLD has some old moves
try:
    moves_old_df = xl.parse('MoveList_OLD')
    for _, r in moves_old_df.iterrows():
        if pd.notna(r.get('Move Name')):
            name = str(r['Move Name']).strip()
            if name not in move_type_map:
                move_type_map[name] = str(r.get('Type', '')).strip()
except Exception:
    pass

merged = pd.merge(main_df, pokemon_list_df[['Number', 'Type', 'Version']], on='Number', how='left')

merged = merged.dropna(subset=['Name'])
merged['Type'] = merged['Type'].fillna('Normal')

records = []
for _, row in merged.iterrows():
    normal_move = str(row.get("Normal/Special Move", "")).strip()
    gimmick_move = str(row.get("Gimmick Move", "")).strip()
    
    gimmick_type = move_type_map.get(gimmick_move, "")
    if not gimmick_type and gimmick_move.startswith('Max '):
        g_map = {
            'Max Flare': 'Fire', 'Max Geyser': 'Water', 'Max Overgrowth': 'Grass',
            'Max Lightning': 'Electric', 'Max Strike': 'Normal', 'Max Knuckle': 'Fighting',
            'Max Phantasm': 'Ghost', 'Max Hailstorm': 'Ice', 'Max Ooze': 'Poison',
            'Max Quake': 'Ground', 'Max Airstream': 'Flying', 'Max Mindstorm': 'Psychic',
            'Max Flutterby': 'Bug', 'Max Rockfall': 'Rock', 'Max Darkness': 'Dark',
            'Max Steelspike': 'Steel', 'Max Wyrmwind': 'Dragon', 'Max Starfall': 'Fairy'
        }
        gimmick_type = g_map.get(gimmick_move, "")
    
    types = [t.strip() for t in str(row.get("Type", "Normal")).replace(" / ", "/").split("/")]
    primary_type = types[0] if types else "Normal"
    
    normal_type = move_type_map.get(normal_move, primary_type)
    if not gimmick_type: 
        gimmick_type = primary_type

    version = str(row.get("Version", "")).strip()

    record = {
        "id": str(row.get("Number", "")),
        "name": str(row.get("Name", "")),
        "star": str(row.get("Star", "")),
        "version": version,
        "types": types,
        "stats": {
            "hp": row.get("HP", 0),
            "atk": row.get("ATK", 0),
            "def": row.get("DEF", 0),
            "spa": row.get("Sp.A", 0),
            "spd": row.get("Sp.D", 0),
            "spe": row.get("SPD", 0),
        },
        "moves": {
            "normal": normal_move,
            "normal_type": normal_type,
            "gimmick": gimmick_move,
            "gimmick_type": gimmick_type,
            "normal_damage": row.get("Normal Damage", 0),
            "gimmick_damage": row.get("Gimmick Move Damage", 0),
        },
        "pe": row.get("PE", 0),
        "hunt_power": row.get("Hunt Power", 0),
        "pe_efficiency": row.get("PE Efficiency", 0),
        "survivability": row.get("Survivability", 0)
    }
    
    def clean_nan(obj):
        if isinstance(obj, dict):
            return {k: clean_nan(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nan(v) for v in obj]
        elif pd.isna(obj):
            return None
        return obj

    records.append(clean_nan(record))
output_path = os.path.join(script_dir, '../js/data.js')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('const DB_POKEMON_LIST = ')
    json.dump(records, f, indent=2)
    f.write(';')

print("Exported data.js list with move types")
