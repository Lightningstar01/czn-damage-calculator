// The damage formula (docs/FORMULA.md). Pure functions: inputs in, numbers and their sources out.
import { buildDeck, buildNodeOn, deckPresets, presetCard, teammateDeck, type DeckItem } from './deck'
import { activeBuffs, activeCounters, activeStats, buffMatches, cardBuffs, findCharacter, type ActiveBuff, type ActiveStat, type Source } from './buffs'
import { teammateView, withLinkedTeam, type Saves } from './team'
import type { Build, Card, CharacterPreset, CharacterSave, PotentialUpgrade, Presets, RotationPlay, Settings, StatName, Trigger } from './types'

export interface Stat {
  value: number
  sources: Source[]
}

export interface FinalStats {
  atk: Stat
  def: Stat
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
  /** 1-based hit number across the build's whole attack list. */
  globalHit: number
  hitNo: number
  /** The card's %: the base (with Card + buffs) when a potential upgrade applies, otherwise as shown in-game. */
  cardPct: number
  /** Card + buffs in cardPct. */
  cardAdd: Source[]
  /** Basic / Signature Card Upgrade potential (card % x this); null for cards without one. */
  potential: Factor | null
  /** Base % buffs, added to the card % after the potential (null: none). */
  basePct: Factor | null
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
  /** Per-play counter stacks (Ember, Spirit of the Aromata...) set on this play, capped by max stacks; only those above 0. */
  counters: { name: string; stacks: number }[]
  vulnerable: boolean
  weaknessDebuff: boolean
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
  chance: number
  /** Its hits at full value (the totals below are x chance). */
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
  counterOptions: { name: string; max: number | null }[][]
}

function sumStat(stats: ActiveStat[], name: StatName): Stat {
  const sources = stats.filter((s) => s.stat === name).map((s) => ({
    label: s.stacks !== 1 ? `${s.label} x${s.stacks}` : s.label, value: s.value * s.stacks, unit: s.unit,
  }))
  return { value: sources.reduce((a, s) => a + s.value, 0), sources }
}

/** Final stats: stats screen + boosts. ATK/DEF = screen x (1 + %) + flat. */
export function finalStats(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings): FinalStats {
  const st = activeStats(presets, charName, cs, build)
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
    critRate,
    critDmg: plus(screen('Crit DMG', s.critDmg, '%'), sumStat(st, 'Crit DMG')),
    elemDmg: plus(screen(`${element ?? ''} DMG`, element ? s.elemDmg[element] || 0 : 0, '%'), sumStat(st, 'Elemental DMG%')),
    extraDmg: plus(screen('Extra DMG', s.extraDmg, '%'), sumStat(st, 'Extra DMG%')),
    dotDmg: plus(screen('DoT', s.dotDmg, '%'), sumStat(st, 'DoT DMG%')),
    weaknessDmg: plus(screen('Weakness DMG', s.weaknessDmg, '%'), sumStat(st, 'Weakness DMG')),
  }
}

/** The Manifest Ego levels that raise the card upgrade potentials and are unlocked in this build. */
export const unlockedPotentialEgo = (ch: CharacterPreset | undefined, build: Build) =>
  (ch?.potentialEgo ?? []).filter((e) => (build.egoLevel ?? 0) >= e.level)

