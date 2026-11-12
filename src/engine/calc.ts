// The damage formula (docs/FORMULA.md). Pure functions: inputs in, numbers and their sources out.
import { wholePct } from './cardText'
import { buildDeck, buildNodeOn, counterHitsList, deckPresets, presetCard, teammateDeck, type DeckItem } from './deck'
import { activeBuffs, activeCounters, activeStats, buffMatches, cardBuffs, EQUIP_STAT, equipped, findCharacter, findFragmentSet, findPartner, unreadableValues, type ActiveBuff, type ActiveStat, type CardBuffs, type PlayCounter, type Source } from './buffs'
import { deletedLinks, teammateView, withLinkedTeam, type Saves } from './team'
import { NO_ENEMY } from './types'
import type { Build, Card, CharacterPreset, CounterHits, Enemy, Fight, LiveBuild, PotentialUpgrade, Presets, RotationPlay, Settings, StatName, Trigger } from './types'

export interface Stat {
  value: number
  sources: Source[]
}

export interface FinalStats {
  atk: Stat
  def: Stat
  /** Health in battle: the stats screen's plus flat Health (the trinket). Shown on Results; no damage reads it yet. */
  hp: Stat
  critRate: Stat
  critDmg: Stat
  elemDmg: Stat
  extraDmg: Stat
  dotDmg: Stat
  weaknessDmg: Stat
}

export interface Factor {
  value: number
  sources: Source[]
}

/** Every factor of one hit, so the UI can draw the formula. A null factor doesn't apply to this hit. */
export interface Hit {
  /** 1-based hit number across the build's whole attack list (the played cards' own hits); 0 on a hit a trigger adds. */
  globalHit: number
  hitNo: number
  /** The card's %: the base (with Card + buffs) when a potential upgrade applies, otherwise as shown in-game. */
  cardPct: number
  /** Card + buffs in cardPct. */
  cardAdd: Source[]
  /** Basic / Signature Card Upgrade potential (card % x this); null for cards without one. */
  potential: Factor | null
  /** The card % after the potential, as the game shows it (rounded with the roundCardPct setting). */
  upgradedPct: number
  /** Base % buffs, added to the card % after the potential (null: none). */
  basePct: Factor | null
  /** Flat buffs (null: none): damage, not a % of the stat. Mult and every factor but the stat and constant raise it; on plain Fixed damage nothing does, on a Fixed DoT its factors do. */
  flat: Factor | null
  multFactor: Factor
  additive: Factor
  weakness: Factor | null
  vulnerable: Factor | null
  enemyDr: Factor | null
  weaknessDebuff: Factor | null
  ravaged: Factor | null
  /** Card % as shown in hand: (card % x Mult + Add), without the buffs that need a target (owner, 2026-10-25). */
  inHand: number
  /** Card % when targeting the enemy: everything up to here (Weakness DMG, Vulnerable, Ravaged...). */
  cardMult: number
  /** ATK, or ATK x 0.3 + DEF x 2.1 for DEF cards. */
  stat: Factor
  constant: number
  elemDmg: Factor | null
  mechDmg: Factor | null
  enemyDef: Factor | null
  /** Final damage buffs: x (1 + their sum). */
  final: Factor | null
  critDmg: number
  critRate: number
  /** Final Crit DMG / Crit Chance plus this card's crit buffs. */
  critDmgSources: Source[]
  critRateSources: Source[]
  nonCrit: number
  crit: number
  expected: number
}

export interface Play {
  /** The card as played (with this play's hit count). */
  card: Card
  /** Position in the build's attack list (0-based). */
  index: number
  hits: Hit[]
  /** Per-play counter stacks (Ember, Spirit of the Aromata...) set on this play, capped by max stacks, and the card's own count in full; only those above 0. */
  counters: { name: string; stacks: number }[]
  vulnerable: boolean
  weaknessDebuff: boolean
  /** The target is Ravaged on this play's hits (the play's switch, else the card's flag). */
  ravaged: boolean
  /** This play's hits hit a Weakness (the play's switch, else automatic: RotationPlay.weakness). */
  weakness: boolean
  /** Fixed damage an earlier card (Rossweisse's Ego skill) adds to this play: a share of its damage, included in the totals. */
  followUp?: FollowUp
  /** Teammate slot and name for a teammate's play; missing = the build's character. */
  slot?: number
  by?: string
  /** A teammate's play without a linked saved build: no damage of its own (its triggers still count). */
  noBuild?: boolean
  /** Hits this play set off (Selena's Mark...), included in the totals. */
  triggered: Triggered[]
  nonCrit: number
  crit: number
  expected: number
}

/** A trigger's hit on a play: the trigger owner's damage (x chance), included in the play's totals. */
export interface Triggered {
  card: Card
  /** Whose hit it is (the trigger's owner). */
  by: string
  /** Chance it happens; with onCrit, the played card's crit chance. */
  chance: number
  /** It happens only on a Critical Hit of the played card. */
  onCrit?: boolean
  /** Its hits at full value. The totals below are x chance; with onCrit: nonCrit 0, crit in full (what it adds when the card crits), expected x chance. */
  hits: Hit[]
  nonCrit: number
  crit: number
  expected: number
}

export interface FollowUp {
  /** The card that set it up. */
  from: string
  share: number
  nonCrit: number
  crit: number
  expected: number
}

export interface Totals {
  nonCrit: number
  crit: number
  expected: number
}

