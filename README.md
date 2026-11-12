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

## Recettes

Chine : gongbao jiding, porc yuxiang, soupe aigre-piquante, tofu braisé
aux shiitake et pak choi, boulettes tête de lion, bœuf braisé aux pommes
de terre, chou-fleur à l'ail, pommes de terre sautées en julienne, bœuf au
poivre noir, bœuf sauté à l'orange, chou déchiré au porc, mapo tofu, dan dan noodles, char siu,
kale sauté.

Vietnam : poulet au caramel.

France : bouillon de bœuf maison, crevettes à l'armoricaine, bœuf
bourguignon, poulet à la crème et aux champignons, filet de panga en
croûte d'herbes, cordon bleu maison.

Sucré : cookies au chocolat, donuts levés.

## Modifier

Tout est dans `index.html`. Les recettes sont un objet JavaScript nommé
`R` en haut du `<script>`, une entrée par recette. Pour en ajouter une,
copiez une entrée existante et ajoutez son identifiant au tableau
`ORDER` juste en dessous.

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

Le fichier de travail est `carnet.html`, qui est aussi publié comme
artifact Claude. `index.html` et `recipes.json` en sont dérivés et ne
se modifient jamais à la main :

    node build-site.js carnet.html index.html
    node build-recipes.js carnet.html recipes.json

`build-site.js` ajoute l'en-tête HTML que la plateforme Claude fournit
d'elle-même mais que GitHub Pages ne fournit pas : doctype, charset,
viewport et les métadonnées de raccourci iOS. `build-recipes.js`
extrait les données et vérifie que `R` et `ORDER` concordent.

## Comment la liste de courses fusionne

Trois tables dans le `<script>`, juste avant la logique du panier :

- `SHOP_SKIP` : ce qu'on n'achète pas (l'eau, les os à bouillon)
- `SHOP_CANON` : le nom canonique de chaque ingrédient, son nom anglais
  et son rayon
- `SHOP_ALIAS` : chaque nom tel qu'il est écrit dans une recette, vers
  son nom canonique. Un ingrédient ajouté à une recette doit être
  ajouté ici, sinon il n'apparaîtra pas dans la liste.

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

Le panier est mémorisé dans le navigateur sous `carnet-basket`. Il
survit à la fermeture de l'onglet. L'ancien format, qui retenait des
recettes entières, est déplié automatiquement au premier chargement.

## Pourquoi recipes.json

Un raccourci ajouté à l'écran d'accueil d'un iPhone garde sa propre
copie de la page, sans barre d'adresse ni rafraîchissement. Les
recettes embarquées dans `index.html` servent donc de secours hors
ligne, et au démarrage la page va chercher `recipes.json` avec un
horodatage qui contourne le cache. Dès que le réseau répond, ce
fichier fait autorité et la page se redessine. Une nouvelle recette
apparaît donc sans avoir à recréer le raccourci.
