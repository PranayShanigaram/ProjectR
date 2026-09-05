/* ═══════════════════════════════════════════════════════════
   WORLD CUP 2026 TEAMS DATA
   ═══════════════════════════════════════════════════════════ */

import { FootballTeam, FootballPlayer } from "../types/football";

// ARGENTINA TEAM
const argentinaPlayers: FootballPlayer[] = [
  { id: "arg_01", name: "Martínez", jersey: 1, position: "GK", overall: 85, pace: 60, shooting: 15, passing: 60, defense: 85, strength: 80, stamina: 80, countryCode: "AR" },
  { id: "arg_02", name: "Romero", jersey: 3, position: "DEF", overall: 89, pace: 75, shooting: 30, passing: 70, defense: 92, strength: 88, stamina: 85, countryCode: "AR" },
  { id: "arg_03", name: "Otamendi", jersey: 2, position: "DEF", overall: 88, pace: 70, shooting: 25, passing: 72, defense: 90, strength: 90, stamina: 85, countryCode: "AR" },
  { id: "arg_04", name: "Tagliafico", jersey: 6, position: "DEF", overall: 86, pace: 80, shooting: 20, passing: 75, defense: 84, strength: 78, stamina: 87, countryCode: "AR" },
  { id: "arg_05", name: "Molina", jersey: 4, position: "DEF", overall: 87, pace: 82, shooting: 25, passing: 73, defense: 85, strength: 80, stamina: 88, countryCode: "AR" },
  { id: "arg_06", name: "De Paul", jersey: 5, position: "MID", overall: 88, pace: 78, shooting: 75, passing: 88, defense: 75, strength: 82, stamina: 86, countryCode: "AR" },
  { id: "arg_07", name: "Fernández", jersey: 8, position: "MID", overall: 85, pace: 76, shooting: 72, passing: 85, defense: 72, strength: 80, stamina: 85, countryCode: "AR" },
  { id: "arg_08", name: "Palacios", jersey: 15, position: "MID", overall: 81, pace: 74, shooting: 68, passing: 80, defense: 70, strength: 78, stamina: 82, countryCode: "AR" },
  { id: "arg_09", name: "Messi", jersey: 10, position: "FWD", overall: 92, pace: 80, shooting: 94, passing: 92, defense: 38, strength: 70, stamina: 78, countryCode: "AR" },
  { id: "arg_10", name: "Di María", jersey: 11, position: "FWD", overall: 87, pace: 85, shooting: 84, passing: 82, defense: 35, strength: 72, stamina: 80, countryCode: "AR" },
  { id: "arg_11", name: "Álvarez", jersey: 9, position: "FWD", overall: 89, pace: 88, shooting: 87, passing: 78, defense: 40, strength: 75, stamina: 84, countryCode: "AR" },
];

// FRANCE TEAM
const francePlayers: FootballPlayer[] = [
  { id: "fra_01", name: "Maignan", jersey: 1, position: "GK", overall: 86, pace: 60, shooting: 10, passing: 58, defense: 88, strength: 82, stamina: 80, countryCode: "FR" },
  { id: "fra_02", name: "Varane", jersey: 2, position: "DEF", overall: 88, pace: 73, shooting: 28, passing: 70, defense: 91, strength: 92, stamina: 84, countryCode: "FR" },
  { id: "fra_03", name: "Upamecano", jersey: 3, position: "DEF", overall: 87, pace: 80, shooting: 25, passing: 68, defense: 89, strength: 90, stamina: 86, countryCode: "FR" },
  { id: "fra_04", name: "Pavard", jersey: 4, position: "DEF", overall: 85, pace: 78, shooting: 30, passing: 72, defense: 82, strength: 85, stamina: 84, countryCode: "FR" },
  { id: "fra_05", name: "Théo Hernández", jersey: 19, position: "DEF", overall: 86, pace: 86, shooting: 35, passing: 78, defense: 81, strength: 80, stamina: 87, countryCode: "FR" },
  { id: "fra_06", name: "Kanté", jersey: 5, position: "MID", overall: 87, pace: 82, shooting: 68, passing: 82, defense: 84, strength: 80, stamina: 90, countryCode: "FR" },
  { id: "fra_07", name: "Griezmann", jersey: 7, position: "MID", overall: 88, pace: 80, shooting: 85, passing: 85, defense: 65, strength: 78, stamina: 86, countryCode: "FR" },
  { id: "fra_08", name: "Tchouaméni", jersey: 12, position: "MID", overall: 84, pace: 77, shooting: 70, passing: 80, defense: 78, strength: 82, stamina: 85, countryCode: "FR" },
  { id: "fra_09", name: "Mbappé", jersey: 10, position: "FWD", overall: 94, pace: 97, shooting: 91, passing: 80, defense: 35, strength: 75, stamina: 88, countryCode: "FR" },
  { id: "fra_10", name: "Benzema", jersey: 9, position: "FWD", overall: 89, pace: 82, shooting: 89, passing: 81, defense: 40, strength: 80, stamina: 82, countryCode: "FR" },
  { id: "fra_11", name: "Dembélé", jersey: 11, position: "FWD", overall: 87, pace: 92, shooting: 82, passing: 75, defense: 38, strength: 72, stamina: 84, countryCode: "FR" },
];