export interface BuildResult extends Totals {
  stats: FinalStats
  plays: Play[]
  /** Each team member's damage (own plays, follow-ups and the hits their triggers add), the build's character first. */
  byCharacter: (Totals & { name: string })[]
  /** Per attack list play (same index): the per-play counters it can set (its player's counter buffs and the team's triggers). */
  counterOptions: PlayCounter[][]
  /** Per attack list play (same index): whether it hits a Weakness without its own switch (the card, a Weakness Attack buff or the fight's
   * enemy); missing for a play left out. */
  weaknessAuto: boolean[]
  /** Things in the save the calculation had to leave out or that likely don't do what they seem to (shown on the Results tab). */
  warnings: string[]
}

function sumStat(stats: ActiveStat[], name: StatName): Stat {
  const sources = stats.filter((s) => s.stat === name).map((s) => ({
    label: s.stacks !== 1 ? `${s.label} x${s.stacks}` : s.label, value: s.value * s.stacks, unit: s.unit,
  }))
  return { value: sources.reduce((a, s) => a + s.value, 0), sources }
}

/** Final stats: stats screen + boosts. ATK/DEF = screen x (1 + %) + flat. */
export function finalStats(presets: Presets, charName: string, build: LiveBuild, settings: Settings): FinalStats {
  const st = activeStats(presets, charName, build)
  const s = build.stats
  const element = findCharacter(presets, charName)?.element
  const screen = (label: string, value: number, unit: Source['unit']): Source => ({ label: `Stats screen ${label}`, value, unit })
  const plus = (base: Source, extra: Stat): Stat => ({
    value: base.value + extra.value, sources: [base, ...extra.sources],
  })
  const scaled = (label: string, screenVal: number, pct: Stat, flat: Stat): Stat => ({
    value: screenVal * (1 + pct.value) + flat.value,
    sources: [screen(label, screenVal, 'flat'), ...pct.sources, ...flat.sources],
  })
  const critRate = plus(screen('Crit Chance', s.critChance, '%'), sumStat(st, 'Crit Rate'))
  if (critRate.value > settings.critCap) {
    critRate.sources.push({ label: 'Capped (Settings)', value: settings.critCap, unit: '%' })
    critRate.value = settings.critCap
  }
  return {
    atk: scaled('Attack', s.attack, sumStat(st, 'ATK%'), sumStat(st, 'Flat ATK')),
    def: scaled('Defense', s.defense, sumStat(st, 'DEF%'), sumStat(st, 'Flat DEF')),
    hp: plus(screen('Health', s.health, 'flat'), sumStat(st, 'Flat HP')),
    critRate,
    critDmg: plus(screen('Crit DMG', s.critDmg, '%'), sumStat(st, 'Crit DMG')),
    elemDmg: plus(screen(`${element ?? ''} DMG`, element ? s.elemDmg[element] || 0 : 0, '%'), sumStat(st, 'Elemental DMG%')),
    extraDmg: plus(screen('Extra DMG', s.extraDmg, '%'), sumStat(st, 'Extra DMG%')),
    dotDmg: plus(screen('DoT', s.dotDmg, '%'), sumStat(st, 'DoT DMG%')),
    weaknessDmg: plus(screen('Weakness DMG', s.weaknessDmg, '%'), sumStat(st, 'Weakness DMG')),
  }
}

/** The Manifest Ego levels that raise the card upgrade potentials and are unlocked in this build. */
export const unlockedPotentialEgo = (ch: CharacterPreset | undefined, build: LiveBuild) =>
  (ch?.potentialEgo ?? []).filter((e) => (build.egoLevel ?? 0) >= e.level)

/** Potential factor for a card upgrade: 1 + per level x (build level + the Manifest Ego bonuses that are unlocked). */
export function potentialFactor(upgrade: PotentialUpgrade | undefined, build: LiveBuild, ch: CharacterPreset | undefined,
  settings: Settings): Factor | null {
  if (!upgrade) return null
  const set = (upgrade === 'Basic' ? build.basicLevel : build.signatureLevel) || 0
  const egos = unlockedPotentialEgo(ch, build)
  const level = set + egos.reduce((n, e) => n + e.levels, 0)
  const sources: Source[] = [{ label: `${upgrade} Card Upgrade level ${set}`, value: set * settings.potentialPerLevel, unit: '%' }]
  for (const e of egos) sources.push({ label: `E${e.level}: +${e.levels} levels`, value: e.levels * settings.potentialPerLevel, unit: '%' })
  return { value: 1 + level * settings.potentialPerLevel, sources }
}

/** The % the game shows on a card for a base % (1 = 100%): raised by the Card + buffs, the card's potential and the Card % buffs that match it.
 * fixed: a Fixed damage % (raised only with the potentialFixed setting; a Fixed card's Heal is raised, Orlea's Annoying I). */
export function shownPct(base: number, card: Card, build: LiveBuild, ch: CharacterPreset | undefined, buffs: ActiveBuff[],
  settings: Settings, fixed = false): number {
  if (fixed && !settings.potentialFixed) return base
  const potential = potentialFactor(card.upgrade, build, ch, settings)
  if (!potential) return base
  const cb = cardBuffs(buffs.filter((b) => !b.counter && !b.weakness), card)
  const cardPct = [...cb.cardPct.all.sources, ...cb.cardPct.first.sources].reduce((a, s) => a + s.value, 0)
  const cardAdd = [...cb.cardAdd.all.sources, ...cb.cardAdd.first.sources].reduce((a, s) => a + s.value, 0)
  return (base + cardAdd) * potential.value * (1 + cardPct)
}

