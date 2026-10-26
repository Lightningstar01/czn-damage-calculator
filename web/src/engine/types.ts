// Data types shared by the engine, the presets and the saved data.
// Percentages are stored as fractions (0.2 = 20%).

export const ELEMENTS = ['Passion', 'Justice', 'Order', 'Instinct', 'Void'] as const
export type Element = (typeof ELEMENTS)[number]

export const CLASSES = ['Striker', 'Psionic', 'Hunter', 'Controller', 'Ranger', 'Vanguard'] as const
export type CharClass = (typeof CLASSES)[number]

export const STATS = ['ATK%', 'Flat ATK', 'DEF%', 'Flat DEF', 'Crit Rate', 'Crit DMG', 'Weakness DMG',
  'Elemental DMG%', 'Extra DMG%', 'DoT DMG%'] as const
export type StatName = (typeof STATS)[number]

export const CATEGORIES = ['Character', 'Potential', 'Partner', 'Memory Fragment', 'Equipment', 'Engraving',
  'Affection', 'Ego Manifestation', 'Character Ego Skill', 'Partner Ego Skill', 'Card Epiphany', 'Neutral Card',
  'Save Data Mutation', 'Support Character', 'Enemy Debuff', 'Other'] as const

export type Scaling = 'ATK' | 'DEF' | 'Fixed'
export type DamageKind = 'Normal' | 'Extra Attack' | 'DoT'
export const CARD_TYPES = ['Attack', 'Skill', 'Upgrade'] as const
export type CardType = (typeof CARD_TYPES)[number]
export type HitScope = 'All hits' | 'First hit only'
export type Condition = 'Always' | 'Ravaged only'
/** Crit Chance / Crit DMG buffs add to the crit stats of matching cards only. */
export type BuffType = 'Additive' | 'Multiplicative' | 'Weakness Attack' | 'Crit Chance' | 'Crit DMG'
export type MultMode = 'Summed' | 'Chained'

/** On/off switch, or a number of stacks. true = on with the effect's default stacks. */
export type Switch = boolean | number

// ---------------------------------------------------------------- presets (coded in src/data/presets.ts)

export interface StatEffect {
  kind: 'Stat'
  id: string
  name: string
  category: string
  stat: StatName
  /** As shown in-game: '16%' for percents, '74' for flat values. */
  value: string
  defaultStacks?: number
  /** Partner effect that only works when the partner's class matches the character's. */
  classLimited?: boolean
  /** Already counted on the stats screen (e.g. memory fragment set stats): listed for reference, never added. */
  onStatsScreen?: boolean
  notes?: string
}

export interface BuffEffect {
  kind: 'Buff'
  id: string
  name: string
  category: string
  /** Buff text as shown in-game: '+30%' = Additive, '30%' = Multiplicative, or 'Weakness Attack'. */
  value: string
  /** Set for Crit Chance / Crit DMG buffs; otherwise the type comes from the value text. */
  type?: BuffType
  /** ALL, a card name, or tags: 'A & B' = all of them, 'A/B' = any of them; also '2+ hits', '2+ cost', DoT, Extra Attack. */
  appliesTo: string
  hitScope: HitScope
  condition: Condition
  maxStacks?: number
  defaultStacks?: number
  classLimited?: boolean
  notes?: string
}

export type Effect = StatEffect | BuffEffect

export interface CharacterPreset {
  name: string
  element: Element
  class: CharClass
  notes?: string
  effects: Effect[]
  /** The character's cards (each epiphany is its own entry), copied into the card library when picked. */
  cards?: CardPreset[]
}

/** A card the owner can copy into the library. Base values (no potentials); the copy can be edited. */
export interface CardPreset {
  /** Unique per character; library copies keep it in Card.preset. */
  id: string
  /** The card it's an epiphany of (groups the picker), e.g. 'Rising Dragon Spire'. */
  base: string
  name: string
  cardType: CardType
  /** AP cost, added as a tag like '1-cost'. Omit for Ego skills. */
  cost?: number
  /** Extra comma-separated tags; the character's element and the cost tag are added on copy. */
  tags?: string
  scaling?: Scaling
  kind?: DamageKind
  /** Base damage % per hit (1 = 100%); 0 for cards that deal no damage. */
  pct: number
  hits: number
  weaknessApplies?: boolean
  targetRavaged?: boolean
  /** Card text as shown in-game. */
  text: string
  notes?: string
  /** Stat boosts / buffs the card gives while it's in the library (switch per build, default on). */
  effects?: Effect[]
}

