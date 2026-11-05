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
/** Crit Chance / Crit DMG buffs add to the crit stats of matching cards only. Card % raises the card's own %
 * like a potential (shown in the in-game card %), so it only counts on cards entered at base % (with an upgrade).
 * Card + (a Potential node's "+15% Damage Amount") adds to the base % before the upgrade: (80% + 15%) x 1.16 = 110%; also only with an upgrade.
 * Base % ("+80% base Damage Amount") is added to the card % after the potential, so the multiplicative buffs raise it too.
 * Final ("final Damage Amount") is its own multiplier: x (1 + the sum of the final buffs), after everything else.
 * Flat ("Damage Amount equal to 30% of Shield owned") is damage, not a %: value x its counter's number, added under the multipliers (Maribell's Resolute Blitz IV).
 * It reads a counter, so it isn't among the types the owner's own buffs can pick. */
export type BuffType = 'Additive' | 'Multiplicative' | 'Weakness Attack' | 'Crit Chance' | 'Crit DMG' | 'Card %' | 'Card +' | 'Base %' | 'Final' | 'Flat'
export const BUFF_TYPES: BuffType[] = ['Additive', 'Multiplicative', 'Weakness Attack', 'Crit Chance', 'Crit DMG', 'Card %', 'Card +', 'Base %', 'Final']
export type MultMode = 'Summed' | 'Chained'

/** On/off switch, or a number of stacks. true = on with the effect's default stacks. */
export type Switch = boolean | number

/** Who an effect reaches (owner, 2026-10-26). 'self' (default): only its owner ("this unit"); 'allies': the whole team
 * ("allies"); 'enemy': a debuff on the target, so every ally's hits get it ("Damage Amount taken by the target").
 * A teammate's effects only count for the main character when they are 'allies' or 'enemy'. */
export type EffectTarget = 'self' | 'allies' | 'enemy'

// ---------------------------------------------------------------- presets (src/data: imported from Prydwen + our additions)

export interface StatEffect {
  kind: 'Stat'
  id: string
  name: string
  category: string
  target?: EffectTarget
  stat: StatName
  /** As shown in-game: '16%' for percents, '74' for flat values. */
  value: string
  defaultStacks?: number
  /** Partner effect that only works when the partner's class matches the character's. */
  classLimited?: boolean
  /** Already counted on the stats screen (e.g. memory fragment set stats): listed for reference, never added. */
  onStatsScreen?: boolean
  /** Manifest Ego level (1-6) that unlocks it: off for builds below that level. */
  egoLevel?: number
  /** Manifest Ego level from which it's replaced (by another effect with that egoLevel): off for builds at or above it. */
  egoBelow?: number
  /** Potential node ('5-1') it comes from: off while that node is locked (Setup > Potentials, build.potentialNodes). */
  node?: string
  /** A few words shown as a grey chip when the switch depends on something in the fight, e.g. 'ATK > 500'. No notes on effects. */
  hint?: string
}

export interface BuffEffect {
  kind: 'Buff'
  id: string
  name: string
  category: string
  target?: EffectTarget
  /** Buff text as shown in-game: '+30%' = Additive, '30%' = Multiplicative, or 'Weakness Attack'. */
  value: string
  /** Set for every type but Additive and Multiplicative, which come from the value text ('+30%' / '30%'): Crit Chance, Crit DMG, Card %, Card +, Base %, Final, Flat. */
  type?: BuffType
  /** ALL, a card name, or tags: 'A & B' = all of them, 'A/B' = any of them; also '2+ hits', '2+ cost', DoT, Extra Attack. */
  appliesTo: string
  hitScope: HitScope
  condition: Condition
  maxStacks?: number
  defaultStacks?: number
  classLimited?: boolean
  /** Manifest Ego level (1-6) that unlocks it: off for builds below that level. */
  egoLevel?: number
  /** See StatEffect.egoBelow. */
  egoBelow?: number
  /** See StatEffect.node. */
  node?: string
  /** Per-play stacks (e.g. 'Ember'): the stacks are set on each play of the attack list (default 0), instead of
   * by the switch, which is then on/off only. Buffs with the same counter share the play's number; maxStacks caps it for this buff. */
  counter?: string
  /** Extra value added automatically while the build's stats-screen Attack is above `above` (Mei Lin 5-1: +5% more above 500);
   * `orEqual`: from `above` on ('500 or higher'). With `every`, the value is added for every full `every` Attack above
   * `above`, up to `max` (Rossweisse 7: +2% for every 20 Attack exceeding 600, max +10%). */
  thresholdBonus?: { above: number; value: string; orEqual?: boolean; every?: number; max?: string }
  /** Stats-screen Attack the buff needs: it's worth 0 below it (Rossweisse 7: 'If Attack is 600 or higher'). */
  thresholdMin?: number
  /** 'Defense' / 'Health': thresholdMin and thresholdBonus read that stats-screen stat instead (Adelheid 7: 'If Defense is 300 or
   * higher'; Cassius 5-1: 'If Health is 600 or higher'; Renoa 7: 'If Critical Chance is 60% or higher', above: 0.6; Selena 7: 'If Extra Damage is 30% or higher', above: 0.3;
   * Lucas 5-1: 'If Critical Damage is 160% or higher', above: 1.6; Tressa 7: 'If Damage over Time is 30% or higher', above: 0.3). */
  thresholdStat?: 'Defense' | 'Health' | 'Critical Chance' | 'Critical Damage' | 'Extra Damage' | 'Damage over Time'
  /** It needs a target, so it isn't in the in-hand card % (Tressa's E2: 164% in hand, 184% on a target in Agony). */
  onTarget?: boolean
  /** See StatEffect.hint. */
  hint?: string
}