// BRAZIL TEAM
const brazilPlayers: FootballPlayer[] = [
  { id: "bra_01", name: "Ederson", jersey: 1, position: "GK", overall: 86, pace: 58, shooting: 12, passing: 62, defense: 87, strength: 80, stamina: 82, countryCode: "BR" },
  { id: "bra_02", name: "Thiago Silva", jersey: 2, position: "DEF", overall: 87, pace: 68, shooting: 25, passing: 75, defense: 90, strength: 88, stamina: 82, countryCode: "BR" },
  { id: "bra_03", name: "Marquinhos", jersey: 3, position: "DEF", overall: 88, pace: 72, shooting: 28, passing: 73, defense: 91, strength: 90, stamina: 85, countryCode: "BR" },
  { id: "bra_04", name: "Vinicius Jr", jersey: 7, position: "DEF", overall: 87, pace: 91, shooting: 35, passing: 75, defense: 76, strength: 82, stamina: 87, countryCode: "BR" },
  { id: "bra_05", name: "Danilo", jersey: 4, position: "DEF", overall: 84, pace: 78, shooting: 32, passing: 70, defense: 80, strength: 82, stamina: 85, countryCode: "BR" },
  { id: "bra_06", name: "Fred", jersey: 5, position: "MID", overall: 84, pace: 75, shooting: 68, passing: 80, defense: 75, strength: 80, stamina: 87, countryCode: "BR" },
  { id: "bra_07", name: "Casemiro", jersey: 6, position: "MID", overall: 86, pace: 72, shooting: 70, passing: 78, defense: 85, strength: 90, stamina: 84, countryCode: "BR" },
  { id: "bra_08", name: "Paquetá", jersey: 8, position: "MID", overall: 83, pace: 80, shooting: 75, passing: 82, defense: 70, strength: 76, stamina: 84, countryCode: "BR" },
  { id: "bra_09", name: "Neymar", jersey: 10, position: "FWD", overall: 91, pace: 89, shooting: 87, passing: 88, defense: 38, strength: 75, stamina: 82, countryCode: "BR" },
  { id: "bra_10", name: "Richarlison", jersey: 9, position: "FWD", overall: 86, pace: 86, shooting: 84, passing: 76, defense: 42, strength: 78, stamina: 85, countryCode: "BR" },
  { id: "bra_11", name: "Rodrygo", jersey: 11, position: "FWD", overall: 85, pace: 87, shooting: 82, passing: 78, defense: 40, strength: 74, stamina: 83, countryCode: "BR" },
];

// GERMANY TEAM
const germanyPlayers: FootballPlayer[] = [
  { id: "ger_01", name: "Neuer", jersey: 1, position: "GK", overall: 87, pace: 58, shooting: 10, passing: 65, defense: 90, strength: 82, stamina: 82, countryCode: "DE" },
  { id: "ger_02", name: "Rüdiger", jersey: 2, position: "DEF", overall: 88, pace: 75, shooting: 30, passing: 70, defense: 91, strength: 93, stamina: 84, countryCode: "DE" },
  { id: "ger_03", name: "Mats Hummels", jersey: 3, position: "DEF", overall: 86, pace: 70, shooting: 28, passing: 72, defense: 89, strength: 90, stamina: 83, countryCode: "DE" },
  { id: "ger_04", name: "Klostermann", jersey: 4, position: "DEF", overall: 82, pace: 76, shooting: 25, passing: 68, defense: 80, strength: 82, stamina: 84, countryCode: "DE" },
  { id: "ger_05", name: "Henrichs", jersey: 19, position: "DEF", overall: 83, pace: 82, shooting: 32, passing: 72, defense: 79, strength: 78, stamina: 86, countryCode: "DE" },
  { id: "ger_06", name: "Kimmich", jersey: 6, position: "MID", overall: 87, pace: 80, shooting: 72, passing: 86, defense: 80, strength: 80, stamina: 88, countryCode: "DE" },
  { id: "ger_07", name: "Goretzka", jersey: 8, position: "MID", overall: 85, pace: 78, shooting: 75, passing: 82, defense: 75, strength: 85, stamina: 86, countryCode: "DE" },
  { id: "ger_08", name: "Gündogan", jersey: 5, position: "MID", overall: 86, pace: 76, shooting: 78, passing: 87, defense: 72, strength: 78, stamina: 84, countryCode: "DE" },
  { id: "ger_09", name: "Müller", jersey: 10, position: "FWD", overall: 87, pace: 78, shooting: 85, passing: 84, defense: 42, strength: 76, stamina: 82, countryCode: "DE" },
  { id: "ger_10", name: "Serge Gnabry", jersey: 7, position: "FWD", overall: 85, pace: 88, shooting: 82, passing: 78, defense: 40, strength: 74, stamina: 84, countryCode: "DE" },
  { id: "ger_11", name: "Kai Havertz", jersey: 9, position: "FWD", overall: 86, pace: 84, shooting: 81, passing: 80, defense: 38, strength: 76, stamina: 83, countryCode: "DE" },
];