/** A per-count card's count on this play (Card.perCount; kept in the play's stacks, default 1), up to its Card.maxCount. */
export const playCount = (card: Pick<Card, 'perCount' | 'maxCount'>, play: RotationPlay) =>
  Math.min(Math.max(0, play.stacks?.[card.perCount!] ?? 1), card.maxCount ?? Infinity)

/** A Fixed DoT (Agony, measured in game, owner 2026-11-01): Fixed damage that the element and DoT DMG stats and Enemy DEF raise and that crits, but Vulnerable doesn't. */
export const isFixedDot = (card: Pick<Card, 'scaling' | 'kind'>) => card.scaling === 'Fixed' && card.kind === 'DoT'

/** The fight's enemy is weak to the card's element (Enemy.weakness: one element or all five). */
export const enemyWeakTo = (enemy: Pick<Enemy, 'weakness'>, card: Pick<Card, 'element'>) =>
  enemy.weakness === 'All' || (!!enemy.weakness && enemy.weakness === card.element)

/** Why a play hits a Weakness beyond the card and its Weakness Attack buffs (shown in the formula strip): the play's switch or the enemy. */
function weaknessReason(card: Card, cb: CardBuffs, enemy: Enemy, play: RotationPlay): Source[] {
  if (play.weakness) return [{ label: 'Hits a Weakness (this play)', value: 0, unit: 'x' }]
  if (card.weaknessApplies || cb.weaknessAttack.length || !enemyWeakTo(enemy, card)) return []
  return [{ label: `Enemy weak to ${enemy.weakness === 'All' ? 'every element' : enemy.weakness}`, value: 0, unit: 'x' }]
}

/** Plain Fixed damage: ignores every multiplier and can't crit (Unconfirmed). */
export const isPlainFixed = (card: Pick<Card, 'scaling' | 'kind'>) => card.scaling === 'Fixed' && card.kind !== 'DoT'

/** The hits one counterHits rule adds at this many stacks: its hits while above 0, or per `per` stacks up to `max`. */
const counterHitsAdded = (c: CounterHits, stacks: number) =>
  c.per ? Math.min(Math.floor(stacks / c.per) * c.hits, c.max ?? Infinity) : stacks > 0 ? c.hits : 0

/** The card's hits on this play before the play's own hit count: the count if it sets the hits (Card.countsHits), with the hits its
 * counter adds (Card.counterHits) and those a Ravaged target adds (Card.ravagedHits). */
export const playBaseHits = (card: Card, play: RotationPlay) =>
  (card.countsHits && card.perCount ? playCount(card, play) : card.hits)
  + counterHitsList(card).reduce((sum, c) => sum + counterHitsAdded(c, play.stacks?.[c.counter] ?? 0), 0)
  + (card.ravagedHits && (play.ravaged ?? card.targetRavaged) ? card.ravagedHits : 0)

/** The card as played: the play's own hit count and Cost, if set, replace the card's. A per-Cost card's % is its % x the Cost;
 * a per-count card's, its % x the play's count (unless the count is its hits). */
export function playCard(card: Card, play: RotationPlay): Card {
  const played: Card = { ...card, hits: play.hits ?? playBaseHits(card, play), cost: play.cost ?? card.cost, targetRavaged: play.ravaged ?? card.targetRavaged }
  if (card.perCost) played.pctUnits = played.cost ?? 1
  if (card.perCount && !card.countsHits) played.pctUnits = playCount(card, play)
  if (played.pctUnits !== undefined) played.pct = card.pct * played.pctUnits
  return played
}

/** One team member as they deal damage: their build's final stats and buffs (none for a teammate without a linked build). */
interface Member {
  name: string
  ch: CharacterPreset | undefined
  /** Their cards by attack list card id. */
  cards: Map<string, Card>
  dmg?: {
    build: LiveBuild
    stats: FinalStats
    fixedBuffs: ActiveBuff[]
    counterBuffs: ActiveBuff[]
    caps: PlayCounter[]
  }
}

function member(presets: Presets, name: string, cards: Card[], dmg?: { build: LiveBuild }, settings?: Settings): Member {
  const ch = findCharacter(presets, name)
  const m: Member = { name, ch, cards: new Map(cards.map((c) => [c.id, c])) }
  if (dmg && settings) {
    const buffs = activeBuffs(presets, name, dmg.build, settings)
    m.dmg = {
      build: dmg.build, stats: finalStats(presets, name, dmg.build, settings),
      fixedBuffs: buffs.filter((b) => !b.counter), counterBuffs: buffs.filter((b) => b.counter), caps: activeCounters(buffs),
    }
  }
  return m
}

/** A team member's triggers that are on: their character's (from its Manifest Ego level) and their deck cards'. */
function memberTriggers(ch: CharacterPreset | undefined, ego: number, deck: DeckItem[]): Trigger[] {
  return [...(ch?.triggers ?? []), ...deckPresets(deck).flatMap((p) => p.triggers ?? [])].filter((t) => (t.egoLevel ?? 0) <= ego)
}

const capped = (play: RotationPlay, name: string, max: number | null | undefined) =>
  Math.min(Math.max(0, play.stacks?.[name] ?? 0), max ?? Infinity)