export type Effect = StatEffect | BuffEffect

/** Damage that a play sets off (owner, 2026-10-28): Selena's Mark ("When an Attack Card is activated, inflict 100% Extra Attack"), her
 * Coordinated Attacks. The added hit is the trigger owner's (their build's stats and buffs), whoever played the card. */
export interface Trigger {
  /** Card preset id of the hit it adds (one of the owner's cards, usually an extraCards entry with notACard). */
  card: string
  /** Which played cards set it off: "Applies to" words matched against the played card ('Attack', 'Passion & Attack'). */
  on: string
  /** Only plays by another combatant ("an Attack Card of another Combatant"). */
  others?: boolean
  /** Only the owner's own plays ("an Attack Card of this unit"). */
  own?: boolean
  /** The hit is one more hit of the played card, not `card`, which is then just the card that gives it (Owen's Wind Charge III: "add 1 Hit(s)"). */
  repeat?: boolean
  /** Only plays that hit a Weakness (the card applies weakness, or a Weakness Attack buff matches it). */
  weakness?: boolean
  /** Per-play counter that must be above 0 on the play ('Mark' on the target, or a 'for 1 turn' effect): set on each play. */
  counter?: string
  maxStacks?: number
  /** The hit happens once per counter stack, not once per play (Renoa's Dirge Bullets discarded). */
  perStack?: boolean
  /** Chance to happen: its damage counts x this (expected value, owner 2026-10-28). */
  chance?: number
  /** Only on a Critical Hit of the played card (Lucas's Flame Thrower III): expected damage x the card's crit chance, nothing if it doesn't crit, in full if it does. */
  onCrit?: boolean
  /** Manifest Ego level (1-6) that unlocks it. */
  egoLevel?: number
}

export interface CharacterPreset {
  name: string
  /** Prydwen's slug, also the file name in src/data/prydwen and src/data/characters. */
  slug?: string
  element: Element
  class: CharClass
  rarity?: string
  notes?: string
  effects: Effect[]
  /** The character's cards (each epiphany is its own entry), put in a build's deck when picked. */
  cards?: CardPreset[]
  /** Reference: Potential nodes are already in the stats screen and the in-game card %. */
  potentials?: PotentialNode[]
  /** Manifest Ego levels (dupes); their buffs are effects with egoLevel set. */
  manifestEgo?: EgoLevel[]
  /** The Manifest Ego levels that raise the Basic / Signature Card Upgrade potentials, and by how many levels each (from their
   * text; some characters have two, E3 and E5). */
  potentialEgo?: { level: number; levels: number }[]
  /** Damage the character's keywords set off on any team member's play (Selena's Mark). */
  triggers?: Trigger[]
  /** When the character was last compared with the owner's in-game screenshots; missing = not reviewed yet (Prydwen's data only). */
  verified?: Verified
  /** Per-play counters a new play of this character starts with (Rin's Dark Mist Stance: on); after that they're the play's own. */
  playStacks?: Record<string, number>
}

/** The last review of a character against the game: its date and the game version shown in-game. */
export interface Verified {
  date: string
  gameVersion: string
}

/** A Potential node ('3-1') or a Manifest Ego level (dupes, 1-6), as Prydwen lists them. Reference text. */
export interface KitEntry {
  name: string
  text: string
}
export interface PotentialNode extends KitEntry { node: string }
export interface EgoLevel extends KitEntry { level: number }
export const MAX_EGO_LEVEL = 6
/** Highest Basic / Signature Card Upgrade level you can set on the Potential screen (Manifest Ego adds more). */
export const MAX_POTENTIAL_LEVEL = 10

