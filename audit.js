// Passe automatique sur les fiches : ce qu'une machine peut repérer sans
// rien comprendre à la cuisine. Le but est d'avoir peu de faux positifs,
// sinon la liste devient du bruit qu'on finit par ignorer.
//   node audit.js
const R = require('./recipes.json');
const FR = R.R, EN = R.R_EN;

const out = [];
const dire = (id, quoi, detail) => out.push({ id, quoi, detail });

// --- normalisation des nombres -----------------------------------------
// Le français écrit 2,5 et l'anglais 2.5 ; le carnet écrit ½ et 1,5 ;
// 70 cl et 700 ml sont la même chose. Rien de tout cela n'est une erreur.
const FRACTIONS = { '½': '.5', '¼': '.25', '¾': '.75', '⅓': '.33', '⅔': '.67', '⅛': '.125' };
// Seuls les chiffres écrits en chiffres sont comparés. Les nombres en
// toutes lettres ne se traduisent pas un pour un ("en deux" devient
// "halve", "une quinzaine" devient "about fifteen") et les comparer ne
// produit que du bruit.

function normaliser(t) {
  let s = ' ' + String(t).toLowerCase() + ' ';
  for (const [g, v] of Object.entries(FRACTIONS)) s = s.split(g).join(v);
  // décimale française
  s = s.replace(/(\d),(\d)/g, '$1.$2');
  // un chiffre collé à sa fraction : 1 .5 -> 1.5
  s = s.replace(/(\d)\s+\.(\d)/g, '$1.$2');
  // volumes ramenés au millilitre
  s = s.replace(/(\d+(?:\.\d+)?)\s*cl\b/g, (_, n) => (parseFloat(n) * 10) + ' ml');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:litres?|l)\b/g, (_, n) => (parseFloat(n) * 1000) + ' ml');
  return s;
}
const nombres = t => {
  const n = (normaliser(t).match(/\d+(?:\.\d+)?/g) || []).map(x => String(parseFloat(x)));
  return n.sort().join(' ');
};

const corps = s => String(s).split('|')[0];
const astuce = s => String(s).split('|')[1] || '';

// --- mots d'un ingrédient, pour savoir s'il est employé -----------------
const VIDES = new Set(['pour', 'avec', 'dans', 'sans', 'cm', 'chair', 'morceaux', 'tranches',
  'lamelles', 'lanieres', 'haché', 'hachée', 'hachés', 'écrasé', 'ciselée', 'émincé',
  'coupé', 'coupée', 'frais', 'fraîche', 'sèche', 'séchés', 'entier', 'entières']);