// SPAIN TEAM
const spainPlayers: FootballPlayer[] = [
  { id: "esp_01", name: "Unai Simón", jersey: 1, position: "GK", overall: 84, pace: 55, shooting: 10, passing: 60, defense: 85, strength: 78, stamina: 80, countryCode: "ES" },
  { id: "esp_02", name: "Piqué", jersey: 3, position: "DEF", overall: 85, pace: 68, shooting: 32, passing: 75, defense: 88, strength: 88, stamina: 82, countryCode: "ES" },
  { id: "esp_03", name: "Laporte", jersey: 2, position: "DEF", overall: 87, pace: 72, shooting: 28, passing: 78, defense: 90, strength: 90, stamina: 84, countryCode: "ES" },
  { id: "esp_04", name: "Alba", jersey: 18, position: "DEF", overall: 84, pace: 82, shooting: 35, passing: 82, defense: 78, strength: 76, stamina: 86, countryCode: "ES" },
  { id: "esp_05", name: "Azpilicueta", jersey: 4, position: "DEF", overall: 83, pace: 76, shooting: 30, passing: 75, defense: 82, strength: 82, stamina: 84, countryCode: "ES" },
  { id: "esp_06", name: "Busquets", jersey: 5, position: "MID", overall: 86, pace: 70, shooting: 65, passing: 88, defense: 80, strength: 78, stamina: 82, countryCode: "ES" },
  { id: "esp_07", name: "Pedri", jersey: 8, position: "MID", overall: 85, pace: 76, shooting: 72, passing: 87, defense: 68, strength: 72, stamina: 84, countryCode: "ES" },
  { id: "esp_08", name: "Gavi", jersey: 6, position: "MID", overall: 84, pace: 78, shooting: 70, passing: 85, defense: 70, strength: 74, stamina: 85, countryCode: "ES" },
  { id: "esp_09", name: "Ferran Torres", jersey: 7, position: "FWD", overall: 84, pace: 85, shooting: 80, passing: 78, defense: 42, strength: 74, stamina: 84, countryCode: "ES" },
  { id: "esp_10", name: "Morata", jersey: 10, position: "FWD", overall: 84, pace: 82, shooting: 82, passing: 76, defense: 40, strength: 78, stamina: 82, countryCode: "ES" },
  { id: "esp_11", name: "Oyarzabal", jersey: 11, position: "FWD", overall: 83, pace: 81, shooting: 80, passing: 75, defense: 41, strength: 72, stamina: 81, countryCode: "ES" },
];

// PORTUGAL TEAM
const portugalPlayers: FootballPlayer[] = [
  { id: "por_01", name: "Rui Patrício", jersey: 1, position: "GK", overall: 83, pace: 55, shooting: 10, passing: 58, defense: 83, strength: 76, stamina: 80, countryCode: "PT" },
  { id: "por_02", name: "Pepe", jersey: 3, position: "DEF", overall: 84, pace: 68, shooting: 28, passing: 70, defense: 87, strength: 88, stamina: 82, countryCode: "PT" },
  { id: "por_03", name: "Dias", jersey: 4, position: "DEF", overall: 87, pace: 75, shooting: 30, passing: 75, defense: 90, strength: 88, stamina: 84, countryCode: "PT" },
  { id: "por_04", name: "Nélson Semedo", jersey: 2, position: "DEF", overall: 84, pace: 82, shooting: 32, passing: 74, defense: 80, strength: 78, stamina: 85, countryCode: "PT" },
  { id: "por_05", name: "Cancelo", jersey: 20, position: "DEF", overall: 86, pace: 84, shooting: 35, passing: 80, defense: 82, strength: 78, stamina: 86, countryCode: "PT" },
  { id: "por_06", name: "Palhinha", jersey: 5, position: "MID", overall: 84, pace: 75, shooting: 68, passing: 78, defense: 82, strength: 88, stamina: 85, countryCode: "PT" },
  { id: "por_07", name: "Vitinha", jersey: 6, position: "MID", overall: 83, pace: 77, shooting: 70, passing: 82, defense: 72, strength: 76, stamina: 84, countryCode: "PT" },
  { id: "por_08", name: "Nunes", jersey: 8, position: "MID", overall: 82, pace: 80, shooting: 72, passing: 80, defense: 75, strength: 80, stamina: 85, countryCode: "PT" },
  { id: "por_09", name: "Cristiano Ronaldo", jersey: 7, position: "FWD", overall: 88, pace: 84, shooting: 92, passing: 79, defense: 35, strength: 80, stamina: 80, countryCode: "PT" },
  { id: "por_10", name: "Gonçalo Ramos", jersey: 9, position: "FWD", overall: 82, pace: 83, shooting: 80, passing: 74, defense: 38, strength: 74, stamina: 82, countryCode: "PT" },
  { id: "por_11", name: "Félix", jersey: 10, position: "FWD", overall: 85, pace: 86, shooting: 83, passing: 80, defense: 40, strength: 72, stamina: 82, countryCode: "PT" },
];

