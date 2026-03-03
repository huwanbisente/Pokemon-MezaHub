const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const oldList = `const SUPPORT_POKEMON_LIST = [
    { name: 'Lucario', moveName: 'Aura Sphere', type: 'Special', qrImage: 'qr_images/lucario_qr.png' },
    { name: 'Mimikyu', moveName: 'Shadow Claw', type: 'Physical', qrImage: 'qr_images/mimikyu_qr.png' },
    { name: 'Lapras', moveName: 'Ice Beam', type: 'Special', qrImage: 'qr_images/lapras_qr.png' },
    { name: 'Sirfetch\\'d', moveName: 'Meteor Assault', type: 'Physical', qrImage: 'qr_images/sirfetchd_qr.png' },
    { name: 'Duraludon', moveName: 'Flash Cannon', type: 'Special', qrImage: 'qr_images/duraludon_qr.png' }
];`;

const newList = `const SUPPORT_POKEMON_LIST = [
    { name: 'Lucario', moveName: 'Aura Sphere', type: 'Special', moveType: 'Fighting', qrImage: 'qr_images/lucario_qr.png' },
    { name: 'Mimikyu', moveName: 'Shadow Claw', type: 'Physical', moveType: 'Ghost', qrImage: 'qr_images/mimikyu_qr.png' },
    { name: 'Lapras', moveName: 'Ice Beam', type: 'Special', moveType: 'Ice', qrImage: 'qr_images/lapras_qr.png' },
    { name: 'Sirfetch\\'d', moveName: 'Meteor Assault', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/sirfetchd_qr.png' },
    { name: 'Duraludon', moveName: 'Flash Cannon', type: 'Special', moveType: 'Steel', qrImage: 'qr_images/duraludon_qr.png' }
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
    
    const pData = PokemonData.list.find(p => p.name.toLowerCase() === sup.name.toLowerCase());
    const el = document.getElementById('qr-modal');
    if (!el) return;
    
    let typesHtml = '';
    let urlName = sup.name.toLowerCase().replace(/['.]/g, '').replace(/\\s+/g, '-');
    let imgUrlAni = \`https://play.pokemonshowdown.com/sprites/ani/\${urlName}.gif\`;
    let imgUrlStatic = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlName}.png\`;
    let glowColor = 'bg-white/10';
    let moveTypeColor = 'bg-slate-500';

    if (pData) {
        typesHtml = pData.types.map(t => \`<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase \${TYPE_COLORS[t] || 'bg-slate-400'} shadow-sm">\${t}</span>\`).join('');
        
        const glowColorMap = {
            'Fire': 'bg-orange-600/20', 'Water': 'bg-blue-600/20', 'Grass': 'bg-green-600/20',
            'Electric': 'bg-yellow-400/20', 'Psychic': 'bg-pink-600/20', 'Ghost': 'bg-purple-600/20',
            'Dark': 'bg-slate-700/20', 'Dragon': 'bg-indigo-600/20', 'Fairy': 'bg-pink-400/20',
            'Fighting': 'bg-red-700/20', 'Steel': 'bg-slate-500/20', 'Ice':'bg-cyan-300/20',
            'Normal': 'bg-slate-400/20', 'Poison': 'bg-purple-600/20', 'Ground':'bg-amber-700/20',
            'Flying':'bg-sky-400/20', 'Bug':'bg-lime-500/20', 'Rock':'bg-stone-500/20'
        };
        glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
        urlName = getPokemonImageUrlName(pData.name);
        imgUrlStatic = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlName}.png\`;
        imgUrlAni = \`https://play.pokemonshowdown.com/sprites/ani/\${urlName}.gif\`;
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

    el.innerHTML = \`
        <div class="relative w-full h-full min-h-screen pb-20 overflow-y-auto pt-6 px-4">
            <header class="flex items-center justify-between mb-6">
                <button onclick="hideQRModal()" class="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <span class="material-symbols-outlined text-white">close</span>
                </button>
                <h1 class="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Scan at Arcade</h1>
                <div class="size-10"></div>
            </header>
            
            <div class="glass-card bg-surface-dark border border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden shadow-2xl">
                <div class="absolute -top-10 -right-10 size-40 \${glowColor} rounded-full blur-[40px] pointer-events-none"></div>
                
                <div class="flex items-center gap-4 relative z-10 mb-6">
                    <div class="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <img class="w-16 h-16 object-contain pixelated scale-[1.2]" src="\${imgUrlAni}" onerror="this.src='\${imgUrlStatic}'; this.onerror=null;" alt="\${sup.name}"/>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <h3 class="text-3xl font-black text-white uppercase tracking-tight leading-none">\${sup.name}</h3>
                        <div class="flex flex-wrap gap-1 mt-2">
                            \${typesHtml}
                        </div>
                    </div>
                </div>

                <div class="flex justify-center bg-white p-4 rounded-3xl shadow-inner relative z-10 mb-6 mx-2 border-4 border-primary/20 bg-white">
                    <img src="\${sup.qrImage}" alt="\${sup.name} QR Code" class="w-full mix-blend-multiply max-w-[280px] object-contain" />
                </div>

                <div class="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between relative z-10 flex-col gap-3">
                    <div class="flex items-center justify-between w-full">
                        <div class="flex flex-col gap-1">
                            <span class="text-[9px] font-black tracking-widest uppercase text-slate-500">Support Move</span>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="size-6 rounded-md \${moveTypeColor} shadow flex items-center justify-center"><span class="material-symbols-outlined text-[14px] font-black">\${moveIcon}</span></div>
                                <span class="text-sm font-black text-white uppercase tracking-tight">\${sup.moveName}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <span class="text-[9px] font-black tracking-widest uppercase text-slate-500">Category</span>
                            <div class="text-[10px] font-black text-white px-2 py-1 mt-1 rounded \${sup.type === 'Special' ? 'bg-purple-600' : 'bg-orange-600'} uppercase shadow">\${sup.type}</div>
                        </div>
                    </div>
                    
                    <div class="w-full h-[1px] bg-white/10 my-1"></div>
                    
                    <button class="w-full py-3 bg-primary text-background-dark font-black tracking-widest rounded-xl text-[10px] uppercase shadow-[0_0_20px_rgba(249,245,6,0.3)]">
                        Save to Photos
                    </button>
                </div>
            </div>
        </div>
    \`;
    
    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}`;

