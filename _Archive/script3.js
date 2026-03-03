const fs = require('fs');
let lines = fs.readFileSync('app.js', 'utf8').split('\n');

const newList = `const SUPPORT_POKEMON_LIST = [
    { name: 'Lucario', moveName: 'Aura Sphere', type: 'Special', moveType: 'Fighting', qrImage: 'qr_images/lucario_qr.png' },
    { name: 'Mimikyu', moveName: 'Shadow Claw', type: 'Physical', moveType: 'Ghost', qrImage: 'qr_images/mimikyu_qr.png' },
    { name: 'Lapras', moveName: 'Ice Beam', type: 'Special', moveType: 'Ice', qrImage: 'qr_images/lapras_qr.png' },
    { name: 'Sirfetch\\'d', moveName: 'Meteor Assault', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/sirfetchd_qr.png' },
    { name: 'Duraludon', moveName: 'Flash Cannon', type: 'Special', moveType: 'Steel', qrImage: 'qr_images/duraludon_qr.png' },
    { name: 'Mega Charizard X', moveName: 'Flamethrower', type: 'Special', moveType: 'Fire', qrImage: 'qr_images/charizard_qr.png' },
    { name: 'Blastoise', moveName: 'Hydro Pump', type: 'Special', moveType: 'Water', qrImage: 'qr_images/blastoise_qr.png' },
    { name: 'Gengar', moveName: 'Shadow Ball', type: 'Special', moveType: 'Ghost', qrImage: 'qr_images/gengar_qr.png' },
    { name: 'Mega Gardevoir', moveName: 'Psychic', type: 'Special', moveType: 'Psychic', qrImage: 'qr_images/gardevoir_qr.png' },
    { name: 'Keldeo', moveName: 'Sacred Sword', type: 'Physical', moveType: 'Fighting', qrImage: 'qr_images/keldeo_qr.png' }
];`;

let startIdx = lines.findIndex(l => l.includes('const SUPPORT_POKEMON_LIST = ['));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('];'));

lines.splice(startIdx, endIdx - startIdx + 1, newList);

// Add Pagination Variables and Buttons
let funcStart = lines.findIndex(l => l.includes('function renderSupportQR() {'));

const paginationVars = `let currentSupportPage = 1;
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
`;

lines.splice(funcStart, 0, paginationVars);


funcStart = lines.findIndex(l => l.includes('function renderSupportQR() {'));
let htmlStartIdx = lines.findIndex((l, i) => i > funcStart && l.includes('SUPPORT_POKEMON_LIST.forEach('));

lines[htmlStartIdx] = `
    const startIndex = (currentSupportPage - 1) * SUPPORT_ITEMS_PER_PAGE;
    const paginatedList = SUPPORT_POKEMON_LIST.slice(startIndex, startIndex + SUPPORT_ITEMS_PER_PAGE);
    const totalPages = Math.ceil(SUPPORT_POKEMON_LIST.length / SUPPORT_ITEMS_PER_PAGE);

    // Render Pagination Controls First
    html += \`
        <div class="flex items-center justify-between mb-2">
            <button onclick="prevSupportPage()" class="px-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold shadow-md cursor-pointer" \${currentSupportPage === 1 ? 'disabled' : ''}>Prev</button>
            <span class="text-xs font-black text-slate-400 tracking-widest uppercase">Page \${currentSupportPage} / \${totalPages}</span>
            <button onclick="nextSupportPage()" class="px-4 py-2 bg-surface-dark border border-white/10 rounded-lg text-slate-300 hover:text-white disabled:opacity-50 text-xs font-bold shadow-md cursor-pointer" \${currentSupportPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
    \`;

    paginatedList.forEach(sup => {`;


fs.writeFileSync('app.js', lines.join('\n'));
console.log('Appended 5 new pokemon and added pagination successfully');