/** Potential that raises a card's damage: Basic Card Upgrade (Basic cards) or Signature Card Upgrade
 * (Prydwen: 'Unique Card Upgrade'; the character's other cards, generated ones included; not Ego skills). */
export type PotentialUpgrade = 'Basic' | 'Signature'

export const CARD_CATEGORIES = ['Starting Card', 'Unique Card', 'Epiphany Card', 'Ego Skill', 'Generated Card'] as const

/** A card the owner can put in a build's deck. Base values (no potentials). */
export interface CardPreset {
  /** Unique per character; deck cards point at it (DeckCard.preset). */
  id: string
  /** The card it's an epiphany of (groups the picker), e.g. 'Rising Dragon Spire'. */
  base: string
  name: string
  cardType: CardType
  /** AP cost. null/omitted: no AP cost (Ego skills, X-cost and unplayable cards: see tags). */
  cost?: number | null
  /** Defaults to the character's element. */
  element?: Element
  /** Prydwen's card category (Starting Card, Unique Card, Epiphany Card, Ego Skill, Generated Card). */
  category?: string
  rarity?: string
  /** Comma-separated (element and cost are their own fields). */
  tags?: string
  scaling?: Scaling
  kind?: DamageKind
  /** Base damage % per hit (1 = 100%); 0 for cards that deal no damage. */
  pct: number
  hits: number
  weaknessApplies?: boolean
  targetRavaged?: boolean
  /** Card text as shown in-game; may hold tokens for the build's numbers (src/engine/cardText.ts). */
  text: string
  /** Card art (art only, 420x632 from cznmetadecks or 200x300 from Prydwen): 'cards/<slug>/<file>', copied into public/ by the import. */
  image?: string
  /** See Card.perCost. */
  perCost?: boolean
  /** See Card.perCount. */
  perCount?: string
  /** See Card.maxCount. */
  maxCount?: number
  /** See Card.countsHits. */
  countsHits?: boolean
  /** See Card.counterHits. */
  counterHits?: { counter: string; hits: number }
  /** See Card.fixedOf. */
  fixedOf?: string
  /** Ids of the cards it creates (shards, Sword Tassel): they join the deck with it (src/engine/deck.ts). */
  creates?: string[]
  /** A Manifest Ego effect that deals damage (Narja's E6): joins the deck by itself from this Ego level, like the Ego skill. */
  egoLevel?: number
  /** Overrides the card upgrade potential picked from its category (null: none). */
  upgrade?: PotentialUpgrade | null
  /** Tags a Potential node adds while it's on (build.potentialNodes): { '3-1': 'Blessing' } (Adelheid's Basic cards). */
  nodeTags?: Record<string, string>
  /** Base % and hits a Potential node changes the card to while it's on: { '3-1': { pct: 0.7, hits: 2 } } (Chizuru's Moonslash). */
  nodeCard?: Record<string, { pct?: number; hits?: number }>
  notes?: string
  /** Stat boosts / buffs the card gives while it's in the deck (switch per build, default on). */
  effects?: Effect[]
  /** Fixed damage on the next play of a matching card ('Equilux'), as a share of that play's damage (Rossweisse's Ego skill);
   * `ego` raises the share from that Manifest Ego level. */
  followUp?: { appliesTo: string; share: number; ego?: { level: number; share: number } }
  /** Damage this card sets off on later plays while it's in the deck (Selena's High-Power Scope IV Coordinated Attack). */
  triggers?: Trigger[]
  /** See Card.notACard. */
  notACard?: boolean
}