export interface PartnerPreset {
  name: string
  class: CharClass
  /** Reference only: already included in the stats-screen numbers. */
  baseHp: number
  baseDef: number
  baseAtk: number
  notes?: string
  effects: Effect[]
}

/** A memory fragment set: a 2-piece or a 4-piece set (one size only). 6 fragment slots per character. */
export interface FragmentSetPreset {
  name: string
  pieces: 2 | 4
  notes?: string
  effects: Effect[]
}

export interface Presets {
  characters: CharacterPreset[]
  partners: PartnerPreset[]
  fragmentSets: FragmentSetPreset[]
}

/** Memory fragment slots on a character; the set dropdowns per build. */
export const FRAGMENT_SLOTS = 6
export const FRAGMENT_SET_PICKS = 3

// ---------------------------------------------------------------- settings

export interface Settings {
  atkConstant: number
  defCardAtkCoef: number
  defCardDefCoef: number
  /** Extra factor on Weakness DMG (Unconfirmed, default 0). */
  extraWeakness: number
  vulnerable: number
  weaknessDebuff: number
  critCap: number
  /** Extra damage Ravaged enemies take (Unconfirmed, default 0). */
  ravaged: number
  multMode: MultMode
  moralePerStack: number
  moraleMax: number
}

// ---------------------------------------------------------------- saved data (per character)

export interface ScreenStats {
  attack: number
  defense: number
  health: number
  critChance: number
  /** Total multiplier: 1.886 = crit hits x1.886. */
  critDmg: number
  /** Total multiplier, base 1.25. */
  weaknessDmg: number
  elemDmg: Record<Element, number>
  extraDmg: number
  dotDmg: number
}

export interface Build {
  id: string
  name: string
  partner: string
  /** Memory fragment set names, one per dropdown ('' = none). */
  fragments: string[]
  stats: ScreenStats
  enemyDefMult: number
  enemyDr: number
  morale: number
  vulnerable: number
  weaknessDebuff: number
  /** Preset effect id -> switch. Missing = on (default stacks). */
  presetSwitches: Record<string, Switch>
}

/** The owner's own stat boost (equipment etc.), shared by the character's builds with a switch per build. */
export interface UserBoost {
  id: string
  source: string
  stat: StatName
  value: string
  category: string
  notes: string
  switches: Record<string, Switch>
}

export interface UserBuff {
  id: string
  source: string
  category: string
  value: string
  /** Empty = auto from the text ('+' = Additive). */
  typeOverride: BuffType | ''
  appliesTo: string
  hitScope: HitScope
  condition: Condition
  maxStacks: number | null
  notes: string
  switches: Record<string, Switch>
}

export interface Card {
  id: string
  name: string
  /** Attack / Skill / Upgrade; matched by "Applies to" like a tag. */
  cardType: CardType
  /** Comma-separated. */
  tags: string
  scaling: Scaling
  kind: DamageKind
  /** Damage % per hit as shown in-game (1.32 = 132%); for Fixed, damage per hit. */
  pct: number
  hits: number
  weaknessApplies: boolean
  targetRavaged: boolean
  /** CardPreset id this card was copied from: its effects then show with the preset effects. */
  preset?: string
}

/** One play in the rotation. hits overrides the card's hits for this play (Combo, extra-hit effects). */
export interface RotationPlay {
  cardId: string
  hits?: number
}

export interface CharacterSave {
  builds: Build[]
  activeBuild: string
  showAllPartners: boolean
  boosts: UserBoost[]
  buffs: UserBuff[]
  cards: Card[]
  /** Plays in order. */
  rotation: RotationPlay[]
}

export interface SaveData {
  version: number
  settings: Settings
  activeCharacter: string
  characters: Record<string, CharacterSave>
}
