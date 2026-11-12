// Brings older saves up to the current format. If the save format changes: bump SAVE_VERSION (save.ts) and add a step here.
import { PRESETS } from '../data/presets'
import { readSettings } from '../data/settings'
import { switchStacks } from '../engine/buffs'
import { AUTO, cardUpgrade, deckItems } from '../engine/deck'
import { ELEMENTS, CARD_TYPES, FRAGMENT_SET_PICKS, NO_ENEMY, type Build, type Card, type CharacterPreset, type CharacterSave, type DeckCard, type Element, type Fight, type RotationPlay, type SaveData, type Switch, type UserBoost, type UserBuff } from '../engine/types'
import { defaultFight, defaultSave, newBoost, newBuff, newBuild, newFight, newStats, newTeammate, SAVE_VERSION } from './save'

/** Fields that older saves had (rotation: removed in v9; the shared card library: removed in v10; the stat boosts and buffs shared by
 * the character's builds, with a switch per build id: moved into the builds in v12). */
type LegacyCharacter = CharacterSave & { rotation?: unknown[]; cards?: Card[]; boosts?: unknown; buffs?: unknown }
type LegacyBuild = Build & { vulnerable?: number; weaknessDebuff?: number; enemyDefMult?: number; enemyDr?: number }

/** Mei Lin's card preset ids before v6 -> Prydwen card ids. */
const MEI_LIN_V5_IDS: Record<string, string> = {
  strike: 'card-338', guardian: 'card-339', ego: 'card-337', sovereignty: 'card-364',
  ...Object.fromEntries((['jewel', 'spire', 'unity', 'aromata'] as const).flatMap((base, i) =>
    [0, 1, 2, 3, 4, 5].map((n) => [n ? `${base}-${n}` : base, `card-${340 + i * 6 + n}`]))),
}

const NOT_A_SAVE = "This file isn't a calculator save."
const isObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const isObjectList = (x: unknown): x is Record<string, unknown>[] => Array.isArray(x) && x.every(isObject)

/** What every save version has: characters, each with at least one build with an id. */
function checkSaveShape(raw: unknown): asserts raw is SaveData {
  if (!isObject(raw) || !isObject(raw.characters)) throw new Error(NOT_A_SAVE)
  // Every save the site wrote has one (v1 too); read as v1, a newer save without it lost its attack lists in the v9 step
  if (typeof raw.version !== 'number') throw new Error(`${NOT_A_SAVE} It has no version number.`)
  for (const [name, cs] of Object.entries(raw.characters)) {
    if (!isObject(cs) || !isObjectList(cs.builds) || !cs.builds.length || !cs.builds.every((b) => typeof b.id === 'string')) {
      throw new Error(`${NOT_A_SAVE} ${name} has no builds.`)
    }
  }
}

/** Fills what a partial save left out, and refuses lists the site couldn't read (it would crash on every load). */
function completeCharacter(name: string, cs: CharacterSave) {
  if (!cs.builds.some((b) => b.id === cs.activeBuild)) cs.activeBuild = cs.builds[0].id
  cs.builds = cs.builds.map((b) => {
    const stats = newStats()
    return { ...newBuild('Build'), ...b, stats: { ...stats, ...b.stats, elemDmg: { ...stats.elemDmg, ...b.stats?.elemDmg } } }
  })
  const lists = cs.builds.flatMap((b) => [b.team, b.deck, b.rotation, b.boosts, b.buffs])
  if (!lists.every(isObjectList) || !cs.builds.every((b) => isObject(b.presetSwitches))) throw new Error(`${NOT_A_SAVE} ${name} has unreadable builds.`)
  // Rows and teammates missing a field the page reads (a stat, cards) blanked the page; a row without a switch is off
  for (const b of cs.builds) {
    b.boosts = b.boosts.map((r) => ({ ...newBoost(), on: false, ...r }))
    b.buffs = b.buffs.map((r) => ({ ...newBuff(), on: false, ...r }))
    b.team = b.team.map((t) => ({ ...newTeammate(), ...t, cards: Array.isArray(t.cards) ? t.cards : [] }))
  }
}

/** A fight the site could read: a string id if any, enemies whose numbers are numbers (a null DEF multiplier would turn all damage into 0).
 * The site's own fields never write anything else, so only a damaged file is refused. */
