// Full simulation of what app.js does in renderSupportQR for Lucario

// Load data using a function scope to avoid const re-declaration issues
const fs = require('fs');
const dataStr = fs.readFileSync('data.js', 'utf8').replace('const DB_POKEMON_LIST', 'var DB_POKEMON_LIST');
eval(dataStr);

// Sort like app.js does
const list = [...DB_POKEMON_LIST].sort((a, b) => a.id.localeCompare(b.id));

const TYPE_MATCHUPS = {
    Normal: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 0.5, Bug: 1, Ghost: 0, Steel: 0.5, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 1, Ice: 1, Dragon: 1, Dark: 1, Fairy: 1 },
    Fighting: { Normal: 2, Fighting: 1, Flying: 0.5, Poison: 0.5, Ground: 1, Rock: 2, Bug: 0.5, Ghost: 0, Steel: 2, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 0.5, Ice: 2, Dragon: 1, Dark: 2, Fairy: 0.5 },
};

function getEffectiveness(atkType, defTypes) {
    let mult = 1.0;
    defTypes.forEach(defType => {
        const row = TYPE_MATCHUPS[atkType];
        if (row && row[defType] !== undefined) {
            mult *= row[defType];
        }
    });
    return mult;
}

const moveType = 'Fighting';

let targets = list.map(p => {
    return { pokemon: p, mult: getEffectiveness(moveType, p.types) };
}).filter(t => t.mult > 1);

// Check that Snorlax is here
const snorlax = targets.find(t => t.pokemon.name === 'Snorlax');
console.log('Snorlax in targets?', !!snorlax, snorlax ? `mult=${snorlax.mult} star=${snorlax.pokemon.star} pe=${snorlax.pokemon.pe_efficiency.toFixed(1)}` : '');

// Deduplicate: keep highest star per name
const starRank = s => { const n = parseInt(s); return isNaN(n) ? -1 : n; };
const bestByName = {};
targets.forEach(t => {
    const name = t.pokemon.name;
    if (!bestByName[name] || starRank(t.pokemon.star) > starRank(bestByName[name].pokemon.star)) {
        bestByName[name] = t;
    }
});
let uniqueTargets = Object.values(bestByName);

// Sort: star desc → PE desc → mult as tiebreaker
uniqueTargets.sort((a, b) => {
    const starA = starRank(a.pokemon.star);
    const starB = starRank(b.pokemon.star);
    if (starB !== starA) return starB - starA;
    if (b.pokemon.pe_efficiency !== a.pokemon.pe_efficiency) return b.pokemon.pe_efficiency - a.pokemon.pe_efficiency;
    return b.mult - a.mult;
});

const top5 = uniqueTargets.slice(0, 5);
console.log('\nTop 5 counters for Fighting (Lucario):');
top5.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.pokemon.name} | star=${t.pokemon.star} | mult=x${t.mult} | PE=${t.pokemon.pe_efficiency.toFixed(1)}`);
});

console.log('\nAll unique targets sorted by star+PE (top 10):');
uniqueTargets.slice(0, 10).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.pokemon.name} | star=${t.pokemon.star} | mult=x${t.mult} | PE=${t.pokemon.pe_efficiency.toFixed(1)}`);
});
