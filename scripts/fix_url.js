const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const target1 = "const urlName = pokemon.name.toLowerCase().replace(/['.]/g, '').replace(/\\s+/g, '-');";
const target2 = "const urlName = c.pokemon.name.toLowerCase().replace(/['.]/g, '').replace(/\\s+/g, '-');";

content = content.replaceAll(target1, "const urlName = getPokemonImageUrlName(pokemon.name);");
content = content.replaceAll(target2, "const urlName = getPokemonImageUrlName(c.pokemon.name);");

fs.writeFileSync('app.js', content, 'utf8');
console.log('Fixed URLs');