/** A counter as a card's buffs read it: a counter named like the card's count is that number, the one its stepper shows (default 1). */
const counterOn = (card: Card, play: RotationPlay, name: string, max: number | null | undefined) =>
  (name === card.perCount ? Math.min(playCount(card, play), max ?? Infinity) : capped(play, name, max))

/** A play's counters as shown: the ones its buffs read, with the card's own count in full, read by a buff or not (E2's "in Agony" stops at 1, the tick doesn't). */
const shownCounters = (card: Card, play: RotationPlay, read: { name: string; stacks: number }[]) =>
  [...(card.perCount ? [{ name: card.perCount, stacks: playCount(card, play) }] : []), ...read.filter((c) => c.name !== card.perCount)].filter((c) => c.stacks > 0)

/** Damage of every hit of every play in the build's attack list: the build's character's plays and (with `saves`, for teammates
 * linked to a saved build) their teammates', plus the hits the team's triggers add. fight: the enemy everyone hits (none: no modifiers). */
export function computeBuild(presets: Presets, charName: string, build: Build, settings: Settings,
  saves: Saves = {}, fight?: Pick<Fight, 'enemies'>): BuildResult {
  const enemy = fight?.enemies[0] ?? NO_ENEMY
  const team = withLinkedTeam(build, saves)
  const ch = findCharacter(presets, charName)
  const warnings = setupWarnings(presets, charName, ch, team)
  warnings.push(...deletedLinks(build, saves), ...unreadableValues(build))
  if (enemy.defMult <= 0) warnings.push("The fight's enemy DEF multiplier is 0, so every hit deals 0 (Setup tab, Fight).")
  const mainDeck = buildDeck(ch, team)
  const main = member(presets, charName, mainDeck.map((i) => i.card), { build: team }, settings)
  const members: (Member | undefined)[] = []
  const triggers: { t: Trigger; owner: Member; slot?: number }[] =
    memberTriggers(ch, team.egoLevel ?? 0, mainDeck).map((t) => ({ t, owner: main }))
  ;(team.team ?? []).forEach((t, slot) => {
    if (!t.character || t.character === charName) return
    const tch = findCharacter(presets, t.character)
    const view = teammateView(charName, team, slot, saves)
    const deck = teammateDeck(tch, t, view ? buildNodeOn(view.build) : undefined)
    members[slot] = member(presets, t.character, deck.map((i) => i.card), view, settings)
    for (const tr of memberTriggers(tch, t.egoLevel ?? 0, deck)) triggers.push({ t: tr, owner: members[slot]!, slot })
  })
  // A play can set the triggers' counters, and those of their owners' buffs (which reach the hits they add)
  const triggerCaps = mergeCaps(triggers.filter((x) => x.t.counter).map((x) => ({ name: x.t.counter!, max: x.t.maxStacks ?? null })),
    [...new Set(triggers.map((x) => x.owner))].flatMap((o) => o.dmg?.caps ?? []))

  let k = 0
  // The hits of one card played by m, with the play's debuffs and counter stacks; added: only that many hits after the card's own (no first-hit buffs);
  // listed: they're numbered across the attack list (a trigger's hits aren't)
  const cardHits = (m: Member, card: Card, play: RotationPlay, added = 0, listed = true) => {
    const d = m.dmg!
    const counters = playCaps(d, card).map(({ name, max }) => ({ name, stacks: counterOn(card, play, name, max) }))
    const live: ActiveBuff[] = d.counterBuffs.map((b) => {
      const stacks = counters.find((c) => c.name === b.counter)?.stacks ?? 0
      return { ...b, stacks: b.maxStacks ? Math.min(stacks, b.maxStacks) : stacks }
    })
    const all = [...d.fixedBuffs, ...live]
    let cb = cardBuffs(all, card)
    // Hits a Weakness: the play's switch, else the card, a Weakness Attack buff or the fight's enemy (owner, 2026-11-09)
    const weakAuto = card.weaknessApplies || cb.weaknessAttack.length > 0 || enemyWeakTo(enemy, card)
    const weak = play.weakness ?? weakAuto
    // "Weakness Attack: +50% Damage Amount" lines count only on a play that hits a Weakness
    if (!weak && all.some((b) => b.weakness)) cb = cardBuffs(all.filter((b) => !b.weakness), card)
    const upgradable = !(card.scaling === 'Fixed' && !settings.potentialFixed)
    const potential = upgradable ? potentialFactor(card.upgrade, d.build, m.ch, settings) : null
    const hits: Hit[] = []
    const stats = { ...d.stats, elemDmg: cardElement(m, d, card) }
    const own = Math.max(0, Math.floor(card.hits))
    for (let h = added ? own + 1 : 1; h <= own + added; h++) hits.push(computeHit(card, h, listed ? ++k : 0, cb, potential, stats, enemy, play, settings, weak))
    return { hits, counters, cb, weak, weakAuto, ...totals(hits) }
  }

  const plays: Play[] = []
  const counterOptions: BuildResult['counterOptions'] = []
  const weaknessAuto: boolean[] = []
  const pending = new Map<Member, { from: string; index: number; appliesTo: string; share: number }>()
  const byMember = new Map<Member, Totals>()
  const credit = (m: Member, t: Totals) => {
    const sum = byMember.get(m) ?? { nonCrit: 0, crit: 0, expected: 0 }
    byMember.set(m, { nonCrit: sum.nonCrit + t.nonCrit, crit: sum.crit + t.crit, expected: sum.expected + t.expected })
  }
  // Snapshot (owner, 2026-10-26): every switched-on buff counts on every hit; each play sets its own debuffs and counter stacks
  ;(team.rotation ?? []).forEach((play, index) => {
    const m = play.by === undefined ? main : members[play.by]
    const base = m?.cards.get(play.cardId)
    counterOptions[index] = mergeCaps(playCaps(m?.dmg, base), triggerCaps)
    if (!m || !base) {
      warnings.push(!m
        ? `Play ${index + 1}: it's a card of teammate ${play.by! + 1}, and that slot has no teammate now, so it's left out.`
        : `Play ${index + 1}: its card is no longer in the deck, so it's left out.`)
      return
    }
    // A per-play hit count also counts for '2+ hits' buffs, so it's buffed as its own card
    const card = playCard(base, play)
    const noDmgWeak = card.weaknessApplies || enemyWeakTo(enemy, card)
    const own = m.dmg ? cardHits(m, card, play)
      : { hits: [], counters: [], cb: undefined, weak: play.weakness ?? noDmgWeak, weakAuto: noDmgWeak, nonCrit: 0, crit: 0, expected: 0 }
    weaknessAuto[index] = own.weakAuto
    if (m.dmg && !card.targetRavaged) warnings.push(...ravagedOnly(m.dmg.counterBuffs, card, play, index))
    const fixedOf = fixedAmountOf(card)
    if (m.dmg && fixedOf && capped(play, fixedOf, null) <= 0) warnings.push(`Play ${index + 1} (${card.name}): its damage is a share of ${fixedOf}, which is 0 on this play.`)
    // Fixed damage set up by an earlier play of the same character: a share of this play's damage (crit or not), on the next matching card
    let followUp: FollowUp | undefined
    const p = pending.get(m)
    if (p && buffMatches({ appliesTo: p.appliesTo, condition: 'Always' }, card)) {
      followUp = { from: p.from, share: p.share, nonCrit: own.nonCrit * p.share, crit: own.crit * p.share, expected: own.expected * p.share }
      pending.delete(m)
    }
    const fu = m.ch?.cards?.find((x) => x.id === base.preset)?.followUp
    const ego = m.dmg?.build.egoLevel ?? (play.by === undefined ? team.egoLevel : team.team[play.by]?.egoLevel) ?? 0
    if (fu) {
      const left = pending.get(m)
      if (left) warnings.push(unmatchedFollowUp(left))
      pending.set(m, { from: card.name, index, appliesTo: fu.appliesTo, share: fu.ego && ego >= fu.ego.level ? fu.ego.share : fu.share })
    }
    credit(m, { nonCrit: own.nonCrit + (followUp?.nonCrit ?? 0), crit: own.crit + (followUp?.crit ?? 0), expected: own.expected + (followUp?.expected ?? 0) })

    // Hits the team's triggers add (Selena's Mark): the trigger owner's, with this play's counters and Vulnerable
    const triggered: Triggered[] = []
    for (const { t, owner, slot } of triggers) {
      if (!owner.dmg || (t.others && slot === play.by) || (t.own && slot !== play.by)) continue
      if (t.counter && capped(play, t.counter, t.maxStacks) <= 0) continue
      if (!buffMatches({ appliesTo: t.on, condition: 'Always' }, card)) continue
      if (t.weakness && !own.weak) continue
      // One more hit of a play that hits nothing is no hit either; a play with no hits of its own can't crit
      if (t.repeat && Math.floor(card.hits) < 1) continue
      if (t.onCrit && !own.hits.length) continue
      const tp = owner.ch?.cards?.find((x) => x.id === t.card)
      if (!tp) continue
      const tcard = t.repeat ? { ...card, id: `trigger:${card.id}` } : presetCard(tp, owner.ch!.element, `trigger:${tp.id}`, buildNodeOn(owner.dmg.build))
      if (t.perStack) tcard.hits *= capped(play, t.counter!, t.maxStacks)
      // Same target, same moment (Unconfirmed; in-game test ravaged-triggered-hits): Ravaged on the play is Ravaged on the hit it sets off,
      // and a play switched off is off for that hit too
      tcard.targetRavaged = play.ravaged ?? (tcard.targetRavaged || card.targetRavaged)
      const r = t.repeat ? cardHits(owner, tcard, play, 1, false)
        : cardHits(owner, tcard, { cardId: tcard.id, vulnerable: play.vulnerable, stacks: play.stacks }, 0, false)
      // onCrit: one roll per play, on its first hit (Flame Thrower III has one hit, and on all enemies it crits or doesn't: owner, 2026-11-01;
      // more hits set on the play: in-game test lucas-readings)
      const chance = t.onCrit ? own.hits[0]?.critRate ?? 0 : t.chance ?? 1
      const hit = t.onCrit
        ? { nonCrit: 0, crit: r.crit, expected: r.expected * chance }
        : { nonCrit: r.nonCrit * chance, crit: r.crit * chance, expected: r.expected * chance }
      triggered.push({ card: tcard, by: owner.name, chance, ...(t.onCrit ? { onCrit: true } : {}), hits: r.hits, ...hit })
      credit(owner, hit)
    }
    const trig = totals(triggered)
    plays.push({ card, index, hits: own.hits, counters: shownCounters(card, play, own.counters),
      vulnerable: !!play.vulnerable, weaknessDebuff: !!play.weaknessDebuff, ravaged: card.targetRavaged, weakness: own.weak, followUp, triggered,
      ...(play.by !== undefined ? { slot: play.by, by: m.name, ...(m.dmg ? {} : { noBuild: true }) } : {}),
      nonCrit: own.nonCrit + (followUp?.nonCrit ?? 0) + trig.nonCrit, crit: own.crit + (followUp?.crit ?? 0) + trig.crit,
      expected: own.expected + (followUp?.expected ?? 0) + trig.expected })
  })
  for (const left of pending.values()) warnings.push(unmatchedFollowUp(left))
  const others = members.filter((x): x is Member => !!x)
  for (const x of others) {
    // byMember: they played a card or one of their triggers fired
    if (x.dmg && !x.dmg.build.stats.attack && byMember.has(x)) {
      warnings.push(`${x.name}'s linked build (${x.dmg.build.name}) has no Attack on its stats screen, so their hits deal no damage.`)
    }
  }
  const byCharacter = [main, ...others]
    .filter((x) => x === main || byMember.has(x))
    .map((x) => ({ name: x.name, ...(byMember.get(x) ?? { nonCrit: 0, crit: 0, expected: 0 }) }))
  // Two dropdowns naming the same lost set give the same warning: once is enough
  return { stats: main.dmg!.stats, plays, byCharacter, counterOptions, weaknessAuto, warnings: [...new Set(warnings)], ...totals(plays) }
}