// ENGLAND TEAM
const englandPlayers: FootballPlayer[] = [
  { id: "eng_01", name: "Pickford", jersey: 1, position: "GK", overall: 84, pace: 56, shooting: 10, passing: 58, defense: 84, strength: 80, stamina: 81, countryCode: "GB" },
  { id: "eng_02", name: "Harry Maguire", jersey: 6, position: "DEF", overall: 85, pace: 72, shooting: 30, passing: 72, defense: 88, strength: 90, stamina: 84, countryCode: "GB" },
  { id: "eng_03", name: "Shaw", jersey: 3, position: "DEF", overall: 84, pace: 80, shooting: 32, passing: 76, defense: 80, strength: 80, stamina: 85, countryCode: "GB" },
  { id: "eng_04", name: "James", jersey: 2, position: "DEF", overall: 85, pace: 83, shooting: 35, passing: 75, defense: 82, strength: 80, stamina: 86, countryCode: "GB" },
  { id: "eng_05", name: "Stones", jersey: 5, position: "DEF", overall: 84, pace: 74, shooting: 28, passing: 76, defense: 85, strength: 82, stamina: 84, countryCode: "GB" },
  { id: "eng_06", name: "Rice", jersey: 4, position: "MID", overall: 85, pace: 76, shooting: 70, passing: 80, defense: 82, strength: 85, stamina: 86, countryCode: "GB" },
  { id: "eng_07", name: "Mount", jersey: 7, position: "MID", overall: 84, pace: 78, shooting: 75, passing: 82, defense: 70, strength: 74, stamina: 85, countryCode: "GB" },
  { id: "eng_08", name: "Bellingham", jersey: 19, position: "MID", overall: 86, pace: 80, shooting: 76, passing: 84, defense: 75, strength: 80, stamina: 86, countryCode: "GB" },
  { id: "eng_09", name: "Kane", jersey: 9, position: "FWD", overall: 88, pace: 80, shooting: 89, passing: 82, defense: 40, strength: 82, stamina: 82, countryCode: "GB" },
  { id: "eng_10", name: "Saka", jersey: 7, position: "FWD", overall: 85, pace: 88, shooting: 82, passing: 79, defense: 38, strength: 72, stamina: 84, countryCode: "GB" },
  { id: "eng_11", name: "Foden", jersey: 20, position: "FWD", overall: 86, pace: 86, shooting: 84, passing: 81, defense: 39, strength: 72, stamina: 84, countryCode: "GB" },
];

// MEXICO TEAM
const mexicoPlayers: FootballPlayer[] = [
  { id: "mex_01", name: "Ochoa", jersey: 1, position: "GK", overall: 82, pace: 54, shooting: 10, passing: 55, defense: 82, strength: 76, stamina: 80, countryCode: "MX" },
  { id: "mex_02", name: "Moreno", jersey: 3, position: "DEF", overall: 82, pace: 72, shooting: 28, passing: 70, defense: 84, strength: 84, stamina: 82, countryCode: "MX" },
  { id: "mex_03", name: "Araujo", jersey: 4, position: "DEF", overall: 81, pace: 75, shooting: 26, passing: 68, defense: 82, strength: 86, stamina: 83, countryCode: "MX" },
  { id: "mex_04", name: "Salcedo", jersey: 2, position: "DEF", overall: 80, pace: 70, shooting: 25, passing: 68, defense: 80, strength: 84, stamina: 81, countryCode: "MX" },
  { id: "mex_05", name: "Lozano", jersey: 22, position: "DEF", overall: 82, pace: 80, shooting: 32, passing: 72, defense: 76, strength: 78, stamina: 85, countryCode: "MX" },
  { id: "mex_06", name: "Herrera", jersey: 6, position: "MID", overall: 82, pace: 74, shooting: 68, passing: 80, defense: 76, strength: 80, stamina: 85, countryCode: "MX" },
  { id: "mex_07", name: "Guardado", jersey: 18, position: "MID", overall: 81, pace: 70, shooting: 65, passing: 78, defense: 75, strength: 76, stamina: 82, countryCode: "MX" },
  { id: "mex_08", name: "Chucky Lozano", jersey: 17, position: "MID", overall: 82, pace: 82, shooting: 75, passing: 76, defense: 68, strength: 74, stamina: 84, countryCode: "MX" },
  { id: "mex_09", name: "Jiménez", jersey: 9, position: "FWD", overall: 83, pace: 80, shooting: 82, passing: 74, defense: 40, strength: 82, stamina: 82, countryCode: "MX" },
  { id: "mex_10", name: "Vega", jersey: 10, position: "FWD", overall: 80, pace: 82, shooting: 78, passing: 72, defense: 38, strength: 74, stamina: 80, countryCode: "MX" },
  { id: "mex_11", name: "Tecatito Corona", jersey: 7, position: "FWD", overall: 81, pace: 84, shooting: 79, passing: 75, defense: 39, strength: 72, stamina: 82, countryCode: "MX" },
];

