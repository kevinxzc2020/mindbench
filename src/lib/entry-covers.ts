/** Individual ImageGen illustrations for the light laboratory. Not gameplay screenshots. */
const ENTRY_COVER_IDS = [
  "reaction-time",
  "number-memory",
  "sequence-memory",
  "visual-memory",
  "cps-test",
  "aim-trainer",
  "typing-test",
  "verbal-memory",
  "keyboard",
  "mouse",
  "wheel",
  "trackpad",
  "screen",
  "motion",
  "speakers",
  "microphone",
  "webcam",
  "gamepad",
  "touch",
  "pen",
  "environment",
  "device-reports",
  "voice-recorder",
  "make-seven",
  "beat-number",
  "number-chain",
  "goose-grab",
  "sheep",
  "skillshot-dodge",
  "screw",
  "fruit",
  "arrow",
  "beads",
] as const;

export type EntryCoverId = (typeof ENTRY_COVER_IDS)[number];

/** One unique asset per function; reused only for that same function across site surfaces. */
export const ENTRY_COVERS: Readonly<Record<string, string | undefined>> = Object.fromEntries(
  ENTRY_COVER_IDS.map(id => [id, `/images/laboratory/entries/${id}-v1.jpg`]),
);

