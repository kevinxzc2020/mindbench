import { GAME_ICONS } from "@/lib/icons";
import type { GameId } from "@/lib/utils";

/** Decorative previews of mechanics, not screenshots or player results. */
export function GameCover({ id }: { id: GameId }) {
  const Icon = GAME_ICONS[id];
  return (
    <div className={`game-cover cover-${id}`} aria-hidden="true">
      <span className="cover-cross cover-cross-top">+</span>
      <span className="cover-cross cover-cross-bottom">+</span>
      {id === "reaction-time" ? (
        <div className="cover-reaction"><span>READY?</span><strong>GO!</strong><i /></div>
      ) : id === "number-memory" ? (
        <div className="cover-digits"><span>8</span><span>3</span><span>1</span><span>9</span><span>4</span></div>
      ) : id === "sequence-memory" || id === "visual-memory" ? (
        <div className={`cover-matrix ${id === "visual-memory" ? "cover-matrix-four" : ""}`}>
          {Array.from({ length: id === "visual-memory" ? 16 : 9 }, (_, i) => <i key={i} className={[0, 4, 7, 10, 15].includes(i) ? "lit" : ""} />)}
        </div>
      ) : id === "aim-trainer" ? (
        <div className="cover-target"><i /><i /><i /><span>+</span></div>
      ) : id === "typing-test" ? (
        <div className="cover-keyboard">{"TYPE".split("").map((letter) => <kbd key={letter}>{letter}</kbd>)}</div>
      ) : id === "verbal-memory" ? (
        <div className="cover-words"><span>remember</span><strong>remember</strong><span>discover</span></div>
      ) : id === "make-seven" ? (
        <div className="cover-seven"><span>3</span><strong>7</strong><span>4</span></div>
      ) : id === "beat-number" ? (
        <div className="cover-beat"><span>2</span><span>4</span><span>8</span></div>
      ) : id === "number-chain" ? (
        <div className="cover-chain"><span>1</span><i /><span>2</span><i /><span>3</span></div>
      ) : (
        <div className="cover-emblem"><i /><Icon size={70} strokeWidth={1.15} /><i /></div>
      )}
    </div>
  );
}
