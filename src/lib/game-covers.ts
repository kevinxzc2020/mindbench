/** Generated conceptual cover artwork, not gameplay screenshots. */
export const GAME_COVERS: Record<string, string> = Object.fromEntries(
  ["reaction-time", "number-memory", "sequence-memory", "visual-memory", "cps-test", "aim-trainer", "typing-test", "verbal-memory", "make-seven", "beat-number", "number-chain", "goose-grab", "sheep", "skillshot-dodge", "fruit", "arrow", "beads"].map(
    (id) => [id, `/images/game-covers/${id}-v1.png`],
  ),
);
GAME_COVERS["visual-memory"] = "/images/game-covers/visual-memory-v2.png";
GAME_COVERS["cps-test"] = "/images/game-covers/cps-test-v6.png";

export const MINI_GAME_COVERS = {
  screw: "/images/screw-photo-v1.png",
  fruit: GAME_COVERS.fruit,
  arrow: GAME_COVERS.arrow,
  beads: GAME_COVERS.beads,
};