// NETHERLANDS TEAM
const netherlandsPlayers: FootballPlayer[] = [
  { id: "ned_01", name: "Noppert", jersey: 1, position: "GK", overall: 82, pace: 54, shooting: 10, passing: 58, defense: 82, strength: 80, stamina: 80, countryCode: "NL" },
  { id: "ned_02", name: "De Vrij", jersey: 4, position: "DEF", overall: 86, pace: 70, shooting: 28, passing: 75, defense: 89, strength: 86, stamina: 83, countryCode: "NL" },
  { id: "ned_03", name: "Aké", jersey: 3, position: "DEF", overall: 85, pace: 76, shooting: 30, passing: 78, defense: 86, strength: 82, stamina: 84, countryCode: "NL" },
  { id: "ned_04", name: "Blind", jersey: 2, position: "DEF", overall: 83, pace: 72, shooting: 32, passing: 79, defense: 82, strength: 76, stamina: 83, countryCode: "NL" },
  { id: "ned_05", name: "Dumfries", jersey: 5, position: "DEF", overall: 84, pace: 84, shooting: 35, passing: 74, defense: 80, strength: 82, stamina: 86, countryCode: "NL" },
  { id: "ned_06", name: "Veerman", jersey: 6, position: "MID", overall: 83, pace: 74, shooting: 70, passing: 82, defense: 76, strength: 78, stamina: 85, countryCode: "NL" },
  { id: "ned_07", name: "Gravenberch", jersey: 8, position: "MID", overall: 84, pace: 78, shooting: 72, passing: 83, defense: 74, strength: 80, stamina: 85, countryCode: "NL" },
  { id: "ned_08", name: "F. de Jong", jersey: 21, position: "MID", overall: 85, pace: 77, shooting: 71, passing: 86, defense: 72, strength: 76, stamina: 84, countryCode: "NL" },
  { id: "ned_09", name: "Memphis Depay", jersey: 7, position: "FWD", overall: 85, pace: 84, shooting: 84, passing: 80, defense: 39, strength: 76, stamina: 83, countryCode: "NL" },
  { id: "ned_10", name: "Bergwijn", jersey: 11, position: "FWD", overall: 83, pace: 86, shooting: 80, passing: 76, defense: 37, strength: 74, stamina: 82, countryCode: "NL" },
  { id: "ned_11", name: "Weghorst", jersey: 9, position: "FWD", overall: 82, pace: 78, shooting: 80, passing: 72, defense: 38, strength: 84, stamina: 82, countryCode: "NL" },
];

// USA TEAM
const usaPlayers: FootballPlayer[] = [
  { id: "usa_01", name: "Steffen", jersey: 1, position: "GK", overall: 81, pace: 54, shooting: 10, passing: 56, defense: 81, strength: 78, stamina: 80, countryCode: "US" },
  { id: "usa_02", name: "Miazga", jersey: 5, position: "DEF", overall: 82, pace: 74, shooting: 28, passing: 70, defense: 84, strength: 86, stamina: 83, countryCode: "US" },
  { id: "usa_03", name: "Ream", jersey: 2, position: "DEF", overall: 82, pace: 70, shooting: 26, passing: 72, defense: 84, strength: 82, stamina: 82, countryCode: "US" },
  { id: "usa_04", name: "Scally", jersey: 4, position: "DEF", overall: 82, pace: 80, shooting: 32, passing: 72, defense: 80, strength: 78, stamina: 85, countryCode: "US" },
  { id: "usa_05", name: "Robinson", jersey: 6, position: "DEF", overall: 81, pace: 82, shooting: 30, passing: 70, defense: 78, strength: 76, stamina: 85, countryCode: "US" },
  { id: "usa_06", name: "Adams", jersey: 3, position: "MID", overall: 83, pace: 76, shooting: 70, passing: 80, defense: 80, strength: 82, stamina: 86, countryCode: "US" },
  { id: "usa_07", name: "McKennie", jersey: 16, position: "MID", overall: 83, pace: 78, shooting: 72, passing: 79, defense: 76, strength: 82, stamina: 86, countryCode: "US" },
  { id: "usa_08", name: "Musah", jersey: 8, position: "MID", overall: 82, pace: 76, shooting: 68, passing: 82, defense: 72, strength: 76, stamina: 84, countryCode: "US" },
  { id: "usa_09", name: "Pulisic", jersey: 10, position: "FWD", overall: 84, pace: 86, shooting: 82, passing: 78, defense: 39, strength: 72, stamina: 84, countryCode: "US" },
  { id: "usa_10", name: "Sargent", jersey: 9, position: "FWD", overall: 81, pace: 82, shooting: 78, passing: 72, defense: 37, strength: 76, stamina: 82, countryCode: "US" },
  { id: "usa_11", name: "Aaronson", jersey: 11, position: "FWD", overall: 82, pace: 84, shooting: 80, passing: 76, defense: 38, strength: 72, stamina: 83, countryCode: "US" },
];