function readableFight(f: Record<string, unknown>) {
  const number = (x: unknown) => x === undefined || Number.isFinite(x)
  return (f.id === undefined || typeof f.id === 'string')
    && (f.enemies === undefined || (isObjectList(f.enemies) && f.enemies.every((e) => number(e.defMult) && number(e.dr))))
}

/** Same for the fights: at least one, each with an enemy, unique ids (two alike can't be told apart), and a valid active one. */
function completeFights(data: SaveData) {
  const fights: unknown = data.fights ?? []
  if (!isObjectList(fights) || !fights.every(readableFight)) throw new Error(`${NOT_A_SAVE} Its fights are unreadable.`)
  const ids = fights.flatMap((f) => f.id ?? [])
  if (new Set(ids).size !== ids.length) throw new Error(`${NOT_A_SAVE} Two of its fights have the same id.`)
  data.fights = data.fights?.map((f) => {
    const blank = newFight('Fight')
    return { ...blank, ...f, enemies: f.enemies?.length ? f.enemies.map((e) => ({ ...NO_ENEMY, ...e })) : blank.enemies }
  }) ?? []
  if (!data.fights.length) data.fights = [defaultFight()]
  if (!data.fights.some((f) => f.id === data.activeFight)) data.activeFight = data.fights[0].id
}

