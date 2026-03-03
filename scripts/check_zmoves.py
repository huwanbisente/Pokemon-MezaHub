import json

with open('data.js', encoding='utf-8') as f:
    d = f.read()

arr = json.loads(d[d.index('['):d.rfind(']')+1])
print(f"Total records: {len(arr)}")

gimmicks = set(p['moves'].get('gimmick', '') for p in arr if p['moves'].get('gimmick', '') not in ['nan', ''])
print("All gimmick moves:", sorted(gimmicks)[:30])

# Show a few sample records with their damages
print("\nSample records:")
for p in arr[:5]:
    print(f"  {p['name']:20s} | normal_dmg: {p['moves']['normal_damage']:8} | gimmick_dmg: {p['moves']['gimmick_damage']:8} | hunt_power: {p['hunt_power']:8.1f} | pe_eff: {p['pe_efficiency']:6.1f}")
