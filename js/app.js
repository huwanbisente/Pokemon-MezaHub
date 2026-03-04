let currentSortType = 'pe';
let currentSortDesc = true;
let currentCounters = [];
let currentOpponentName = '';
let currentCounterStarFilter = 'All';

let currentPokedexPage = 1;
const POKEDEX_PER_PAGE = 10;
let currentPokedexQuery = '';
let currentPokedexVersion = 'All';

// --- Collection (persisted via localStorage) ---
const COLLECTION_KEY = 'pokemon_collection_v1';
function getCollection() {
    try { return new Set(JSON.parse(localStorage.getItem(COLLECTION_KEY)) || []); }
    catch { return new Set(); }
}
function saveCollection(set) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify([...set]));
    // Sync to Firebase if configured
    if (typeof window.syncCollectionToFirebase === 'function') {
        window.syncCollectionToFirebase([...set]);
    }
}
function isCollected(pokemonId) { return getCollection().has(pokemonId); }
function toggleCollection(pokemonId) {
    const col = getCollection();
    if (col.has(pokemonId)) { col.delete(pokemonId); } else { col.add(pokemonId); }
    saveCollection(col);
    // Refresh the card button state without full re-render
    const btn = document.getElementById(`col-btn-${CSS.escape(pokemonId)}`);
    if (btn) updateCollectionBtn(btn, col.has(pokemonId));

    // Refresh profile if active
    const profileScreen = document.getElementById('screen-profile');
    if (profileScreen && !profileScreen.classList.contains('hidden')) {
        renderProfile();
    }
}
function updateCollectionBtn(btn, collected) {
    if (collected) {
        btn.innerHTML = '<span class="material-symbols-outlined text-[11px]">check_circle</span> Collected';
        btn.className = btn.className.replace('bg-white/5 text-slate-400 border-white/10 hover:border-primary/40', 'bg-primary/20 text-primary border-primary/40');
        btn.className = 'w-full mt-2 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg border transition-all bg-primary/20 text-primary border-primary/40';
    } else {
        btn.innerHTML = '<span class="material-symbols-outlined text-[11px]">add_circle</span> Add to Collection';
        btn.className = 'w-full mt-2 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg border transition-all bg-white/5 text-slate-400 border-white/10 hover:border-primary/40 hover:text-primary';
    }
}

// --- Battle Log (persisted via localStorage) ---
const BATTLE_LOG_KEY = 'trainer_battle_log_v1';
function getBattleLog() {
    try { return JSON.parse(localStorage.getItem(BATTLE_LOG_KEY)) || []; }
    catch { return []; }
}
function recordBattle() {
    if (!currentOpponentName) return;
    const opponent = PokemonData.list.find(p => p.name.toLowerCase() === currentOpponentName.toLowerCase());
    if (!opponent) return;

    const topCounters = (currentCounters || []).slice(0, 3).map(c => c.pokemon.name);
    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        opponent: { name: opponent.name, star: opponent.star, types: opponent.types, id: opponent.id },
        countersUsed: topCounters
    };

    const log = getBattleLog();
    log.unshift(entry);
    if (log.length > 100) log.pop();
    localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(log));

    // Sync to Firebase if configured
    if (typeof window.syncBattleLogToFirebase === 'function') {
        window.syncBattleLogToFirebase(log);
    }

    // Button feedback
    const btn = document.getElementById('record-battle-btn');
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-outlined text-primary">check_circle</span><span class="text-primary">Battle Recorded!</span>';
        setTimeout(() => {
            btn.innerHTML = '<span class="material-symbols-outlined">swords</span> Record Battle';
        }, 2000);
    }

    // Refresh profile if active
    const profileScreen = document.getElementById('screen-profile');
    if (profileScreen && !profileScreen.classList.contains('hidden')) {
        renderProfile();
    }
}

function renderProfile() {
    const col = getCollection();
    const log = getBattleLog();

    // Stats
    const dexCountEl = document.getElementById('profile-dex-count');
    const battleCountEl = document.getElementById('profile-battle-count');
    const superstarsCountEl = document.getElementById('profile-superstars-count');

    if (dexCountEl) dexCountEl.innerText = col.size;
    if (battleCountEl) battleCountEl.innerText = log.length;

    // Count how many 6-star tags are in the collection
    if (superstarsCountEl) {
        const collectedIds = Array.from(col);
        const superstarCount = PokemonData.list.filter(p => collectedIds.includes(p.id) && String(p.star).includes('6')).length;
        superstarsCountEl.innerText = superstarCount;
    }

    // Top Pokemon & Companion (from collection)
    const topPokemonEl = document.getElementById('profile-top-pokemon');
    if (topPokemonEl) {
        const collectedIds = Array.from(col);
        const collectedPokemon = PokemonData.list.filter(p => collectedIds.includes(p.id)).slice(0, 10);

        // --- Set Companion Pokemon ---
        const compImg = document.getElementById('profile-companion-img');
        if (compImg) {
            const savedCompanion = localStorage.getItem('stardust_companion_pokemon');
            let compName = 'Pikachu';

            if (savedCompanion) {
                compName = savedCompanion;
            } else if (collectedPokemon.length > 0) {
                compName = collectedPokemon[0].name;
            }

            const urlName = getPokemonImageUrlName(compName);
            compImg.src = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;

            if (typeof applyCompanionScale === 'function') {
                applyCompanionScale(compName, compImg);
            }
        }
        // -----------------------------

        if (collectedPokemon.length > 0) {
            topPokemonEl.innerHTML = collectedPokemon.map(p => {
                const urlName = getPokemonImageUrlName(p.name);
                const imgUrl = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
                return `
                <div class="flex-shrink-0 w-20 bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center gap-1 cursor-pointer hover:border-primary/40 transition-all"
                     onclick="showPokemonModal('${p.name.replace(/'/g, "\\'")}')">
                    <img src="${imgUrl}" class="w-12 h-12 object-contain pixelated" alt="${p.name}"/>
                    <p class="text-[8px] text-white font-black truncate w-full text-center uppercase">${p.name}</p>
                </div>`;
            }).join('');
        } else {
            topPokemonEl.innerHTML = '<p class="text-slate-500 text-[10px] py-4">No Pokémon in collection yet.</p>';
        }
    }

    // Battle History (Show Top 3 on Profile)
    const historyEl = document.getElementById('profile-battle-history');
    if (historyEl) {
        if (log.length > 0) {
            const displayLog = log.slice(0, 3);
            historyEl.innerHTML = displayLog.map(entry => {
                const date = new Date(entry.id).toLocaleDateString();
                const typesHtml = entry.opponent.types.map(t => `<span class="px-1 py-0.5 rounded-[4px] text-[7px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'}">${t}</span>`).join('');
                const countersHtml = entry.countersUsed.slice(0, 2).map(c => `<span class="bg-white/5 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold border border-white/5">${c}</span>`).join('');

                return `
                <div class="bg-surface-dark border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-col">
                            <p class="text-white text-xs font-black uppercase tracking-tight">${entry.opponent.name}</p>
                            <div class="flex gap-1 mt-1">${typesHtml}</div>
                        </div>
                        <span class="text-[8px] font-bold text-slate-500 uppercase">${date}</span>
                    </div>
                    <div class="flex items-center gap-2 pt-2 border-t border-white/5">
                        <span class="text-[8px] font-black text-primary uppercase tracking-widest">Counters:</span>
                        <div class="flex gap-1">${countersHtml}</div>
                    </div>
                </div>`;
            }).join('');
        } else {
            historyEl.innerHTML = '<p class="text-slate-500 text-[10px] py-4">No battle records found.</p>';
        }
    }
}

// --- Modals for Profile ---

window.openCollectionModal = function () {
    const col = getCollection();
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('collection-modal-grid');
    const stats = document.getElementById('collection-modal-stats');

    if (!modal || !grid || !stats) return;

    stats.innerText = `${col.size} Collected`;

    const collectedIds = Array.from(col);
    const collectedPokemon = PokemonData.list.filter(p => collectedIds.includes(p.id));

    if (collectedPokemon.length === 0) {
        grid.innerHTML = '<p class="text-slate-500 text-xs col-span-4 text-center py-10 w-full">No Pokémon collected yet.</p>';
    } else {
        grid.innerHTML = collectedPokemon.map(p => {
            const urlName = getPokemonImageUrlName(p.name);
            const imgUrl = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
            return `
            <div class="glass-card bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 transition-all"
                 onclick="showPokemonModal('${p.name.replace(/'/g, "\\'")}')">
                <img src="${imgUrl}" class="w-12 h-12 object-contain pixelated" alt="${p.name}"/>
                <p class="text-[8px] text-white font-black truncate w-full text-center uppercase">${p.name}</p>
            </div>
            `;
        }).join('');
    }

    modal.classList.remove('hidden');
};

window.openBattleHistoryModal = function () {
    const log = getBattleLog();
    const modal = document.getElementById('battle-history-modal');
    const wrapper = document.getElementById('history-modal-wrapper');
    const stats = document.getElementById('history-modal-stats');

    if (!modal || !wrapper || !stats) return;

    stats.innerText = `${log.length} Battles Recorded`;

    if (log.length === 0) {
        wrapper.innerHTML = '<p class="text-slate-500 text-xs text-center py-10 w-full">No battle records found.</p>';
    } else {
        wrapper.innerHTML = log.map(entry => {
            const date = new Date(entry.id).toLocaleDateString();
            const typesHtml = entry.opponent.types.map(t => `<span class="px-1 py-0.5 rounded-[4px] text-[7px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'}">${t}</span>`).join('');
            const countersHtml = entry.countersUsed.map(c => `<span class="bg-white/5 px-1.5 py-0.5 rounded text-[8px] text-slate-300 font-bold border border-white/5">${c}</span>`).join('');

            return `
            <div class="bg-surface-dark border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                <div class="flex justify-between items-start">
                    <div class="flex flex-col">
                        <p class="text-white text-xs font-black uppercase tracking-tight">${entry.opponent.name}</p>
                        <div class="flex gap-1 mt-1">${typesHtml}</div>
                    </div>
                    <span class="text-[8px] font-bold text-slate-500 uppercase">${date}</span>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-white/5">
                    <span class="text-[8px] font-black text-primary uppercase tracking-widest">Counters Used:</span>
                    <div class="flex gap-1 flex-wrap">${countersHtml}</div>
                </div>
            </div>`;
        }).join('');
    }

    modal.classList.remove('hidden');
};

