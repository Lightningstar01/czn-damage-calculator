// Shared by the test files.
import type { BuildResult } from '../src/engine/calc'
import { PRESETS } from '../src/data/presets'
import { DEFAULT_SETTINGS } from '../src/data/settings'
import { presetCard } from '../src/engine/deck'
import { newId } from '../src/store/save'
import type { Build, Card, CardPreset, CharacterSave, Element, Presets, RotationPlay } from '../src/engine/types'

export const presets: Presets = {
  characters: [...PRESETS.characters, { name: 'Testy', element: 'Order', class: 'Vanguard', effects: [] }],
  partners: PRESETS.partners,
  // Made-up sets for the tests (the real ones live in src/data/fragmentSets.ts)
  fragmentSets: [
    { name: 'Test Four', pieces: 4, effects: [
      { kind: 'Stat', id: 'atk', name: 'Attack', category: 'Memory Fragment', stat: 'ATK%', value: '20%', onStatsScreen: true },
      { kind: 'Buff', id: 'dmg', name: 'Damage', category: 'Memory Fragment', value: '+30%', appliesTo: 'ALL', hitScope: 'All hits', condition: 'Always' },
    ] },
    { name: 'Test Two', pieces: 2, effects: [
      { kind: 'Stat', id: 'crit', name: 'Crit DMG', category: 'Memory Fragment', stat: 'Crit DMG', value: '10%', onStatsScreen: true },
    ] },
  ],
}
export const settings = DEFAULT_SETTINGS
/** Switch off Mei Lin's potential 5-1 (Strike card %), for tests about something else. */
export const noStrikeNode = (b: Build) => { b.presetSwitches['Mei Lin|p5-1-strike'] = false }

/** element: the character's. */
export function newCard(element: Element): Card {
  return { id: newId(), name: '', cardType: 'Attack', element, cost: 1, tags: '', scaling: 'ATK', kind: 'Normal', pct: 1, hits: 1, weaknessApplies: false, targetRavaged: false }
}

/** A card preset as a card with a new id; element: the character's (unless the preset sets its own). */
export function cardFromPreset(p: CardPreset, element: Element): Card {
  return presetCard(p, element, newId())
}

export function card(name: string, tags: string, hits: number, weak = false, ravaged = false): Card {
  return { ...newCard('Passion'), name, tags, hits, pct: 1, weaknessApplies: weak, targetRavaged: ravaged }
}

export const plays = (...ids: string[]): RotationPlay[] => ids.map((cardId) => ({ cardId }))
/** Put cards in every build's deck, as custom cards (a preset copy keeps its preset's effects). */
export const addCards = (cs: CharacterSave, ...cards: Card[]) => { for (const b of cs.builds) b.deck.push(...cards.map((c) => ({ id: c.id, custom: c }))) }
/** The same attack list for every build of the save. */
export const setPlays = (cs: CharacterSave, list: RotationPlay[]) => { for (const b of cs.builds) b.rotation = structuredClone(list) }

/** Sum of a card's plays in a build result. */
export function cardTotal(r: BuildResult, name: string, key: 'nonCrit' | 'crit' | 'expected' = 'nonCrit') {
  return r.plays.filter((p) => p.card.name === name).reduce((a, p) => a + p[key], 0)
}