js = js.replace(oldList, newList);

let renderFuncStart = js.indexOf('function renderSupportQR() {');
let renderFuncEnd = js.indexOf('document.addEventListener(\'DOMContentLoaded\', () => {');

let oldRenderFunc = js.substring(renderFuncStart, renderFuncEnd);

let newRenderFunc = `
function renderSupportQR() {
    const list = document.getElementById('qr-support-list');
    if (!list) return;

    let html = '';
    SUPPORT_POKEMON_LIST.forEach(sup => {
        const pData = PokemonData.list.find(p => p.name.toLowerCase() === sup.name.toLowerCase());
        
        let typesHtml = '';
        let urlName = sup.name.toLowerCase().replace(/['.]/g, '').replace(/\\s+/g, '-');
        let imgUrlAni = \`https://play.pokemonshowdown.com/sprites/ani/\${urlName}.gif\`;
        let imgUrlStatic = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlName}.png\`;
        let glowColor = 'bg-white/10';
        let moveTypeColor = 'bg-slate-500';

        if (pData) {
            typesHtml = pData.types.map(t => \`<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase \${TYPE_COLORS[t] || 'bg-slate-400'} shadow-sm">\${t}</span>\`).join('');
            
            const glowColorMap = {
                'Fire': 'bg-orange-600/20', 'Water': 'bg-blue-600/20', 'Grass': 'bg-green-600/20',
                'Electric': 'bg-yellow-400/20', 'Psychic': 'bg-pink-600/20', 'Ghost': 'bg-purple-600/20',
                'Dark': 'bg-slate-700/20', 'Dragon': 'bg-indigo-600/20', 'Fairy': 'bg-pink-400/20',
                'Fighting': 'bg-red-700/20', 'Steel': 'bg-slate-500/20', 'Ice':'bg-cyan-300/20',
                'Normal': 'bg-slate-400/20', 'Poison': 'bg-purple-600/20', 'Ground':'bg-amber-700/20',
                'Flying':'bg-sky-400/20', 'Bug':'bg-lime-500/20', 'Rock':'bg-stone-500/20'
            };
            glowColor = glowColorMap[pData.types[0]] || 'bg-white/10';
            urlName = getPokemonImageUrlName(pData.name);
            imgUrlStatic = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlName}.png\`;
            imgUrlAni = \`https://play.pokemonshowdown.com/sprites/ani/\${urlName}.gif\`;
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
            
            targets.sort((a,b) => {
                if (b.mult !== a.mult) return b.mult - a.mult;
                return b.pokemon.pe_efficiency - a.pokemon.pe_efficiency;
            });
            
            const top5 = targets.slice(0, 5);
            if (top5.length > 0) {
                topTargetsHtml = top5.map(t => {
                    let urlNameTarget = getPokemonImageUrlName(t.pokemon.name);
                    let targetImg = \`https://play.pokemonshowdown.com/sprites/gen5/\${urlNameTarget}.png\`;
                    let multColor = t.mult === 4 ? 'bg-red-600' : 'bg-orange-500';
                    return \`
                    <div class="flex flex-col items-center gap-1 w-1/5">
                        <div class="size-10 rounded-full bg-black/40 border border-white/10 p-1 flex items-center justify-center relative shadow-inner">
                            <span class="absolute -top-1 -right-1 text-[7px] font-black text-white \${multColor} px-1 rounded shadow-sm">x\${t.mult}</span>
                            <img class="w-full h-full object-contain pixelated relative z-10 scale-125 hover:scale-[1.5] transition-transform" src="\${targetImg}" alt="\${t.pokemon.name}"/>
                        </div>
                        <span class="text-[6px] font-black text-slate-300 uppercase tracking-tighter truncate w-full text-center mt-0.5">\${t.pokemon.name}</span>
                    </div>\`;
                }).join('');
            }
        }

        html += \`
        <div onclick="showQRModal('\${sup.name.replace(/'/g, "\\\\'")}')" class="glass-card bg-surface-dark border border-white/10 rounded-3xl p-4 flex flex-col relative overflow-hidden group hover:border-primary/40 transition-colors shadow-2xl cursor-pointer">
            <div class="absolute -top-10 -right-10 size-40 \${glowColor} rounded-full blur-[40px] pointer-events-none"></div>
            
            <div class="flex items-center gap-4 relative z-10 mb-4">
                <div class="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <img class="w-16 h-16 object-contain pixelated scale-[1.2]" src="\${imgUrlAni}" onerror="this.src='\${imgUrlStatic}'; this.onerror=null;" alt="\${sup.name}"/>
                </div>
                <div class="flex-1 flex flex-col pt-1">
                    <h3 class="text-2xl font-black text-white uppercase tracking-tight leading-none">\${sup.name}</h3>
                    <div class="flex flex-wrap gap-1 mt-1.5">
                        \${typesHtml}
                    </div>
                </div>
            </div>

            <div class="mb-4 relative z-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Counters</span>
                    <div class="h-[1px] bg-white/10 flex-1"></div>
                </div>
                <div class="flex justify-around items-end bg-black/30 rounded-2xl p-3 border border-white/5">
                    \${topTargetsHtml}
                </div>
            </div>

            <div class="mt-auto bg-black/60 border border-white/5 p-3 rounded-xl flex items-center justify-between relative z-10 bg-gradient-to-r from-black/60 to-surface-dark group-hover:from-primary/10 transition-colors">
                <div class="flex flex-col gap-1">
                    <span class="text-[8px] font-black tracking-widest uppercase text-slate-500 line-clamp-1">Support Move</span>
                    <div class="flex items-center gap-2">
                        <div class="size-5 rounded-sm \${moveTypeColor} shadow flex items-center justify-center"><span class="material-symbols-outlined text-[12px] font-black">\${moveIcon}</span></div>
                        <span class="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">\${sup.moveName}</span>
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
        \`;
    });
    list.innerHTML = html;
}
`;

js = js.replace(oldRenderFunc, newRenderFunc);
fs.writeFileSync('app.js', js, 'utf8');
console.log('Done!');