function getPokemonImageUrlName(name) {
    // Handle Pikachu special variants like "Pikachu(5☆)" → just "pikachu"
    if (name.startsWith('Pikachu(') || name.startsWith('pikachu(')) {
        return 'pikachu';
    }

    // Pokémon Showdown drops the hyphen for Kommo-o
    if (name === 'Kommo-o' || name === 'kommo-o') {
        return 'kommoo';
    }

    // Strip non-ASCII (star symbols etc), parentheses, apostrophes, dots
    let urlName = name.toLowerCase()
        .replace(/[^\x00-\x7F]/g, '')   // remove non-ASCII (☆ etc)
        .replace(/[()'.]/g, '')          // remove parens, apostrophes, dots
        .replace(/\s+/g, '-')            // spaces to hyphens
        .replace(/-+/g, '-')             // collapse multiple hyphens
        .replace(/^-|-$/g, '');          // trim edge hyphens

    if (urlName.startsWith('alolan-')) {
        urlName = urlName.replace('alolan-', '') + '-alola';
    } else if (urlName.startsWith('galarian-')) {
        urlName = urlName.replace('galarian-', '') + '-galar';
    } else if (urlName.startsWith('hisuian-')) {
        urlName = urlName.replace('hisuian-', '') + '-hisui';
    } else if (urlName.startsWith('paldean-')) {
        urlName = urlName.replace('paldean-', '') + '-paldea';
    } else if (urlName.startsWith('mega-')) {
        if (urlName.endsWith('-x')) {
            urlName = urlName.replace('mega-', '').replace(/-x$/, '') + '-megax';
        } else if (urlName.endsWith('-y')) {
            urlName = urlName.replace('mega-', '').replace(/-y$/, '') + '-megay';
        } else {
            urlName = urlName.replace('mega-', '') + '-mega';
        }
    }
    return urlName;
}

const PokemonData = {
    list: [],

    load() {
        if (typeof DB_POKEMON_LIST !== 'undefined') {
            const uniqueList = [...DB_POKEMON_LIST];

            // Sort by ID from 1-1-xxxx to 1-2-xxxx
            uniqueList.sort((a, b) => a.id.localeCompare(b.id));

            this.list = uniqueList;
            this.renderPokedex();
        } else {
            console.error("Failed to load pokemon data variable DB_POKEMON_LIST");
        }
    },

    getEffectiveness(atkType, defTypes) {
        let mult = 1.0;
        defTypes.forEach(defType => {
            const row = TYPE_MATCHUPS[atkType];
            if (row && row[defType] !== undefined) {
                mult *= row[defType];
            }
        });
        return mult;
    },

    findCounters(opponentName) {
        const opponent = this.list.find(p => p.name.toLowerCase() === opponentName.toLowerCase());
        if (!opponent) return [];

        let candidates = this.list.map(p => {
            // Find best attacking move multiplier
            const normalMult = p.moves.normal_type ? this.getEffectiveness(p.moves.normal_type, opponent.types) : 1;
            const gimmickMult = p.moves.gimmick_type ? this.getEffectiveness(p.moves.gimmick_type, opponent.types) : 1;
            const bestMult = Math.max(normalMult, gimmickMult);
            return {
                pokemon: p,
                multiplier: bestMult
            };
        }).filter(c => c.multiplier > 1); // Must be super effective

        // Rank by multiplier, then PE efficiency
        candidates.sort((a, b) => {
            if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;
            return b.pokemon.pe_efficiency - a.pokemon.pe_efficiency;
        });

        // Group by name to remove duplicate forms (if they have same name)
        const unique = [];
        const seen = new Set();
        for (const c of candidates) {
            if (!seen.has(c.pokemon.name)) {
                unique.push(c);
                seen.add(c.pokemon.name);
            }
        }

        return {
            opponent,
            counters: unique
        };
    },

    renderPokedex() {
        const container = document.getElementById('pokedex-grid');
        if (!container) return;

        let filtered = this.list;

        if (currentPokedexQuery) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(currentPokedexQuery.toLowerCase()));
        }

        if (currentPokedexVersion !== 'All') {
            const vParam = currentPokedexVersion.toLowerCase();
            filtered = filtered.filter(p =>
                (p.star && p.star.toLowerCase() === vParam) ||
                (p.version && p.version.toLowerCase() === vParam)
            );
        }

        const countBadge = document.getElementById('dex-count-badge');
        if (countBadge) {
            countBadge.innerText = `${filtered.length} ENTRIES`;
        }

        const totalPages = Math.ceil(filtered.length / POKEDEX_PER_PAGE) || 1;
        if (currentPokedexPage > totalPages) currentPokedexPage = totalPages;
        if (currentPokedexPage < 1) currentPokedexPage = 1;

        const startIndex = (currentPokedexPage - 1) * POKEDEX_PER_PAGE;
        const displayList = filtered.slice(startIndex, startIndex + POKEDEX_PER_PAGE);

        const paginationContainer = document.getElementById('pokedex-pagination');
        if (paginationContainer) {
            if (filtered.length > 0) {
                paginationContainer.classList.remove('hidden');
                document.getElementById('pokedex-page-indicator').innerText = `PAGE ${currentPokedexPage} / ${totalPages}`;
            } else {
                paginationContainer.classList.add('hidden');
            }
        }

        let html = '';
        if (displayList.length === 0) {
            container.innerHTML = '<p class="text-slate-400 font-bold p-4 col-span-2">No Pokémon found.</p>';
            return;
        }

        displayList.forEach(pokemon => {
            const typesHtml = pokemon.types.map(t => `<span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'}">${t}</span>`).join('');

            const glowColorMap = {
                'Fire': 'bg-orange-600/20',
                'Water': 'bg-blue-600/20',
                'Grass': 'bg-green-600/20',
                'Electric': 'bg-yellow-400/20',
                'Psychic': 'bg-pink-600/20',
                'Ghost': 'bg-purple-600/20',
                'Dark': 'bg-slate-700/20',
                'Dragon': 'bg-indigo-600/20',
                'Fairy': 'bg-pink-400/20',
            };
            const glowColor = glowColorMap[pokemon.types[0]] || 'bg-white/10';

            const urlName = getPokemonImageUrlName(pokemon.name);
            const imgUrl = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
            const imgUrlAni = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
            const gimmickBadge = getGimmickBadge(pokemon);

            html += `
            <div onclick="showPokemonModal('${pokemon.name.replace(/'/g, "\\'")}')" class="glass-card rounded-2xl p-4 border border-white/10 relative group overflow-hidden cursor-pointer flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div class="absolute -top-10 -right-10 size-32 ${glowColor} rounded-full blur-[40px] pointer-events-none"></div>
                <div class="flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-black text-white/40 tracking-widest leading-none">#${pokemon.id.split('-').pop()}</span>
                        <span class="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[50%] opacity-80">${pokemon.version ? pokemon.version : (pokemon.star ? pokemon.star.replace(/[- ]star/i, '★') : '')}</span>
                    </div>
                    <div class="flex justify-center mb-2 relative h-16 pointer-events-none">
                        <img alt="${pokemon.name}" class="object-contain pokemon-render relative z-10 w-full h-full max-h-full" 
                             src="${imgUrlAni}" 
                             onerror="this.src='${imgUrl}'; this.onerror=null;"/>
                    </div>
                    <div class="flex justify-between items-center mb-1 gap-2">
                        <div class="flex items-center gap-1.5 overflow-hidden">
                            <h4 class="text-white font-black text-sm tracking-tight leading-tight line-clamp-1">${pokemon.name}</h4>
                            <span class="text-primary text-[10px] bg-primary/10 px-1 py-0.5 rounded leading-none shrink-0 font-black">${pokemon.star ? pokemon.star.replace(/[- ]star/i, '★') : ''}</span>
                        </div>
                        <div class="shrink-0 flex items-center">
                            ${gimmickBadge}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-2">
                        ${typesHtml}
                    </div>
                </div>
                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-1 mt-auto pt-2 border-t border-white/5 opacity-80">
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">HP</span>
                        <span class="text-[9px] text-white font-black">${pokemon.stats.hp}</span>
                    </div>
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">ATK</span>
                        <span class="text-[9px] text-orange-400 font-black">${pokemon.stats.atk}</span>
                    </div>
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">DEF</span>
                        <span class="text-[9px] text-yellow-400 font-black">${pokemon.stats.def}</span>
                    </div>
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">SPA</span>
                        <span class="text-[9px] text-purple-400 font-black">${pokemon.stats.spa}</span>
                    </div>
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">SPD</span>
                        <span class="text-[9px] text-blue-400 font-black">${pokemon.stats.spd}</span>
                    </div>
                    <div class="flex flex-col items-center p-1 bg-white/5 rounded">
                        <span class="text-[7px] text-slate-400 font-bold">SPE</span>
                        <span class="text-[9px] text-green-400 font-black">${pokemon.stats.spe}</span>
                    </div>
                </div>
                <!-- Add to Collection button -->
                <button id="col-btn-${pokemon.id}"
                    onclick="event.stopPropagation(); toggleCollection('${pokemon.id}')"
                    class="w-full mt-2 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg border transition-all ${isCollected(pokemon.id) ? 'bg-primary/20 text-primary border-primary/40' : 'bg-white/5 text-slate-400 border-white/10 hover:border-primary/40 hover:text-primary'}">
                    <span class="material-symbols-outlined text-[11px]">${isCollected(pokemon.id) ? 'check_circle' : 'add_circle'}</span>
                    ${isCollected(pokemon.id) ? 'Collected' : 'Add to Collection'}
                </button>
            </div>
            `;
        });

        container.innerHTML = html;
    }
};

const TYPE_MATCHUPS = {
    Normal: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 0.5, Bug: 1, Ghost: 0, Steel: 0.5, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 1, Ice: 1, Dragon: 1, Dark: 1, Fairy: 1 },
    Fighting: { Normal: 2, Fighting: 1, Flying: 0.5, Poison: 0.5, Ground: 1, Rock: 2, Bug: 0.5, Ghost: 0, Steel: 2, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 0.5, Ice: 2, Dragon: 1, Dark: 2, Fairy: 0.5 },
    Flying: { Normal: 1, Fighting: 2, Flying: 1, Poison: 1, Ground: 1, Rock: 0.5, Bug: 2, Ghost: 1, Steel: 0.5, Fire: 1, Water: 1, Grass: 2, Electric: 0.5, Psychic: 1, Ice: 1, Dragon: 1, Dark: 1, Fairy: 1 },
    Poison: { Normal: 1, Fighting: 1, Flying: 1, Poison: 0.5, Ground: 0.5, Rock: 0.5, Bug: 1, Ghost: 0.5, Steel: 0, Fire: 1, Water: 1, Grass: 2, Electric: 1, Psychic: 1, Ice: 1, Dragon: 1, Dark: 1, Fairy: 2 },
    Ground: { Normal: 1, Fighting: 1, Flying: 0, Poison: 2, Ground: 1, Rock: 2, Bug: 0.5, Ghost: 1, Steel: 2, Fire: 2, Water: 1, Grass: 0.5, Electric: 2, Psychic: 1, Ice: 1, Dragon: 1, Dark: 1, Fairy: 1 },
    Rock: { Normal: 1, Fighting: 0.5, Flying: 2, Poison: 1, Ground: 0.5, Rock: 1, Bug: 2, Ghost: 1, Steel: 0.5, Fire: 2, Water: 1, Grass: 1, Electric: 1, Psychic: 1, Ice: 2, Dragon: 1, Dark: 1, Fairy: 1 },
    Bug: { Normal: 1, Fighting: 0.5, Flying: 0.5, Poison: 0.5, Ground: 1, Rock: 1, Bug: 1, Ghost: 0.5, Steel: 0.5, Fire: 0.5, Water: 1, Grass: 2, Electric: 1, Psychic: 2, Ice: 1, Dragon: 1, Dark: 2, Fairy: 0.5 },
    Ghost: { Normal: 0, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 1, Bug: 1, Ghost: 2, Steel: 1, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 2, Ice: 1, Dragon: 1, Dark: 0.5, Fairy: 1 },
    Steel: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 2, Bug: 1, Ghost: 1, Steel: 0.5, Fire: 0.5, Water: 0.5, Grass: 1, Electric: 0.5, Psychic: 1, Ice: 2, Dragon: 1, Dark: 1, Fairy: 2 },
    Fire: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 0.5, Bug: 2, Ghost: 1, Steel: 2, Fire: 0.5, Water: 0.5, Grass: 2, Electric: 1, Psychic: 1, Ice: 2, Dragon: 0.5, Dark: 1, Fairy: 1 },
    Water: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 2, Rock: 2, Bug: 1, Ghost: 1, Steel: 1, Fire: 2, Water: 0.5, Grass: 0.5, Electric: 1, Psychic: 1, Ice: 1, Dragon: 0.5, Dark: 1, Fairy: 1 },
    Grass: { Normal: 1, Fighting: 1, Flying: 0.5, Poison: 0.5, Ground: 2, Rock: 2, Bug: 0.5, Ghost: 1, Steel: 0.5, Fire: 0.5, Water: 2, Grass: 0.5, Electric: 1, Psychic: 1, Ice: 1, Dragon: 0.5, Dark: 1, Fairy: 1 },
    Electric: { Normal: 1, Fighting: 1, Flying: 2, Poison: 1, Ground: 0, Rock: 1, Bug: 1, Ghost: 1, Steel: 1, Fire: 1, Water: 2, Grass: 0.5, Electric: 0.5, Psychic: 1, Ice: 1, Dragon: 0.5, Dark: 1, Fairy: 1 },
    Psychic: { Normal: 1, Fighting: 2, Flying: 1, Poison: 2, Ground: 1, Rock: 1, Bug: 1, Ghost: 1, Steel: 0.5, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 0.5, Ice: 1, Dragon: 1, Dark: 0, Fairy: 1 },
    Ice: { Normal: 1, Fighting: 1, Flying: 2, Poison: 1, Ground: 2, Rock: 1, Bug: 1, Ghost: 1, Steel: 0.5, Fire: 0.5, Water: 0.5, Grass: 2, Electric: 1, Psychic: 1, Ice: 0.5, Dragon: 2, Dark: 1, Fairy: 1 },
    Dragon: { Normal: 1, Fighting: 1, Flying: 1, Poison: 1, Ground: 1, Rock: 1, Bug: 1, Ghost: 1, Steel: 0.5, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 1, Ice: 1, Dragon: 2, Dark: 1, Fairy: 0 },
    Dark: { Normal: 1, Fighting: 0.5, Flying: 1, Poison: 1, Ground: 1, Rock: 1, Bug: 1, Ghost: 2, Steel: 1, Fire: 1, Water: 1, Grass: 1, Electric: 1, Psychic: 2, Ice: 1, Dragon: 1, Dark: 0.5, Fairy: 0.5 },
    Fairy: { Normal: 1, Fighting: 2, Flying: 1, Poison: 0.5, Ground: 1, Rock: 1, Bug: 1, Ghost: 1, Steel: 0.5, Fire: 0.5, Water: 1, Grass: 1, Electric: 1, Psychic: 1, Ice: 1, Dragon: 2, Dark: 2, Fairy: 1 }
};

