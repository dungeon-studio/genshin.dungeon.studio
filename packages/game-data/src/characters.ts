import type { Element } from './elements.js';
import type { Rarity } from './rarities.js';
import type { WeaponType } from './weapons.js';

/**
 * Character definition
 */
export interface Character {
  id: string;
  name: string;
  element: Element;
  weaponType: WeaponType;
  rarity: Rarity;
  region: string;
  version: string; // Release version (e.g., "1.0", "3.1", "5.2")
}

/**
 * Complete playable character data
 *
 * Contains all 107 playable Genshin Impact characters (as of version Luna IV)
 * Excludes: Traveler, Wonderland Manekin, and Aloy (special cases with element "None" or non-standard obtainment)
 *
 * Sorted by:
 * 1. Rarity descending (5-star first, then 4-star)
 * 2. Version descending within each rarity (newest first: Luna IV > 5.8 > 5.7 > ... > 1.0)
 *
 * To add more characters, follow the guide in docs/how-tos/update-game-characters.md
 */
export const CHARACTERS: Character[] = [
  // 5-star characters (sorted by version descending)

  // Luna IV
  {
    id: 'columbina',
    name: 'Columbina',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Nod-Krai',
    version: 'Luna IV',
  },

  // Luna III
  {
    id: 'durin',
    name: 'Durin',
    element: 'Pyro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Mondstadt',
    version: 'Luna III',
  },

  // Luna II
  {
    id: 'nefer',
    name: 'Nefer',
    element: 'Dendro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Nod-Krai',
    version: 'Luna II',
  },

  // Luna I
  {
    id: 'flins',
    name: 'Flins',
    element: 'Electro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Nod-Krai',
    version: 'Luna I',
  },
  {
    id: 'lauma',
    name: 'Lauma',
    element: 'Dendro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Nod-Krai',
    version: 'Luna I',
  },

  // 5.8
  {
    id: 'ineffa',
    name: 'Ineffa',
    element: 'Electro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Nod-Krai',
    version: '5.8',
  },

  // 5.7
  {
    id: 'skirk',
    name: 'Skirk',
    element: 'Cryo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Unknown',
    version: '5.7',
  },

  // 5.6
  {
    id: 'escoffier',
    name: 'Escoffier',
    element: 'Cryo',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Fontaine',
    version: '5.6',
  },

  // 5.5
  {
    id: 'varesa',
    name: 'Varesa',
    element: 'Electro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Natlan',
    version: '5.5',
  },

  // 5.4
  {
    id: 'yumemizuki-mizuki',
    name: 'Yumemizuki Mizuki',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Inazuma',
    version: '5.4',
  },

  // 5.3
  {
    id: 'citlali',
    name: 'Citlali',
    element: 'Cryo',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Natlan',
    version: '5.3',
  },
  {
    id: 'mavuika',
    name: 'Mavuika',
    element: 'Pyro',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Natlan',
    version: '5.3',
  },

  // 5.2
  {
    id: 'chasca',
    name: 'Chasca',
    element: 'Anemo',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Natlan',
    version: '5.2',
  },

  // 5.1
  {
    id: 'xilonen',
    name: 'Xilonen',
    element: 'Geo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Natlan',
    version: '5.1',
  },

  // 5.0
  {
    id: 'kinich',
    name: 'Kinich',
    element: 'Dendro',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Natlan',
    version: '5.0',
  },
  {
    id: 'mualani',
    name: 'Mualani',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Natlan',
    version: '5.0',
  },

  // 4.8
  {
    id: 'emilie',
    name: 'Emilie',
    element: 'Dendro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Fontaine',
    version: '4.8',
  },

  // 4.7
  {
    id: 'clorinde',
    name: 'Clorinde',
    element: 'Electro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Fontaine',
    version: '4.7',
  },
  {
    id: 'sigewinne',
    name: 'Sigewinne',
    element: 'Hydro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Fontaine',
    version: '4.7',
  },

  // 4.6
  {
    id: 'arlecchino',
    name: 'Arlecchino',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Snezhnaya',
    version: '4.6',
  },

  // 4.5
  {
    id: 'chiori',
    name: 'Chiori',
    element: 'Geo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Inazuma',
    version: '4.5',
  },

  // 4.4
  {
    id: 'xianyun',
    name: 'Xianyun',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Liyue',
    version: '4.4',
  },

  // 4.3
  {
    id: 'navia',
    name: 'Navia',
    element: 'Geo',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Fontaine',
    version: '4.3',
  },

  // 4.2
  {
    id: 'furina',
    name: 'Furina',
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Fontaine',
    version: '4.2',
  },

  // 4.1
  {
    id: 'neuvillette',
    name: 'Neuvillette',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Fontaine',
    version: '4.1',
  },
  {
    id: 'wriothesley',
    name: 'Wriothesley',
    element: 'Cryo',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Fontaine',
    version: '4.1',
  },

  // 4.0
  {
    id: 'lyney',
    name: 'Lyney',
    element: 'Pyro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Fontaine',
    version: '4.0',
  },

  // 3.7

  // 3.6
  {
    id: 'baizhu',
    name: 'Baizhu',
    element: 'Dendro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Liyue',
    version: '3.6',
  },

  // 3.5
  {
    id: 'dehya',
    name: 'Dehya',
    element: 'Pyro',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Sumeru',
    version: '3.5',
  },

  // 3.4
  {
    id: 'alhaitham',
    name: 'Alhaitham',
    element: 'Dendro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Sumeru',
    version: '3.4',
  },

  // 3.3
  {
    id: 'wanderer',
    name: 'Wanderer',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Sumeru',
    version: '3.3',
  },

  // 3.2
  {
    id: 'nahida',
    name: 'Nahida',
    element: 'Dendro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Sumeru',
    version: '3.2',
  },

  // 3.1
  {
    id: 'cyno',
    name: 'Cyno',
    element: 'Electro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Sumeru',
    version: '3.1',
  },
  {
    id: 'nilou',
    name: 'Nilou',
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Sumeru',
    version: '3.1',
  },

  // 3.0
  {
    id: 'tighnari',
    name: 'Tighnari',
    element: 'Dendro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Sumeru',
    version: '3.0',
  },

  // 2.8

  // 2.7
  {
    id: 'yelan',
    name: 'Yelan',
    element: 'Hydro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Liyue',
    version: '2.7',
  },

  // 2.6
  {
    id: 'kamisato-ayato',
    name: 'Kamisato Ayato',
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Inazuma',
    version: '2.6',
  },

  // 2.5
  {
    id: 'yae-miko',
    name: 'Yae Miko',
    element: 'Electro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Inazuma',
    version: '2.5',
  },

  // 2.4
  {
    id: 'shenhe',
    name: 'Shenhe',
    element: 'Cryo',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Liyue',
    version: '2.4',
  },

  // 2.3
  {
    id: 'arataki-itto',
    name: 'Arataki Itto',
    element: 'Geo',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Inazuma',
    version: '2.3',
  },

  // 2.2

  // 2.1
  {
    id: 'raiden-shogun',
    name: 'Raiden Shogun',
    element: 'Electro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Inazuma',
    version: '2.1',
  },
  {
    id: 'sangonomiya-kokomi',
    name: 'Sangonomiya Kokomi',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Inazuma',
    version: '2.1',
  },

  // 2.0
  {
    id: 'kamisato-ayaka',
    name: 'Kamisato Ayaka',
    element: 'Cryo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Inazuma',
    version: '2.0',
  },
  {
    id: 'yoimiya',
    name: 'Yoimiya',
    element: 'Pyro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Inazuma',
    version: '2.0',
  },

  // 1.6
  {
    id: 'kaedehara-kazuha',
    name: 'Kaedehara Kazuha',
    element: 'Anemo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Inazuma',
    version: '1.6',
  },

  // 1.5
  {
    id: 'eula',
    name: 'Eula',
    element: 'Cryo',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.5',
  },

  // 1.4

  // 1.3
  {
    id: 'hu-tao',
    name: 'Hu Tao',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Liyue',
    version: '1.3',
  },
  {
    id: 'xiao',
    name: 'Xiao',
    element: 'Anemo',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Liyue',
    version: '1.3',
  },

  // 1.2
  {
    id: 'albedo',
    name: 'Albedo',
    element: 'Geo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.2',
  },
  {
    id: 'ganyu',
    name: 'Ganyu',
    element: 'Cryo',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Liyue',
    version: '1.2',
  },

  // 1.1
  {
    id: 'tartaglia',
    name: 'Tartaglia',
    element: 'Hydro',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Snezhnaya',
    version: '1.1',
  },
  {
    id: 'zhongli',
    name: 'Zhongli',
    element: 'Geo',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Liyue',
    version: '1.1',
  },

  // 1.0
  {
    id: 'diluc',
    name: 'Diluc',
    element: 'Pyro',
    weaponType: 'Claymore',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'jean',
    name: 'Jean',
    element: 'Anemo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'keqing',
    name: 'Keqing',
    element: 'Electro',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'klee',
    name: 'Klee',
    element: 'Pyro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'mona',
    name: 'Mona',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'qiqi',
    name: 'Qiqi',
    element: 'Cryo',
    weaponType: 'Sword',
    rarity: 5,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'venti',
    name: 'Venti',
    element: 'Anemo',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Mondstadt',
    version: '1.0',
  },

  // 4-star characters (sorted by version descending)

  // Luna III
  {
    id: 'jahoda',
    name: 'Jahoda',
    element: 'Anemo',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Nod-Krai',
    version: 'Luna III',
  },

  // Luna I
  {
    id: 'aino',
    name: 'Aino',
    element: 'Hydro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Nod-Krai',
    version: 'Luna I',
  },

  // 5.7
  {
    id: 'dahlia',
    name: 'Dahlia',
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Mondstadt',
    version: '5.7',
  },

  // 5.6
  {
    id: 'ifa',
    name: 'Ifa',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Natlan',
    version: '5.6',
  },

  // 5.5
  {
    id: 'iansan',
    name: 'Iansan',
    element: 'Electro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Natlan',
    version: '5.5',
  },

  // 5.3
  {
    id: 'lan-yan',
    name: 'Lan Yan',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Liyue',
    version: '5.3',
  },

  // 5.2
  {
    id: 'ororon',
    name: 'Ororon',
    element: 'Electro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Natlan',
    version: '5.2',
  },

  // 5.0
  {
    id: 'kachina',
    name: 'Kachina',
    element: 'Geo',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Natlan',
    version: '5.0',
  },

  // 4.7
  {
    id: 'sethos',
    name: 'Sethos',
    element: 'Electro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Sumeru',
    version: '4.7',
  },

  // 4.4
  {
    id: 'gaming',
    name: 'Gaming',
    element: 'Pyro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Liyue',
    version: '4.4',
  },

  // 4.3
  {
    id: 'chevreuse',
    name: 'Chevreuse',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Fontaine',
    version: '4.3',
  },

  // 4.2
  {
    id: 'charlotte',
    name: 'Charlotte',
    element: 'Cryo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Fontaine',
    version: '4.2',
  },

  // 4.0
  {
    id: 'freminet',
    name: 'Freminet',
    element: 'Cryo',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Fontaine',
    version: '4.0',
  },
  {
    id: 'lynette',
    name: 'Lynette',
    element: 'Anemo',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Fontaine',
    version: '4.0',
  },

  // 3.7
  {
    id: 'kirara',
    name: 'Kirara',
    element: 'Dendro',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Inazuma',
    version: '3.7',
  },

  // 3.6
  {
    id: 'kaveh',
    name: 'Kaveh',
    element: 'Dendro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Sumeru',
    version: '3.6',
  },

  // 3.5
  {
    id: 'mika',
    name: 'Mika',
    element: 'Cryo',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Mondstadt',
    version: '3.5',
  },

  // 3.4
  {
    id: 'yaoyao',
    name: 'Yaoyao',
    element: 'Dendro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Liyue',
    version: '3.4',
  },

  // 3.3
  {
    id: 'faruzan',
    name: 'Faruzan',
    element: 'Anemo',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Sumeru',
    version: '3.3',
  },

  // 3.2
  {
    id: 'layla',
    name: 'Layla',
    element: 'Cryo',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Sumeru',
    version: '3.2',
  },

  // 3.1
  {
    id: 'candace',
    name: 'Candace',
    element: 'Hydro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Sumeru',
    version: '3.1',
  },

  // 3.0
  {
    id: 'collei',
    name: 'Collei',
    element: 'Dendro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Sumeru',
    version: '3.0',
  },
  {
    id: 'dori',
    name: 'Dori',
    element: 'Electro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Sumeru',
    version: '3.0',
  },

  // 2.8
  {
    id: 'shikanoin-heizou',
    name: 'Shikanoin Heizou',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Inazuma',
    version: '2.8',
  },

  // 2.7
  {
    id: 'kuki-shinobu',
    name: 'Kuki Shinobu',
    element: 'Electro',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Inazuma',
    version: '2.7',
  },

  // 2.6

  // 2.5

  // 2.4
  {
    id: 'yun-jin',
    name: 'Yun Jin',
    element: 'Geo',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Liyue',
    version: '2.4',
  },

  // 2.3
  {
    id: 'gorou',
    name: 'Gorou',
    element: 'Geo',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Inazuma',
    version: '2.3',
  },

  // 2.2
  {
    id: 'thoma',
    name: 'Thoma',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Inazuma',
    version: '2.2',
  },

  // 2.1
  {
    id: 'kujou-sara',
    name: 'Kujou Sara',
    element: 'Electro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Inazuma',
    version: '2.1',
  },

  // 2.0
  {
    id: 'sayu',
    name: 'Sayu',
    element: 'Anemo',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Inazuma',
    version: '2.0',
  },

  // 1.6

  // 1.5
  {
    id: 'yanfei',
    name: 'Yanfei',
    element: 'Pyro',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Liyue',
    version: '1.5',
  },

  // 1.4
  {
    id: 'rosaria',
    name: 'Rosaria',
    element: 'Cryo',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.4',
  },

  // 1.3

  // 1.2

  // 1.1
  {
    id: 'diona',
    name: 'Diona',
    element: 'Cryo',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.1',
  },
  {
    id: 'xinyan',
    name: 'Xinyan',
    element: 'Pyro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Liyue',
    version: '1.1',
  },

  // 1.0
  {
    id: 'amber',
    name: 'Amber',
    element: 'Pyro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'barbara',
    name: 'Barbara',
    element: 'Hydro',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'beidou',
    name: 'Beidou',
    element: 'Electro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'bennett',
    name: 'Bennett',
    element: 'Pyro',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'chongyun',
    name: 'Chongyun',
    element: 'Cryo',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'fischl',
    name: 'Fischl',
    element: 'Electro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'kaeya',
    name: 'Kaeya',
    element: 'Cryo',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'lisa',
    name: 'Lisa',
    element: 'Electro',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'ningguang',
    name: 'Ningguang',
    element: 'Geo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'noelle',
    name: 'Noelle',
    element: 'Geo',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'razor',
    name: 'Razor',
    element: 'Electro',
    weaponType: 'Claymore',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'sucrose',
    name: 'Sucrose',
    element: 'Anemo',
    weaponType: 'Catalyst',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
  },
  {
    id: 'xiangling',
    name: 'Xiangling',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
  },
  {
    id: 'xingqiu',
    name: 'Xingqiu',
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
  },
];

/**
 * Helper to find character by ID
 */
export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find((char) => char.id === id);
}

/**
 * Helper to filter characters by element
 */
export function getCharactersByElement(element: Element): Character[] {
  return CHARACTERS.filter((char) => char.element === element);
}

/**
 * Helper to filter characters by weapon type
 */
export function getCharactersByWeaponType(weaponType: WeaponType): Character[] {
  return CHARACTERS.filter((char) => char.weaponType === weaponType);
}

/**
 * Helper to filter characters by rarity
 */
export function getCharactersByRarity(rarity: Rarity): Character[] {
  return CHARACTERS.filter((char) => char.rarity === rarity);
}

/**
 * Helper to filter characters by version
 */
export function getCharactersByVersion(version: string): Character[] {
  return CHARACTERS.filter((char) => char.version === version);
}