/** Bring an older (or partial) save up to the current format. Throws if it isn't a save file. */
export function migrate(raw: unknown): SaveData {
  checkSaveShape(raw)
  const data = raw
  if (data.version > SAVE_VERSION) throw new Error('This save is from a newer version of the calculator.')
  if (data.version <= 1) {
    // v2: memory fragment set picks per build
    for (const cs of Object.values(data.characters ?? {})) {
      for (const b of cs.builds ?? []) b.fragments ??= Array(FRAGMENT_SET_PICKS).fill('')
    }
    data.version = 2
  }
  if (data.version === 2) {
    // v3: card type dropdown. Take it from a matching tag (and drop that tag), else Attack.
    for (const cs of Object.values(data.characters ?? {}) as LegacyCharacter[]) {
      for (const c of cs.cards ?? []) {
        const tags = (c.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean)
        const found = tags.find((t) => (CARD_TYPES as readonly string[]).includes(t))
        c.cardType ??= (found as Card['cardType']) ?? 'Attack'
        if (found) c.tags = tags.filter((t) => t !== found).join(', ')
      }
    }
    data.version = 3
  }
  if (data.version === 3) {
    // v4: rotation plays are objects, so a play can override the card's hits
    for (const cs of Object.values(data.characters ?? {})) {
      const old = cs as LegacyCharacter
      old.rotation = (old.rotation ?? []).map((p) => typeof p === 'string' ? { cardId: p } : p)
    }
    data.version = 4
  }
  if (data.version === 4) {
    // v5: element and cost are card fields. Take them from tags like 'Passion' / '1-cost' (and drop those tags);
    // else the character's element and no cost.
    for (const [name, cs] of Object.entries(data.characters ?? {}) as [string, LegacyCharacter][]) {
      const charElement = PRESETS.characters.find((c) => c.name === name)?.element ?? ELEMENTS[0]
      for (const c of cs.cards ?? []) {
        const tags = (c.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean)
        const el = tags.find((t) => (ELEMENTS as readonly string[]).includes(t))
        const cost = tags.find((t) => /^\d+-cost$/i.test(t))
        c.element ??= (el as Element) ?? charElement
        c.cost ??= cost ? parseInt(cost, 10) : null
        c.tags = tags.filter((t) => t !== el && t !== cost).join(', ')
      }
    }
    data.version = 5
  }
  if (data.version === 5) {
    // v6: card presets are imported from Prydwen, so Mei Lin's hand-entered preset ids became Prydwen card ids
    for (const c of (data.characters?.['Mei Lin'] as LegacyCharacter | undefined)?.cards ?? []) {
      if (c.preset && c.preset in MEI_LIN_V5_IDS) c.preset = MEI_LIN_V5_IDS[c.preset]
    }
    data.version = 6
  }
  if (data.version === 6) {
    // v7: Manifest Ego level per build
    for (const cs of Object.values(data.characters ?? {})) {
      for (const b of cs.builds ?? []) b.egoLevel ??= 0
    }
    data.version = 7
  }
  if (data.version === 7) {
    // v8: potentials are modeled. Card upgrade levels per build start at 0. A card still at its preset's base %
    // gets the preset's upgrade; cards typed by hand keep their in-game % (no upgrade), so no result changes.
    for (const [name, cs] of Object.entries(data.characters ?? {}) as [string, LegacyCharacter][]) {
      for (const b of cs.builds ?? []) {
        b.basicLevel ??= 0
        b.signatureLevel ??= 0
      }
      const presetCards = PRESETS.characters.find((c) => c.name === name)?.cards ?? []
      for (const c of cs.cards ?? []) {
        const p = c.preset ? presetCards.find((x) => x.id === c.preset) : undefined
        if (p && c.upgrade === undefined && c.pct === p.pct) {
          const up = cardUpgrade(p)
          if (up) c.upgrade = up
        }
      }
    }
    data.version = 8
  }
  if (data.version === 8) {
    // v9: team snapshot (owner, 2026-10-26). Each build gets its own copy of the attack list and an empty team.
    // The build's Vulnerable / Weakness debuff stacks (used one per hit, in order) become a switch on each play
    // whose first hit had a stack. Per-play counter stacks (Ember, Aromata) start at 0.
    for (const cs of Object.values(data.characters ?? {}) as LegacyCharacter[]) {
      const rotation = (cs.rotation ?? []) as RotationPlay[]
      const cards = new Map((cs.cards ?? []).map((c) => [c.id, c]))
      for (const b of (cs.builds ?? []) as LegacyBuild[]) {
        let k = 0
        b.rotation = rotation.map((p) => {
          const card = cards.get(p.cardId)
          const play: RotationPlay = { ...p }
          if (card) {
            if (k < (b.vulnerable ?? 0)) play.vulnerable = true
            if (k < (b.weaknessDebuff ?? 0)) play.weaknessDebuff = true
            k += Math.max(0, Math.floor(p.hits ?? card.hits))
          }
          return play
        })
        b.team ??= []
        delete b.vulnerable
        delete b.weaknessDebuff
      }
      delete cs.rotation
    }
    data.version = 9
  }
  // A save stamped v10 while the v10 step was being written (dev server) has builds without a deck: run the step again
  const deckless = data.version === 10 && Object.values(data.characters ?? {}).some((cs) => (cs.builds ?? []).some((b) => !b.deck))
  if (data.version === 9 || deckless) {
    // v10: a deck per build (owner, 2026-10-27). The shared card library is copied into every build with the same ids, so the
    // attack lists still match. Preset cards follow their preset (cards can't be edited any more, so edited numbers go); the
    // Ego skill and created cards now come with the deck, so they leave it and their plays point at 'auto:<preset id>';
    // other cards stay as custom cards. Teammates drop the cards that now come with their deck.
    for (const [name, cs] of Object.entries(data.characters ?? {}) as [string, LegacyCharacter][]) {
      if (data.version === 10 && cs.builds?.every((b) => b.deck)) continue
      const ch = PRESETS.characters.find((c) => c.name === name)
      const picked: DeckCard[] = (cs.cards ?? []).map((c) => c.preset && ch?.cards?.some((p) => p.id === c.preset)
        ? { id: c.id, preset: c.preset } : { id: c.id, custom: c })
      const auto = autoPresets(ch, picked)
      const moved = new Map(picked.filter((d) => d.preset && auto.has(d.preset)).map((d) => [d.id, AUTO + d.preset]))
      const deck = picked.filter((d) => !moved.has(d.id))
      for (const b of cs.builds ?? []) {
        if (b.deck) continue
        b.deck = structuredClone(deck)
        b.rotation = (b.rotation ?? []).map((p) => moved.has(p.cardId) ? { ...p, cardId: moved.get(p.cardId)! } : p)
        for (const t of b.team ?? []) {
          const tch = PRESETS.characters.find((c) => c.name === t.character)
          const tauto = autoPresets(tch, (t.cards ?? []).map((preset, i) => ({ id: String(i), preset })))
          t.cards = (t.cards ?? []).filter((id) => !tauto.has(id))
        }
      }
      delete cs.cards
    }
    data.version = 10
  }
  if (data.version === 10) {
    // v11: the enemy moves from the build to shared fights (owner, 2026-10-31), one per distinct pair of values, so none is lost; the open
    // build's stays active. Builds never touched (Crit DMG 0, which no character has) get the game's base crit stats.
    const fights: Fight[] = []
    const fightOf = (b: LegacyBuild) => {
      const enemy = { defMult: b.enemyDefMult ?? NO_ENEMY.defMult, dr: b.enemyDr ?? NO_ENEMY.dr }
      const found = fights.find((f) => f.enemies[0].defMult === enemy.defMult && f.enemies[0].dr === enemy.dr)
      if (found) return found
      const neutral = enemy.defMult === NO_ENEMY.defMult && enemy.dr === NO_ENEMY.dr
      const made = newFight(neutral ? 'Default' : `Fight ${fights.length + 1}`, enemy)
      fights.push(made)
      return made
    }
    const open = data.characters[data.activeCharacter]
    const openBuild = open?.builds.find((b) => b.id === open.activeBuild) ?? open?.builds[0]
    if (openBuild) data.activeFight = fightOf(openBuild).id
    for (const cs of Object.values(data.characters)) {
      for (const b of cs.builds as LegacyBuild[]) {
        fightOf(b)
        delete b.enemyDefMult
        delete b.enemyDr
        if (b.stats && !b.stats.critDmg) {
          b.stats.critDmg = newStats().critDmg
          if (!b.stats.critChance) b.stats.critChance = newStats().critChance
        }
      }
    }
    data.fights = fights
    data.version = 11
  }
  if (data.version === 11) {
    // v12: each build has its own stat boosts and buffs (owner, 2026-11-11), so editing one build's row leaves the others alone. A build
    // keeps the shared rows that were on for it; a row that was off in every build stays in all of them, off, so none is lost.
    for (const [name, cs] of Object.entries(data.characters) as [string, LegacyCharacter][]) {
      // The rows a build keeps, with its own switch (completeCharacter fills in what a row lacks)
      const rowsOf = (shared: unknown, b: Build): Record<string, unknown>[] => {
        if (shared !== undefined && !isObjectList(shared)) throw new Error(`${NOT_A_SAVE} ${name} has unreadable builds.`)
        const sw = (r: Record<string, unknown>, x: Build) => (isObject(r.switches) ? r.switches[x.id] as Switch | undefined : undefined)
        const on = (r: Record<string, unknown>, x: Build) => switchStacks(sw(r, x)) > 0
        return (shared ?? []).filter((r) => on(r, b) || !cs.builds.some((x) => on(r, x))).map((r) => {
          const row: Record<string, unknown> = { ...r, on: on(r, b) ? sw(r, b) : false }
          delete row.switches
          return row
        })
      }
      for (const b of cs.builds) {
        b.boosts = rowsOf(cs.boosts, b) as unknown as UserBoost[]
        b.buffs = rowsOf(cs.buffs, b) as unknown as UserBuff[]
      }
      delete cs.boosts
      delete cs.buffs
    }
    data.version = 12
  }
  // Future migrations go here, in version order: if (data.version === 12) { ...; data.version = 13 }
  for (const [name, cs] of Object.entries(data.characters)) completeCharacter(name, cs)
  completeFights(data)
  return {
    ...defaultSave(),
    ...data,
    settings: readSettings(data.settings),
    version: SAVE_VERSION,
  }
}

/** Preset ids that come with a deck by themselves (Ego skill, cards created by its other cards). */
function autoPresets(ch: CharacterPreset | undefined, picked: DeckCard[]): Set<string> {
  const ego = new Set((ch?.cards ?? []).filter((p) => p.category === 'Ego Skill').map((p) => p.id))
  const others = (id: string) => picked.filter((d) => d.preset !== id)
  const created = (id: string) => deckItems(ch, others(id)).some((i) => i.createdBy && i.preset?.id === id)
  return new Set(picked.map((d) => d.preset).filter((id): id is string => !!id && (ego.has(id) || created(id))))
}