/** A follow-up (Rossweisse's Ego skill) with no matching play after it before the list ends or the same card is played again. */
const unmatchedFollowUp = (p: { from: string; index: number; appliesTo: string }) =>
  `Play ${p.index + 1} (${p.from}): its damage goes on the next ${p.appliesTo} card played, and none follows it, so that part isn't counted.`

/** What the build names but the presets don't have (renamed or removed by an update): it counts for nothing, so say so. */
function setupWarnings(presets: Presets, charName: string, ch: CharacterPreset | undefined, build: LiveBuild): string[] {
  const out: string[] = []
  if (!ch) out.push(`${charName} is not in the presets.`)
  const sets = (who: string, fragments: string[] = []) => fragments.filter((f) => f && !findFragmentSet(presets, f))
    .map((f) => `${who}'s memory fragment set ${f} is not in the presets: its effects don't count.`)
  const partner = (who: string, p: string) => (p && !findPartner(presets, p) ? [`${who}'s partner ${p} is not in the presets: its effects don't count.`] : [])
  // A named piece a re-import dropped: its saved rarity still gives the flat stat
  const lost = (who: string, equipment: Build['equipment']) => equipped(presets, equipment).filter((e) => e.lost)
    .map((e) => `${who}'s ${e.slot} ${e.lost} is not in the presets any more: it counts as a ${e.rarity} ${e.slot} (its flat ${EQUIP_STAT[e.slot].label}), without effects. Pick it again on Setup › Equipment.`)
  out.push(...partner(charName, build.partner), ...sets(charName, build.fragments), ...lost(charName, build.equipment))
  for (const d of build.deck ?? []) {
    if (!d.custom && !ch?.cards?.some((p) => p.id === d.preset)) out.push(`Deck card ${d.preset} is not in ${charName}'s cards any more, so it's left out.`)
  }
  for (const t of build.team ?? []) {
    if (!t.character) continue
    const tch = findCharacter(presets, t.character)
    if (!tch) out.push(`Teammate ${t.character} is not in the presets.`)
    out.push(...partner(t.character, t.partner), ...sets(t.character, t.fragments), ...lost(t.character, t.live?.equipment))
    for (const id of t.cards ?? []) if (tch && !tch.cards?.some((p) => p.id === id)) out.push(`${t.character}'s card ${id} is not in their cards any more, so it's left out.`)
  }
  return out
}

