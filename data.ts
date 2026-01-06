
import { Player, Championship, PlayerEra, PvPCategory } from './types';

export const initialData: { players: Player[], champs: Championship[] } = {
  "players": [
    {
      "id": "p1",
      "displayName": "Steve",
      "skinName": "Steve",
      "name": "Steve",
      "uuid": "steve-uuid",
      "era": PlayerEra.OLD_SCHOOL,
      "championships": [],
      "lastActive": Date.now(),
      "stats": {
        "2024-Spring": {
          "Overall": { "elo": 1500, "wins": 10, "losses": 2, "tier": "B" },
          "Axe & Shield": { "elo": 1450, "wins": 5, "losses": 1, "tier": "B" },
          "Diamond PvP": { "elo": 1550, "wins": 5, "losses": 1, "tier": "B" },
          "Netherite PvP": { "elo": 1500, "wins": 0, "losses": 0, "tier": "B" }
        },
        "2024-Summer": {
          "Overall": { "elo": 1850, "wins": 25, "losses": 5, "tier": "A" },
          "Axe & Shield": { "elo": 1800, "wins": 10, "losses": 2, "tier": "A" },
          "Diamond PvP": { "elo": 1900, "wins": 15, "losses": 3, "tier": "A" },
          "Netherite PvP": { "elo": 1850, "wins": 0, "losses": 0, "tier": "A" }
        },
        "2024-Autumn": {
          "Overall": { "elo": 2300, "wins": 50, "losses": 10, "tier": "S" },
          "Axe & Shield": { "elo": 2200, "wins": 20, "losses": 5, "tier": "S" },
          "Diamond PvP": { "elo": 2400, "wins": 30, "losses": 5, "tier": "S" },
          "Netherite PvP": { "elo": 2300, "wins": 0, "losses": 0, "tier": "S" }
        }
      }
    },
    {
      "id": "p2",
      "displayName": "Alex",
      "skinName": "Alex",
      "name": "Alex",
      "uuid": "alex-uuid",
      "era": PlayerEra.NEW_SCHOOL,
      "championships": [],
      "lastActive": Date.now(),
      "stats": {
        "2024-Spring": {
          "Overall": { "elo": 1300, "wins": 5, "losses": 5, "tier": "C" },
          "Axe & Shield": { "elo": 1250, "wins": 2, "losses": 3, "tier": "C" },
          "Diamond PvP": { "elo": 1350, "wins": 3, "losses": 2, "tier": "C" },
          "Netherite PvP": { "elo": 1300, "wins": 0, "losses": 0, "tier": "C" }
        },
        "2024-Summer": {
          "Overall": { "elo": 1600, "wins": 15, "losses": 10, "tier": "B" },
          "Axe & Shield": { "elo": 1550, "wins": 7, "losses": 5, "tier": "B" },
          "Diamond PvP": { "elo": 1650, "wins": 8, "losses": 5, "tier": "B" },
          "Netherite PvP": { "elo": 1600, "wins": 0, "losses": 0, "tier": "B" }
        },
        "2024-Autumn": {
          "Overall": { "elo": 2000, "wins": 30, "losses": 15, "tier": "A" },
          "Axe & Shield": { "elo": 1950, "wins": 15, "losses": 7, "tier": "A" },
          "Diamond PvP": { "elo": 2050, "wins": 15, "losses": 8, "tier": "A" },
          "Netherite PvP": { "elo": 2000, "wins": 0, "losses": 0, "tier": "A" }
        }
      }
    }
  ],
  "champs": []
};
