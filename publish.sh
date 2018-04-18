#!/bin/sh
BLUE='\033[1;34m'
RED='\033[0;31m'
NC='\033[0m'
GREEN='\033[0;32m'
LPURPLE='\033[1;35m'
echo -e "${LPURPLE}Copie${NC} des ${BLUE}fichiers ${RED}arnaudgregoire/vibes${NC} sur ${RED}itownsResearch/2018_TSI_vibes${NC} ..."
git push -f https://github.com/itownsResearch/2018_TSI_vibes.git master:master
cd ..
echo -e "${BLUE}Clonage${NC} du ${GREEN}dépot ${RED}itownsResearch/2018_TSI_vibes${NC} ..."
git clone https://github.com/itownsResearch/2018_TSI_vibes.git
cd 2018_TSI_vibes
echo -e "${BLUE}Installation${NC} des ${LPURPLE}dépendances${NC} et ${LPURPLE}compilation${NC} des ${GREEN}fichiers${NC} (dossier ${RED}dist) ${NC}..."
npm install
npm run build
git add -f dist/*.js
git commit -m "dist"
echo -e "${BLUE}Copie${NC} du ${LPURPLE}dossier ${GREEN}dist ${NC}sur ${RED}itownsResearch/2018_TSI_vibes${NC}"
git push -f