/** Potential factor for a card upgrade: 1 + per level x (build level + the Manifest Ego bonuses that are unlocked). */
export function potentialFactor(upgrade: PotentialUpgrade | undefined, build: Build, ch: CharacterPreset | undefined,
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
export function shownPct(base: number, card: Card, build: Build, ch: CharacterPreset | undefined, buffs: ActiveBuff[],
  settings: Settings, fixed = false): number {
  if (fixed && !settings.potentialFixed) return base
  const potential = potentialFactor(card.upgrade, build, ch, settings)
  if (!potential) return base
  const cb = cardBuffs(buffs.filter((b) => !b.counter), card)
  const cardPct = [...cb.cardPct.all.sources, ...cb.cardPct.first.sources].reduce((a, s) => a + s.value, 0)
  const cardAdd = [...cb.cardAdd.all.sources, ...cb.cardAdd.first.sources].reduce((a, s) => a + s.value, 0)
  return (base + cardAdd) * potential.value * (1 + cardPct)
}

/** A per-count card's count on this play (Card.perCount; kept in the play's stacks, default 1). */
export const playCount = (name: string, play: RotationPlay) => play.stacks?.[name] ?? 1

/** The card's hits on this play before the play's own hit count: with the hits its counter adds (Card.counterHits). */
export const playBaseHits = (card: Card, play: RotationPlay) =>
  card.hits + (card.counterHits && (play.stacks?.[card.counterHits.counter] ?? 0) > 0 ? card.counterHits.hits : 0)

/** The card as played: the play's own hit count and Cost, if set, replace the card's. A per-Cost card's % is its % x the Cost;
 * a per-count card's, its % x the play's count. */
export function playCard(card: Card, play: RotationPlay): Card {
  const played = { ...card, hits: play.hits ?? playBaseHits(card, play), cost: play.cost ?? card.cost }
  if (card.perCost) played.pct = card.pct * (played.cost ?? 1)
  if (card.perCount) played.pct = card.pct * playCount(card.perCount, play)
  return played
}

/** One team member as they deal damage: their build's final stats and buffs (none for a teammate without a linked build). */
interface Member {
  name: string
  ch: CharacterPreset | undefined
  /** Their cards by attack list card id. */
  cards: Map<string, Card>
  dmg?: {
    build: Build
    stats: FinalStats
    fixedBuffs: ActiveBuff[]
    counterBuffs: ActiveBuff[]
    caps: { name: string; max: number | null }[]
  }
}

function member(presets: Presets, name: string, cards: Card[], dmg?: { cs: CharacterSave; build: Build }, settings?: Settings): Member {
  const ch = findCharacter(presets, name)
  const m: Member = { name, ch, cards: new Map(cards.map((c) => [c.id, c])) }
  if (dmg && settings) {
    const buffs = activeBuffs(presets, name, dmg.cs, dmg.build, settings)
    m.dmg = {
      build: dmg.build, stats: finalStats(presets, name, dmg.cs, dmg.build, settings),
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

/** Damage of every hit of every play in the build's attack list: the build's character's plays and (with `saves`, for teammates
 * linked to a saved build) their teammates', plus the hits the team's triggers add. */
export function computeBuild(presets: Presets, charName: string, cs: CharacterSave, build: Build, settings: Settings,
  saves: Saves = {}): BuildResult {
  const team = withLinkedTeam(build, saves)
  const ch = findCharacter(presets, charName)
  const mainDeck = buildDeck(ch, team)
  const main = member(presets, charName, mainDeck.map((i) => i.card), { cs, build: team }, settings)
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
  // The hits of one card played by m, with the play's debuffs and counter stacks
  const cardHits = (m: Member, card: Card, play: RotationPlay) => {
    const d = m.dmg!
    const counters = d.caps.map(({ name, max }) => ({ name, stacks: capped(play, name, max) }))
    const live: ActiveBuff[] = d.counterBuffs.map((b) => ({ ...b, stacks: counters.find((c) => c.name === b.counter)?.stacks ?? 0 }))
    const cb = cardBuffs([...d.fixedBuffs, ...live], card)
    const upgradable = !(card.scaling === 'Fixed' && !settings.potentialFixed)
    const potential = upgradable ? potentialFactor(card.upgrade, d.build, m.ch, settings) : null
    const hits: Hit[] = []
    for (let h = 1; h <= Math.max(0, Math.floor(card.hits)); h++) hits.push(computeHit(card, h, ++k, cb, potential, d.stats, d.build, play, settings))
    return { hits, counters, cb, ...totals(hits) }
  }

  const plays: Play[] = []
  const counterOptions: BuildResult['counterOptions'] = []
  const pending = new Map<Member, { from: string; appliesTo: string; share: number }>()
  const byMember = new Map<Member, Totals>()
  const credit = (m: Member, t: Totals) => {
    const sum = byMember.get(m) ?? { nonCrit: 0, crit: 0, expected: 0 }
    byMember.set(m, { nonCrit: sum.nonCrit + t.nonCrit, crit: sum.crit + t.crit, expected: sum.expected + t.expected })
  }
  // Snapshot (owner, 2026-10-26): every switched-on buff counts on every hit; each play sets its own debuffs and counter stacks
  ;(team.rotation ?? []).forEach((play, index) => {
    const m = play.by === undefined ? main : members[play.by]
    const base = m?.cards.get(play.cardId)
    counterOptions[index] = mergeCaps(m?.dmg?.caps ?? [], triggerCaps)
    if (!m || !base) return
    // A per-play hit count also counts for '2+ hits' buffs, so it's buffed as its own card
    const card = playCard(base, play)
    const own = m.dmg ? cardHits(m, card, play) : { hits: [], counters: [], cb: undefined, nonCrit: 0, crit: 0, expected: 0 }
    // Fixed damage set up by an earlier play of the same character: a share of this play's damage (crit or not), on the next matching card
    let followUp: FollowUp | undefined
    const p = pending.get(m)
    if (p && buffMatches({ appliesTo: p.appliesTo, condition: 'Always' }, card)) {
      followUp = { from: p.from, share: p.share, nonCrit: own.nonCrit * p.share, crit: own.crit * p.share, expected: own.expected * p.share }
      pending.delete(m)
    }
    const fu = m.ch?.cards?.find((x) => x.id === base.preset)?.followUp
    const ego = m.dmg?.build.egoLevel ?? (play.by === undefined ? team.egoLevel : team.team[play.by]?.egoLevel) ?? 0
    if (fu) pending.set(m, { from: card.name, appliesTo: fu.appliesTo, share: fu.ego && ego >= fu.ego.level ? fu.ego.share : fu.share })
    credit(m, { nonCrit: own.nonCrit + (followUp?.nonCrit ?? 0), crit: own.crit + (followUp?.crit ?? 0), expected: own.expected + (followUp?.expected ?? 0) })

    // Hits the team's triggers add (Selena's Mark): the trigger owner's, with this play's counters and Vulnerable
    const triggered: Triggered[] = []
    for (const { t, owner, slot } of triggers) {
      if (!owner.dmg || (t.others && slot === play.by)) continue
      if (t.counter && capped(play, t.counter, t.maxStacks) <= 0) continue
      if (!buffMatches({ appliesTo: t.on, condition: 'Always' }, card)) continue
      if (t.weakness && !card.weaknessApplies && !own.cb?.weaknessAttack.length) continue
      const tp = owner.ch?.cards?.find((x) => x.id === t.card)
      if (!tp) continue
      const tcard = presetCard(tp, owner.ch!.element, `trigger:${tp.id}`, buildNodeOn(owner.dmg.build))
      if (t.perStack) tcard.hits *= capped(play, t.counter!, t.maxStacks)
      const r = cardHits(owner, tcard, { cardId: tcard.id, vulnerable: play.vulnerable, stacks: play.stacks })
      const chance = t.chance ?? 1
      const hit = { nonCrit: r.nonCrit * chance, crit: r.crit * chance, expected: r.expected * chance }
      triggered.push({ card: tcard, by: owner.name, chance, hits: r.hits, ...hit })
      credit(owner, hit)
    }
    const trig = totals(triggered)
    plays.push({ card, index, hits: own.hits, counters: own.counters.filter((c) => c.stacks > 0),
      vulnerable: !!play.vulnerable, weaknessDebuff: !!play.weaknessDebuff, followUp, triggered,
      ...(play.by !== undefined ? { slot: play.by, by: m.name, ...(m.dmg ? {} : { noBuild: true }) } : {}),
      nonCrit: own.nonCrit + (followUp?.nonCrit ?? 0) + trig.nonCrit, crit: own.crit + (followUp?.crit ?? 0) + trig.crit,
      expected: own.expected + (followUp?.expected ?? 0) + trig.expected })
  })
  const byCharacter = [main, ...members.filter((x): x is Member => !!x)]
    .filter((x) => x === main || byMember.has(x))
    .map((x) => ({ name: x.name, ...(byMember.get(x) ?? { nonCrit: 0, crit: 0, expected: 0 }) }))
  return { stats: main.dmg!.stats, plays, byCharacter, counterOptions, ...totals(plays) }
}

function totals(xs: Totals[]): Totals {
  return {
    nonCrit: xs.reduce((a, x) => a + x.nonCrit, 0), crit: xs.reduce((a, x) => a + x.crit, 0),
    expected: xs.reduce((a, x) => a + x.expected, 0),
  }
}

/** Counters from two lists, once each (the smaller max wins). */
function mergeCaps(a: { name: string; max: number | null }[], b: { name: string; max: number | null }[]) {
  const out = new Map<string, number | null>()
  for (const { name, max } of [...a, ...b]) {
    const prev = out.get(name)
    out.set(name, prev === undefined ? max : prev === null ? max : max === null ? prev : Math.min(prev, max))
  }
  return [...out].map(([name, max]) => ({ name, max }))
}

function computeHit(card: Card, hitNo: number, k: number, cb: ReturnType<typeof cardBuffs>, potential: Factor | null,
  stats: FinalStats, build: Build, play: RotationPlay, settings: Settings): Hit {
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
  const baseSources = both(cb.basePct)
  const basePct: Factor | null = baseSources.length ? { value: total(baseSources), sources: baseSources } : null
  const pct = cardPct * (potential?.value ?? 1) + (basePct?.value ?? 0)
  const finalSources = both(cb.final)
  const final: Factor | null = finalSources.length ? { value: 1 + total(finalSources), sources: finalSources } : null
  const multSources = [...cb.multiplicative.all.sources, ...(first ? cb.multiplicative.first.sources : [])]
  const combine = (sources: Source[]) => settings.multMode === 'Chained'
    ? sources.reduce((a, s) => a * (1 + s.value), 1)
    : 1 + sources.reduce((a, s) => a + s.value, 0)
  const multValue = combine(multSources)
  const addSources = [...cb.additive.all.sources, ...(first ? cb.additive.first.sources : [])]
  const additive = { value: addSources.reduce((a, s) => a + s.value, 0), sources: addSources }
  const inHand = pct * combine(multSources.filter((s) => !s.onTarget))
    + addSources.filter((s) => !s.onTarget).reduce((a, s) => a + s.value, 0)

  const weakApplies = card.weaknessApplies || cb.weaknessAttack.length > 0
  const weakness: Factor | null = weakApplies ? {
    value: stats.weaknessDmg.value * (1 + settings.extraWeakness),
    sources: [
      ...stats.weaknessDmg.sources,
      ...(card.weaknessApplies ? [] : cb.weaknessAttack.map((s) => ({ ...s, label: `Weakness Attack: ${s.label}` }))),
      ...(settings.extraWeakness ? [{ label: 'Extra weakness factor (Settings)', value: settings.extraWeakness, unit: '%' as const }] : []),
    ],
  } : null
  const vulnerable = play.vulnerable
    ? { value: 1 + settings.vulnerable, sources: [{ label: 'Vulnerable on the target (this play)', value: settings.vulnerable, unit: '%' as const }] }
    : null
  const enemyDr = build.enemyDr
    ? { value: 1 - build.enemyDr, sources: [{ label: 'Enemy damage reduction', value: build.enemyDr, unit: '%' as const }] }
    : null
  const weaknessDebuff = play.weaknessDebuff
    ? { value: 1 - settings.weaknessDebuff, sources: [{ label: 'Weakness debuff on you (this play)', value: settings.weaknessDebuff, unit: '%' as const }] }
    : null
  const ravaged = card.targetRavaged && settings.ravaged
    ? { value: 1 + settings.ravaged, sources: [{ label: 'Ravaged target (Settings)', value: settings.ravaged, unit: '%' as const }] }
    : null
  const cardMult = (pct * multValue + additive.value) * (weakness?.value ?? 1) * (vulnerable?.value ?? 1)
    * (enemyDr?.value ?? 1) * (weaknessDebuff?.value ?? 1) * (ravaged?.value ?? 1)

  const stat: Factor = card.scaling === 'DEF'
    ? {
      value: stats.atk.value * settings.defCardAtkCoef + stats.def.value * settings.defCardDefCoef,
      sources: [
        { label: `Final ATK ${round(stats.atk.value)} x ${settings.defCardAtkCoef}`, value: stats.atk.value * settings.defCardAtkCoef, unit: 'flat' },
        { label: `Final DEF ${round(stats.def.value)} x ${settings.defCardDefCoef}`, value: stats.def.value * settings.defCardDefCoef, unit: 'flat' },
      ],
    }
    : stats.atk
  const elemDmg = stats.elemDmg.value ? { value: 1 + stats.elemDmg.value, sources: stats.elemDmg.sources } : null
  const mech = card.kind === 'Extra Attack' ? stats.extraDmg : card.kind === 'DoT' ? stats.dotDmg : null
  const mechDmg = mech && mech.value ? { value: 1 + mech.value, sources: mech.sources } : null
  const enemyDef = build.enemyDefMult !== 1
    ? { value: build.enemyDefMult, sources: [{ label: 'Enemy DEF multiplier', value: build.enemyDefMult, unit: 'x' as const }] }
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

  let nonCrit: number, crit: number, expected: number
  if (card.scaling === 'Fixed') {
    // Fixed damage: % x Final ATK x its constant (owner thinks ATK-based, 2026-10-28; Unconfirmed); ignores every
    // multiplier and can't crit (Unconfirmed)
    nonCrit = crit = expected = pct * stats.atk.value * settings.fixedAtkCoef
  } else {
    nonCrit = cardMult * stat.value * settings.atkConstant * (elemDmg?.value ?? 1) * (mechDmg?.value ?? 1) * (enemyDef?.value ?? 1)
      * (final?.value ?? 1)
    crit = nonCrit * critDmg
    expected = nonCrit * (1 + critRate * (critDmg - 1))
  }
  return {
    globalHit: k, hitNo, cardPct, cardAdd, potential, basePct, multFactor: { value: multValue, sources: multSources }, additive,
    weakness, vulnerable, enemyDr, weaknessDebuff, ravaged, inHand, cardMult, stat,
    constant: card.scaling === 'Fixed' ? settings.fixedAtkCoef : settings.atkConstant,
    elemDmg, mechDmg, enemyDef, final, critDmg, critRate, critDmgSources, critRateSources, nonCrit, crit, expected,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}
