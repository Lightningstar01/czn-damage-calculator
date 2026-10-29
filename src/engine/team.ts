// Teammates linked to their saved builds (owner, 2026-10-28): their Manifest Ego, partner and sets come from that build, and their
// plays in a team's attack list deal damage with it (their stats, potentials, boosts and buffs, plus the team's ally / enemy effects).
import { NO_BUILD, type Build, type CharacterSave, type DeckCard, type Switch, type Teammate } from './types'

/** Every character's saved data (SaveData.characters). */
export type Saves = Record<string, CharacterSave>

export interface Linked {
  cs: CharacterSave
  build: Build
}

/** The saved build a teammate slot uses: its pick, else the character's active build; none when unlinked or nothing is saved. */
export function linkedBuild(saves: Saves, t: Teammate | undefined): Linked | undefined {
  if (!t?.character || t.build === NO_BUILD) return undefined
  const cs = saves[t.character]
  if (!cs?.builds?.length) return undefined
  const build = cs.builds.find((b) => b.id === t.build) ?? cs.builds.find((b) => b.id === cs.activeBuild) ?? cs.builds[0]
  return { cs, build }
}

/** The build with each linked teammate slot's Manifest Ego, partner and sets taken from their saved build. */
export function withLinkedTeam(build: Build, saves: Saves): Build {
  if (!(build.team ?? []).some((t) => linkedBuild(saves, t))) return build
  return {
    ...build,
    team: build.team.map((t) => {
      const l = linkedBuild(saves, t)
      return l ? { ...t, egoLevel: l.build.egoLevel ?? 0, partner: l.build.partner, fragments: l.build.fragments ?? [] } : t
    }),
  }
}

/** How teammate slot `slot` of a (withLinkedTeam) build plays: their saved build, with the slot's picked cards as their deck and this
 * build's character and other teammate as their team. Their own effects keep their build's switches; the others' follow this build. */
export function teammateView(charName: string, build: Build, slot: number, saves: Saves): (Linked & { name: string }) | undefined {
  const t = build.team?.[slot]
  const l = linkedBuild(saves, t)
  if (!t || !l) return undefined
  const me: Teammate = {
    character: charName, egoLevel: build.egoLevel ?? 0, partner: build.partner, fragments: build.fragments ?? [],
    cards: (build.deck ?? []).flatMap((d) => d.preset ?? []),
  }
  const switches: Record<string, Switch> = {}
  for (const [k, v] of Object.entries(l.build.presetSwitches ?? {})) if (!k.includes('>')) switches[k] = v
  for (const [k, v] of Object.entries(build.presetSwitches ?? {})) {
    if (!k.includes('>')) switches[`${charName}>${k}`] = v
    else if (!k.startsWith(`${t.character}>`)) switches[k] = v
  }
  const deck: DeckCard[] = (t.cards ?? []).map((preset, i) => ({ id: String(i), preset }))
  return {
    name: t.character, cs: l.cs,
    build: { ...l.build, deck, presetSwitches: switches, rotation: [], team: [me, ...build.team.filter((x, i) => i !== slot && x.character)] },
  }
}