export interface PartnerPreset {
  name: string
  class: CharClass
  /** Reference only: already included in the stats-screen numbers. */
  baseHp: number
  baseDef: number
  baseAtk: number
  notes?: string
  /** Passive effects, plus the effects of the partner's Ego skill (category 'Partner Ego Skill'), which the
   * character holding the partner can use besides their own Ego skill. */
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

/** A character as imported from Prydwen (src/data/prydwen/<slug>.json, generated: never edit by hand). */
export interface ImportedCharacter {
  name: string
  slug: string
  element: Element
  class: CharClass
  rarity: string
  cards: CardPreset[]
  potentials: PotentialNode[]
  manifestEgo: EgoLevel[]
}

/** What a re-import must not overwrite, mainly the buffs. Stored in src/data/characters/<slug>.ts. */
export interface CharacterAdditions {
  /** See CharacterPreset.verified. Every additions file has one (checkAdditions). */
  verified?: Verified
  notes?: string
  /** The character's own stat boosts and buffs. */
  effects?: Effect[]
  /** See CharacterPreset.triggers. */
  triggers?: Trigger[]
  /** See CharacterPreset.playStacks. */
  playStacks?: Record<string, number>
  /** Per card id: fields to override (in-game name, tags, %, hits, text...), notes (added after the imported ones, or
   * instead of them with replaceNotes) and effects. */
  cards?: Record<string, Partial<Omit<CardPreset, 'id' | 'base'>> & { replaceNotes?: boolean }>
  /** Cards the import doesn't have (ids must not clash with the import's), added after the imported ones. */
  extraCards?: CardPreset[]
  /** Per Potential node ('3-1'): the in-game name and text, replacing the import's. */
  potentials?: Record<string, Partial<KitEntry>>
  /** Per Manifest Ego level: the in-game name and text, replacing the import's. Wording only: the +3 card upgrade levels stay
   * read from the import (potentialEgo in merge.ts). */
  ego?: Record<number, Partial<KitEntry>>
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
  /** Card damage per Basic / Signature Card Upgrade level (0.02 = +2% of the base). */
  potentialPerLevel: number
  /** Whether those upgrades also raise Fixed damage (Unconfirmed). */
  potentialFixed: boolean
  /** An upgraded card % is rounded to a whole % before buffs (owner, 2026-11-01; Unconfirmed, in-game test card-pct-rounding). */
  roundCardPct: boolean
  /** Fixed damage = % x Final ATK x this (Unconfirmed). */
  fixedAtkCoef: number
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
  morale: number
  /** Manifest Ego level (dupes), 0-6: unlocks the character's effects with an egoLevel. */
  egoLevel: number
  /** Basic / Signature Card Upgrade potential levels, 0-10 (Manifest Ego levels are added on top). */
  basicLevel: number
  signatureLevel: number
  /** Potential node ('3-1') -> unlocked, for nodes that change card text or tags (CardPreset.nodeTags). Missing = on. */
  potentialNodes?: Record<string, boolean>
  /** Preset effect key (presetKey / teamKey) -> switch. Missing = on (default stacks). */
  presetSwitches: Record<string, Switch>
  /** Up to TEAM_SIZE teammates whose ally buffs and enemy debuffs count for this character. */
  team: Teammate[]
  /** The main character's cards picked on the Cards tab (the Ego skill and created cards come with them: src/engine/deck.ts). */
  deck: DeckCard[]
  /** This build's attack list: the team's plays, in order (the main character's, and teammates' with RotationPlay.by). */
  rotation: RotationPlay[]
}

/** A card in a build's deck: a card preset (always its current data), or a custom card from an older save. */
export interface DeckCard {
  /** Attack list plays point here. */
  id: string
  /** Card preset id of the build's character. */
  preset?: string
  custom?: Card
}

/** The other two team slots. */
export const TEAM_SIZE = 2

/** A teammate in a build. Linked to one of their saved builds (by default their active one), their Ego, partner and sets come from
 * it and their plays in the attack list deal damage with it (owner, 2026-10-28); not linked, they're a buff source only. */
export interface Teammate {
  /** Character name ('' = empty slot). */
  character: string
  egoLevel: number
  partner: string
  /** Memory fragment set names, one per dropdown. */
  fragments: string[]
  /** Card preset ids picked for their deck (Cards tab; copies allowed): those cards' team effects count, with their Ego skill and
   * created cards. */
  cards: string[]
  /** Id of the teammate character's saved build to use; missing = their active build; NO_BUILD = none (the fields above). */
  build?: string
  /** Only on a LiveTeammate: a computed team assigned into a saved build doesn't compile. */
  live?: never
}

/** A teammate while computing (withLinkedTeam, teammateView), never saved. live: their stats and Potential nodes. Missing: their "If
 * Attack is 500 or higher" thresholds aren't met and their nodes count as on. */
export type LiveTeammate = Omit<Teammate, 'live'> & { live?: Pick<Build, 'stats' | 'potentialNodes'> }

/** A build while computing; a saved Build is one too (its teammates have no live stats). */
export type LiveBuild = Omit<Build, 'team'> & { team: LiveTeammate[] }

/** Teammate.build: not linked to a saved build. */
export const NO_BUILD = 'none'

/** The owner's own stat boost (equipment etc.), shared by the character's builds with a switch per build. */
export interface UserBoost {
  id: string
  source: string
  /** Who it comes from, a label only: '' = this character, else a teammate slot (FROM_OPTIONS). */
  from?: string
  stat: StatName
  value: string
  category: string
  notes: string
  switches: Record<string, Switch>
}

export interface UserBuff {
  id: string
  source: string
  /** Who it comes from, a label only: '' = this character, else a teammate slot (FROM_OPTIONS). */
  from?: string
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
  /** Matched by "Applies to" like a tag (e.g. 'Passion'). */
  element: Element
  /** AP cost, matched by '1-cost' / '2+ cost'. null = no AP cost (Ego skill). */
  cost: number | null
  /** Comma-separated. */
  tags: string
  scaling: Scaling
  kind: DamageKind
  /** Damage % per hit (1.32 = 132%); for Fixed, damage per hit. Base value (without potentials) when upgrade is set,
   * otherwise as shown in-game. */
  pct: number
  /** Potential that raises this card's damage; missing = none (pct is then the in-game value). */
  upgrade?: PotentialUpgrade
  hits: number
  weaknessApplies: boolean
  targetRavaged: boolean
  /** CardPreset id this card was copied from: its effects then show with the preset effects. */
  preset?: string
  /** "X% Damage for each Cost of this card": pct is per Cost; each play sets the Cost (RotationPlay.cost). */
  perCost?: boolean
  /** "X% for each <thing>" (Orlea's Annoying: 'Cards in hand'): pct is per thing; each play sets the count in its stacks
   * under this name (default 1). */
  perCount?: string
  /** The most perCount can be (Agony: 'max 20 stacks'). */
  maxCount?: number
  /** Set on a card as played: its pct is the % the game shows x this (the play's Cost or count), so the shown % can be rounded on its own. */
  pctUnits?: number
  /** The count of perCount is the card's hits, not a multiple of its % (Agony: each stack is its own hit, and each can crit). */
  countsHits?: boolean
  /** Hits added on plays with this counter above 0 (Yuki's "Inspiration: Add 1 Hit"), unless the play sets its own hits. */
  counterHits?: { counter: string; hits: number }
  /** A Fixed card's "Fixed Damage equal to X% of Shield owned" (Maribell's Shelter Strike): damage = % x this per-play counter, not x ATK. */
  fixedOf?: string
  /** Damage from an effect, not a card being played (Mark, Coordinated Attacks, Attunement damage): the card type words (Attack /
   * Skill / Upgrade) don't match it, so Attack Card buffs and Attack Card triggers skip it. */
  notACard?: boolean
}

/** Labels for UserBoost.from / UserBuff.from. */
export const FROM_OPTIONS = ['', 'Teammate 1', 'Teammate 2'] as const

/** One play in a build's attack list. Every switched-on buff applies to it (snapshot, owner 2026-10-26); the play
 * itself says which target debuffs are up and how many per-play stacks each counter has. */
export interface RotationPlay {
  cardId: string
  /** Teammate slot (0-based) whose card this is; missing = the build's character. cardId is then a card of teammateDeck. */
  by?: number
  /** Overrides the card's hits for this play (Combo, extra-hit effects). */
  hits?: number
  /** Overrides the card's Cost for this play (cards whose damage is per Cost, e.g. Creation and Destruction V). */
  cost?: number
  /** Vulnerable on the target for this play's hits. */
  vulnerable?: boolean
  /** Weakness debuff on the character for this play's hits. */
  weaknessDebuff?: boolean
  /** Whether the target is Ravaged on this play's hits; missing = the card's own flag (on for "On Ravage" cards, off for the rest). */
  ravaged?: boolean
  /** Counter name (BuffEffect.counter, e.g. 'Ember') -> stacks for this play. Missing = 0. */
  stacks?: Record<string, number>
}

export interface CharacterSave {
  builds: Build[]
  activeBuild: string
  showAllPartners: boolean
  boosts: UserBoost[]
  buffs: UserBuff[]
}

/** One enemy of a fight. */
export interface Enemy {
  /** Enemy DEF multiplier (1 = none). */
  defMult: number
  /** Enemy damage reduction (fraction). */
  dr: number
}

/** No enemy modifiers: what the engine uses without a fight. */
export const NO_ENEMY: Enemy = { defMult: 1, dr: 0 }

/** A saved fight (owner, 2026-10-31): shared by every character and build, so builds are compared against the same enemy.
 * One target for now: the engine reads enemies[0]; a list so several targets can come later. */
export interface Fight {
  id: string
  name: string
  enemies: Enemy[]
}

export interface SaveData {
  version: number
  settings: Settings
  activeCharacter: string
  characters: Record<string, CharacterSave>
  fights: Fight[]
  activeFight: string
}