const TYPE_COLORS = {
    Normal: "bg-slate-400 text-white",
    Fire: "bg-orange-500 text-white",
    Water: "bg-blue-500 text-white",
    Electric: "bg-yellow-400 text-slate-900",
    Grass: "bg-green-500 text-white",
    Ice: "bg-cyan-300 text-slate-900",
    Fighting: "bg-red-700 text-white",
    Poison: "bg-purple-600 text-white",
    Ground: "bg-amber-700 text-white",
    Flying: "bg-sky-400 text-slate-900",
    Psychic: "bg-pink-500 text-white",
    Bug: "bg-lime-500 text-slate-900",
    Rock: "bg-stone-500 text-white",
    Ghost: "bg-indigo-800 text-white",
    Dragon: "bg-indigo-600 text-white",
    Dark: "bg-slate-800 text-white",
    Steel: "bg-slate-500 text-white",
    Fairy: "bg-pink-300 text-slate-900"
};

function navigate(viewId) {
    const screens = ['pokedex', 'battle', 'qr', 'profile', 'marketplace'];
    screens.forEach(screen => {
        const el = document.getElementById(`screen-${screen}`);
        const icon = document.getElementById(`nav-icon-${screen}`);
        const text = document.getElementById(`nav-text-${screen}`);

        if (screen === viewId) {
            el.classList.remove('hidden');
            icon.classList.remove('text-slate-500');
            icon.classList.add('text-primary', 'neon-glow');
            text.classList.remove('text-slate-500');
            text.classList.add('text-primary', 'neon-glow');
        } else {
            el.classList.add('hidden');
            icon.classList.add('text-slate-500');
            icon.classList.remove('text-primary', 'neon-glow');
            text.classList.add('text-slate-500');
            text.classList.remove('text-primary', 'neon-glow');
        }
    });

    if (viewId === 'battle') {
        const i = document.getElementById('battle-search-input');
        if (i && i.value) {
            handleSearch(i.value);
        }
    } else if (viewId === 'profile') {
        renderProfile();
    } else if (viewId === 'marketplace') {
        renderMarketplace();
    }
}

function handleSearch(query) {
    if (!query) return;
    currentOpponentName = query;
    const result = PokemonData.findCounters(query);
    if (!result.opponent) {
        document.getElementById('battle-target-info').innerHTML = `<p class="text-slate-400">No opponent found with that name.</p>`;
        document.getElementById('battle-counters-list').innerHTML = '';
        document.getElementById('battle-weaknesses-list').innerHTML = '';
        return;
    }

    currentCounters = result.counters;
    renderOpponent(result.opponent);
    renderWeaknesses(result.opponent);
    renderSupportCounters(result.opponent);
    applyCounterSort();
}

function renderSupportCounters(opponent) {
    const el = document.getElementById('battle-support-counters');
    if (!el) return;

    // Find support pokemon whose move is super-effective against the opponent
    const matches = SUPPORT_POKEMON_LIST.filter(sup => {
        if (!sup.moveType) return false;
        const mult = PokemonData.getEffectiveness(sup.moveType, opponent.types);
        return mult > 1;
    });

    if (matches.length === 0) {
        el.innerHTML = `<p class="text-xs text-slate-500 font-bold col-span-2 py-2">No Support Pokémon counter available.</p>`;
        return;
    }

    // Show max 2 support counters side by side
    const display = matches.slice(0, 2);

    el.innerHTML = display.map(sup => {
        const urlName = getPokemonImageUrlName(sup.name);
        const imgUrlAni = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
        const imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
        const moveColor = TYPE_COLORS[sup.moveType] || 'bg-slate-500 text-white';
        const mult = PokemonData.getEffectiveness(sup.moveType, opponent.types);
        const multBadgeColor = mult === 4 ? 'bg-red-500' : 'bg-orange-500';

        return `
        <div onclick="navigate('qr'); setTimeout(()=>showQRModal('${sup.name.replace(/'/g, "\\'")}'),100)"
             class="cursor-pointer hover:bg-white/5 rounded-xl transition-all group w-full overflow-hidden flex flex-col h-full">

            <!-- TOP ROW: Avatar (left) + QR (right) -->
            <div class="flex gap-2 p-2 pb-1 flex-1 items-center">

                <!-- Left box: Pokémon avatar -->
                <div class="flex-1 flex items-center justify-center relative h-[80px]">
                    <img class="w-full h-full object-contain pixelated p-1"
                         src="${imgUrlAni}"
                         onerror="this.src='${imgUrlStatic}'; this.onerror=null;"
                         alt="${sup.name}"/>
                    <!-- Multiplier badge -->
                    <span class="absolute bottom-1 right-1 text-[6px] font-black text-white ${multBadgeColor} px-1 py-0.5 rounded leading-none z-10 shadow-sm">${mult}x</span>
                </div>

                <!-- Right box: QR code tightly wrapped -->
                <div class="flex-1 flex items-center justify-center">
                    <img src="${sup.qrImage}" class="bg-white border border-black/10 rounded-lg p-1.5 w-[75px] h-[75px] object-contain shadow-sm" alt="QR Code"/>
                </div>

            </div>

            <!-- BOTTOM: Name + Info -->
            <div class="px-2 pb-2 pt-1 flex flex-col gap-0.5">
                <p class="text-white text-[10px] font-black uppercase tracking-tight leading-tight truncate">${sup.name}</p>
                <div class="flex items-center gap-1 flex-wrap">
                    <span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${moveColor} leading-none">${sup.moveType}</span>
                    <span class="text-slate-400 text-[7px] font-bold truncate">${sup.moveName}</span>
                </div>
            </div>

        </div>`;
    }).join('');
}

function setCounterStarFilter(star) {
    currentCounterStarFilter = star;

    // Update button visual styles
    const buttons = ['All', '6-Star', '5-Star', '4-Star', '3-Star', '2-Star'];

    // reset all buttons
    buttons.forEach(btn => {
        let el = document.getElementById('filter-star-' + (btn === 'All' ? 'All' : btn.split('-')[0]));
        if (el) {
            el.className = "px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-surface-dark border border-white/10 text-slate-400 hover:text-white transition-colors shrink-0";
        }
    });

    // set active
    let activeId = 'filter-star-' + (star === 'All' ? 'All' : star.split('-')[0]);
    let activeEl = document.getElementById(activeId);
    if (activeEl) {
        activeEl.className = "px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary text-black transition-colors shrink-0";
    }

    applyCounterSort();
}

function setCounterSort(type) {
    if (currentSortType === type) {
        currentSortDesc = !currentSortDesc; // Toggle asc/desc
    } else {
        currentSortType = type;
        currentSortDesc = true; // Default to desc when switching types
    }

    // Update button Styles with arrows
    const peArrow = currentSortType === 'pe' ? (currentSortDesc ? ' ▼' : ' ▲') : '';
    const huntArrow = currentSortType === 'hunt' ? (currentSortDesc ? ' ▼' : ' ▲') : '';

    document.getElementById('sort-pe-btn').className = `px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${currentSortType === 'pe' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`;
    document.getElementById('sort-pe-btn').innerText = 'PE Eff' + peArrow;

    document.getElementById('sort-hunt-btn').className = `px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${currentSortType === 'hunt' ? 'bg-primary text-black' : 'text-slate-500 hover:text-white'}`;
    document.getElementById('sort-hunt-btn').innerText = 'Hunt Pwr' + huntArrow;

    applyCounterSort();
}

function applyCounterSort() {
    if (!currentCounters || currentCounters.length === 0) return;

    let filtered = [...currentCounters];

    // Apply Star Filter
    if (currentCounterStarFilter !== 'All') {
        const starNum = currentCounterStarFilter.split('-')[0];
        filtered = filtered.filter(c => c.pokemon.star && c.pokemon.star.startsWith(starNum));
    }

    filtered.sort((a, b) => {
        // Always sort by multiplier first, highest multiplier is always best
        if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;

        // Then sort by chosen metric
        if (currentSortType === 'pe') {
            return currentSortDesc ? b.pokemon.pe_efficiency - a.pokemon.pe_efficiency : a.pokemon.pe_efficiency - b.pokemon.pe_efficiency;
        } else {
            return currentSortDesc ? b.pokemon.hunt_power - a.pokemon.hunt_power : a.pokemon.hunt_power - b.pokemon.hunt_power;
        }
    });

    // Only take top 5
    renderCounters(filtered.slice(0, 5));
}

function getGimmickBadge(pokemon) {
    // 1. Check Explicit list for Mega Evolutions first (these often have "nan" for gimmick move)
    const megaList = ['Venusaur', 'Charizard', 'Blastoise', 'Pidgeot', 'Gengar'];
    if (megaList.includes(pokemon.name) || pokemon.name.includes('Mega ') || (pokemon.name === 'Lucario' && pokemon.star === '5-star')) {
        return `<img src="assets/icons/Mega_Evolution.png" class="h-6 w-6 object-contain drop-shadow-md" alt="Mega Evolution" title="Mega Evolution">`;
    }

    // 2. Bail out if no gimmick move exists
    if (!pokemon.moves || !pokemon.moves.gimmick || String(pokemon.moves.gimmick).toLowerCase() === 'nan') return '';

    const gimmick = String(pokemon.moves.gimmick).toLowerCase();

    // 3. Dynamax check
    if (gimmick.includes('max ') || gimmick.includes('g-max')) {
        return `<img src="assets/icons/Dynamax.png" class="h-6 w-6 object-contain drop-shadow-md" alt="Dynamax" title="Dynamax: ${pokemon.moves.gimmick}">`;
    }

    // 4. Z-Move checks
    if (gimmick.includes('z-') || gimmick.includes('downpour') || gimmick.includes('strike') || gimmick.includes('rave') || gimmick.includes('symphony') || gimmick.includes('impact') || pokemon.version.includes('V1')) {
        // Broad catch for Z-moves which have varied names
        return `<img src="assets/icons/Z-Move.png" class="h-6 w-6 object-contain drop-shadow-md" alt="Z-Move" title="Z-Move: ${pokemon.moves.gimmick}">`;
    }

    // Default fallback to Z-Move if it's V1/V2 and has a gimmick we didn't text-match
    return `<img src="assets/icons/Z-Move.png" class="h-6 w-6 object-contain drop-shadow-md" alt="Gimmick" title="${pokemon.moves.gimmick}">`;
}

