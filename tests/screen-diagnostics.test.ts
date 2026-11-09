import test from "node:test";
import assert from "node:assert/strict";
import { canvasBackingSize, cycleIndex, FRAME_WINDOW, frameSummary, geometryKey, gradientRGB, makeScreenMark, markerPosition, movingTargetX, observationCSV, screenMode, snakeCell, SOLID_COLORS, steppedPosition, type ScreenGeometry } from "../src/lib/screen-diagnostics";

test("invalid deep links fall back to the safe static color mode", () => {
  assert.equal(screenMode("motion"), "motion"); assert.equal(screenMode("gradient"), "gradient");
  for (const input of [null, "", "camera", "MOTION"]) assert.equal(screenMode(input), "solid");
});
test("color traversal wraps in both directions including large jumps", () => {
  assert.equal(cycleIndex(0, -1, SOLID_COLORS.length), 8);
  assert.equal(cycleIndex(8, 1, 9), 0); assert.equal(cycleIndex(2, -20, 9), 0);
});
test("snake traversal visits every region once without diagonal jumps", () => {
  for (const [columns, rows] of [[4,3],[6,4],[8,6]]) {
    const cells = Array.from({length:columns*rows}, (_,i)=>snakeCell(i,columns,rows));
    assert.equal(new Set(cells.map(c=>`${c.row},${c.column}`)).size,columns*rows);
    cells.slice(1).forEach((c,i)=>assert.equal(Math.abs(c.column-cells[i].column)+Math.abs(c.row-cells[i].row),1));
    assert.deepEqual(cells[columns],{row:1,column:columns-1});
  }
});
test("continuous gradients retain endpoints and stepped ramps have discrete equal-width bins", () => {
  assert.equal(steppedPosition(.37,null),.37);
  for (const count of [16,32,64,256]) {
    assert.equal(steppedPosition(0,count),0); assert.equal(steppedPosition(1,count),1);
    const bins = Array.from({length:count},(_,i)=>steppedPosition((i+.5)/count,count));
    assert.equal(new Set(bins).size,count);
    bins.forEach((v,i)=>assert.equal(v,i/(count-1)));
  }
});
test("gray and near-black/white ranges represent the documented RGB code values", () => {
  for(const [preset,low,high] of [["gray",0,255],["dark",0,32],["light",223,255]] as const) {
    assert.deepEqual(gradientRGB(preset,0),[low,low,low]); assert.deepEqual(gradientRGB(preset,1),[high,high,high]);
    let previous:number=low;
    for(let i=0;i<=256;i++) { const rgb=gradientRGB(preset,i/256); assert.ok(rgb[0]>=previous && rgb[0]<=high); assert.equal(rgb[0],rgb[1]); previous=rgb[0]; }
  }
});
test("RGB lanes isolate channels and spectrum closes without out-of-range values", () => {
  assert.deepEqual(gradientRGB("rgb",1,0),[255,0,0]); assert.deepEqual(gradientRGB("rgb",1,1),[0,255,0]); assert.deepEqual(gradientRGB("rgb",1,2),[0,0,255]);
  assert.deepEqual(gradientRGB("spectrum",0),[255,0,0]); assert.deepEqual(gradientRGB("spectrum",1),[255,0,0]);
  for(let i=0;i<=600;i++) for(const n of gradientRGB("spectrum",i/600)) assert.ok(Number.isInteger(n)&&n>=0&&n<=255);
});
test("canvas matches DPR when affordable and bounds large allocations", () => {
  assert.deepEqual(canvasBackingSize(1000,500,2),{width:2000,height:1000,scale:2,limited:false});
  for (const [w,h,dpr] of [[7680,4320,2],[30000,1000,1],[1000,30000,3]]) {
    const b=canvasBackingSize(w,h,dpr); assert.ok(b.width<=8192&&b.height<=8192); assert.ok(b.width*b.height<=16777216); assert.equal(b.limited,true);
  }
});
test("motion uses elapsed time rather than frame count", () => {
  const a=movingTargetX(100,480,1000,64,"right"); const b=movingTargetX(350,480,1000,64,"right");
  assert.equal(b-a,120); assert.equal(movingTargetX(1000,480,1000,64,"right"),416);
  const frames60=Array.from({length:60},()=>1000/60).reduce((a,b)=>a+b,0);
  const frames120=Array.from({length:120},()=>1000/120).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(movingTargetX(frames60,480,1000,64,"right")-movingTargetX(frames120,480,1000,64,"right"))<1e-9);
});
test("motion reverses and wraps only after the target passes the boundary", () => {
  assert.equal(movingTargetX(0,480,1000,64,"right"),-64); assert.equal(movingTargetX(0,480,1000,64,"left"),1000);
  assert.equal(movingTargetX(500,480,1000,64,"left"),760);
  assert.ok(Math.abs(movingTargetX(1064/480*1000,480,1000,64,"right")+64)<1e-9);
});
test("frame statistics reject invalid samples and use elapsed duration for callback rate", () => {
  assert.equal(frameSummary([]),null); assert.equal(frameSummary([NaN,Infinity,-1,0]),null);
  const s=frameSummary([10,10,10,30,NaN,0])!;
  assert.equal(s.count,4); assert.equal(s.medianMs,10); assert.equal(s.p95Ms,30); assert.equal(s.maxMs,30);
  assert.equal(s.callbackRate,1000*4/60); assert.equal(s.longerIntervals,1); assert.equal(s.longerThresholdMs,15);
});
test("relative pacing is not a fixed display refresh threshold", () => {
  assert.equal(frameSummary(Array(60).fill(1000/30))!.longerIntervals,0);
  assert.equal(frameSummary([10,10,15])!.longerIntervals,0);
  assert.equal(frameSummary([10,10,15.01])!.longerIntervals,1);
});
test("frame window removes old stalls and calculates even medians and nearest-rank P95", () => {
  const s=frameSummary([1000,...Array(FRAME_WINDOW).fill(10)])!; assert.equal(s.count,FRAME_WINDOW); assert.equal(s.maxMs,10);
  assert.equal(frameSummary([10,20])!.medianMs,15);
  assert.equal(frameSummary(Array.from({length:100},(_,i)=>i+1))!.p95Ms,95);
});
const geometry:ScreenGeometry={width:1000,height:500,left:50,top:100,dpr:2,screenX:0,screenY:0,screenWidth:1920,screenHeight:1080,presentation:"preview"};
test("manual mark coordinates are local CSS positions, with bounded normalized positions", () => {
  assert.deepEqual(markerPosition(300,350,geometry),{x:250,y:250,relativeX:.25,relativeY:.5});
  assert.deepEqual(markerPosition(-1,9999,geometry),{x:0,y:500,relativeX:0,relativeY:1});
});
test("marks capture geometry rather than silently following resized or moved windows", () => {
  const copy={...geometry}; const mark=makeScreenMark(1,300,350,copy,"#ffffff","dark","2026-11-09T00:00:00Z");
  copy.width=2000; assert.equal(mark.geometry.width,1000); assert.equal(mark.space,geometryKey(geometry));
  for (const change of [{width:999},{height:499},{left:51},{top:101},{dpr:1},{screenX:1},{screenY:1},{screenWidth:1280},{screenHeight:720},{presentation:"fullscreen" as const}]) assert.notEqual(mark.space,geometryKey({...geometry,...change}));
});
test("CSV preserves Unicode/newlines/quotes and neutralizes user-supplied formulas", () => {
  const csv=observationCSV([["备注","=HYPERLINK(\"x\")"," +1","@SUM(1)","-2",-2,"line1\nline2"]]);
  assert.ok(csv.startsWith("\uFEFF\"备注\"")); assert.ok(csv.includes('"\'=HYPERLINK(""x"")"')); assert.ok(csv.includes('"\' +1"'));
  assert.ok(csv.includes('"\'@SUM(1)"')); assert.ok(csv.includes('"\'-2","-2"')); assert.ok(csv.includes('"line1\nline2"'));
});
