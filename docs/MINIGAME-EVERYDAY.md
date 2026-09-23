# Imported mini-games

Four non-duplicate browser games from the public repository [IcedSoul/minigame-everyday](https://github.com/IcedSoul/minigame-everyday) are included under `public/minigames/` and exposed through the MindBench homepage's “Daily mini-games” section.

Imported upstream revision: `73bb72fa6b144148fc7c7e93c83ffd47f3d9f173` (`2026-06-08`).

## Included games

- Day 01: Screw Sort (`public/minigames/screw`)
- Day 02: Fruit Funnel (`public/minigames/fruit`)
- Day 03: Arrow Run (`public/minigames/arrow`)
- Day 06: Pixel Beads (`public/minigames/beads`)

Day 04 (Sheep Planet) is not exposed because it overlaps with MindBench's existing Bunny Match. Day 05 (Goose Grab 3D) is not exposed because MindBench already has Goose Grab.

The upstream README describes the repository as MIT-licensed, but this checkout did not contain a separate `LICENSE` file. Keep the source link and verify the upstream license before a public commercial deployment. The imported bundles are isolated in same-origin iframes so their original browser entry points and relative assets continue to work without adding their Phaser/Babylon dependencies to the Next.js bundle.

These games currently do not submit scores to the MindBench API. They are playable imports, not yet part of the cognitive-score registry or leaderboard. That avoids inventing scoring semantics for games whose upstream code does not expose a MindBench score contract.
