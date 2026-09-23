import type { MiniGameId } from "@/lib/mini-games";

export function MiniGamePreview({ id }: { id: MiniGameId }) {
  return (
    <div className={`studio-mini-preview studio-mini-preview-${id}`} aria-hidden="true">
      {id === "screw" && (
        <div className="mini-preview-screw-board">
          {Array.from({ length: 6 }, (_, index) => <i key={index} className={`mini-preview-screw-pin pin-${index + 1}`} />)}
          <span className="mini-preview-screw-rail rail-one" />
          <span className="mini-preview-screw-rail rail-two" />
          <span className="mini-preview-screw-box" />
        </div>
      )}
      {id === "fruit" && (
        <div className="mini-preview-fruit-scene">
          <span className="mini-preview-cloud cloud-one" />
          <span className="mini-preview-cloud cloud-two" />
          <span className="mini-preview-fruit fruit-red" />
          <span className="mini-preview-fruit fruit-yellow" />
          <span className="mini-preview-fruit fruit-green" />
          <span className="mini-preview-fruit fruit-purple" />
          <span className="mini-preview-funnel" />
          <span className="mini-preview-hill hill-left" />
          <span className="mini-preview-hill hill-right" />
        </div>
      )}
      {id === "arrow" && (
        <div className="mini-preview-arrow-grid">
          {Array.from({ length: 9 }, (_, index) => <span key={index} className={`mini-preview-arrow-cell cell-${index + 1}`}>{index % 3 === 1 ? "→" : ""}</span>)}
        </div>
      )}
      {id === "sheep-planet" && (
        <div className="mini-preview-sheep-scene">
          <span className="mini-preview-sheep-sun" />
          <div className="mini-preview-card card-back"><i /></div>
          <div className="mini-preview-card card-mid"><i /></div>
          <div className="mini-preview-card card-front"><i /></div>
          <span className="mini-preview-tray"><i /><i /><i /></span>
        </div>
      )}
      {id === "goose-3d" && (
        <div className="mini-preview-goose-scene">
          <span className="mini-preview-bowl" />
          <span className="mini-preview-shape shape-cube" />
          <span className="mini-preview-shape shape-sphere" />
          <span className="mini-preview-shape shape-ring" />
          <span className="mini-preview-slot-bar"><i /><i /><i /></span>
        </div>
      )}
      {id === "beads" && (
        <div className="mini-preview-bead-grid">
          {Array.from({ length: 36 }, (_, index) => <i key={index} className={`bead-${(index * 7) % 5}`} />)}
          <span className="mini-preview-bead-cursor" />
        </div>
      )}
      <span className="studio-mini-preview-label">PLAY LAB / PREVIEW</span>
    </div>
  );
}
