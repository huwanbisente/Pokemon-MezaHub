const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

// 1. Fix the DB lookup to strip "Mega" and "X/Y" so we can find the base pokemon for types
const oldLookup = "const pData = PokemonData.list.find(p => p.name.toLowerCase() === sup.name.toLowerCase());";
const newLookup = `const searchName = sup.name.replace('Mega ', '').replace(' X', '').replace(' Y', '').trim();
    const pData = PokemonData.list.find(p => p.name.toLowerCase() === searchName.toLowerCase());`;

app = app.replaceAll(oldLookup, newLookup);

// 2. Use our smart URL generator instead of the naive replace
const oldUrlName = "let urlName = sup.name.toLowerCase().replace(/['.]/g, '').replace(/\\s+/g, '-');";
const newUrlName = "let urlName = getPokemonImageUrlName(sup.name);";

app = app.replaceAll(oldUrlName, newUrlName);

// 3. Prevent pData.name from overwriting the Mega Charizard X URL back to Charizard URL
const oldOverride = `        glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
        urlName = getPokemonImageUrlName(pData.name);
        imgUrlStatic = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlName}.png\`;
        imgUrlAni = \`https://play.pokemonshowdown.com/sprites/ani/\${urlName}.gif\`;`;

const newOverride = `        glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
        if (sup.name === 'Mega Charizard X') {
            typesHtml = ['Fire', 'Dragon'].map(t => \`<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase \${TYPE_COLORS[t] || 'bg-slate-400'} shadow-sm">\${t}</span>\`).join('');
        }`;

app = app.replaceAll(oldOverride, newOverride);

fs.writeFileSync('app.js', app);
console.log('Fixed Mega Evolutions URL formatting');