// Helper to create placeholder players for teams needing data
const createPlaceholderPlayers = (count: number, teamCode: string): FootballPlayer[] => {
  const positions: ("GK" | "DEF" | "DEF" | "DEF" | "DEF" | "MID" | "MID" | "MID" | "FWD" | "FWD" | "FWD")[] = 
    ["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD"];
  return Array.from({ length: count }, (_, i) => ({
    id: `${teamCode.toLowerCase()}_${String(i + 1).padStart(2, '0')}`,
    name: `Player ${i + 1}`,
    jersey: i + 1,
    position: positions[i] || "MID",
    overall: Math.floor(Math.random() * 15) + 78,
    pace: Math.floor(Math.random() * 30) + 65,
    shooting: Math.floor(Math.random() * 35) + 60,
    passing: Math.floor(Math.random() * 35) + 65,
    defense: Math.floor(Math.random() * 35) + 60,
    strength: Math.floor(Math.random() * 25) + 72,
    stamina: Math.floor(Math.random() * 15) + 80,
    countryCode: teamCode,
  }));
};

// Additional team players - simplified rosters for remaining teams
const canadaPlayers = createPlaceholderPlayers(11, "CAN");
const moroccoPlayers = createPlaceholderPlayers(11, "MAR");
const uruguayPlayers = createPlaceholderPlayers(11, "URY");
const belgiumPlayers = createPlaceholderPlayers(11, "BEL");
const italyPlayers = createPlaceholderPlayers(11, "ITA");
const egyptPlayers = createPlaceholderPlayers(11, "EGY");
const polandPlayers = createPlaceholderPlayers(11, "POL");
const japanPlayers = createPlaceholderPlayers(11, "JPN");
const australiaPlayers = createPlaceholderPlayers(11, "AUS");
const southKoreaPlayers = createPlaceholderPlayers(11, "KOR");
const chinaPlayers = createPlaceholderPlayers(11, "CHN");
const iraqPlayers = createPlaceholderPlayers(11, "IRQ");
const iranPlayers = createPlaceholderPlayers(11, "IRN");
const saudiArabiaPlayers = createPlaceholderPlayers(11, "KSA");
const uzbekistanPlayers = createPlaceholderPlayers(11, "UZB");
const costaRicaPlayers = createPlaceholderPlayers(11, "CRC");
const greecePlayers = createPlaceholderPlayers(11, "GRE");
const paraguayPlayers = createPlaceholderPlayers(11, "PAR");
const maliPlayers = createPlaceholderPlayers(11, "MLI");
const norwayPlayers = createPlaceholderPlayers(11, "NOR");
const serbiaPlayers = createPlaceholderPlayers(11, "SRB");
const turkeyPlayers = createPlaceholderPlayers(11, "TUR");