/** A play's stacks that do nothing because they only count on a Ravaged target (Ember on a Strike with Target Ravaged off). */
function ravagedOnly(buffs: ActiveBuff[], card: Card, play: RotationPlay, index: number): string[] {
  const names = buffs.filter((b) => b.condition === 'Ravaged only' && capped(play, b.counter!, b.maxStacks) > 0
    && buffMatches({ appliesTo: b.appliesTo, condition: 'Always' }, card)).map((b) => b.counter!)
  return [...new Set(names)].map((n) => `Play ${index + 1} (${card.name}): ${n} only counts on a Ravaged target. Switch on Target Ravaged for this play, or set it to 0.`)
}

/** The elemental damage a card gets: its own element's stat. Boosts (Elemental DMG%) are read as the character's own element
 * (Unconfirmed; no card has another element yet). */
function cardElement(m: Member, d: NonNullable<Member['dmg']>, card: Card): Stat {
  if (!m.ch || card.element === m.ch.element) return d.stats.elemDmg
  const value = d.build.stats.elemDmg[card.element] || 0
  return { value, sources: [{ label: `Stats screen ${card.element} DMG`, value, unit: '%' }] }
}

function totals(xs: Totals[]): Totals {
  return {
    nonCrit: xs.reduce((a, x) => a + x.nonCrit, 0), crit: xs.reduce((a, x) => a + x.crit, 0),
    expected: xs.reduce((a, x) => a + x.expected, 0),
  }
}

