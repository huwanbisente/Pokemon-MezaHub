const fs = require('fs');
const content = fs.readFileSync('data.js', 'utf8');
eval(content.replace('const DB_POKEMON_LIST', 'var DB_POKEMON_LIST'));

console.log('Total items in raw DB:', DB_POKEMON_LIST.length);
const v1Items = DB_POKEMON_LIST.filter(p => (p.version || p.star) === 'Stardust V1');
const v2Items = DB_POKEMON_LIST.filter(p => (p.version || p.star) === 'Stardust V2');
const spItems = DB_POKEMON_LIST.filter(p => p.star === 'Special');
console.log('Raw Total:', DB_POKEMON_LIST.length, 'Raw V1:', v1Items.length, 'Raw V2:', v2Items.length, 'Raw Special:', spItems.length);

const unique = [];
const seenNames = new Set();
for (const p of DB_POKEMON_LIST) {
    const nameKey = p.name.toLowerCase();
    if (!seenNames.has(nameKey)) {
        unique.push(p);
        seenNames.add(nameKey);
    }
}
const uv1 = unique.filter(p => (p.version || p.star) === 'Stardust V1').length;
const uv2 = unique.filter(p => (p.version || p.star) === 'Stardust V2').length;
const usp = unique.filter(p => p.star === 'Special').length;
console.log('Unique Total:', unique.length, 'Unique V1:', uv1, 'Unique V2:', uv2, 'Unique Special:', usp);

const missingV1 = v1Items.filter(p => !unique.find(u => u.id === p.id));
console.log('Missing V1 (sample 5):', missingV1.slice(0, 5).map(p => p.name));
