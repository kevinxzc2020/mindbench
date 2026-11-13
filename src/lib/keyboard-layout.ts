export interface KeyCap { code: string; label: string; width?: number }
export interface PlacedKey { cap: KeyCap; row: number | string; column: number | string }
const key = (code: string, label: string, width = 1): KeyCap => ({ code, label, width });
const letter = (letters: string) => Array.from(letters).map(l => key(`Key${l}`, l));
export type KeyboardLayout = "ansi" | "tkl" | "iso" | "75" | "60";
export const KEYBOARD_LAYOUTS: { id: KeyboardLayout; label: string }[] = [
  { id: "ansi", label: "ANSI · 104" }, { id: "iso", label: "ISO · 105" }, { id: "tkl", label: "TKL · 87" },
  { id: "75", label: "75% · 84" }, { id: "60", label: "60% · 61" },
];
const FUNCTION_ROW = [key("Escape", "Esc"), ...Array.from({ length: 12 }, (_, i) => key(`F${i + 1}`, `F${i + 1}`))];

/** Main alphanumeric block. 60% boards have no function row; their top-left key sends Escape. */
export function keyboardRows(layout: KeyboardLayout): KeyCap[][] {
  const iso = layout === "iso";
  return [
    ...(layout === "60" ? [] : [FUNCTION_ROW]),
    [layout === "60" ? key("Escape", "Esc") : key("Backquote", "` ~"), ...Array.from("1234567890").map(n => key(`Digit${n}`, n)), key("Minus", "− _"), key("Equal", "= +"), key("Backspace", "Backspace", 2)],
    [key("Tab", "Tab", 1.5), ...letter("QWERTYUIOP"), key("BracketLeft", "[ {"), key("BracketRight", "] }"), key("Backslash", "\ |", 1.5)],
    [key("CapsLock", "Caps", 1.75), ...letter("ASDFGHJKL"), key("Semicolon", "; :"), key("Quote", "' \""), key("Enter", "Enter", 2.25)],
    [key("ShiftLeft", "Shift", iso ? 1.25 : 2.25), ...(iso ? [key("IntlBackslash", "< >")] : []), ...letter("ZXCVBNM"), key("Comma", ", <"), key("Period", ". >"), key("Slash", "/ ?"), key("ShiftRight", "Shift", 2.75)],
    [key("ControlLeft", "Ctrl", 1.25), key("MetaLeft", "Win / ⌘", 1.25), key("AltLeft", "Alt / ⌥", 1.25), key("Space", "Space", 6.25), key("AltRight", "AltGr", 1.25), key("MetaRight", "Win / ⌘", 1.25), key("ContextMenu", "Menu", 1.25), key("ControlRight", "Ctrl", 1.25)],
  ];
}

const ARROWS: PlacedKey[] = [
  { cap: key("ArrowUp", "↑"), row: 5, column: 2 }, { cap: key("ArrowLeft", "←"), row: 6, column: 1 },
  { cap: key("ArrowDown", "↓"), row: 6, column: 2 }, { cap: key("ArrowRight", "→"), row: 6, column: 3 },
];
/** Navigation cluster placed on a 3 × 6 grid beside the main block. */
export function navigationCluster(layout: KeyboardLayout): PlacedKey[] {
  if (layout === "60") return [];
  if (layout === "75") return [
    { cap: key("PrintScreen", "PrtSc"), row: 1, column: 1 }, { cap: key("Delete", "Del"), row: 1, column: 2 },
    { cap: key("Home", "Home"), row: 2, column: 3 }, { cap: key("PageUp", "PgUp"), row: 3, column: 3 },
    { cap: key("PageDown", "PgDn"), row: 4, column: 3 }, { cap: key("End", "End"), row: 5, column: 3 }, ...ARROWS,
  ];
  const grid = [["PrintScreen", "PrtSc"], ["ScrollLock", "ScrLk"], ["Pause", "Pause"], ["Insert", "Ins"], ["Home", "Home"], ["PageUp", "PgUp"], ["Delete", "Del"], ["End", "End"], ["PageDown", "PgDn"]];
  return [...grid.map(([code, label], i) => ({ cap: key(code, label), row: Math.floor(i / 3) + 1, column: i % 3 + 1 })), ...ARROWS];
}
export const NUMPAD_KEYS = [key("NumLock","Num"),key("NumpadDivide","/"),key("NumpadMultiply","×"),key("NumpadSubtract","−"),key("Numpad7","7"),key("Numpad8","8"),key("Numpad9","9"),key("NumpadAdd","+"),key("Numpad4","4"),key("Numpad5","5"),key("Numpad6","6"),key("Numpad1","1"),key("Numpad2","2"),key("Numpad3","3"),key("NumpadEnter","Enter"),key("Numpad0","0"),key("NumpadDecimal",".")];
export const hasNumpad = (layout: KeyboardLayout) => layout === "ansi" || layout === "iso";
export function layoutCodes(layout: KeyboardLayout) {
  return [...keyboardRows(layout).flat(), ...navigationCluster(layout).map(p => p.cap), ...(hasNumpad(layout) ? NUMPAD_KEYS : [])].map(k => k.code);
}

/** Guided combinations for checking simultaneous key registration. None of them is a browser/OS shortcut. */
export const KEY_COMBOS: { id: string; keys: string[] }[] = [
  { id: "wasd", keys: ["KeyW", "KeyA", "KeyS", "KeyD"] },
  { id: "move-jump", keys: ["ShiftLeft", "KeyW", "KeyD", "Space"] },
  { id: "top-row", keys: ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY"] },
  { id: "modifiers", keys: ["ControlLeft", "ShiftLeft", "AltLeft", "KeyZ", "KeyX"] },
  { id: "home-row", keys: ["KeyA", "KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL", "Semicolon"] },
];
export interface ComboResult { best: number; missing: string[]; passed: boolean }
export const freshCombo = (keys: string[]): ComboResult => ({ best: 0, missing: [...keys], passed: false });
/** Keeps the moment with the most combo keys held together; passes when all are held at once. */
export function updateCombo(result: ComboResult, keys: string[], held: readonly string[]): ComboResult {
  if (result.passed) return result;
  const down = keys.filter(k => held.includes(k));
  if (down.length <= result.best) return result;
  return { best: down.length, missing: keys.filter(k => !held.includes(k)), passed: down.length === keys.length };
}