function motsCles(nom) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[,(].*$/, '')
    .split(/[\s'’]+/)
    .filter(w => w.length > 2 && !VIDES.has(w))
    .map(w => w.replace(/s$/, '').slice(0, 5));
}
const sansAccent = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

for (const id of Object.keys(FR)) {
  const f = FR[id], e = EN[id];
  if (!e) { dire(id, 'ABSENT EN', "la recette n'existe pas en anglais"); continue; }

  // --- 1. les chiffres doivent concorder entre les deux langues ---
  f.s.forEach((s, i) => {
    const a = nombres(corps(s)), b = nombres(corps(e.s[i]));
    if (a !== b) dire(id, 'étape ' + (i + 1) + ', chiffres divergents', `FR [${a}] vs EN [${b}]\n      FR: ${corps(s)}\n      EN: ${corps(e.s[i])}`);
    const ta = nombres(astuce(s)), tb = nombres(astuce(e.s[i]));
    if (ta !== tb) dire(id, 'étape ' + (i + 1) + ', chiffres divergents dans l\'astuce', `FR [${ta}] vs EN [${tb}]`);
  });

  f.g.forEach((grp, gi) => grp[1].forEach((it, ii) => {
    const ei = e.g[gi][1][ii];
    if (nombres(it[1]) !== nombres(ei[1]))
      dire(id, 'quantité divergente', `${it[0]} = ${it[1]}   vs   ${ei[0]} = ${ei[1]}`);
    if (!String(it[1]).trim()) dire(id, 'quantité vide', it[0]);
    const ha = (it[2] || {}).t, hb = (ei[2] || {}).t;
    if (!!ha !== !!hb) dire(id, 'astuce présente d\'un seul côté', it[0]);
    else if (ha && nombres(ha) !== nombres(hb))
      dire(id, 'astuce d\'ingrédient, chiffres divergents', `${it[0]} : FR [${nombres(ha)}] vs EN [${nombres(hb)}]\n      FR: ${ha}\n      EN: ${hb}`);
  }));

  (f.no || []).forEach((n, i) => {
    const m = (e.no || [])[i] || ['', ''];
    if (nombres(n[1]) !== nombres(m[1]))
      dire(id, 'note ' + (i + 1) + ', chiffres divergents', `« ${n[0]} » : FR [${nombres(n[1])}] vs EN [${nombres(m[1])}]`);
  });
  if (nombres(f.p || '') !== nombres(e.p || ''))
    dire(id, 'conclusion, chiffres divergents', `FR [${nombres(f.p || '')}] vs EN [${nombres(e.p || '')}]`);
  if (nombres(f.prep + ' ' + f.cook) !== nombres(e.prep + ' ' + e.cook))
    dire(id, 'temps de la fiche divergents', `FR ${f.prep} / ${f.cook}   vs   EN ${e.prep} / ${e.cook}`);

  // --- 2. oignon et échalote, proscrits ---
  const plat = (JSON.stringify(f) + JSON.stringify(e)).replace(/\\"/g, '"');
  const re = /.{0,60}(oignons?|échalotes?|shallots?|onions?).{0,45}/gi;
  const trouve = [];
  let m;
  while ((m = re.exec(plat))) {
    if (/spring onion|ciboule|oignon de la recette|sans oignon|l'oignon de|à l'oignon émincé|no onion|the onion of|thinly sliced onion/i.test(m[0])) continue;
    trouve.push(m[0].trim());
  }
  if (trouve.length) dire(id, 'OIGNON OU ÉCHALOTE', [...new Set(trouve)].slice(0, 2).join('  //  '));

  // --- 3. un ingrédient listé doit se retrouver dans les étapes ---
  // Les composants d'une sauce ou d'une marinade sont employés en bloc
  // ("mélanger la sauce"), et l'accompagnement ne figure pas dans le
  // déroulé : les uns comme les autres ne sont pas des oublis.
  const COLLECTIFS = /sauce|marinade|assaisonnement|seasoning|aromates|pour finir|le reste|to finish|accompagnement/i;
  const GARNITURES = /^(riz|nouilles|pain|rice|noodles|bread)/i;
  const texteFR = sansAccent(f.s.join(' ') + ' ' + (f.no || []).map(n => n[0] + ' ' + n[1]).join(' '));
  f.g.forEach(grp => {
    if (COLLECTIFS.test(grp[0])) return;
    grp[1].forEach(it => {
      if (GARNITURES.test(it[0])) return;
      const mots = motsCles(it[0]);
      if (!mots.length) return;
      if (!mots.some(w => texteFR.includes(w)))
        dire(id, 'ingrédient listé mais absent des étapes', `${it[0]} (${it[1]})`);
    });
  });
}


// --- 4. une note qui recommande un geste que plus aucune étape ne fait ---
// C'est exactement ce qui est arrivé au char siu : l'étape d'entaillage a
// été supprimée et la note qui la justifiait est restée, si bien que la
// fiche conseillait en note ce qu'elle interdisait en étape. Une correction
// faite à un seul endroit laisse toujours ce genre de trace.
// Volontairement court. Uniquement des gestes structurels, qu'une fiche
// fait ou ne fait pas, jamais des mots qu'une note peut employer en
// parlant d'une variante ou de la conservation ("tremper", "griller",
// "mariner" reviennent partout et noyaient la sortie).
const GESTES = ['entaill', 'incis', 'ecum', 'degaz', 'claqu', 'flamb', 'tamis',
  'deglac', 'petri', 'panur', 'blanchi'];
for (const id of Object.keys(FR)) {
  const f = FR[id];
  const etapes = sansAccent(f.s.join(' ') + ' ' + f.g.map(g => g[1].map(i => i[0] + ' ' + ((i[2] || {}).t || '')).join(' ')).join(' '));
  (f.no || []).forEach((n, i) => {
    const texte = sansAccent(n[0] + ' ' + n[1]);
    GESTES.forEach(g => {
      // Frontière de mot : sans elle, « éventailler » déclenche « entailler ».
      const re = new RegExp('\\b' + g);
      if (re.test(texte) && !re.test(etapes))
        dire(id, 'note ' + (i + 1) + ' parle d\'un geste absent des étapes', `« ${n[0]} » évoque « ${g}… » qu'aucune étape ne fait`);
    });
  });
}

// --- ingrédient absent de SHOP_ALIAS ------------------------------------
// Un ingrédient dont le libellé n'est pas dans SHOP_ALIAS n'apparaît pas
// dans la liste de courses, sans erreur ni trace : il manque simplement
// à l'étal. C'est arrivé aux carottes des lasagnes, alias présent pour
// « Carotte en biseau » et consorts mais pas pour « Carottes » tout court.
{
  const fs = require('fs');
  const src = fs.readFileSync('carnet.html', 'utf8');
  // SHOP_SKIP est un tableau, les deux autres des objets : on compte les
  // délimiteurs plutôt que de chercher « }; », qui attrapait la table
  // suivante et faisait passer toute l'eau du carnet pour un oubli.
  const bloc = (nom) => {
    const i = src.indexOf('var ' + nom);
    if (i < 0) return null;
    let d = -1;
    for (let k = i; k < src.length; k++) {
      if (src[k] === '{' || src[k] === '[') { d = k; break; }
      if (src[k] === ';') break;
    }
    if (d < 0) return null;
    const ouvre = src[d], ferme = ouvre === '{' ? '}' : ']';
    let n = 0, dansTexte = null;
    for (let k = d; k < src.length; k++) {
      const c = src[k];
      if (dansTexte) { if (c === '\\') k++; else if (c === dansTexte) dansTexte = null; continue; }
      if (c === '"' || c === "'") { dansTexte = c; continue; }
      if (c === ouvre) n++;
      else if (c === ferme && --n === 0) {
        try { return eval('(' + src.slice(d, k + 1) + ')'); } catch (e) { return null; }
      }
    }
    return null;
  };
  const alias = bloc('SHOP_ALIAS'), skip = bloc('SHOP_SKIP'), canon = bloc('SHOP_CANON');
  if (!alias || !skip || !canon) {
    dire('(tables)', 'tables de courses illisibles', 'SHOP_ALIAS, SHOP_SKIP ou SHOP_CANON n\'a pas pu être lu dans carnet.html');
  } else {
    const estIgnore = (nom) => Array.isArray(skip) ? skip.includes(nom) : !!skip[nom];
    for (const id of Object.keys(FR)) {
      FR[id].g.forEach(g => g[1].forEach(it => {
        const nom = it[0];
        if (estIgnore(nom)) return;
        if (alias[nom] && estIgnore(alias[nom])) return;
        if (!alias[nom]) dire(id, 'ingrédient absent de la liste de courses', `« ${nom} » n'a pas d'entrée dans SHOP_ALIAS`);
        else if (!canon[alias[nom]]) dire(id, 'alias sans nom canonique', `« ${nom} » renvoie à « ${alias[nom]} », absent de SHOP_CANON`);
      }));
    }
  }
}

console.log(`${Object.keys(FR).length} recettes examinées, ${out.length} signalement(s).\n`);
const parId = {};
out.forEach(o => (parId[o.id] = parId[o.id] || []).push(o));
for (const id of Object.keys(parId)) {
  console.log('### ' + id + '  (' + FR[id].n + ')');
  parId[id].forEach(o => console.log('  - ' + o.quoi + ' : ' + o.detail));
  console.log();
}
if (!out.length) console.log('Rien à signaler.');