export const WORLD_CUP_2026_TEAMS: FootballTeam[] = [
  // GROUP A
  { id: "ARG", name: "Argentina", shortCode: "ARG", countryCode: "AR", flag: "🇦🇷", primaryColor: "#1968A1", secondaryColor: "#FFF", accentColor: "#FFD60A", players: argentinaPlayers, overallRating: 87, attackRating: 91, defenseRating: 88, midfieldRating: 85 },
  { id: "CAN", name: "Canada", shortCode: "CAN", countryCode: "CA", flag: "🇨🇦", primaryColor: "#FF0000", secondaryColor: "#FFF", accentColor: "#000000", players: canadaPlayers, overallRating: 81, attackRating: 81, defenseRating: 81, midfieldRating: 81 },
  { id: "MAR", name: "Morocco", shortCode: "MAR", countryCode: "MA", flag: "🇲🇦", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#007F3E", players: moroccoPlayers, overallRating: 82, attackRating: 82, defenseRating: 82, midfieldRating: 82 },
  { id: "URY", name: "Uruguay", shortCode: "URY", countryCode: "UY", flag: "🇺🇾", primaryColor: "#0055B8", secondaryColor: "#FFF", accentColor: "#FFD700", players: uruguayPlayers, overallRating: 83, attackRating: 85, defenseRating: 82, midfieldRating: 83 },
  
  // GROUP B
  { id: "FRA", name: "France", shortCode: "FRA", countryCode: "FR", flag: "🇫🇷", primaryColor: "#0055B8", secondaryColor: "#FFF", accentColor: "#FF0000", players: francePlayers, overallRating: 88, attackRating: 93, defenseRating: 87, midfieldRating: 86 },
  { id: "NED", name: "Netherlands", shortCode: "NED", countryCode: "NL", flag: "🇳🇱", primaryColor: "#FF6600", secondaryColor: "#FFF", accentColor: "#0066CC", players: netherlandsPlayers, overallRating: 84, attackRating: 84, defenseRating: 85, midfieldRating: 85 },
  { id: "POL", name: "Poland", shortCode: "POL", countryCode: "PL", flag: "🇵🇱", primaryColor: "#FFF", secondaryColor: "#FF0000", accentColor: "#000000", players: polandPlayers, overallRating: 82, attackRating: 84, defenseRating: 82, midfieldRating: 82 },
  { id: "MEX", name: "Mexico", shortCode: "MEX", countryCode: "MX", flag: "🇲🇽", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#007F3E", players: mexicoPlayers, overallRating: 82, attackRating: 82, defenseRating: 82, midfieldRating: 82 },
  
  // GROUP C
  { id: "BRA", name: "Brazil", shortCode: "BRA", countryCode: "BR", flag: "🇧🇷", primaryColor: "#002776", secondaryColor: "#FFF", accentColor: "#FFD700", players: brazilPlayers, overallRating: 86, attackRating: 89, defenseRating: 86, midfieldRating: 85 },
  { id: "ESP", name: "Spain", shortCode: "ESP", countryCode: "ES", flag: "🇪🇸", primaryColor: "#C60C30", secondaryColor: "#FFC400", accentColor: "#002D52", players: spainPlayers, overallRating: 85, attackRating: 85, defenseRating: 86, midfieldRating: 87 },
  { id: "GER", name: "Germany", shortCode: "GER", countryCode: "DE", flag: "🇩🇪", primaryColor: "#000000", secondaryColor: "#FFF", accentColor: "#FFD700", players: germanyPlayers, overallRating: 86, attackRating: 87, defenseRating: 88, midfieldRating: 87 },
  { id: "JPN", name: "Japan", shortCode: "JPN", countryCode: "JP", flag: "🇯🇵", primaryColor: "#BC002D", secondaryColor: "#FFF", accentColor: "#FFF", players: japanPlayers, overallRating: 80, attackRating: 80, defenseRating: 80, midfieldRating: 80 },
  
  // GROUP D
  { id: "BEL", name: "Belgium", shortCode: "BEL", countryCode: "BE", flag: "🇧🇪", primaryColor: "#000000", secondaryColor: "#FFC400", accentColor: "#CE1126", players: belgiumPlayers, overallRating: 82, attackRating: 84, defenseRating: 81, midfieldRating: 82 },
  { id: "ITA", name: "Italy", shortCode: "ITA", countryCode: "IT", flag: "🇮🇹", primaryColor: "#009246", secondaryColor: "#FFF", accentColor: "#CE2B37", players: italyPlayers, overallRating: 82, attackRating: 82, defenseRating: 83, midfieldRating: 82 },
  { id: "EGY", name: "Egypt", shortCode: "EGY", countryCode: "EG", flag: "🇪🇬", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#000000", players: egyptPlayers, overallRating: 80, attackRating: 80, defenseRating: 80, midfieldRating: 80 },
  { id: "USA", name: "United States", shortCode: "USA", countryCode: "US", flag: "🇺🇸", primaryColor: "#002868", secondaryColor: "#FFF", accentColor: "#BF0A30", players: usaPlayers, overallRating: 82, attackRating: 83, defenseRating: 82, midfieldRating: 82 },
  
  // GROUP E
  { id: "ENG", name: "England", shortCode: "ENG", countryCode: "GB", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", primaryColor: "#012169", secondaryColor: "#FFF", accentColor: "#C8102E", players: englandPlayers, overallRating: 85, attackRating: 87, defenseRating: 84, midfieldRating: 84 },
  { id: "POR", name: "Portugal", shortCode: "POR", countryCode: "PT", flag: "🇵🇹", primaryColor: "#C8102E", secondaryColor: "#FFF", accentColor: "#007A5E", players: portugalPlayers, overallRating: 85, attackRating: 87, defenseRating: 85, midfieldRating: 84 },
  { id: "TUR", name: "Turkey", shortCode: "TUR", countryCode: "TR", flag: "🇹🇷", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#FFF", players: turkeyPlayers, overallRating: 80, attackRating: 80, defenseRating: 80, midfieldRating: 80 },
  { id: "CZE", name: "Czech Republic", shortCode: "CZE", countryCode: "CZ", flag: "🇨🇿", primaryColor: "#11457E", secondaryColor: "#FFF", accentColor: "#D60C18", players: createPlaceholderPlayers(11, "CZE"), overallRating: 79, attackRating: 79, defenseRating: 79, midfieldRating: 79 },
  
  // GROUP F
  { id: "AUS", name: "Australia", shortCode: "AUS", countryCode: "AU", flag: "🇦🇺", primaryColor: "#00A651", secondaryColor: "#FFD100", accentColor: "#003DA5", players: australiaPlayers, overallRating: 79, attackRating: 79, defenseRating: 79, midfieldRating: 79 },
  { id: "SRB", name: "Serbia", shortCode: "SRB", countryCode: "RS", flag: "🇷🇸", primaryColor: "#C60C30", secondaryColor: "#FFF", accentColor: "#003DA5", players: serbiaPlayers, overallRating: 80, attackRating: 80, defenseRating: 80, midfieldRating: 80 },
  { id: "KOR", name: "South Korea", shortCode: "KOR", countryCode: "KR", flag: "🇰🇷", primaryColor: "#C60C30", secondaryColor: "#FFF", accentColor: "#003478", players: southKoreaPlayers, overallRating: 80, attackRating: 80, defenseRating: 80, midfieldRating: 80 },
  { id: "MEX", name: "Mexico", shortCode: "MEX2", countryCode: "MX", flag: "🇲🇽", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#007F3E", players: mexicoPlayers, overallRating: 82, attackRating: 82, defenseRating: 82, midfieldRating: 82 },
  
  // GROUP G
  { id: "CHN", name: "China", shortCode: "CHN", countryCode: "CN", flag: "🇨🇳", primaryColor: "#DE2910", secondaryColor: "#FFD700", accentColor: "#000000", players: chinaPlayers, overallRating: 78, attackRating: 78, defenseRating: 78, midfieldRating: 78 },
  { id: "IRN", name: "Iran", shortCode: "IRN", countryCode: "IR", flag: "🇮🇷", primaryColor: "#239F40", secondaryColor: "#FFF", accentColor: "#CE1126", players: iranPlayers, overallRating: 78, attackRating: 78, defenseRating: 78, midfieldRating: 78 },
  { id: "KSA", name: "Saudi Arabia", shortCode: "KSA", countryCode: "SA", flag: "🇸🇦", primaryColor: "#006C35", secondaryColor: "#FFF", accentColor: "#CE1126", players: saudiArabiaPlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
  { id: "UZB", name: "Uzbekistan", shortCode: "UZB", countryCode: "UZ", flag: "🇺🇿", primaryColor: "#0099DA", secondaryColor: "#FFF", accentColor: "#CE1126", players: uzbekistanPlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
  
  // GROUP H
  { id: "CRC", name: "Costa Rica", shortCode: "CRC", countryCode: "CR", flag: "🇨🇷", primaryColor: "#0052B4", secondaryColor: "#FFF", accentColor: "#CE1126", players: costaRicaPlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
  { id: "GRE", name: "Greece", shortCode: "GRE", countryCode: "GR", flag: "🇬🇷", primaryColor: "#0052B4", secondaryColor: "#FFF", accentColor: "#F3B21E", players: greecePlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
  { id: "PAR", name: "Paraguay", shortCode: "PAR", countryCode: "PY", flag: "🇵🇾", primaryColor: "#003DA5", secondaryColor: "#FFF", accentColor: "#CE1126", players: paraguayPlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
  { id: "MLI", name: "Mali", shortCode: "MLI", countryCode: "ML", flag: "🇲🇱", primaryColor: "#008C45", secondaryColor: "#FFD700", accentColor: "#CE1126", players: maliPlayers, overallRating: 76, attackRating: 76, defenseRating: 76, midfieldRating: 76 },
  { id: "NOR", name: "Norway", shortCode: "NOR", countryCode: "NO", flag: "🇳🇴", primaryColor: "#002868", secondaryColor: "#FFF", accentColor: "#E8000B", players: norwayPlayers, overallRating: 79, attackRating: 79, defenseRating: 79, midfieldRating: 79 },
  { id: "IRQ", name: "Iraq", shortCode: "IRQ", countryCode: "IQ", flag: "🇮🇶", primaryColor: "#CE1126", secondaryColor: "#FFF", accentColor: "#007A5E", players: iraqPlayers, overallRating: 77, attackRating: 77, defenseRating: 77, midfieldRating: 77 },
];

export const getTeamById = (id: string): FootballTeam | undefined =>
  WORLD_CUP_2026_TEAMS.find((team) => team.id === id);

export const getTeamPlayers = (teamId: string): FootballPlayer[] => {
  const team = getTeamById(teamId);
  return team ? team.players : [];
};

export const getAllTeams = (): FootballTeam[] => WORLD_CUP_2026_TEAMS;
