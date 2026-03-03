// Simulate what app.js does for getEffectiveness and the counter lookup

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

// Snorlax is Normal type
const snorlax = { name: 'Snorlax', types: ['Normal'], star: '6-star', pe_efficiency: 213.1 };

const mult = getEffectiveness('Fighting', snorlax.types);
console.log('Fighting vs Snorlax (Normal):', mult);
console.log('Would be included (mult > 1):', mult > 1);

// Tyranitar is Rock/Dark
const tyranitar = { name: 'Tyranitar', types: ['Rock', 'Dark'], star: '6-star', pe_efficiency: 179.4 };
const mult2 = getEffectiveness('Fighting', tyranitar.types);
console.log('Fighting vs Tyranitar (Rock/Dark):', mult2);
console.log('Would be included (mult > 1):', mult2 > 1);
