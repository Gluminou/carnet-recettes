// Produit index.html pour GitHub Pages à partir de carnet.html.
// Le fichier source est aussi publié comme artifact Claude, où l'en-tête
// HTML est fourni par la plateforme. Servi en direct, il lui faut le sien.
const fs = require('fs');
const src = process.argv[2] || 'carnet.html';
const out = process.argv[3] || 'index.html';
const body = fs.readFileSync(src, 'utf8');

if (/<!doctype/i.test(body)) throw new Error(src + ' a déjà un doctype');

const head = '<!doctype html>\n<html lang="fr">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n' +
  '<meta name="apple-mobile-web-app-title" content="Recettes">\n' +
  '<meta name="theme-color" content="#F2F2EE" media="(prefers-color-scheme: light)">\n' +
  '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n';

fs.writeFileSync(out, head + body + '\n</body>\n</html>\n');
console.log(out + ' écrit (' + Math.round((head.length + body.length) / 1024) + ' Ko)');
