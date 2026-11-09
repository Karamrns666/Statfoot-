// Règles de jeu : source unique = src/lib/reglement.ts (Règlement officiel Ardentia). Alias conservés pour l'existant.
import { REGLEMENT } from '@/lib/reglement'
export const PLAYERS_ON_PITCH = REGLEMENT.format.playersOnPitch
export const FIELD_PLAYERS = PLAYERS_ON_PITCH - 1
export const GAME_FORMAT_LABEL = `${PLAYERS_ON_PITCH} contre ${PLAYERS_ON_PITCH}`
