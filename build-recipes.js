// Fabrique recipes.json à partir de la source des recettes, recipes.src.js,
// rangée dans le dépôt privé Gluminou/carnet-recettes-data :
//   node build-recipes.js <recipes.src.js> <recipes.json>
// Source unique : les blocs "var R_FR = {...}" / "var ORDER_FR=[...]" et
// leurs équivalents anglais.
//
// Le script refuse d'écrire si les deux langues divergent de structure.
// Ce n'est pas du zèle : les cases à cocher de l'application sont indexées
// par position, donc un ingrédient ou une étape en plus d'un côté ferait
// silencieusement correspondre les coches aux mauvaises lignes.
const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
if (!src || !out) throw new Error('usage : node build-recipes.js <recipes.src.js> <recipes.json>');

const s = fs.readFileSync(src, 'utf8');
if (s.indexOf('var R_FR = {') < 0 || s.indexOf('var R_EN={') < 0) throw new Error('blocs R_FR / R_EN introuvables dans ' + src);
const d = eval(s + '\n({R: R_FR, ORDER: ORDER_FR, R_EN: R_EN, ORDER_EN: ORDER_EN})');

// --- le menu et les données se répondent, dans les deux langues ---
function checkMenu(R, ORDER, lang) {
  const inMenu = [];
  ORDER.forEach(g => g[1].forEach(k => {
    inMenu.push(k);
    if (!R[k]) throw new Error(lang + ' : recette au menu mais absente des données : ' + k);
  }));
  Object.keys(R).forEach(k => {
    if (inMenu.indexOf(k) < 0) throw new Error(lang + ' : recette orpheline, absente du menu : ' + k);
  });
  return inMenu;
}
const fr = checkMenu(d.R, d.ORDER, 'FR');
const en = checkMenu(d.R_EN, d.ORDER_EN, 'EN');
if (fr.join() !== en.join()) throw new Error('ordre des recettes différent entre FR et EN');
if (d.ORDER.length !== d.ORDER_EN.length) throw new Error('nombre de catégories différent entre FR et EN');

// --- chaque fiche a la même ossature des deux côtés ---
function count(x) { return Array.isArray(x) ? x.length : 0; }
fr.forEach(k => {
  const f = d.R[k], e = d.R_EN[k];
  const why = msg => { throw new Error(k + ' : ' + msg); };

  if (count(f.g) !== count(e.g)) why('nombre de groupes différent');
  f.g.forEach((grp, gi) => {
    if (count(grp[1]) !== count(e.g[gi][1])) why('groupe ' + (gi + 1) + ' : nombre d\'ingrédients différent');
    grp[1].forEach((it, ii) => {
      const ei = e.g[gi][1][ii];
      const fh = (it[2] || {}).h || '', eh = (ei[2] || {}).h || '';
      if (fh !== eh) why('ingrédient ' + (gi + 1) + '.' + (ii + 1) + ' : caractères chinois différents (' + fh + ' / ' + eh + ')');
    });
  });

  if (count(f.s) !== count(e.s)) why('nombre d\'étapes différent');
  if (count(f.no) !== count(e.no)) why('nombre de notes différent');
  if (!!f.p !== !!e.p) why('la conclusion existe d\'un seul côté');
  if (f.cjk !== e.cjk) why('titre chinois différent');
  (f.no || []).forEach((n, i) => {
    if (!!n[2] !== !!(e.no[i] || [])[2]) why('note ' + (i + 1) + ' : marquage différent');
  });
});

/* Numéro de fabrication.
   Il permet à la page d'ignorer un recipes.json plus ancien qu'elle au lieu
   de se laisser écraser : c'est arrivé le 21 novembre 2026, l'artefact
   servant encore un recipes.json d'avant le passage au bilingue, si bien
   que la page affichait 28 recettes alors qu'elle en embarquait 29.
   Il n'augmente que lorsque le contenu change, pour que la CI puisse
   refabriquer le fichier et le retrouver identique. */
const corps = { R: d.R, ORDER: d.ORDER, R_EN: d.R_EN, ORDER_EN: d.ORDER_EN };
let v = 1;
try {
  const ancien = JSON.parse(fs.readFileSync(out, 'utf8'));
  const memeContenu = JSON.stringify({ R: ancien.R, ORDER: ancien.ORDER, R_EN: ancien.R_EN, ORDER_EN: ancien.ORDER_EN })
    === JSON.stringify(corps);
  const vAncien = typeof ancien.v === 'number' ? ancien.v : 0;
  v = memeContenu ? (vAncien || 1) : vAncien + 1;
} catch (e) { /* premier passage */ }

fs.writeFileSync(out, JSON.stringify(Object.assign({ v: v }, corps)));
console.log(fr.length + ' recettes × 2 langues écrites dans ' + out + ' (fabrication ' + v + ')');
d.ORDER.forEach((g, i) => console.log('  ' + g[0] + ' / ' + d.ORDER_EN[i][0] + ' : ' + g[1].length));
