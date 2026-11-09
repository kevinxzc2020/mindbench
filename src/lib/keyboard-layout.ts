export interface KeyCap { code: string; label: string; width?: number }
const key = (code: string, label: string, width = 1): KeyCap => ({ code, label, width });
const letter = (letters: string) => Array.from(letters).map(l => key(`Key${l}`, l));
export type KeyboardLayout = "ansi" | "tkl" | "iso";
export function keyboardRows(layout: KeyboardLayout): KeyCap[][] {
  return [
    [key("Escape", "Esc"), ...Array.from({length:12},(_,i)=>key(`F${i+1}`,`F${i+1}`)), key("PrintScreen","PrtSc"), key("ScrollLock","ScrLk"), key("Pause","Pause")],
    [key("Backquote","` ~"), ...Array.from("1234567890").map(n=>key(`Digit${n}`,n)), key("Minus","− _"), key("Equal","= +"), key("Backspace","Backspace",2)],
    [key("Tab","Tab",1.5), ...letter("QWERTYUIOP"), key("BracketLeft","[ {"), key("BracketRight","] }"), key("Backslash","\\ |",1.5)],
    [key("CapsLock","Caps",1.75), ...letter("ASDFGHJKL"), key("Semicolon","; :"), key("Quote","' \""), key("Enter","Enter",2.25)],
    [key("ShiftLeft","Shift",layout === "iso" ? 1.25 : 2.25), ...(layout === "iso" ? [key("IntlBackslash","< >")] : []), ...letter("ZXCVBNM"), key("Comma",", <"), key("Period",". >"), key("Slash","/ ?"), key("ShiftRight","Shift",2.75)],
    [key("ControlLeft","Ctrl",1.25),key("MetaLeft","Win / ⌘",1.25),key("AltLeft","Alt / ⌥",1.25),key("Space","Space",6.25),key("AltRight","AltGr",1.25),key("MetaRight","Win / ⌘",1.25),key("ContextMenu","Menu",1.25),key("ControlRight","Ctrl",1.25)],
  ];
}
export const NAV_KEYS = [key("Insert","Ins"),key("Home","Home"),key("PageUp","PgUp"),key("Delete","Del"),key("End","End"),key("PageDown","PgDn"),key("ArrowLeft","←"),key("ArrowUp","↑"),key("ArrowDown","↓"),key("ArrowRight","→")];
export const NUMPAD_KEYS = [key("NumLock","Num"),key("NumpadDivide","/"),key("NumpadMultiply","×"),key("NumpadSubtract","−"),key("Numpad7","7"),key("Numpad8","8"),key("Numpad9","9"),key("NumpadAdd","+"),key("Numpad4","4"),key("Numpad5","5"),key("Numpad6","6"),key("Numpad1","1"),key("Numpad2","2"),key("Numpad3","3"),key("NumpadEnter","Enter"),key("Numpad0","0"),key("NumpadDecimal",".")];
export function layoutCodes(layout: KeyboardLayout) { return [...keyboardRows(layout).flat(), ...NAV_KEYS, ...(layout === "tkl" ? [] : NUMPAD_KEYS)].map(k => k.code); }
