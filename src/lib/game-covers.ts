import { ENTRY_COVERS } from "./entry-covers";

/** Individual light-laboratory illustrations, not gameplay screenshots. */
export const GAME_COVERS: Record<string, string> = Object.fromEntries(
  ["reaction-time", "number-memory", "sequence-memory", "visual-memory", "cps-test", "aim-trainer", "typing-test", "verbal-memory", "make-seven", "beat-number", "number-chain", "goose-grab", "sheep", "skillshot-dodge", "fruit", "arrow", "beads"].map(
    (id) => [id, ENTRY_COVERS[id]!],
  ),
);

export const MINI_GAME_COVERS = {
  screw: ENTRY_COVERS.screw!,
  fruit: GAME_COVERS.fruit,
  arrow: GAME_COVERS.arrow,
  beads: GAME_COVERS.beads,
};
