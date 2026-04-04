// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Artifact set piece types
 */
export const ARTIFACT_PIECES = {
  FLOWER: 'Flower of Life',
  PLUME: 'Plume of Death',
  SANDS: 'Sands of Eon',
  GOBLET: 'Goblet of Eonothem',
  CIRCLET: 'Circlet of Logos',
} as const;

export type ArtifactPiece = (typeof ARTIFACT_PIECES)[keyof typeof ARTIFACT_PIECES];

/**
 * Artifact set definition
 *
 * This is a straight inventory of game data only.
 * Analysis (stat recommendations, playstyle pairings, etc.) is deferred to
 * higher-level application logic and planning layers.
 *
 * FUTURE: Consider adding obsolescedBy field to track when newer sets replace older ones.
 */
export interface ArtifactSet {
  id: string;
  name: string;
  version: string; // Release version (e.g., "1.0", "3.0", "4.3")
  bonuses: Record<2 | 4, string>; // 2-piece and 4-piece bonus descriptions
}

/**
 * Artifact sets data - 5-STAR SETS ONLY
 * Sorted by version descending (newest first)
 * Last updated: Version 5.8
 * Total: 42 five-star artifact sets for endgame optimization
 */
export const ARTIFACT_SETS: ArtifactSet[] = [
  // 5-Star Artifact Sets (v2.0+), sorted newest to oldest
  {
    id: 'aubade-of-morningstar-and-moon',
    name: 'Aubade of Morningstar and Moon',
    version: '5.8',
    bonuses: {
      2: 'Increases Elemental Mastery by 80.',
      4: "When the equipping character is off-field, Lunar Reaction DMG is increased by 20%. When the party's Moonsign Level is at least Ascendant Gleam, Lunar Reaction DMG will be further increased by 40%. This effect will disappear after the equipping character is active for 3s.",
    },
  },
  {
    id: 'a-day-carved-from-rising-winds',
    name: 'A Day Carved From Rising Winds',
    version: '5.7',
    bonuses: {
      2: 'ATK +18%.',
      4: "After a Normal Attack, Charged Attack, Elemental Skill or Elemental Burst hits an opponent, gain the Blessing of Pastoral Winds effect for 6s: ATK is increased by 25%. If the equipping character has completed Witch's Homework, Blessing of Pastoral Winds will be upgraded to Resolve of Pastoral Winds, which also increases the CRIT Rate of the equipping character by an additional 20%. This effect can be triggered once every second.",
    },
  },
  {
    id: 'silken-moons-serenade',
    name: "Silken Moon's Serenade",
    version: '5.6',
    bonuses: {
      2: 'Energy Recharge +20%.',
      4: "When dealing Elemental DMG, gain the Gleaming Moon: Devotion effect for 8s: Increases all party members' Elemental Mastery by 60/120 when the party's Moonsign is Nascent Gleam/Ascendant Gleam. The equipping character can trigger this effect while off-field. All party members' Lunar Reaction DMG is increased by 10% for each different Gleaming Moon effect that party members have.",
    },
  },
  {
    id: 'night-of-the-skys-unveiling',
    name: "Night of the Sky's Unveiling",
    version: '5.5',
    bonuses: {
      2: 'Increases Elemental Mastery by 80.',
      4: "When nearby party members trigger Lunar Reactions, if the equipping character is on the field, gain the Gleaming Moon: Intent effect for 4s: Increases CRIT Rate by 15%/30% when the party's Moonsign is Nascent Gleam/Ascendant Gleam. All party members' Lunar Reaction DMG is increased by 10% for each different Gleaming Moon effect that party members have.",
    },
  },
  {
    id: 'finale-of-the-deep-galleries',
    name: 'Finale of the Deep Galleries',
    version: '5.4',
    bonuses: {
      2: 'Cryo DMG Bonus +15%.',
      4: 'When the equipping character has 0 Elemental Energy, Normal Attack DMG is increased by 60% and Elemental Burst DMG is increased by 60%. After the equipping character deals Normal Attack DMG, the aforementioned Elemental Burst effect will stop applying for 6s. After the equipping character deals Elemental Burst DMG, the aforementioned Normal Attack effect will stop applying for 6s.',
    },
  },
  {
    id: 'long-nights-oath',
    name: "Long Night's Oath",
    version: '5.3',
    bonuses: {
      2: 'Plunging Attack DMG increased by 25%.',
      4: 'After the equipping character\'s Plunging Attack/Charged Attack/Elemental Skill hits an opponent, they will gain 1/2/2 stack(s) of "Radiance Everlasting." Plunging Attacks, Charged Attacks or Elemental Skills can each trigger this effect once every 1s. Radiance Everlasting: Plunging Attacks deal 15% increased DMG for 6s. Max 5 stacks.',
    },
  },
  {
    id: 'obsidian-codex',
    name: 'Obsidian Codex',
    version: '5.2',
    bonuses: {
      2: "While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%.",
      4: 'After the equipping character consumes 1 Nightsoul point while on the field, CRIT Rate increases by 40% for 6s. This effect can trigger once every second.',
    },
  },
  {
    id: 'scroll-of-the-hero-of-cinder-city',
    name: 'Scroll of the Hero of Cinder City',
    version: '5.0',
    bonuses: {
      2: 'When a nearby party member triggers a Nightsoul Burst, the equipping character regenerates 6 Elemental Energy.',
      4: "After the equipping character triggers a reaction related to their Elemental Type, all nearby party members gain a 12% Elemental DMG Bonus for the Elemental Types involved in the elemental reaction for 15s. If the equipping character is in the Nightsoul's Blessing state when triggering this effect, all nearby party members gain an additional 28% Elemental DMG Bonus.",
    },
  },
  {
    id: 'unfinished-reverie',
    name: 'Unfinished Reverie',
    version: '4.6',
    bonuses: {
      2: 'ATK +18%.',
      4: 'After leaving combat for 3s, DMG dealt increased by 50%. In combat, if no Burning opponents are nearby for more than 6s, this DMG Bonus will decrease by 10% per second until it reaches 0%. When a Burning opponent exists, it will increase by 10% instead until it reaches 50%.',
    },
  },
  {
    id: 'fragment-of-harmonic-whimsy',
    name: 'Fragment of Harmonic Whimsy',
    version: '4.6',
    bonuses: {
      2: 'ATK +18%.',
      4: 'When the value of a Bond of Life increases or decreases, this character deals 18% increased DMG for 6s. Max 3 stacks.',
    },
  },
  {
    id: 'nighttime-whispers-in-the-echoing-woods',
    name: 'Nighttime Whispers in the Echoing Woods',
    version: '4.3',
    bonuses: {
      2: 'ATK +18%.',
      4: 'After using an Elemental Skill, gain a 20% Geo DMG Bonus for 10s. When under a shield granted by the Crystallize reaction, or when Moondrifts formed by Lunar-Crystallize reactions are nearby, the above effect will be increased by 150%.',
    },
  },
  {
    id: 'song-of-days-past',
    name: 'Song of Days Past',
    version: '4.3',
    bonuses: {
      2: 'Healing Bonus +15%.',
      4: 'When the equipping character heals a party member, the Yearning effect will be created for 6s, which records the total amount of healing provided (including overflow healing). When the duration expires, the Yearning effect will be transformed into the "Waves of Days Past" effect.',
    },
  },
  {
    id: 'golden-troupe',
    name: 'Golden Troupe',
    version: '3.4',
    bonuses: {
      2: 'Increases Elemental Skill DMG by 20%.',
      4: 'Increases Elemental Skill DMG by 25%. Additionally, when not on the field, Elemental Skill DMG will be further increased by 25%. This effect will be cleared 2s after taking the field.',
    },
  },
  {
    id: 'marechaussee-hunter',
    name: 'Marechaussee Hunter',
    version: '3.4',
    bonuses: {
      2: 'Normal and Charged Attack DMG +15%.',
      4: 'When current HP increases or decreases, CRIT Rate will be increased by 12% for 5s. Max 3 stacks.',
    },
  },
  {
    id: 'vourukashas-glow',
    name: "Vourukasha's Glow",
    version: '3.6',
    bonuses: {
      2: 'HP +20%.',
      4: 'Elemental Skill and Elemental Burst DMG will be increased by 10%. After the equipping character takes DMG, the aforementioned DMG Bonus is increased by 80% for 5s. This effect increase can have 5 stacks.',
    },
  },
  {
    id: 'nymphs-dream',
    name: "Nymph's Dream",
    version: '3.6',
    bonuses: {
      2: 'Hydro DMG Bonus +15%.',
      4: 'After Normal, Charged, and Plunging Attacks, Elemental Skills, and Elemental Bursts hit opponents, 1 stack of Mirrored Nymph will be triggered, lasting 8s. When under the effect of 1, 2, or 3 or more Mirrored Nymph stacks, ATK will be increased by 7%/16%/25%, and Hydro DMG will be increased by 4%/9%/15%.',
    },
  },
  {
    id: 'flower-of-paradise-lost',
    name: 'Flower of Paradise Lost',
    version: '3.3',
    bonuses: {
      2: 'Increases Elemental Mastery by 80.',
      4: "The equipping character's Bloom, Hyperbloom, and Burgeon reaction DMG are increased by 40%, and their Lunar-Bloom reaction DMG is increased by 10%. Additionally, after the equipping character triggers Bloom, Hyperbloom, Lunar-Bloom, or Burgeon, they will gain another 25% bonus.",
    },
  },
  {
    id: 'desert-pavilion-chronicle',
    name: 'Desert Pavilion Chronicle',
    version: '3.3',
    bonuses: {
      2: 'Anemo DMG Bonus +15%.',
      4: "When Charged Attacks hit opponents, the equipping character's Normal Attack SPD will increase by 10% while Normal, Charged, and Plunging Attack DMG will increase by 40% for 15s.",
    },
  },
  {
    id: 'gilded-dreams',
    name: 'Gilded Dreams',
    version: '3.0',
    bonuses: {
      2: 'Increases Elemental Mastery by 80.',
      4: 'Within 8s of triggering an Elemental Reaction, the character equipping this will obtain buffs based on the Elemental Type of the other party members. ATK is increased by 14% for each party member whose Elemental Type is the same as the equipping character, and Elemental Mastery is increased by 50 for every party member with a different Elemental Type.',
    },
  },
  {
    id: 'deepwood-memories',
    name: 'Deepwood Memories',
    version: '3.0',
    bonuses: {
      2: 'Dendro DMG Bonus +15%.',
      4: "After Elemental Skills or Bursts hit opponents, the targets' Dendro RES will be decreased by 30% for 8s. This effect can be triggered even if the equipping character is not on the field.",
    },
  },
  {
    id: 'echoes-of-an-offering',
    name: 'Echoes of an Offering',
    version: '2.6',
    bonuses: {
      2: 'ATK +18%.',
      4: 'When Normal Attacks hit opponents, there is a 36% chance that it will trigger Valley Rite, which will increase Normal Attack DMG by 70% of ATK. This effect will be dispelled 0.05s after a Normal Attack deals DMG.',
    },
  },
  {
    id: 'vermillion-hereafter',
    name: 'Vermillion Hereafter',
    version: '2.6',
    bonuses: {
      2: 'ATK +18%.',
      4: "After using an Elemental Burst, this character will gain the Nascent Light effect, increasing their ATK by 8% for 16s. When the character's HP decreases, their ATK will further increase by 10%. This increase can occur this way maximum of 4 times.",
    },
  },
  {
    id: 'ocean-hued-clam',
    name: 'Ocean-Hued Clam',
    version: '2.3',
    bonuses: {
      2: 'Healing Bonus +15%.',
      4: 'When the character equipping this artifact set heals a character in the party, a Sea-Dyed Foam will appear for 3 seconds, accumulating the amount of HP recovered from healing (including overflow healing). At the end of the duration, the Sea-Dyed Foam will explode, dealing DMG to nearby opponents.',
    },
  },
  {
    id: 'husk-of-opulent-dreams',
    name: 'Husk of Opulent Dreams',
    version: '2.3',
    bonuses: {
      2: 'DEF +30%.',
      4: 'A character equipped with this Artifact set will obtain the Curiosity effect in the following conditions: When on the field, the character gains 1 stack after hitting an opponent with a Geo attack, triggering a maximum of once every 0.3s. When off the field, the character gains 1 stack every 3s. Curiosity can stack up to 4 times, each providing 6% DEF and a 6% Geo DMG Bonus.',
    },
  },
  {
    id: 'emblem-of-severed-fate',
    name: 'Emblem of Severed Fate',
    version: '2.0',
    bonuses: {
      2: 'Energy Recharge +20%.',
      4: 'Increases Elemental Burst DMG by 25% of Energy Recharge. A maximum of 75% bonus DMG can be obtained in this way.',
    },
  },
  {
    id: 'shimenawas-reminiscence',
    name: "Shimenawa's Reminiscence",
    version: '2.0',
    bonuses: {
      2: 'ATK +18%.',
      4: 'When casting an Elemental Skill, if the character has 15 or more Energy, they lose 15 Energy and Normal/Charged/Plunging Attack DMG is increased by 50% for 10s.',
    },
  },
  {
    id: 'pale-flame',
    name: 'Pale Flame',
    version: '1.5',
    bonuses: {
      2: 'Physical DMG Bonus +25%.',
      4: 'When an Elemental Skill hits an opponent, ATK is increased by 9% for 7s. This effect stacks up to 2 times and can be triggered once every 0.3s. Once 2 stacks are reached, the 2-set effect is increased by 100%.',
    },
  },
  {
    id: 'tenacity-of-the-millelith',
    name: 'Tenacity of the Millelith',
    version: '1.5',
    bonuses: {
      2: 'HP +20%.',
      4: 'When an Elemental Skill hits an opponent, the ATK of all nearby party members is increased by 20% and their Shield Strength is increased by 30% for 3s. This effect can be triggered once every 0.5s.',
    },
  },
  {
    id: 'heart-of-depth',
    name: 'Heart of Depth',
    version: '1.2',
    bonuses: {
      2: 'Hydro DMG Bonus +15%.',
      4: 'After using an Elemental Skill, increases Normal Attack and Charged Attack DMG by 30% for 15s.',
    },
  },
  {
    id: 'blizzard-strayer',
    name: 'Blizzard Strayer',
    version: '1.2',
    bonuses: {
      2: 'Cryo DMG Bonus +15%.',
      4: 'When a character attacks an opponent affected by Cryo, their CRIT Rate is increased by 20%. If the opponent is Frozen, CRIT Rate is increased by an additional 20%.',
    },
  },
  {
    id: 'crimson-witch-of-flames',
    name: 'Crimson Witch of Flames',
    version: '1.0',
    bonuses: {
      2: 'Pyro DMG Bonus +15%.',
      4: 'Increases Overloaded and Burning, and Burgeon DMG by 40%. Increases Vaporize and Melt DMG by 15%. Using Elemental Skill increases the 2-Piece Set Bonus by 50% for 10s. Max 3 stacks.',
    },
  },
  {
    id: 'lavawalker',
    name: 'Lavawalker',
    version: '1.0',
    bonuses: {
      2: 'Pyro RES increased by 40%.',
      4: 'Increases DMG against opponents affected by Pyro by 35%.',
    },
  },
  {
    id: 'thundering-fury',
    name: 'Thundering Fury',
    version: '1.0',
    bonuses: {
      2: 'Electro DMG Bonus +15%.',
      4: 'Increases damage caused by Overloaded, Electro-Charged, Superconduct, and Hyperbloom by 40%, and the DMG Bonus conferred by Aggravate is increased by 20%. When Quicken or the aforementioned Elemental Reactions are triggered, Elemental Skill CD is decreased by 1s.',
    },
  },
  {
    id: 'thundersoother',
    name: 'Thundersoother',
    version: '1.0',
    bonuses: {
      2: 'Electro RES increased by 40%.',
      4: 'Increases DMG against opponents affected by Electro by 35%.',
    },
  },
  {
    id: 'retracing-bolide',
    name: 'Retracing Bolide',
    version: '1.0',
    bonuses: {
      2: 'Increases Shield Strength by 35%.',
      4: 'While protected by a shield, gain an additional 40% Normal and Charged Attack DMG.',
    },
  },
  {
    id: 'archaic-petra',
    name: 'Archaic Petra',
    version: '1.0',
    bonuses: {
      2: 'Geo DMG Bonus +15%.',
      4: 'Upon obtaining an Elemental Shard created through Crystallize or triggering a Lunar-Crystallize reaction, all party members gain 35% DMG Bonus for that particular element for 10s.',
    },
  },
  {
    id: 'viridescent-venerer',
    name: 'Viridescent Venerer',
    version: '1.0',
    bonuses: {
      2: 'Anemo DMG Bonus +15%.',
      4: "Increases Swirl DMG by 60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s.",
    },
  },
  {
    id: 'maiden-beloved',
    name: 'Maiden Beloved',
    version: '1.0',
    bonuses: {
      2: 'Character Healing Effectiveness +15%.',
      4: 'Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.',
    },
  },
  {
    id: 'bloodstained-chivalry',
    name: 'Bloodstained Chivalry',
    version: '1.0',
    bonuses: {
      2: 'Physical DMG Bonus +25%.',
      4: 'After defeating an opponent, increases Charged Attack DMG by 50%, and reduces its Stamina cost to 0 for 10s.',
    },
  },
  {
    id: 'noblesse-oblige',
    name: 'Noblesse Oblige',
    version: '1.0',
    bonuses: {
      2: 'Elemental Burst DMG +20%.',
      4: "Using an Elemental Burst increases all party members' ATK by 20% for 12s. This effect cannot stack.",
    },
  },
  {
    id: 'wanderers-troupe',
    name: "Wanderer's Troupe",
    version: '1.0',
    bonuses: {
      2: 'Increases Elemental Mastery by 80.',
      4: 'Increases Charged Attack DMG by 35% if the character uses a Catalyst or Bow.',
    },
  },
  {
    id: 'gladiators-finale',
    name: "Gladiator's Finale",
    version: '1.0',
    bonuses: {
      2: 'ATK +18%.',
      4: 'If the wielder of this artifact set uses a Sword, Claymore or Polearm, increases their Normal Attack DMG by 35%.',
    },
  },
];

