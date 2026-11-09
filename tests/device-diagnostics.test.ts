import test from "node:test";
import assert from "node:assert/strict";
import { createKeyboardState, keyDown, keyUp, interruptKeyboard, createMouseState, mouseDown, mouseUp, mouseMove, interruptMouse, createWheelState, wheelInput, interruptWheel, appendLog, csvLog, LOG_LIMIT } from "../src/lib/device-diagnostics";
import { layoutCodes } from "../src/lib/keyboard-layout";

test("keyboard distinguishes independent physical presses from held-key auto-repeat",()=>{
  const s=createKeyboardState();keyDown(s,"KeyA",false,0,30);
  for(let i=1;i<=10;i++)keyDown(s,"KeyA",true,i*10,30);
  keyUp(s,"KeyA",200);
  assert.equal(s.presses,1);assert.equal(s.repeats,10);assert.equal(s.suspects,0);assert.equal(s.keys.KeyA.lastHold,200);assert.deepEqual(s.held,[]);
});
test("release-to-press chatter is flagged, but intentional slow repetitions are not",()=>{
  const s=createKeyboardState();keyDown(s,"KeyA",false,0,30);keyUp(s,"KeyA",50);keyDown(s,"KeyA",false,60,30);keyUp(s,"KeyA",90);keyDown(s,"KeyA",false,400,30);
  assert.equal(s.presses,3);assert.equal(s.suspects,1);assert.equal(s.keys.KeyA.shortestGap,10);
});
test("missing keyup is observable without creating a duplicate held key",()=>{
  const s=createKeyboardState();keyDown(s,"KeyA",false,0,30);keyDown(s,"KeyA",false,5,30);
  assert.equal(s.suspects,1);assert.deepEqual(s.held,["KeyA"]);assert.equal(s.presses,1);
});
test("left/right modifiers and numpad have separate identity and chord counts",()=>{
  const s=createKeyboardState();["ShiftLeft","ShiftRight","Digit1","Numpad1"].forEach((code,i)=>keyDown(s,code,false,i,30));
  assert.equal(s.maxChord,4);keyUp(s,"ShiftLeft",20);assert.equal(s.held.length,3);assert.equal(Object.keys(s.keys).length,4);
});
test("focus loss cancels held states and timing baselines without fabricating releases or faults",()=>{
  const s=createKeyboardState();keyDown(s,"KeyA",false,0,30);interruptKeyboard(s,10,"focus-lost");keyUp(s,"KeyA",11);keyDown(s,"KeyA",false,12,30);
  assert.equal(s.suspects,0);assert.equal(s.keys.KeyA.releases,0);assert.equal(s.presses,2);assert.equal(s.interruptions,1);
});
test("a held key discovered mid-repeat is not certified as a physical press",()=>{
  const s=createKeyboardState();keyDown(s,"KeyA",true,10,30);keyUp(s,"KeyA",20);assert.equal(s.presses,0);assert.equal(s.suspects,0);assert.equal(s.keys.KeyA.releases,0);
});
test("keyboard layout counts and physical codes are distinct",()=>{
  for(const [layout,count] of [["ansi",104],["tkl",87],["iso",105]] as const){const codes=layoutCodes(layout);assert.equal(codes.length,count);assert.equal(new Set(codes).size,count);}
});
test("mouse bitmask tracks chording and middle/right mapping independently",()=>{
  const s=createMouseState();mouseDown(s,0,0,80,{x:50,y:50},false);mouseDown(s,2,10,80,{x:50,y:50},false);mouseDown(s,1,20,80,{x:50,y:50},false);
  mouseMove(s,7,{x:51,y:50},30);assert.equal(s.missingReleases,0);
  mouseUp(s,2,50,{x:50,y:50});mouseMove(s,5,{x:51,y:50},60);assert.equal(s.missingReleases,0);assert.notEqual(s.buttons[0].since,null);assert.equal(s.buttons[2].ups,1);
});
test("mouse rapid pair compares clicks on the same button, not different buttons",()=>{
  const s=createMouseState();mouseDown(s,0,0,80,{x:50,y:50},false);mouseUp(s,0,10,{x:50,y:50});mouseDown(s,2,20,80,{x:50,y:50},false);mouseDown(s,0,30,80,{x:50,y:50},false);
  assert.equal(s.rapid,1);assert.equal(s.buttons[0].shortestInterval,30);assert.equal(s.buttons[2].rapid,0);
});
test("mouse release without a tracked press is ignored",()=>{
  const s=createMouseState();mouseUp(s,0,10,{x:10,y:50});assert.equal(s.buttons[0].ups,0);assert.equal(s.log.length,0);
});
test("a drag completes only if started and released on the designated targets",()=>{
  const s=createMouseState();mouseDown(s,0,0,80,{x:14,y:50},true);mouseMove(s,1,{x:50,y:50},40);mouseUp(s,0,100,{x:86,y:50});
  assert.equal(s.dragCompleted,1);assert.equal(s.drag,"complete");
  mouseDown(s,0,300,80,{x:14,y:50},true);mouseUp(s,0,400,{x:50,y:50});assert.equal(s.dragEarly,1);assert.equal(s.dragCompleted,1);
});
test("missing mouse release flags observed event loss and cancels an active drag",()=>{
  const s=createMouseState();mouseDown(s,0,0,80,{x:14,y:50},true);mouseMove(s,0,{x:20,y:50},20);assert.equal(s.missingReleases,1);assert.equal(s.drag,"interrupted");
  mouseMove(s,0,{x:22,y:50},30);assert.equal(s.missingReleases,1);
});
test("mouse focus loss is not counted as a defective drag or missing release",()=>{
  const s=createMouseState();mouseDown(s,0,0,80,{x:14,y:50},true);interruptMouse(s,10,"focus-lost");mouseMove(s,0,{x:20,y:50},20);mouseDown(s,0,30,80,{x:14,y:50},true);
  assert.equal(s.missingReleases,0);assert.equal(s.dragEarly,0);assert.equal(s.rapid,0);
});
test("all five standard mouse buttons count independent down/up pairs",()=>{
  const s=createMouseState();for(let i=0;i<5;i++){mouseDown(s,i,i*100,80,{x:50,y:50},false);mouseUp(s,i,i*100+50,{x:50,y:50});}
  assert.deepEqual(s.buttons.map(b=>[b.downs,b.ups]),[[1,1],[1,1],[1,1],[1,1],[1,1]]);
});
test("one-way wheel test detects opposite input only on its chosen axis",()=>{
  const s=createWheelState();wheelInput(s,0,100,0,false,"down",0);wheelInput(s,0,-1,0,false,"down",10);wheelInput(s,-30,0,0,false,"down",20);
  assert.equal(s.events,3);assert.equal(s.eligible,2);assert.equal(s.opposite,1);assert.equal(s.left,1);
});
test("free scrolling never labels an ordinary reversal as a fault",()=>{
  const s=createWheelState();wheelInput(s,0,100,0,false,"free",0);wheelInput(s,0,-100,0,false,"free",10);
  assert.equal(s.reversals,1);assert.equal(s.opposite,0);assert.equal(s.log.filter(e=>e.kind==="suspect").length,0);
});
test("horizontal directional wheel testing works without vertical movement",()=>{
  const s=createWheelState();wheelInput(s,-3,0,1,false,"left",0);wheelInput(s,1,0,1,false,"left",10);assert.equal(s.opposite,1);assert.equal(s.eligible,2);
});
test("wheel units remain separate and no conversion invents physical wheel steps",()=>{
  const s=createWheelState();wheelInput(s,0,100,0,false,"down",0);wheelInput(s,0,3,1,false,"down",10);wheelInput(s,0,1,2,false,"down",20);
  assert.equal(s.totals[0].y,100);assert.equal(s.totals[1].y,3);assert.equal(s.totals[2].y,1);
});
test("zoom, zero and non-finite wheel inputs do not corrupt scroll results",()=>{
  const s=createWheelState();wheelInput(s,0,-100,0,true,"down",0);wheelInput(s,0,0,0,false,"down",10);wheelInput(s,0,NaN,0,false,"down",20);
  assert.equal(s.events,0);assert.equal(s.opposite,0);assert.equal(s.ignoredZoom,1);assert.equal(s.zero,1);
});
test("pausing a wheel test resets directional continuity",()=>{
  const s=createWheelState();wheelInput(s,0,1,0,false,"free",0);interruptWheel(s,10,"focus-lost");wheelInput(s,0,-1,0,false,"free",20);assert.equal(s.reversals,0);
});
test("logs and plots stay bounded while session totals retain all events",()=>{
  const s=createWheelState();for(let i=0;i<LOG_LIMIT+20;i++)wheelInput(s,0,1,0,false,"down",i);
  assert.equal(s.events,LOG_LIMIT+20);assert.equal(s.logged,LOG_LIMIT+20);assert.equal(s.log.length,LOG_LIMIT);assert.equal(s.samples.length,80);assert.equal(s.totals[0].y,LOG_LIMIT+20);
});
test("CSV escapes commas, quotes and newlines",()=>{
  const s=createKeyboardState();appendLog(s,{at:1,event:"test",target:"key",detail:'a,"b"\nc',kind:"notice"});
  assert.ok(csvLog(s.log).includes('"a,""b""\nc"'));assert.ok(csvLog(s.log).startsWith("\uFEFF"));
});