/** Counters from two lists, once each (the smaller max wins). */
function mergeCaps(a: PlayCounter[], b: PlayCounter[]): PlayCounter[] {
  const out = new Map<string, PlayCounter>()
  for (const c of [...a, ...b]) {
    const prev = out.get(c.name)
    const max = !prev || prev.max === null ? c.max : c.max === null ? prev.max : Math.min(prev.max, c.max)
    out.set(c.name, { name: c.name, max, ...(prev?.amount || c.amount ? { amount: true } : {}) })
  }
  return [...out.values()]
}

/** The amount counter a Fixed card's damage is a share of (Card.fixedOf). */
const fixedAmountOf = (card: Card | undefined) => (card?.scaling === 'Fixed' ? card.fixedOf : undefined)

/** The counters a play of this card has: the ones its player's buffs read, plus the one that adds hits to it, even when no buff reads
 * that one (Annihilation's Dark Mist Stance, Yuki's Inspiration with 3-1 off): then it's on/off. A counter that buffs read keeps their
 * stacks (Hugo's Quick Fix II adds a hit in a Commence the Hunt state, and the +30% per stack still reads the play's number).
 * A counter stops where the card's own buffs stop reading it. */
function playCaps(d: Member['dmg'], card: Card | undefined) {
  const fixedOf = fixedAmountOf(card)
  // an on/off counter caps at 1; a per-stacks one at the stacks its max hits need (none without a max)
  const hitsCounters = counterHitsList(card).filter((h) => !d?.caps.some((c) => c.name === h.counter))
  return mergeCaps(d?.caps ?? [], [
    ...hitsCounters.map((h) => ({ name: h.counter, max: h.per ? (h.max ? h.per * Math.ceil(h.max / h.hits) : null) : 1 })),
    ...(fixedOf ? [{ name: fixedOf, max: null, amount: true }] : []),
    ...activeCounters(card ? (d?.counterBuffs ?? []).filter((b) => buffMatches({ appliesTo: b.appliesTo, condition: 'Always' }, card)) : []),
  ])
}

