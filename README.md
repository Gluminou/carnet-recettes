# Carnet de recettes

Carnet de cuisine familial, pour trois personnes, à Hong Kong.

Un seul fichier HTML autonome, sans dépendance ni installation. Ouvrez
`index.html` dans un navigateur, ou passez par la version en ligne si
GitHub Pages est activé sur le dépôt.

## Ce que contient le carnet

- Un menu déroulant qui liste les recettes, groupées par cuisine
- Un onglet Ingrédients, avec cases à cocher et compteur par groupe
- Un onglet Préparation, avec étapes cochables et notes de technique
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
aux shiitake et pak choi, chou-fleur à l'ail, black pepper beef, chou
déchiré au porc, mapo tofu, dan dan noodles, char siu, kale sauté.

France : crevettes à l'armoricaine, bœuf bourguignon.

Sucré : cookies au chocolat.

## Modifier

Tout est dans `index.html`. Les recettes sont un objet JavaScript nommé
`R` en haut du `<script>`, une entrée par recette. Pour en ajouter une,
copiez une entrée existante et ajoutez son identifiant au tableau
`ORDER` juste en dessous.

Puis régénérez `recipes.json`, qui doit toujours refléter `index.html` :

    node build-recipes.js index.html recipes.json

## Pourquoi recipes.json

Un raccourci ajouté à l'écran d'accueil d'un iPhone garde sa propre
copie de la page, sans barre d'adresse ni rafraîchissement. Les
recettes embarquées dans `index.html` servent donc de secours hors
ligne, et au démarrage la page va chercher `recipes.json` avec un
horodatage qui contourne le cache. Dès que le réseau répond, ce
fichier fait autorité et la page se redessine. Une nouvelle recette
apparaît donc sans avoir à recréer le raccourci.
