const fs = require('fs');
let lines = fs.readFileSync('app.js', 'utf8').split('\n');

const newCode = `
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
        <div class="relative w-full h-full min-h-screen pb-20 pt-6 px-4">
            <header class="flex items-center justify-between mb-6">
                <button onclick="hideQRModal()" class="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
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

                <div class="flex justify-center bg-white p-4 rounded-3xl shadow-inner relative z-10 mb-6 mx-2 border-4 border-primary/20">
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
                </div>
            </div>
        </div>
    \`;
    
    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}
`;

// Update SUPPORT_POKEMON_LIST to have moveType
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("name: 'Lucario'")) lines[i] = "    { name: 'Lucario', moveName: 'Aura Sphere', type: 'Special', moveType: 'Fighting', qrImage: 'qr_images/lucario_qr.png' },";
    if (lines[i].includes("name: 'Mimikyu'")) lines[i] = "    { name: 'Mimikyu', moveName: 'Shadow Claw', type: 'Physical', moveType: 'Ghost', qrImage: 'qr_images/mimikyu_qr.png' },";
    if (lines[i].includes("name: 'Lapras'")) lines[i] = "    { name: 'Lapras', moveName: 'Ice Beam', type: 'Special', moveType: 'Ice', qrImage: 'qr_images/lapras_qr.png' },";
    if (lines[i].includes("name: 'Sirfetch\\'d'")) lines[i] = "    { name: 'Sirfetch\\'d', moveName: 'Meteor Assault', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/sirfetchd_qr.png' },";
    if (lines[i].includes("name: 'Duraludon'")) lines[i] = "    { name: 'Duraludon', moveName: 'Flash Cannon', type: 'Special', moveType: 'Steel', qrImage: 'qr_images/duraludon_qr.png' },";
}

// insert `newCode` at line 454
lines.splice(454, 0, newCode);

fs.writeFileSync('app.js', lines.join('\n'));
console.log('Successfully injected showQRModal');
