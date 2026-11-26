# Carnet de recettes

Carnet de cuisine familial, pour trois personnes, à Hong Kong.

Un seul fichier HTML autonome, sans dépendance ni installation. Ouvrez
`index.html` dans un navigateur, ou passez par la version en ligne si
GitHub Pages est activé sur le dépôt.

## Ce que contient le carnet

- Un menu déroulant qui liste les recettes, groupées par cuisine
- Un onglet Ingrédients, avec cases à cocher et compteur par groupe
- Un onglet Préparation, avec étapes cochables et notes de technique
- Un onglet Courses : un panier à droite de chaque ingrédient l'envoie
  dans la liste du jour, ligne par ligne et en piochant dans plusieurs
  recettes. Les quantités se fusionnent, se rangent par rayon, et un
  bouton copie le tout en texte brut, prêt à coller dans WhatsApp
- Pour les ingrédients chinois peu courants, un bouton qui ouvre une
  recherche d'images, avec les caractères à montrer en magasin

Les cases cochées sont mémorisées par recette dans le navigateur. Une
liste de courses en cours sur une recette n'affecte pas les autres.

## Contraintes appliquées à toutes les recettes

- Trois couverts
- Sans oignon, la base aromatique est remontée au cas par cas
- Chaque recette indique comment adapter la part de l'enfant

## Où sont les recettes

Pas dans ce dépôt public. Les recettes vivent dans le dépôt privé
**Gluminou/carnet-recettes-data**, dans `recipes.src.js`, et la page les
reçoit par `sync.js` une fois l'appareil connecté avec une clé. Sans clé,
l'app n'affiche que l'écran de clé.

Ajouter ou corriger une recette, depuis le dépôt privé (chemins vers ce
dépôt-ci à adapter) :

    node ../carnet-recettes/build-recipes.js recipes.src.js recipes.json
    node ../carnet-recettes/audit.js recipes.json
    node ../carnet-recettes/tools/content.mjs put recipes.json data.json carnet-content

puis commit et push du dépôt privé. Les appareils connectés rechargent
le carnet d'eux-mêmes avec la nouvelle version.

## Deux langues

Le carnet existe en français et en anglais, avec un bouton FR / EN dans
l'en-tête. Les deux versions sont deux jeux de données complets,
`R_FR` / `ORDER_FR` et `R_EN` / `ORDER_EN`, pas une traduction calculée
à la volée.

Les cases cochées sont indexées par position, donc les deux jeux
doivent rester superposables : même ordre de recettes, même nombre de
groupes, d'ingrédients, d'étapes et de notes, mêmes caractères chinois
aux mêmes places. `build-recipes.js` vérifie tout cela et refuse de
produire `recipes.json` en cas d'écart.

## Comment la liste de courses fusionne

Trois tables dans le `<script>`, juste avant la logique du panier :

