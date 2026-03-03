import re, json

data = open('data.js', encoding='utf-8').read()
data = data.strip()
if data.startswith('const DB_POKEMON_LIST'):
    data = data[data.index('['):]
    data = data[:data.rfind(']')+1]

items = json.loads(data)

# Filter fighting-weak types
fighting_weak_types = {'Dark','Rock','Normal','Ice','Steel'}
results = []
for p in items:
    if set(p.get('types',[])) & fighting_weak_types:
        star_num = int(p.get('star','0-star').split('-')[0])
        results.append((p['name'], p.get('star','?'), star_num, p.get('pe_efficiency', 0)))

results.sort(key=lambda x: (x[2], x[3]), reverse=True)
print("Top 10 Fighting-Weak Pokemons by Star+PE:")
for r in results[:10]:
    print(f"  {r[1]:6s}  PE={r[3]:7.1f}  {r[0]}")

