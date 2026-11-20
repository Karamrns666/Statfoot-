# étapes de la vérification en ligne (branche verif-prod)
mkdir -p logos-avant
LABEL=avant node e2e/logos-planche.mjs > logos-avant/run.txt 2>&1
