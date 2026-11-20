# étapes de la vérification en ligne (branche verif-prod) — après mise en production
sleep 150
mkdir -p logos-apres poster-out pbe-out
LABEL=apres node e2e/logos-planche.mjs > logos-apres/run.txt 2>&1
node e2e/poster-check.mjs > poster-out/run.txt 2>&1
node e2e/pbe-planche.mjs > pbe-out/run.txt 2>&1