function computeHit(card: Card, hitNo: number, k: number, cb: ReturnType<typeof cardBuffs>, potential: Factor | null,
  stats: FinalStats, enemy: Enemy, play: RotationPlay, settings: Settings, weakApplies: boolean): Hit {
  const first = hitNo === 1
  // Card % buffs raise the base % like the card upgrade potentials, so only on cards entered at base %
  const cardPctSources = potential ? [...cb.cardPct.all.sources, ...(first ? cb.cardPct.first.sources : [])] : []
  if (potential && cardPctSources.length) {
    potential = {
      value: potential.value * (1 + cardPctSources.reduce((a, s) => a + s.value, 0)),
      sources: [...potential.sources, ...cardPctSources],
    }
  }
  const both = (b: { all: { sources: Source[] }; first: { sources: Source[] } }) => [...b.all.sources, ...(first ? b.first.sources : [])]
  const total = (sources: Source[]) => sources.reduce((a, s) => a + s.value, 0)
  const cardAdd = potential ? both(cb.cardAdd) : []
  const cardPct = card.pct + total(cardAdd)
  const fixedOf = fixedAmountOf(card)
  const amount = fixedOf ? capped(play, fixedOf, null) : 0
  const stat: Factor = card.scaling === 'DEF'
    ? {
      value: stats.atk.value * settings.defCardAtkCoef + stats.def.value * settings.defCardDefCoef,
      sources: [
        { label: `Final ATK ${round(stats.atk.value)} x ${settings.defCardAtkCoef}`, value: stats.atk.value * settings.defCardAtkCoef, unit: 'flat' },
        { label: `Final DEF ${round(stats.def.value)} x ${settings.defCardDefCoef}`, value: stats.def.value * settings.defCardDefCoef, unit: 'flat' },
      ],
    }
    : fixedOf
      ? { value: amount, sources: [{ label: `${fixedOf} (this play)`, value: amount, unit: 'flat' }] }
      : stats.atk
  // Flat damage is a number of its own, whatever the stat and its constant are; the multipliers raise it (owner, 2026-11-01; Unconfirmed)
  const flatSources = both(cb.flat).map((s) => ({ ...s, unit: 'flat' as const }))
  const flat: Factor | null = flatSources.length ? { value: total(flatSources), sources: flatSources } : null
  const baseSources = both(cb.basePct)
  const basePct: Factor | null = baseSources.length ? { value: total(baseSources), sources: baseSources } : null
  // The card's upgraded %, as the game shows it: rounded to a whole % before buffs (Settings; owner, 2026-11-01; Unconfirmed).
  // The game shows a per-Cost or per-count card's % for one unit (16% for each Rhythm), so that's what's rounded (Unconfirmed)
  const raised = cardPct * (potential?.value ?? 1)
  const units = card.pctUnits || 1
  const upgradedPct = potential && settings.roundCardPct ? wholePct(raised / units) * units : raised
  const pct = upgradedPct + (basePct?.value ?? 0)
  const finalSources = both(cb.final)
  const final: Factor | null = finalSources.length ? { value: 1 + total(finalSources), sources: finalSources } : null
  // A Fixed DoT takes only the buffs marked fixedDot (Olga's Shard Erosion); others don't raise it (Tressa's Agony, measured)
  const multSources = [...cb.multiplicative.all.sources, ...(first ? cb.multiplicative.first.sources : [])]
    .filter((s) => !isFixedDot(card) || s.fixedDot)
  const combine = (sources: Source[]) => settings.multMode === 'Chained'
    ? sources.reduce((a, s) => a * (1 + s.value), 1)
    : 1 + sources.reduce((a, s) => a + s.value, 0)
  const multValue = combine(multSources)
  const addSources = [...cb.additive.all.sources, ...(first ? cb.additive.first.sources : [])]
  const additive = { value: addSources.reduce((a, s) => a + s.value, 0), sources: addSources }
  const inHand = pct * combine(multSources.filter((s) => !s.onTarget))
    + addSources.filter((s) => !s.onTarget).reduce((a, s) => a + s.value, 0)

  // Weakness DMG buffs (Matrix Overlay's "+15% Weakness Damage Amount taken") add to the stat on this play
  const weakBuffs = both(cb.weaknessDmg)
  const weakness: Factor | null = weakApplies ? {
    value: (stats.weaknessDmg.value + total(weakBuffs)) * (1 + settings.extraWeakness),
    sources: [
      ...stats.weaknessDmg.sources,
      ...weakBuffs,
      ...(card.weaknessApplies ? [] : cb.weaknessAttack.map((s) => ({ ...s, label: `Weakness Attack: ${s.label}` }))),
      ...weaknessReason(card, cb, enemy, play),
      ...(settings.extraWeakness ? [{ label: 'Extra weakness factor (Settings)', value: settings.extraWeakness, unit: '%' as const }] : []),
    ],
  } : null
  const vulnerable = play.vulnerable
    ? { value: 1 + settings.vulnerable, sources: [{ label: 'Vulnerable on the target (this play)', value: settings.vulnerable, unit: '%' as const }] }
    : null
  const enemyDr = enemy.dr
    ? { value: 1 - enemy.dr, sources: [{ label: 'Enemy damage reduction', value: enemy.dr, unit: '%' as const }] }
    : null
  const weaknessDebuff = play.weaknessDebuff
    ? { value: 1 - settings.weaknessDebuff, sources: [{ label: 'Weakness debuff on you (this play)', value: settings.weaknessDebuff, unit: '%' as const }] }
    : null
  const ravaged = card.targetRavaged && settings.ravaged
    ? { value: 1 + settings.ravaged, sources: [{ label: 'Ravaged target (Settings)', value: settings.ravaged, unit: '%' as const }] }
    : null
  const onTarget = (weakness?.value ?? 1) * (vulnerable?.value ?? 1) * (enemyDr?.value ?? 1) * (weaknessDebuff?.value ?? 1) * (ravaged?.value ?? 1)
  const cardMult = (pct * multValue + additive.value) * onTarget

  const elemDmg = stats.elemDmg.value ? { value: 1 + stats.elemDmg.value, sources: stats.elemDmg.sources } : null
  const mech = card.kind === 'Extra Attack' ? stats.extraDmg : card.kind === 'DoT' ? stats.dotDmg : null
  const mechDmg = mech && mech.value ? { value: 1 + mech.value, sources: mech.sources } : null
  const enemyDef = enemy.defMult !== 1
    ? { value: enemy.defMult, sources: [{ label: 'Enemy DEF multiplier', value: enemy.defMult, unit: 'x' as const }] }
    : null
  const critBuffs = (b: typeof cb.critDmg) => [...b.all.sources, ...(first ? b.first.sources : [])]
  const critDmgSources = [...stats.critDmg.sources, ...critBuffs(cb.critDmg)]
  const critDmg = stats.critDmg.value + critBuffs(cb.critDmg).reduce((a, s) => a + s.value, 0)
  const critRateSources = [...stats.critRate.sources, ...critBuffs(cb.critRate)]
  let critRate = stats.critRate.value + critBuffs(cb.critRate).reduce((a, s) => a + s.value, 0)
  if (critRate > settings.critCap) {
    if (!critRateSources.some((s) => s.label === 'Capped (Settings)')) critRateSources.push({ label: 'Capped (Settings)', value: settings.critCap, unit: '%' })
    critRate = settings.critCap
  }

  const fixedConstant = fixedOf ? 1 : settings.fixedAtkCoef
  // Fixed damage: % x Final ATK x its constant (owner thinks ATK-based, 2026-10-28; Unconfirmed), or % x the amount the card names (fixedOf)
  const fixedDamage = pct * stat.value * fixedConstant + (flat?.value ?? 0)
  const scaled = (elemDmg?.value ?? 1) * (mechDmg?.value ?? 1) * (enemyDef?.value ?? 1)
  const nonCrit = isPlainFixed(card) ? fixedDamage
    : isFixedDot(card) ? fixedDamage * scaled * multValue
      : (cardMult * stat.value * settings.atkConstant + (flat?.value ?? 0) * multValue * onTarget) * scaled * (final?.value ?? 1)
  const crit = isPlainFixed(card) ? nonCrit : nonCrit * critDmg
  const expected = isPlainFixed(card) ? nonCrit : nonCrit * (1 + critRate * (critDmg - 1))
  return {
    globalHit: k, hitNo, cardPct, cardAdd, potential, upgradedPct, basePct, flat, multFactor: { value: multValue, sources: multSources }, additive,
    weakness, vulnerable, enemyDr, weaknessDebuff, ravaged, inHand, cardMult, stat,
    constant: card.scaling === 'Fixed' ? fixedConstant : settings.atkConstant,
    elemDmg, mechDmg, enemyDef, final, critDmg, critRate, critDmgSources, critRateSources, nonCrit, crit, expected,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
