import test from "node:test";
import assert from "node:assert/strict";
import { gamePayload, setAnalyticsSender, trackGame, type GameEvent } from "../src/lib/analytics";
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from "../src/lib/difficulty";
import { isAbilityTest, nextTests } from "../src/lib/next-tests";
import { GAMES } from "../src/lib/utils";

test("game events carry only the game id, the difficulty label and catalogue ids", () => {
  assert.deepEqual(gamePayload({ name: "game_open", game: "typing-test" }), { name: "game_open", params: { game_id: "typing-test" } });
  assert.deepEqual(gamePayload({ name: "game_start", game: "typing-test", difficulty: "hard" }), { name: "game_start", params: { game_id: "typing-test", difficulty: "hard" } });
  // A score, a time or anything else a caller adds is not part of the schema and never reaches the payload.
  const withScore = { name: "game_complete", game: "cps-test", difficulty: "medium", score: 9.4, text: "typed words" } as unknown as GameEvent;
  assert.deepEqual(gamePayload(withScore), { name: "game_complete", params: { game_id: "cps-test", difficulty: "medium" } });
  assert.deepEqual(gamePayload({ name: "recommendation_click", game: "typing-test", target: "reaction-time", kind: "test" }), {
    name: "recommendation_click",
    params: { game_id: "typing-test", content_id: "reaction-time", content_type: "test", placement: "game_result" },
  });
});

test("malformed game events are dropped instead of sent", () => {
  for (const bad of [
    { name: "game_open", game: "Typing Test" },
    { name: "game_open", game: "x".repeat(61) },
    { name: "game_start", game: "typing-test", difficulty: "impossible" },
    { name: "game_complete", game: "typing-test" },
    { name: "recommendation_click", game: "typing-test", target: "email@example.com", kind: "test" },
    { name: "recommendation_click", game: "typing-test", target: "iq", kind: "resource" },
    { name: "something_else", game: "typing-test" },
  ]) assert.equal(gamePayload(bad as unknown as GameEvent), null, JSON.stringify(bad));
});

test("game events are sent only while analytics is allowed and are never buffered", () => {
  const calls: { name: string; params: Record<string, string> }[] = [];
  setAnalyticsSender(null);
  assert.equal(trackGame({ name: "game_open", game: "typing-test" }), false);
  setAnalyticsSender((name, params) => calls.push({ name, params }));
  assert.equal(trackGame({ name: "game_start", game: "typing-test", difficulty: DEFAULT_DIFFICULTY }), true);
  assert.deepEqual(calls, [{ name: "game_start", params: { game_id: "typing-test", difficulty: "medium" } }]);
  setAnalyticsSender(null);
  assert.equal(trackGame({ name: "game_complete", game: "typing-test", difficulty: "easy" }), false);
  assert.equal(calls.length, 1);
});

test("every game, difficulty and suggested next test in the product fits the event schema", () => {
  for (const game of GAMES) {
    for (const difficulty of DIFFICULTIES) assert.ok(gamePayload({ name: "game_start", game: game.id, difficulty }), `${game.id} ${difficulty}`);
    for (const entry of nextTests(game.id)) {
      const kind = isAbilityTest(entry.id) ? "test" : "game";
      assert.ok(gamePayload({ name: "recommendation_click", game: game.id, target: entry.id, kind }), `${game.id} -> ${entry.id}`);
    }
  }
});

test("games open on the default difficulty, which is one of the real choices", () => {
  assert.equal(DEFAULT_DIFFICULTY, "medium");
  assert.ok(DIFFICULTIES.includes(DEFAULT_DIFFICULTY));
});