function renderOpponent(pokemon) {
    const typesHtml = pokemon.types.map(t => `<span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'}">${t}</span>`).join('');
    const gimmickBadge = getGimmickBadge(pokemon);

    const urlName = getPokemonImageUrlName(pokemon.name);
    const imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
    const imgUrlAnimated = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;

    document.getElementById('battle-target-info').innerHTML = `
        <div class="flex w-full flex-col gap-3 bg-surface-dark p-4 rounded-xl border border-white/10 glass-card">
            <div class="flex gap-4 items-center justify-between">
                <div class="flex flex-col flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <p class="text-white text-2xl font-black tracking-tight flex items-center gap-2">
                            ${pokemon.name}
                            <span class="text-primary text-sm font-black bg-primary/10 px-1.5 py-0.5 rounded leading-none shrink-0">${pokemon.star ? pokemon.star.replace(/[- ]star/i, '★') : ''}</span>
                        </p>
                        ${typesHtml}
                        ${gimmickBadge}
                    </div>
                    <p class="text-slate-400 text-xs font-black uppercase tracking-widest">${pokemon.id.split('-').pop()}</p>
                    <p class="text-slate-300 text-xs font-bold mt-1">HP: ${Number(pokemon.stats.hp).toLocaleString()} | PE: ${Number(Math.round(pokemon.pe)).toLocaleString()}</p>
                </div>
                <div class="size-20 flex items-center justify-center shrink-0 overflow-hidden relative">
                    <img class="w-20 h-20 object-contain z-10 pixelated" src="${imgUrlAnimated}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;" alt="${pokemon.name}"/>
                </div>
            </div>

            <!-- Record Battle button -->
            <button id="record-battle-btn"
                onclick="recordBattle()"
                class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white">
                <span class="material-symbols-outlined text-sm">swords</span> Record Battle
            </button>
        </div>
    `;
}

function renderWeaknesses(pokemon) {
    const weaknesses = { 4: [], 2: [], 0: [] };

    // Test all attack types against this defender
    Object.keys(TYPE_MATCHUPS).forEach(atkType => {
        const mult = PokemonData.getEffectiveness(atkType, pokemon.types);
        if (mult === 4) weaknesses[4].push(atkType);
        if (mult === 2) weaknesses[2].push(atkType);
        if (mult === 0) weaknesses[0].push(atkType);
    });

    let html = '';

    if (weaknesses[4].length > 0) {
        html += `
        <div class="flex flex-col gap-2">
            <p class="text-xs font-black text-red-500 uppercase tracking-widest">Ultra Weak (4x)</p>
            <div class="flex flex-wrap gap-2">
                ${weaknesses[4].map(t => `<div class="px-3 py-1 rounded-full ${TYPE_COLORS[t]} text-xs font-bold shadow-sm">${t}</div>`).join('')}
            </div>
        </div>`;
    }

    if (weaknesses[2].length > 0) {
        html += `
        <div class="flex flex-col gap-2 mt-3">
            <p class="text-xs font-black text-orange-400 uppercase tracking-widest">Weak (2x)</p>
            <div class="flex flex-wrap gap-2">
                ${weaknesses[2].map(t => `<div class="px-3 py-1 rounded-full ${TYPE_COLORS[t]} text-xs font-bold shadow-sm">${t}</div>`).join('')}
            </div>
        </div>`;
    }

    if (weaknesses[0].length > 0) {
        html += `
        <div class="flex flex-col gap-2 mt-3">
            <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Immune (0x)</p>
            <div class="flex flex-wrap gap-2">
                ${weaknesses[0].map(t => `<div class="px-3 py-1 rounded-full ${TYPE_COLORS[t]} text-xs font-bold shadow-sm">${t}</div>`).join('')}
            </div>
        </div>`;
    }

    if (html === '') {
        html = '<p class="text-sm text-slate-400 font-bold">No standard weaknesses found.</p>';
    }

    document.getElementById('battle-weaknesses-list').innerHTML = html;
}

function renderCounters(counters) {
    let seen = new Set();
    counters = counters.filter(c => {
        if (seen.has(c.pokemon.name)) return false;
        seen.add(c.pokemon.name);
        return true;
    });

    if (counters.length === 0) {
        document.getElementById('battle-counters-list').innerHTML = '<p class="text-sm text-slate-400">No super effective counters found.</p>';
        return;
    }

    const html = counters.map(c => {
        const urlName = getPokemonImageUrlName(c.pokemon.name);
        const imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
        const imgUrlAnimated = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
        const gimmickBadge = getGimmickBadge(c.pokemon);

        return `
        <div class="flex items-center justify-between p-3 rounded-xl bg-surface-dark border border-white/10 glass-card">
            <div class="flex items-center gap-3">
                <div class="size-12 flex items-center justify-center shrink-0 overflow-hidden relative">
                    <img alt="${c.pokemon.name}" class="w-12 h-12 object-contain z-10 pixelated" src="${imgUrlAnimated}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;"/>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-2 mt-0.5">
                        <p class="font-black text-white text-base leading-none">${c.pokemon.name}</p>
                        <span class="text-primary text-[10px] font-black bg-primary/10 px-1 py-0.5 rounded leading-none shrink-0">${c.pokemon.star ? c.pokemon.star.replace(/[- ]star/i, '★') : ''}</span>
                        ${gimmickBadge}
                    </div>
                    <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">${c.pokemon.moves.normal} / ${c.pokemon.moves.gimmick || 'None'}</p>
                    <p class="text-[10px] font-bold text-primary mt-1 flex gap-2">
                        <span>Pwr: ${Number(Math.round(c.pokemon.hunt_power)).toLocaleString()}</span>
                        <span>|</span>
                        <span>Eff: ${Number(c.pokemon.pe_efficiency.toFixed(1)).toLocaleString()}</span>
                    </p>
                </div>
            </div>
            <div class="text-right shrink-0">
                <p class="text-primary font-black text-xl">x${c.multiplier}</p>
                <p class="text-[8px] uppercase font-black text-slate-500 tracking-widest">Damage</p>
            </div>
        </div>
    `}).join('');

    document.getElementById('battle-counters-list').innerHTML = html;
}

