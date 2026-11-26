// Produit index.html pour GitHub Pages à partir de carnet.html.
// Le fichier source est aussi publié comme artifact Claude, où l'en-tête
// HTML est fourni par la plateforme. Servi en direct, il lui faut le sien.
const fs = require('fs');
const src = process.argv[2] || 'carnet.html';
const out = process.argv[3] || 'index.html';
let body = fs.readFileSync(src, 'utf8');

if (/<!doctype/i.test(body)) throw new Error(src + ' a déjà un doctype');

/* Le numéro de fabrication de recipes.json est recopié dans la page, pour
   qu'elle puisse refuser un recipes.json plus ancien qu'elle. Lancer
   build-recipes.js avant celui-ci : dans l'autre ordre la page porte le
   numéro précédent, ce qui fait seulement accepter le fichier distant. */
const json = process.argv[4] || 'recipes.json';
let v = 0;
try { const d = JSON.parse(fs.readFileSync(json, 'utf8')); if (typeof d.v === 'number') v = d.v; }
catch (e) { console.warn(json + ' illisible, la page sort avec DATA_V=0'); }
const marque = 'var DATA_V=0;';
if (body.indexOf(marque) < 0) throw new Error(src + ' ne contient pas « ' + marque + ' »');
body = body.replace(marque, 'var DATA_V=' + v + ';');

const head = '<!doctype html>\n<html lang="fr">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n' +
  '<meta name="apple-mobile-web-app-title" content="Recettes">\n' +
  '<meta name="theme-color" content="#F2F2EE" media="(prefers-color-scheme: light)">\n' +
  '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n' +
  '<meta name="mobile-web-app-capable" content="yes">\n' +
  '<link rel="manifest" href="manifest.webmanifest">\n' +
  '<link rel="apple-touch-icon" href="icon-180.png">\n' +
  '<link rel="icon" href="icon-192.png">\n';

fs.writeFileSync(out, head + body + '\n</body>\n</html>\n');
console.log(out + ' écrit (' + Math.round((head.length + body.length) / 1024) + ' Ko, fabrication ' + v + ')');
