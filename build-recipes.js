// Extrait les données de recettes de carnet.html vers recipes.json.
// Source unique : le bloc "var R = { ... }" suivi de "var ORDER=[...]".
const fs = require('fs');
const src = process.argv[2] || 'carnet.html';
const out = process.argv[3] || 'recipes.json';

const html = fs.readFileSync(src, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) throw new Error('bloc <script> introuvable');

const s = m[1];
const a = s.indexOf('var R = {');
const b = s.indexOf('var cur');
if (a < 0 || b < 0 || b <= a) throw new Error('bloc de données introuvable');

const data = eval(s.slice(a, b) + ' ({R: R, ORDER: ORDER})');

const ids = Object.keys(data.R);
const inMenu = [];
data.ORDER.forEach(g => g[1].forEach(k => {
  inMenu.push(k);
  if (!data.R[k]) throw new Error('recette au menu mais absente des données : ' + k);
}));
ids.forEach(k => { if (inMenu.indexOf(k) < 0) throw new Error('recette orpheline, absente du menu : ' + k); });

fs.writeFileSync(out, JSON.stringify(data));
console.log(ids.length + ' recettes écrites dans ' + out);
data.ORDER.forEach(g => console.log('  ' + g[0] + ' : ' + g[1].length));