const SUPPORT_POKEMON_LIST = [
    { name: 'Lucario', moveName: 'Aura Sphere', type: 'Special', moveType: 'Fighting', qrImage: 'qr_images/lucario_qr.png' },
    { name: 'Mimikyu', moveName: 'Shadow Claw', type: 'Physical', moveType: 'Ghost', qrImage: 'qr_images/mimikyu_qr.png' },
    { name: 'Lapras', moveName: 'Ice Beam', type: 'Special', moveType: 'Ice', qrImage: 'qr_images/lapras_qr.png' },
    { name: 'Sirfetch\'d', moveName: 'Meteor Assault', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/sirfetchd_qr.png' },
    { name: 'Duraludon', moveName: 'Flash Cannon', type: 'Special', moveType: 'Steel', qrImage: 'qr_images/duraludon_qr.png' },
    { name: 'Mega Charizard X', moveName: 'Flamethrower', type: 'Special', moveType: 'Fire', qrImage: 'qr_images/charizard_qr.png' },
    { name: 'Blastoise', moveName: 'Hydro Pump', type: 'Special', moveType: 'Water', qrImage: 'qr_images/blastoise_qr.png' },
    { name: 'Gengar', moveName: 'Shadow Ball', type: 'Special', moveType: 'Ghost', qrImage: 'qr_images/gengar_qr.png' },
    { name: 'Mega Gardevoir', moveName: 'Psychic', type: 'Special', moveType: 'Psychic', qrImage: 'qr_images/gardevoir_qr.png' },
    { name: 'Keldeo', moveName: 'Sacred Sword', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/keldeo_qr.png' }
];


function hideQRModal() {
    const el = document.getElementById('qr-modal');
    if (el) {
        el.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

function showQRModal(name) {
    const sup = SUPPORT_POKEMON_LIST.find(s => s.name === name);
    if (!sup) return;

    const searchName = sup.name.replace('Mega ', '').replace(' X', '').replace(' Y', '').trim();
    const pData = PokemonData.list.find(p => p.name.toLowerCase() === searchName.toLowerCase());
    const el = document.getElementById('qr-modal');
    if (!el) return;

    let typesHtml = '';
    let urlName = getPokemonImageUrlName(sup.name);
    let imgUrlAni = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
    let imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
    let glowColor = 'bg-white/10';
    let moveTypeColor = 'bg-slate-500';

    if (pData) {
        typesHtml = pData.types.map(t => `<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'} shadow-sm">${t}</span>`).join('');

        const glowColorMap = {
            'Fire': 'bg-orange-600/20', 'Water': 'bg-blue-600/20', 'Grass': 'bg-green-600/20',
            'Electric': 'bg-yellow-400/20', 'Psychic': 'bg-pink-600/20', 'Ghost': 'bg-purple-600/20',
            'Dark': 'bg-slate-700/20', 'Dragon': 'bg-indigo-600/20', 'Fairy': 'bg-pink-400/20',
            'Fighting': 'bg-red-700/20', 'Steel': 'bg-slate-500/20', 'Ice': 'bg-cyan-300/20',
            'Normal': 'bg-slate-400/20', 'Poison': 'bg-purple-600/20', 'Ground': 'bg-amber-700/20',
            'Flying': 'bg-sky-400/20', 'Bug': 'bg-lime-500/20', 'Rock': 'bg-stone-500/20'
        };
        glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
    }

    if (sup.name === 'Lucario' || sup.name === "Sirfetch'd") moveTypeColor = 'bg-red-700 text-white';
    else if (sup.name === 'Mimikyu') moveTypeColor = 'bg-indigo-800 text-white';
    else if (sup.name === 'Lapras') moveTypeColor = 'bg-cyan-300 text-black';
    else if (sup.name === 'Duraludon') moveTypeColor = 'bg-slate-500 text-white';

    let moveIcon = 'star';
    if (moveTypeColor.includes('red-700')) moveIcon = 'sports_martial_arts';
    if (moveTypeColor.includes('indigo-800')) moveIcon = 'visibility_off';
    if (moveTypeColor.includes('cyan-300')) moveIcon = 'ac_unit';
    if (moveTypeColor.includes('slate-500')) moveIcon = 'shield';

    el.innerHTML = `
        <div class="relative w-full h-full min-h-screen pb-20 pt-6 px-4">
            <header class="flex items-center justify-between mb-6">
                <button onclick="hideQRModal()" class="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-white">close</span>
                </button>
                <h1 class="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Scan at Arcade</h1>
                <div class="size-10"></div>
            </header>
            
            <div class="glass-card bg-surface-dark border border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-2xl">
                <div class="absolute -top-10 -right-10 size-40 ${glowColor} rounded-full blur-[40px] pointer-events-none"></div>
                
                <div class="flex items-center gap-4 relative z-10 mb-6">
                    <div class="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img class="w-16 h-16 object-contain pixelated scale-[1.2]" src="${imgUrlAni}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;" alt="${sup.name}"/>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <h3 class="text-3xl font-black text-white uppercase tracking-tight leading-none">${sup.name}</h3>
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${typesHtml}
                        </div>
                    </div>
                </div>

                <div class="flex justify-center bg-white p-4 rounded-3xl shadow-inner relative z-10 mb-6 mx-2 border-4 border-primary/20">
                    <img src="${sup.qrImage}" alt="${sup.name} QR Code" class="w-full mix-blend-multiply max-w-[280px] object-contain" />
                </div>

                <div class="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between relative z-10 flex-col gap-3">
                    <div class="flex items-center justify-between w-full">
                        <div class="flex flex-col gap-1">
                            <span class="text-[9px] font-black tracking-widest uppercase text-slate-500">Support Move</span>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="size-6 rounded-md ${moveTypeColor} shadow flex items-center justify-center"><span class="material-symbols-outlined text-[14px] font-black">${moveIcon}</span></div>
                                <span class="text-sm font-black text-white uppercase tracking-tight">${sup.moveName}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <span class="text-[9px] font-black tracking-widest uppercase text-slate-500">Category</span>
                            <div class="text-[10px] font-black text-white px-2 py-1 mt-1 rounded ${sup.type === 'Special' ? 'bg-purple-600' : 'bg-orange-600'} uppercase shadow">${sup.type}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}


let currentSupportPage = 1;
const SUPPORT_ITEMS_PER_PAGE = 5;

function prevSupportPage() {
    if (currentSupportPage > 1) {
        currentSupportPage--;
        renderSupportQR();
    }
}

function nextSupportPage() {
    const totalPages = Math.ceil(SUPPORT_POKEMON_LIST.length / SUPPORT_ITEMS_PER_PAGE);
    if (currentSupportPage < totalPages) {
        currentSupportPage++;
        renderSupportQR();
    }
}

function renderSupportQR() {
    const list = document.getElementById('qr-support-list');
    if (!list) return;

    let html = '';

    const startIndex = (currentSupportPage - 1) * SUPPORT_ITEMS_PER_PAGE;
    const paginatedList = SUPPORT_POKEMON_LIST.slice(startIndex, startIndex + SUPPORT_ITEMS_PER_PAGE);
    const totalPages = Math.ceil(SUPPORT_POKEMON_LIST.length / SUPPORT_ITEMS_PER_PAGE);

    // Render Pagination Controls First
    html += `
        <div class="flex items-center justify-between mb-2">
            <button onclick="prevSupportPage()" class="px-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold shadow-md cursor-pointer" ${currentSupportPage === 1 ? 'disabled' : ''}>Prev</button>
            <span class="text-xs font-black text-slate-400 tracking-widest uppercase">Page ${currentSupportPage} / ${totalPages}</span>
            <button onclick="nextSupportPage()" class="px-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold shadow-md cursor-pointer" ${currentSupportPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
    `;

    paginatedList.forEach(sup => {
        const searchName = sup.name.replace('Mega ', '').replace(' X', '').replace(' Y', '').trim();
        const pData = PokemonData.list.find(p => p.name.toLowerCase() === searchName.toLowerCase());

        let typesHtml = '';
        let urlName = getPokemonImageUrlName(sup.name);
        let imgUrlAni = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
        let imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
        let glowColor = 'bg-white/10';
        let moveTypeColor = 'bg-slate-500';

        if (pData) {
            typesHtml = pData.types.map(t => `<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'} shadow-sm">${t}</span>`).join('');

            const glowColorMap = {
                'Fire': 'bg-orange-600/20', 'Water': 'bg-blue-600/20', 'Grass': 'bg-green-600/20',
                'Electric': 'bg-yellow-400/20', 'Psychic': 'bg-pink-600/20', 'Ghost': 'bg-purple-600/20',
                'Dark': 'bg-slate-700/20', 'Dragon': 'bg-indigo-600/20', 'Fairy': 'bg-pink-400/20',
                'Fighting': 'bg-red-700/20', 'Steel': 'bg-slate-500/20', 'Ice': 'bg-cyan-300/20',
                'Normal': 'bg-slate-400/20', 'Poison': 'bg-purple-600/20', 'Ground': 'bg-amber-700/20',
                'Flying': 'bg-sky-400/20', 'Bug': 'bg-lime-500/20', 'Rock': 'bg-stone-500/20'
            };
            glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
        }

        if (sup.name === 'Lucario' || sup.name === "Sirfetch'd") moveTypeColor = 'bg-red-700 text-white';
        else if (sup.name === 'Mimikyu') moveTypeColor = 'bg-indigo-800 text-white';
        else if (sup.name === 'Lapras') moveTypeColor = 'bg-cyan-300 text-black';
        else if (sup.name === 'Duraludon') moveTypeColor = 'bg-slate-500 text-white';

        let moveIcon = 'star';
        if (moveTypeColor.includes('red-700')) moveIcon = 'sports_martial_arts';
        if (moveTypeColor.includes('indigo-800')) moveIcon = 'visibility_off';
        if (moveTypeColor.includes('cyan-300')) moveIcon = 'ac_unit';
        if (moveTypeColor.includes('slate-500')) moveIcon = 'shield';

        let topTargetsHtml = '<p class="text-xs text-slate-500 font-bold col-span-5 text-center py-2">No key targets found</p>';
        if (sup.moveType && PokemonData.list.length > 0) {
            let targets = PokemonData.list.map(p => {
                return { pokemon: p, mult: PokemonData.getEffectiveness(sup.moveType, p.types) };
            }).filter(t => t.mult > 1);

            // Deduplicate first — keep the entry with the highest star rating for each name
            const starRank = s => { const n = parseInt(s); return isNaN(n) ? -1 : n; };
            const bestByName = {};
            targets.forEach(t => {
                const name = t.pokemon.name;
                if (!bestByName[name] || starRank(t.pokemon.star) > starRank(bestByName[name].pokemon.star)) {
                    bestByName[name] = t;
                }
            });
            let uniqueTargets = Object.values(bestByName);

            // Now sort unique targets: star desc → PE desc → effectiveness as tiebreaker
            uniqueTargets.sort((a, b) => {
                const starA = starRank(a.pokemon.star);
                const starB = starRank(b.pokemon.star);
                if (starB !== starA) return starB - starA;
                if (b.pokemon.pe_efficiency !== a.pokemon.pe_efficiency) return b.pokemon.pe_efficiency - a.pokemon.pe_efficiency;
                return b.mult - a.mult;
            });

            const top5 = uniqueTargets.slice(0, 5);
            if (top5.length > 0) {
                topTargetsHtml = top5.map(t => {
                    let urlNameTarget = getPokemonImageUrlName(t.pokemon.name);
                    let targetImg = `https://play.pokemonshowdown.com/sprites/gen5/${urlNameTarget}.png`;
                    let multColor = t.mult === 4 ? 'bg-red-600' : 'bg-orange-500';
                    return `
                    <div class="flex flex-col items-center gap-1 w-1/5">
                        <div class="size-10 rounded-full bg-black/40 border border-white/10 p-1 flex items-center justify-center relative shadow-inner">
                            <span class="absolute -top-1 -right-1 text-[7px] font-black text-white ${multColor} px-1 rounded shadow-sm">x${t.mult}</span>
                            <img class="w-full h-full object-contain pixelated relative z-10 scale-125 hover:scale-[1.5] transition-transform" src="${targetImg}" alt="${t.pokemon.name}"/>
                        </div>
                        <span class="text-[6px] font-black text-slate-300 uppercase tracking-tighter truncate w-full text-center mt-0.5">${t.pokemon.name}</span>
                    </div>`;
                }).join('');
            }
        }

        html += `
        <div onclick="showQRModal('${sup.name.replace(/'/g, "\\'")}')" class="glass-card bg-surface-dark border border-white/10 rounded-3xl p-4 flex flex-col relative overflow-hidden group hover:border-primary/40 transition-colors shadow-2xl cursor-pointer">
            <div class="absolute -top-10 -right-10 size-40 ${glowColor} rounded-full blur-[40px] pointer-events-none"></div>
            
            <div class="flex items-center gap-4 relative z-10 mb-4">
                <div class="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <img class="w-16 h-16 object-contain pixelated scale-[1.2]" src="${imgUrlAni}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;" alt="${sup.name}"/>
                </div>
                <div class="flex-1 flex flex-col pt-1">
                    <h3 class="text-2xl font-black text-white uppercase tracking-tight leading-none">${sup.name}</h3>
                    <div class="flex flex-wrap gap-1 mt-1.5">
                        ${typesHtml}
                    </div>
                </div>
            </div>

            <div class="mb-4 relative z-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Counters</span>
                    <div class="h-[1px] bg-white/10 flex-1"></div>
                </div>
                <div class="flex justify-around items-end bg-black/30 rounded-2xl p-3 border border-white/5">
                    ${topTargetsHtml}
                </div>
            </div>

            <div class="mt-auto bg-black/60 border border-white/5 p-3 rounded-xl flex items-center justify-between relative z-10 bg-gradient-to-r from-black/60 to-surface-dark group-hover:from-primary/10 transition-colors">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black tracking-widest uppercase text-slate-500 line-clamp-1">Support Move</span>
                    <div class="flex items-center gap-2">
                        <div class="size-5 rounded-sm ${moveTypeColor} shadow flex items-center justify-center"><span class="material-symbols-outlined text-[12px] font-black">${moveIcon}</span></div>
                        <span class="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">${sup.moveName}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="text-[8px] font-black tracking-widest uppercase text-slate-500 line-clamp-1">Deploy</span>
                    <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-black text-primary uppercase">Scan QR</span>
                        <span class="material-symbols-outlined text-primary text-[14px]">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    list.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', () => {
    PokemonData.load();
    renderSupportQR();
    const searchInput = document.getElementById('battle-search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e.target.value);
            }
        });
        searchInput.addEventListener('blur', (e) => {
            handleSearch(e.target.value);
        });
    }

    const pokedexSearchInput = document.getElementById('pokedex-search-input');
    if (pokedexSearchInput) {
        pokedexSearchInput.addEventListener('keyup', (e) => {
            currentPokedexQuery = e.target.value;
            currentPokedexPage = 1; // reset to 1 on new search
            PokemonData.renderPokedex();
        });
    }
});

function hidePokemonModal() {
    const el = document.getElementById('pokemon-modal');
    if (el) {
        el.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        document.getElementById('app-container').classList.add('overflow-y-auto');
        document.getElementById('app-container').classList.remove('overflow-hidden');
    }
}

function prevPokedexPage() {
    if (currentPokedexPage > 1) {
        currentPokedexPage--;
        PokemonData.renderPokedex();
    }
}

function nextPokedexPage() {
    // We don't check max pages here strictly since renderPokedex caps it,
    // but we can increment safely.
    currentPokedexPage++;
    PokemonData.renderPokedex();
}

function setPokedexVersion(version) {
    currentPokedexVersion = version;
    currentPokedexPage = 1;

    // Update button visual styles
    const buttons = ['All', 'v1', 'v2', 'v3', 'v4'];
    const activeClass = "flex h-9 shrink-0 items-center justify-center rounded-full bg-primary text-background-dark px-6 shadow-[0_0_20px_rgba(249,245,6,0.4)]";
    const inactiveClass = "flex h-9 shrink-0 items-center justify-center rounded-full bg-surface-dark border border-white/10 px-5 text-slate-400 hover:text-white transition-colors";

    // reset all buttons
    buttons.forEach(btn => {
        const el = document.getElementById('btn-version-' + btn);
        if (el) el.className = inactiveClass;
    });

    // set active
    let activeId = 'btn-version-All';
    if (version === 'Stardust v1') activeId = 'btn-version-v1';
    else if (version === 'Stardust v2') activeId = 'btn-version-v2';
    else if (version === 'Stardust v3') activeId = 'btn-version-v3';
    else if (version === 'Stardust v4') activeId = 'btn-version-v4';

    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.className = activeClass;

    PokemonData.renderPokedex();
}

function showPokemonModal(name) {
    const pokemon = PokemonData.list.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!pokemon) return;

    const el = document.getElementById('pokemon-modal');
    if (!el) return;

    const typesHtml = pokemon.types.map(t => `<span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${TYPE_COLORS[t] || 'bg-slate-400'}">${t}</span>`).join('');

    const glowColorMap = {
        'Fire': 'bg-orange-600/20', 'Water': 'bg-blue-600/20', 'Grass': 'bg-green-600/20',
        'Electric': 'bg-yellow-400/20', 'Psychic': 'bg-pink-600/20', 'Ghost': 'bg-purple-600/20',
        'Dark': 'bg-slate-700/20', 'Dragon': 'bg-indigo-600/20', 'Fairy': 'bg-pink-400/20',
    };
    const primaryGlow = glowColorMap[pokemon.types[0]] || 'bg-white/10';

    const urlName = getPokemonImageUrlName(pokemon.name);
    const imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
    const imgUrlAnimated = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;

    // Detect Gimmick Form
    let formBadge = '';
    let gimmickLabel = 'Gimmick Move';
    const megaList = ['Venusaur', 'Charizard', 'Blastoise', 'Pidgeot', 'Gengar'];
    if (megaList.includes(pokemon.name) || pokemon.name.includes('Mega ') || (pokemon.name === 'Lucario' && pokemon.star === '5-star')) {
        formBadge = `<div class="flex items-center gap-1 bg-gradient-to-r from-red-500/20 to-blue-500/20 border border-white/20 px-2 py-0.5 rounded text-[9px] font-black uppercase text-white shadow-sm"><span class="material-symbols-outlined text-[12px]">join_inner</span> Mega Evolution</div>`;
    } else if (pokemon.moves.gimmick && (pokemon.moves.gimmick.startsWith('Max ') || pokemon.moves.gimmick.startsWith('G-Max '))) {
        formBadge = `<div class="flex items-center gap-1 bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase text-red-100 shadow-sm"><span class="material-symbols-outlined text-[12px]">cyclone</span> Dynamax</div>`;
        gimmickLabel = 'Max Move';
    } else if (pokemon.moves.gimmick && pokemon.moves.gimmick.endsWith(' Z')) {
        formBadge = `<div class="flex items-center gap-1 bg-gradient-to-r from-yellow-300/20 to-yellow-600/20 border border-yellow-400/30 px-2 py-0.5 rounded text-[9px] font-black uppercase text-yellow-100 shadow-sm"><span class="material-symbols-outlined text-[12px]">diamond</span> Z-Move</div>`;
        gimmickLabel = 'Z-Move';
    }

    el.innerHTML = `
        <div class="relative w-full h-full min-h-screen pb-20 overflow-y-auto">
            <header class="sticky top-0 flex items-center justify-between px-4 py-3 z-20 backdrop-blur-xl border-b border-white/5 bg-background-dark/80 shrink-0">
                <button onclick="hidePokemonModal()" class="flex size-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-xl text-white">arrow_back</span>
                </button>
                <h1 class="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Detailed Profile</h1>
                <div class="size-9"></div><!-- spacer -->
            </header>
            
            <main class="flex-1 flex flex-col px-4 pt-4 pb-28 gap-4">
                <div class="bg-surface-dark border border-white/10 rounded-3xl p-5 relative overflow-hidden shrink-0 shadow-lg">
                    <div class="absolute inset-0 ${primaryGlow} opacity-30 blur-2xl rounded-full scale-[1.5] -translate-y-10"></div>
                    
                    <div class="relative z-10 flex flex-col items-center">
                        <div class="flex items-start gap-2 mb-2 w-full justify-between">
                            <span class="px-2 py-1 rounded-md bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest border border-white/10">#${pokemon.id.split('-').pop()}</span>
                            <div class="flex flex-col items-end gap-1">
                                <span class="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 uppercase">${pokemon.version ? pokemon.version : (pokemon.star ? pokemon.star.replace(/[- ]star/i, '★') : '')}</span>
                                ${formBadge}
                            </div>
                        </div>
                        
                        <div class="h-32 flex items-center justify-center mt-2 mb-6">
                            <img alt="${pokemon.name}" class="h-32 object-contain drop-shadow-2xl hover:scale-110 transition-transform pixelated" src="${imgUrlAnimated}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;"/>
                        </div>
                        
                        <h2 class="text-3xl font-black tracking-tight text-white uppercase leading-none mt-2 text-center drop-shadow-md pb-2 flex items-center justify-center gap-2">
                            ${pokemon.name}
                            <span class="text-primary text-xl font-black bg-primary/10 px-2 py-1 rounded leading-none shrink-0">${pokemon.star ? pokemon.star.replace(/[- ]star/i, '★') : ''}</span>
                        </h2>
                        <div class="flex flex-wrap gap-2 mt-2 justify-center">
                            ${typesHtml}
                        </div>
                    </div>
                </div>

                <div class="bg-surface-dark border border-white/10 rounded-2xl p-4 shadow-lg shrink-0">
                    <h3 class="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-sm">bar_chart</span> Base Stats</h3>
                    
                    <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>HP</span><span class="text-white">${pokemon.stats.hp}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-red-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.hp / 255) * 100)}%"></div></div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Attack</span><span class="text-white">${pokemon.stats.atk}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-orange-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.atk / 255) * 100)}%"></div></div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Defense</span><span class="text-white">${pokemon.stats.def}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-yellow-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.def / 255) * 100)}%"></div></div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Sp. Atk</span><span class="text-white">${pokemon.stats.spa}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-purple-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.spa / 255) * 100)}%"></div></div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Sp. Def</span><span class="text-white">${pokemon.stats.spd}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-blue-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.spd / 255) * 100)}%"></div></div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <div class="flex justify-between text-[8px] font-black uppercase text-slate-400"><span>Speed</span><span class="text-white">${pokemon.stats.spe}</span></div>
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-green-500 rounded-full" style="width: ${Math.min(100, (pokemon.stats.spe / 255) * 100)}%"></div></div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <div class="flex flex-col items-center flex-1 border-r border-white/5">
                            <span class="text-primary font-black text-xs">PE ${Math.round(pokemon.pe)}</span>
                            <span class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Power Eq</span>
                        </div>
                        <div class="flex flex-col items-center flex-1 border-r border-white/5">
                            <span class="text-primary font-black text-xs">${Math.round(pokemon.hunt_power)}</span>
                            <span class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Hunt Pwr</span>
                        </div>
                        <div class="flex flex-col items-center flex-1">
                            <span class="text-primary font-black text-xs">${pokemon.pe_efficiency.toFixed(1)}</span>
                            <span class="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Efficiency</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-3 shrink-0">
                    <div class="bg-surface-dark border border-white/10 rounded-2xl p-4 shadow-lg">
                        <h3 class="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-sm">swords</span> Primary Moveset</h3>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                                <div class="flex items-center gap-3 w-1/2">
                                    <div class="flex flex-col items-start truncate w-full">
                                        <span class="text-[8px] font-bold uppercase tracking-widest text-slate-500">Normal Move</span>
                                        <span class="text-[11px] font-black text-white truncate w-full">${pokemon.moves.normal || 'Tackle'}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end w-1/4">
                                    <span class="text-[8px] font-bold uppercase tracking-widest text-slate-500">Power</span>
                                    <span class="text-[11px] font-bold text-white">${pokemon.moves.normal_damage || 0}</span>
                                </div>
                                <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase ${TYPE_COLORS[pokemon.moves.normal_type] || 'bg-slate-400'} w-[50px] text-center">${pokemon.moves.normal_type || 'Normal'}</span>
                            </div>
                            ${pokemon.moves.gimmick && pokemon.moves.gimmick !== 'None' && String(pokemon.moves.gimmick).toLowerCase() !== 'nan' ? `
                            <div class="flex items-center justify-between p-2 bg-primary/10 rounded-xl border border-primary/20">
                                <div class="flex items-center gap-3 w-1/2">
                                    <div class="flex flex-col items-start truncate w-full">
                                        <span class="text-[8px] font-bold uppercase tracking-widest text-primary">${gimmickLabel}</span>
                                        <span class="text-[11px] font-black text-white truncate w-full">${pokemon.moves.gimmick}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end w-1/4">
                                    <span class="text-[8px] font-bold uppercase tracking-widest text-primary/70">Power</span>
                                    <span class="text-[11px] font-bold text-white">${pokemon.moves.gimmick_damage || 0}</span>
                                </div>
                                <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase ${TYPE_COLORS[pokemon.moves.gimmick_type] || 'bg-slate-400'} w-[50px] text-center">${pokemon.moves.gimmick_type || 'None'}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                
                <button onclick="navigate('battle'); document.getElementById('battle-search-input').value = '${pokemon.name.replace(/'/g, "\\'")}'; handleSearch('${pokemon.name.replace(/'/g, "\\'")}'); hidePokemonModal();" class="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-background-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                    <span class="material-symbols-outlined text-sm">target</span> Find Counters
                </button>
            </main>
        </div>
    `;

    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    document.getElementById('app-container').classList.remove('overflow-y-auto');
    document.getElementById('app-container').classList.add('overflow-hidden');
}

// ==========================================
// TRAINER AVATAR PICKER
// ==========================================

const TRAINER_AVATAR_KEY = 'mezahub_trainer_avatar_v1';

const TRAINERS = [
    { name: 'Red', img: 'https://play.pokemonshowdown.com/sprites/trainers/red.png' },
    { name: 'Ash', img: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png' },
    { name: 'Blue', img: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png' },
    { name: 'Giovanni', img: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png' },
    { name: 'Misty', img: 'https://play.pokemonshowdown.com/sprites/trainers/misty.png' },
    { name: 'Brock', img: 'https://play.pokemonshowdown.com/sprites/trainers/brock.png' },
    { name: 'Lance', img: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png' },
    { name: 'Silver', img: 'https://play.pokemonshowdown.com/sprites/trainers/silver.png' },
    { name: 'Ethan', img: 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png' },
    { name: 'May', img: 'https://play.pokemonshowdown.com/sprites/trainers/may.png' },
    { name: 'Steven', img: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png' },
    { name: 'Dawn', img: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png' },
    { name: 'Cynthia', img: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png' },
    { name: 'N', img: 'https://play.pokemonshowdown.com/sprites/trainers/n.png' },
    { name: 'Serena', img: 'https://play.pokemonshowdown.com/sprites/trainers/serena.png' },
    { name: 'Lillie', img: 'https://play.pokemonshowdown.com/sprites/trainers/lillie.png' },
    { name: 'Gladion', img: 'https://play.pokemonshowdown.com/sprites/trainers/gladion.png' },
    { name: 'Guzma', img: 'https://play.pokemonshowdown.com/sprites/trainers/guzma.png' },
    { name: 'Leon', img: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png' },
    { name: 'Marnie', img: 'https://play.pokemonshowdown.com/sprites/trainers/marnie.png' }
];

function openAvatarPicker() {
    const modal = document.getElementById('avatar-picker-modal');
    const grid = document.getElementById('avatar-trainer-grid');
    const savedImg = localStorage.getItem(TRAINER_AVATAR_KEY) || TRAINERS[0].img;

    grid.innerHTML = TRAINERS.map(t => `
        <button onclick="selectTrainerAvatar('${t.img}', '${t.name}')"
            class="flex flex-col items-center gap-1.5 group"
            title="${t.name}">
            <div class="w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${t.img === savedImg ? 'border-primary shadow-[0_0_12px_rgba(249,245,6,0.5)]' : 'border-white/10 hover:border-primary/50'} bg-background-dark flex items-center justify-center">
                <img src="${t.img}" alt="${t.name}"
                    class="w-full h-full object-contain pixelated"
                    style="transform: scale(2.2); transform-origin: center 15%;"
                    onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-slate-600 text-2xl\\'>person</span>'">
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">${t.name}</span>
        </button>
    `).join('');

    modal.classList.remove('hidden');
}

function selectTrainerAvatar(imgUrl, name) {
    // Save
    localStorage.setItem(TRAINER_AVATAR_KEY, imgUrl);
    // Update avatar circle
    const avatarImg = document.getElementById('profile-trainer-avatar-img');
    if (avatarImg) { avatarImg.src = imgUrl; avatarImg.style.display = 'block'; }
    // Close picker
    document.getElementById('avatar-picker-modal').classList.add('hidden');
    showToast(`Trainer set to ${name}!`, 'success');
}


const QR_IMAGE_KEY = 'mezahub_qr_image_v1';
const TRAINER_NAME_KEY = 'mezahub_trainer_name_v1';

window.editTrainerName = function () {
    const nameEl = document.getElementById('profile-trainer-name');
    const currentName = localStorage.getItem(TRAINER_NAME_KEY) || (nameEl ? nameEl.innerText : 'Vincent');
    const newName = prompt("Enter your new Trainer Name:", currentName);
    if (newName && newName.trim() !== "") {
        localStorage.setItem(TRAINER_NAME_KEY, newName.trim());
        if (nameEl) nameEl.innerText = newName.trim();
        showToast("Trainer Name Updated!", "success");
    }
}

window.updateTrainerNameUI = function () {
    const nameEl = document.getElementById('profile-trainer-name');
    if (nameEl) {
        const localName = localStorage.getItem(TRAINER_NAME_KEY);
        if (localName) {
            nameEl.innerText = localName;
        } else if (typeof currentUser !== 'undefined' && currentUser && currentUser.displayName) {
            nameEl.innerText = currentUser.displayName;
        } else {
            nameEl.innerText = "Vincent"; // Default Fallback
        }
    }
}

// Ensure the name is loaded when App initializes
document.addEventListener('DOMContentLoaded', () => {
    updateTrainerNameUI();
});

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        if (typeof showToast === 'function') showToast('Image too large. Max 2MB.', 'error');
        else alert('Image too large. Max 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (type === 'qr') {
            try {
                localStorage.setItem(QR_IMAGE_KEY, dataUrl);
                const img = document.getElementById('profile-trainer-qr-img');
                const icon = document.getElementById('profile-trainer-qr-icon');
                const text = document.getElementById('profile-trainer-qr-text');
                if (img) {
                    img.src = dataUrl;
                    img.classList.remove('hidden');
                    if (icon) icon.classList.add('hidden');
                    if (text) text.classList.add('hidden');
                }
                if (typeof showToast === 'function') showToast('QR Code updated!', 'success');
            } catch (err) {
                if (typeof showToast === 'function') showToast('Failed to save image. Try a smaller file.', 'error');
                else alert('Failed to save image. File may be too large for storage.');
            }
        }
    };
    reader.readAsDataURL(file);
}

function loadProfileImages() {
    // Load QR Code
    const savedQr = localStorage.getItem(QR_IMAGE_KEY);
    if (savedQr) {
        const img = document.getElementById('profile-trainer-qr-img');
        const icon = document.getElementById('profile-trainer-qr-icon');
        const text = document.getElementById('profile-trainer-qr-text');
        if (img) {
            img.src = savedQr;
            img.classList.remove('hidden');
            if (icon) icon.classList.add('hidden');
            if (text) text.classList.add('hidden');
        }
    }
    // Load Avatar/Cover
    const savedAvatar = localStorage.getItem(TRAINER_AVATAR_KEY);
    if (savedAvatar) {
        const avatarImg = document.getElementById('profile-trainer-avatar-img');
        if (avatarImg) { avatarImg.src = savedAvatar; avatarImg.style.display = 'block'; }
        const coverArt = document.getElementById('profile-cover-art');
        if (coverArt) { coverArt.src = savedAvatar; coverArt.style.opacity = '0.35'; }
    }
}
document.addEventListener('DOMContentLoaded', loadProfileImages);
// If app is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(loadProfileImages, 100);
}

// ==========================================
// COMPANION POKEMON FEATURES
// ==========================================

function applyCompanionScale(name, imgElement) {
    if (!imgElement) return;
    const n = name.toLowerCase();

    // Charizard has a massive transparent bounding box because of its wide wing-span.
    // It requires a huge scale-up. Rayquaza, Ho-Oh, Lugia, and Venusaur also suffer from this.
    // Everyone else looks perfect at the baseline 1.3 scale.
    const massive = ['charizard', 'venusaur', 'rayquaza', 'ho-oh', 'lugia'];

    if (massive.includes(n)) {
        imgElement.style.transform = 'scale(2.2)';
    } else {
        // Revert all other Pokemon back to the original layout's perfect 1.3 scale
        imgElement.style.transform = 'scale(1.3)';
    }
}

function openCompanionPicker() {
    const modal = document.getElementById('companion-picker-modal');
    const grid = document.getElementById('companion-pokemon-grid');
    if (!modal || !grid) return;

    // Iconic companions from anime, lore, and core games (Starters, Rivals, Anime main cast)
    const iconicCompanions = [
        { name: 'Pikachu' }, { name: 'Eevee' }, { name: 'Bulbasaur' },
        { name: 'Charmander' }, { name: 'Squirtle' }, { name: 'Togepi' },
        { name: 'Psyduck' }, { name: 'Meowth' }, { name: 'Jigglypuff' },
        { name: 'Snorlax' }, { name: 'Lapras' }, { name: 'Gengar' },
        { name: 'Wobbuffet' }, { name: 'Marill' }, { name: 'Turtwig' },
        { name: 'Chimchar' }, { name: 'Piplup' }, { name: 'Riolu' },
        { name: 'Lucario' }, { name: 'Croagunk' }, { name: 'Axew' },
        { name: 'Dedenne' }, { name: 'Rowlet' }, { name: 'Litten' },
        { name: 'Popplio' }, { name: 'Sprigatito' }, { name: 'Fuecoco' },
        { name: 'Quaxly' }, { name: 'Charizard' }, { name: 'Greninja' }
    ];

    // Get collected Pokemon
    const collectedIds = Array.from(getCollection());
    let collectedRoster = PokemonData.list.filter(p => collectedIds.includes(p.id));

    // Merge iconic companions with the user's collection
    let roster = [...iconicCompanions, ...collectedRoster];

    // Dedup names
    const uniqueNames = new Set();
    roster = roster.filter(p => {
        if (!uniqueNames.has(p.name)) {
            uniqueNames.add(p.name);
            return true;
        }
        return false;
    });

    grid.innerHTML = roster.map(p => {
        const urlName = getPokemonImageUrlName(p.name);
        const imgUrl = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;
        return `
        <div class="glass-card bg-surface border border-white/5 rounded-2xl p-2 flex flex-col items-center gap-1 cursor-pointer hover:border-primary/40 transition-all hover:bg-white/5"
             onclick="selectCompanion('${p.name.replace(/'/g, "\\'")}')">
            <img src="${imgUrl}" class="w-12 h-12 object-contain pixelated" alt="${p.name}"/>
            <p class="text-[8px] text-white font-black truncate w-full text-center uppercase">${p.name}</p>
        </div>`;
    }).join('');

    modal.classList.remove('hidden');
}

function selectCompanion(name) {
    localStorage.setItem('stardust_companion_pokemon', name);
    document.getElementById('companion-picker-modal').classList.add('hidden');
    if (typeof showToast === 'function') showToast(`Companion set to ${name}!`, 'success');

    // Update live profile
    const compImg = document.getElementById('profile-companion-img');
    if (compImg) {
        const urlName = getPokemonImageUrlName(name);
        compImg.src = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
        applyCompanionScale(name, compImg);
    }
}

// ==========================================
// SETTINGS PANEL FEATURES
// ==========================================

const SUGGESTIONS_KEY = 'mezahub_suggestions_v1';

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    initSettingsPanel();
}

function initSettingsPanel() {
    // Show live Pokémon entry count
    const dexCountEl = document.getElementById('settings-dex-count');
    if (dexCountEl && typeof DB_POKEMON_LIST !== 'undefined') {
        dexCountEl.textContent = DB_POKEMON_LIST.length.toLocaleString();
    }

    // Show collected count
    const collectedCountEl = document.getElementById('settings-collected-count');
    if (collectedCountEl) {
        const count = getCollection().size;
        collectedCountEl.textContent = count === 0
            ? 'No Pokémon collected yet'
            : `${count} Pokémon in your collection`;
    }

    // Render saved suggestions
    renderSavedSuggestions();
}

function saveSuggestion() {
    const input = document.getElementById('suggestions-input');
    const text = (input?.value || '').trim();
    if (!text) {
        input.classList.add('border-red-500/50');
        setTimeout(() => input.classList.remove('border-red-500/50'), 1500);
        return;
    }

    const suggestions = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    suggestions.unshift({
        id: Date.now(),
        text,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    // Keep max 10 saved suggestions
    if (suggestions.length > 10) suggestions.pop();
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));

    input.value = '';
    renderSavedSuggestions();

    // Show toast
    showToast('✓ Feedback saved! Thank you.', 'success');
}

function renderSavedSuggestions() {
    const container = document.getElementById('suggestions-saved-list');
    if (!container) return;

    const suggestions = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    if (suggestions.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="border-t border-white/5 pt-3">
            <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Your Saved Feedback (${suggestions.length})</p>
            <div class="flex flex-col gap-2">
                ${suggestions.map(s => `
                    <div class="bg-black/20 border border-white/5 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <p class="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-2">${s.text}</p>
                            <p class="text-[9px] text-slate-600 font-bold mt-1">${s.date}</p>
                        </div>
                        <button onclick="deleteSuggestion(${s.id})" class="shrink-0 text-slate-600 hover:text-red-400 transition-colors mt-0.5">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function deleteSuggestion(id) {
    let suggestions = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    suggestions = suggestions.filter(s => s.id !== id);
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
    renderSavedSuggestions();
}

function clearAllCollection() {
    localStorage.removeItem(COLLECTION_KEY);
    document.getElementById('clear-confirm-panel').classList.add('hidden');

    // Refresh the count display
    const collectedCountEl = document.getElementById('settings-collected-count');
    if (collectedCountEl) collectedCountEl.textContent = 'No Pokémon collected yet';

    // Refresh visible screens
    if (typeof renderProfile === 'function') renderProfile();

    showToast('Collection cleared.', 'warning');
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const colors = {
        success: 'bg-green-500/90 text-white',
        warning: 'bg-red-500/90 text-white',
        info: 'bg-blue-500/90 text-white'
    };

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-sm transition-all ${colors[type] || colors.success} max-w-[320px] text-center`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

// ==========================================
// REGION THEME PICKER
// ==========================================

const REGION_THEME_KEY = 'mezahub_region_theme_v1';

const REGION_THEMES = [
    {
        name: 'Kanto',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accent: '#e63946',
        coverImg: 'assets/regions/kanto.png',
        emoji: '🔴'
    },
    {
        name: 'Johto',
        gradient: 'linear-gradient(135deg, #1b4332 0%, #245238 50%, #1b4332 100%)',
        accent: '#52b788',
        coverImg: 'assets/regions/johto.png',
        emoji: '🌿'
    },
    {
        name: 'Hoenn',
        gradient: 'linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #00b4d8 100%)',
        accent: '#00b4d8',
        coverImg: 'assets/regions/hoenn.png',
        emoji: '🌊'
    },
    {
        name: 'Sinnoh',
        gradient: 'linear-gradient(135deg, #2d3561 0%, #c05c7e 50%, #f3826f 100%)',
        accent: '#c05c7e',
        coverImg: 'assets/regions/sinnoh.png',
        emoji: '❄️'
    },
    {
        name: 'Unova',
        gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #2a2a2a 100%)',
        accent: '#adb5bd',
        coverImg: 'assets/regions/unova.png',
        emoji: '🌆'
    },
    {
        name: 'Kalos',
        gradient: 'linear-gradient(135deg, #e63946 0%, #457b9d 50%, #1d3557 100%)',
        accent: '#e63946',
        coverImg: 'assets/regions/kalos.png',
        emoji: '🗼'
    },
    {
        name: 'Alola',
        gradient: 'linear-gradient(135deg, #f77f00 0%, #fcbf49 50%, #eae2b7 100%)',
        accent: '#f77f00',
        coverImg: 'assets/regions/alola.png',
        emoji: '🌺'
    },
    {
        name: 'Galar',
        gradient: 'linear-gradient(135deg, #240046 0%, #5a189a 50%, #9d4edd 100%)',
        accent: '#9d4edd',
        coverImg: 'assets/regions/galar.png',
        emoji: '⚔️'
    },
    {
        name: 'Paldea',
        gradient: 'linear-gradient(135deg, #7b2d8b 0%, #c0392b 50%, #e67e22 100%)',
        accent: '#e67e22',
        coverImg: 'assets/regions/paldea.png',
        emoji: '🏟️'
    },
    {
        name: 'Mezastar',
        gradient: 'linear-gradient(135deg, #0d0d0f 0%, #1a1a1f 50%, #0d0d16 100%)',
        accent: '#f9f506',
        coverImg: 'assets/kanto.png',
        emoji: '⭐'
    },
];

function openRegionPicker() {
    const modal = document.getElementById('region-picker-modal');
    const grid = document.getElementById('region-theme-grid');
    if (!modal || !grid) return;

    const savedName = localStorage.getItem(REGION_THEME_KEY) || 'Mezastar';

    grid.innerHTML = REGION_THEMES.map(region => {
        const isActive = region.name === savedName;
        return `
        <div onclick="selectRegionTheme('${region.name}')"
             class="relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${isActive ? 'border-primary shadow-[0_0_15px_rgba(249,245,6,0.4)]' : 'border-white/10 hover:border-white/30'}"
             style="background: ${region.gradient}; min-height: 80px;">
            <div class="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <span class="text-2xl mb-1">${region.emoji}</span>
                <span class="text-white font-black text-xs uppercase tracking-widest leading-tight">${region.name}</span>
                ${isActive ? '<span class="text-primary text-[8px] font-black uppercase tracking-widest mt-1">ACTIVE</span>' : ''}
            </div>
        </div>`;
    }).join('');

    modal.classList.remove('hidden');
}

function selectRegionTheme(regionName) {
    const region = REGION_THEMES.find(r => r.name === regionName);
    if (!region) return;

    localStorage.setItem(REGION_THEME_KEY, regionName);

    // Apply gradient to cover
    const cover = document.getElementById('profile-cover');
    if (cover) cover.style.background = region.gradient;

    // Apply cover art image
    const coverArt = document.getElementById('profile-cover-art');
    if (coverArt) {
        if (region.coverImg) {
            coverArt.src = region.coverImg;
            coverArt.style.opacity = '0.6';
            coverArt.onerror = () => { coverArt.style.opacity = '0'; };
        } else {
            coverArt.src = '';
            coverArt.style.opacity = '0';
        }
    }

    // Close modal
    document.getElementById('region-picker-modal').classList.add('hidden');
}

function loadRegionTheme() {
    const savedName = localStorage.getItem(REGION_THEME_KEY);
    if (savedName) selectRegionTheme(savedName);
}

document.addEventListener('DOMContentLoaded', loadRegionTheme);

// ─── MARKETPLACE ───────────────────────────────────────────────────────────────
let currentMarketPage = 1;
const MARKET_PER_PAGE = 5;

let currentMerchPage = 1;
const MERCH_PER_PAGE = 6;

const MERCH_DATA = [
    { name: 'Pro Acrylic Slab', price: '₱750.00', img: 'assets/marketplace/slab.png', badge: 'BEST SELLER' },
    { name: 'Battle Carry Case', price: '₱1,450.00', img: 'assets/marketplace/case.png' },
    { name: 'Custom QR Tags', price: '₱300.00', img: 'assets/marketplace/custom_tags.jpg' },
    { name: 'Pikachu Plushie', price: '₱1,200.00', img: 'assets/marketplace/pikachu_plushie.jpg' },
    { name: 'Mezastar Small Case', price: '₱350.00', img: 'assets/marketplace/small_case.jpg' },
    { name: 'Large Storage Box', price: '₱850.00', img: 'assets/marketplace/storage_box.jpg' },
    { name: 'Pokéball Keychain', price: '₱200.00', img: 'assets/marketplace/keychains.jpg' },
    { name: 'Tag Sleeves (Clear)', price: '₱150.00', img: 'assets/marketplace/protectors.jpg' }
];

function renderMarketplace() {
    const grid = document.getElementById('marketplace-6star-grid');
    if (!grid) return;

    let sixStarTags = PokemonData.list.filter(p => p.star && String(p.star).toLowerCase().includes('6'));

    if (sixStarTags.length === 0) {
        grid.innerHTML = '<p class="text-slate-500 text-[10px] font-bold py-4 text-center">No 6★ tags available.</p>';
        return;
    }

    const totalPages = Math.ceil(sixStarTags.length / MARKET_PER_PAGE) || 1;
    if (currentMarketPage > totalPages) currentMarketPage = totalPages;
    if (currentMarketPage < 1) currentMarketPage = 1;

    const startIndex = (currentMarketPage - 1) * MARKET_PER_PAGE;
    const displayList = sixStarTags.slice(startIndex, startIndex + MARKET_PER_PAGE);

    const paginationContainer = document.getElementById('marketplace-pagination');
    if (paginationContainer) {
        if (sixStarTags.length > MARKET_PER_PAGE) {
            paginationContainer.classList.remove('hidden');
            document.getElementById('marketplace-page-indicator').innerText = `PAGE ${currentMarketPage} / ${totalPages}`;
        } else {
            paginationContainer.classList.add('hidden');
        }
    }

    // Simple deterministic price generator per pokemon
    const basePrice = 1500;
    const badges = ['RARE', 'LEGEND', 'MINT', 'PREMIUM', 'HOT', 'EXCLUSIVE'];
    const badgeColors = [
        'bg-yellow-500/90',
        'bg-red-500/90',
        'bg-blue-500/90',
        'bg-purple-500/90',
        'bg-primary/90',
        'bg-orange-500/90'
    ];

    let html = '';
    displayList.forEach((pokemon, i) => {
        const urlName = getPokemonImageUrlName(pokemon.name);
        const imgUrlAni = `https://play.pokemonshowdown.com/sprites/ani/${urlName}.gif`;
        const imgUrlStatic = `https://play.pokemonshowdown.com/sprites/gen5/${urlName}.png`;

        // Pseudo-random but stable price
        const charSum = pokemon.name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
        const price = basePrice + (charSum % 3000) + Math.round((pokemon.stats.atk || 100) * 8);
        const formattedPrice = '₱' + price.toLocaleString('en-PH');

        const badge = badges[charSum % badges.length];
        const badgeColor = badgeColors[charSum % badgeColors.length];

        const typesHtml = (pokemon.types || []).map(t => {
            const c = TYPE_COLORS[t] || 'bg-slate-400 text-white';
            return `<span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${c}">${t}</span>`;
        }).join('');

        html += `
        <div class="glass-card bg-surface-dark border border-white/10 rounded-2xl p-3 flex gap-4 items-center group hover:border-primary/30 transition-all">
            <div class="w-20 h-20 bg-black/40 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center">
                <img src="${imgUrlAni}" onerror="this.src='${imgUrlStatic}'; this.onerror=null;"
                    class="w-full h-full object-contain p-2 pixelated" alt="${pokemon.name}">
                <div class="absolute bottom-0 inset-x-0 ${badgeColor} text-[7px] font-black text-black text-center py-0.5 uppercase tracking-widest">
                    ${badge}
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="text-white text-sm font-black uppercase truncate">${pokemon.name}</h4>
                    <span class="text-primary font-black text-sm shrink-0 ml-1">${formattedPrice}</span>
                </div>
                <div class="flex items-center gap-1 flex-wrap mb-2">
                    ${typesHtml}
                    <span class="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">6★</span>
                </div>
                <div class="flex gap-2">
                    <button class="flex-1 bg-white/5 border border-white/10 py-1.5 rounded-lg text-[9px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                        Details
                    </button>
                    <button class="flex-1 bg-primary py-1.5 rounded-lg text-[9px] font-black text-black hover:bg-primary/80 transition-all uppercase tracking-widest shadow-lg shadow-primary/10">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>`;
    });

    grid.innerHTML = html;

    // --- Merch Rendering ---
    const merchGrid = document.getElementById('marketplace-merch-grid');
    if (merchGrid) {
        const totalMPages = Math.ceil(MERCH_DATA.length / MERCH_PER_PAGE) || 1;
        if (currentMerchPage > totalMPages) currentMerchPage = totalMPages;
        if (currentMerchPage < 1) currentMerchPage = 1;

        const mStart = (currentMerchPage - 1) * MERCH_PER_PAGE;
        const mDisplay = MERCH_DATA.slice(mStart, mStart + MERCH_PER_PAGE);

        const mPagination = document.getElementById('merch-pagination');
        if (mPagination) {
            if (MERCH_DATA.length > MERCH_PER_PAGE) {
                mPagination.classList.remove('hidden');
                document.getElementById('merch-page-indicator').innerText = `PAGE ${currentMerchPage} / ${totalMPages}`;
            } else {
                mPagination.classList.add('hidden');
            }
        }

        let mHtml = '';
        mDisplay.forEach(item => {
            const badgeHtml = item.badge ? `<span class="absolute top-2 right-2 bg-primary px-1.5 py-0.5 rounded text-[8px] font-black text-black z-10">${item.badge}</span>` : '';
            mHtml += `
            <div class="glass-card bg-surface-dark border border-white/10 rounded-2xl overflow-hidden group">
                <div class="aspect-square relative overflow-hidden bg-black/40">
                    ${badgeHtml}
                    <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="${item.name}" onerror="this.style.display='none'">
                </div>
                <div class="p-3">
                    <h4 class="text-white text-[11px] font-black uppercase truncate">${item.name}</h4>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-primary font-black text-xs">${item.price}</span>
                        <button class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                            <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                        </button>
                    </div>
                </div>
            </div>`;
        });
        merchGrid.innerHTML = mHtml;
    }
}

function changeMerchPage(diff) {
    currentMerchPage += diff;
    renderMarketplace();
    const merchSection = document.getElementById('market-section-merch');
    if (merchSection) {
        merchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function changeMarketPage(diff) {
    currentMarketPage += diff;
    renderMarketplace();
    // Scroll back to the top of the tags section smoothly
    const tagsSection = document.getElementById('market-section-tags');
    if (tagsSection) {
        tagsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function switchMarketTab(tabName) {
    // Buttons
    const btnAll = document.getElementById('market-btn-all');
    const btnMerch = document.getElementById('market-btn-merch');
    const btnTags = document.getElementById('market-btn-tags');

    // Sections
    const secMerch = document.getElementById('market-section-merch');
    const secTags = document.getElementById('market-section-tags');

    // Reset buttons
    [btnAll, btnMerch, btnTags].forEach(btn => {
        if (!btn) return;
        btn.className = 'market-filter-btn px-5 py-2 rounded-full bg-surface-dark border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all';
    });

    // Reset sections
    if (secMerch) secMerch.classList.add('hidden');
    if (secTags) secTags.classList.add('hidden');

    if (tabName === 'all') {
        if (btnAll) btnAll.className = 'market-filter-btn px-5 py-2 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(249,245,6,0.3)] transition-all';
        if (secMerch) secMerch.classList.remove('hidden');
        if (secTags) secTags.classList.remove('hidden');
    } else if (tabName === 'merch') {
        if (btnMerch) btnMerch.className = 'market-filter-btn px-5 py-2 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(249,245,6,0.3)] transition-all';
        if (secMerch) secMerch.classList.remove('hidden');
    } else if (tabName === 'tags') {
        if (btnTags) btnTags.className = 'market-filter-btn px-5 py-2 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(249,245,6,0.3)] transition-all';
        if (secTags) secTags.classList.remove('hidden');
    }
}