/**
 * Valid main affixes for Sands of Eon
 */
export const SANDS_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'Energy Recharge',
] as const;

export type SandsMainAffix = (typeof SANDS_MAIN_AFFIXES)[number];

/**
 * Valid main affixes for Goblet of Eonothem
 */
export const GOBLET_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'Pyro DMG Bonus',
  'Hydro DMG Bonus',
  'Electro DMG Bonus',
  'Cryo DMG Bonus',
  'Geo DMG Bonus',
  'Anemo DMG Bonus',
  'Dendro DMG Bonus',
  'Physical DMG Bonus',
] as const;

export type GobletMainAffix = (typeof GOBLET_MAIN_AFFIXES)[number];

/**
 * Valid main affixes for Circlet of Logos
 */
export const CIRCLET_MAIN_AFFIXES = [
  'HP Percentage',
  'ATK Percentage',
  'DEF Percentage',
  'Elemental Mastery',
  'CRIT Rate',
  'CRIT DMG',
  'Healing Bonus',
] as const;

export type CircletMainAffix = (typeof CIRCLET_MAIN_AFFIXES)[number];

/**
 * Valid artifact minor affixes
 */
export const ARTIFACT_MINOR_AFFIXES = [
  'HP',
  'HP Percentage',
  'ATK',
  'ATK Percentage',
  'DEF',
  'DEF Percentage',
  'Elemental Mastery',
  'Energy Recharge',
  'CRIT Rate',
  'CRIT DMG',
] as const;

export type ArtifactMinorAffix = (typeof ARTIFACT_MINOR_AFFIXES)[number];

/**
 * Union of all artifact main affix types
 */
export type ArtifactMainAffix = SandsMainAffix | GobletMainAffix | CircletMainAffix;

/**
 * Helper to find artifact set by ID
 */
export function getArtifactSetById(id: string): ArtifactSet | undefined {
  return ARTIFACT_SETS.find((set) => set.id === id);
}

/**
 * Helper to filter artifact sets by version
 */
export function getArtifactSetsByVersion(version: string): ArtifactSet[] {
  return ARTIFACT_SETS.filter((set) => set.version === version);
}