- `SHOP_SKIP` : ce qu'on n'achète pas (l'eau, les os à bouillon)
- `SHOP_CANON` : le nom canonique de chaque ingrédient, son nom anglais
  et son rayon
- `SHOP_ALIAS` : chaque nom tel qu'il est écrit dans une recette, vers
  son nom canonique. Un ingrédient ajouté à une recette doit être
  ajouté ici, sinon il n'apparaîtra pas dans la liste.
- `SHOP_ZH` : le nom chinois de chaque ingrédient canonique, pour le
  marché. Chinois traditionnel et vocabulaire de Hong Kong, qui
  s'écarte souvent du mandarin standard : 薯仔 et non 土豆, 紹菜 et non
  大白菜, 麻油 et non 香油, 餐酒 pour le vin, 白酒 voulant dire
  alcool de grain. `mergeShopPinyin` verse ces termes dans la table
  `PY` au démarrage, pour que le pinyin s'affiche par le mécanisme
  déjà en place, sans écraser les entrées existantes.

`qtyParse` lit une quantité française et rend un nombre et une unité.
`qtyMerge` additionne ce qui est additionnable : les grammes entre eux,
les cuillères entre elles (1 c. à s. = 3 c. à c.), un nombre nu sous
l'unité de comptage quand il n'y en a qu'une. Ce qui n'est pas
comparable reste affiché côte à côte, par exemple « ¾ c. à c. + un
filet » : mieux vaut deux chiffres qu'un faux total. Les quantités non
chiffrées (« au goût », « quelques feuilles ») passent telles quelles.

Le panier retient des ingrédients, pas des recettes : chaque entrée
vaut `recette|groupe|rang`. On choisit donc ce qu'il faut vraiment
acheter, sans trimbaler le riz et la sauce soja déjà au placard. Le
bouton d'en-tête est un simple raccourci « tout ajouter » ou « tout
retirer » pour la recette ouverte.

Les quantités de la liste se corrigent à la main : on touche le chiffre,
on écrit le nombre qu'on veut acheter. Le total calculé est juste
arithmétiquement mais pas toujours au regard de l'étal, 900 g de riz
s'achetant en paquet d'un kilo. Seul le nombre se tape ; l'unité est
posée à côté, hors du champ, et ne se touche pas. Une ligne qui porte
plusieurs unités, « 2 cm + 6 tranches », en offre un par unité, chacun
indépendant.

L'unité affichée reste celle du moment de la saisie, mais elle se
redéduit du nombre une fois celui-ci enregistré : 1200 tapé dans un
champ en grammes se réaffiche « 1,2 kg ». La correction est donc gardée
dans l'unité de base, grammes ou millilitres, sous `carnet-qty`, et
non dans l'unité affichée. Un nombre n'ayant pas de langue, elle vaut
pour les deux : corrigée en français, elle suit en anglais dans la
liste qui part chez l'aide ménagère. La virgule décimale et les
fractions du carnet (½, ¾) sont acceptées. La correction prime sur le
calcul ; vider le champ, ou y écrire n'importe quoi, revient au total
calculé.

Le panier est mémorisé dans le navigateur sous `carnet-basket`. Il
survit à la fermeture de l'onglet. L'ancien format, qui retenait des
recettes entières, est déplié automatiquement au premier chargement.

## Les scripts de construction

`index.html` est généré à partir de `carnet.html`, jamais édité à la main :

    node build-site.js      # carnet.html -> index.html

`build-site.js` ajoute l'en-tête HTML que la plateforme Claude fournit
d'elle-même mais que GitHub Pages ne fournit pas : doctype, charset,
viewport et les métadonnées de raccourci iOS.

`build-recipes.js` fabrique `recipes.json` à partir de `recipes.src.js`
(dépôt privé) et refuse d'écrire si les deux langues divergent de
structure : nombre de recettes, de catégories, de groupes,
d'ingrédients par groupe, d'étapes, de notes, et position des
caractères chinois. Ce n'est pas du zèle. Les cases à cocher de
l'application sont indexées par position, donc une ligne en plus d'un
seul côté ferait silencieusement correspondre les coches aux mauvaises
lignes, sans message d'erreur et sans que personne le remarque.

## Auditer les fiches

    node audit.js recipes.json     # dans le dépôt privé

Passe mécanique sur toutes les recettes : chiffres qui divergent entre le
français et l'anglais, quantités qui ne concordent pas, astuce présente
d'un seul côté, oignon ou échalote, ingrédient listé mais jamais employé
dans les étapes.

Elle ne compare que les chiffres écrits en chiffres. Les nombres en
toutes lettres ne se traduisent pas un pour un, « en deux » devient
« halve » et « une quinzaine » devient « about fifteen », et les
comparer noyait la sortie sous les faux positifs. Il en reste une
poignée, toujours les mêmes, principalement les notes qui expliquent
pourquoi l'oignon a été retiré.

Elle signale aussi les notes qui recommandent un geste qu'aucune étape ne
fait. C'est déjà arrivé à une fiche : une étape avait
été supprimée et la note qui la justifiait était restée, si bien que la
fiche conseillait en note ce que l'étape interdisait. La liste de gestes
est volontairement courte, limitée aux gestes structurels, parce que des
mots comme « tremper » ou « mariner » reviennent légitimement dans les
notes de variante et de conservation. Deux faux positifs connus
subsistent, un blanchiment facultatif et une comparaison entre deux panures.

Le script ne sait pas cuisiner. Il attrape les incohérences mécaniques,
pas les erreurs de technique ni les contradictions de sens.

## Versions

L'app affiche son numéro de version et sa date en bas, avec un bouton **Rechercher une mise à jour** et la liste des **Nouveautés**. Chaque changement se publie avec :

```
node tools/release.mjs patch "Ce qui change, en mots simples"
```

`patch` pour une correction, `minor` pour une nouveauté visible, `major` pour une refonte. Le script garde la page, `version.json` et `changelog.json` en accord, puis relance `node build-site.js`. La section elle-même est `updates.js`, commune à toutes les apps.

## Synchronisation entre appareils

`sync.js` (le même fichier dans toutes les apps de Gluminou) copie les données de cette app d'un appareil à l'autre par `data.json` dans le dépôt privé **Gluminou/carnet-recettes-data** : les recettes elles-mêmes, puis panier, quantités corrigées, ingrédients cochés et langue (la dernière recette ouverte reste propre à chaque appareil). Chaque appareil se connecte une fois avec une clé GitHub à grain fin qui a **Contents : Read and write** sur ce dépôt (**Read-only** donne un accès en lecture seule). La clé se colle dans la section **Synchronisation entre appareils**, en bas de la page. Sur un ordinateur, les apps partagent la même adresse, donc une clé saisie dans une app sert aussi aux autres, et chaque app peut être déconnectée à part.

Les changements venus de deux appareils sont fusionnés élément par élément. Quand les deux ont changé la même chose, le plus récent l'emporte. L'historique du dépôt garde chaque version.
