# vérification finale (cartes, logos, Top 25 IPG) après mise en production
mkdir -p final-out
node e2e/final-planche.mjs > final-out/run.txt 2>&1
