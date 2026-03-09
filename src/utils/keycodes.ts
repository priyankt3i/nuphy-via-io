
export const QMK_KEYCODES: Record<number, string> = {
  0x0000: 'NO',
  0x0001: 'TRNS',
  0x0004: 'A',
  0x0005: 'B',
  0x0006: 'C',
  0x0007: 'D',
  0x0008: 'E',
  0x0009: 'F',
  0x000A: 'G',
  0x000B: 'H',
  0x000C: 'I',
  0x000D: 'J',
  0x000E: 'K',
  0x000F: 'L',
  0x0010: 'M',
  0x0011: 'N',
  0x0012: 'O',
  0x0013: 'P',
  0x0014: 'Q',
  0x0015: 'R',
  0x0016: 'S',
  0x0017: 'T',
  0x0018: 'U',
  0x0019: 'V',
  0x001A: 'W',
  0x001B: 'X',
  0x001C: 'Y',
  0x001D: 'Z',
  0x001E: '1',
  0x001F: '2',
  0x0020: '3',
  0x0021: '4',
  0x0022: '5',
  0x0023: '6',
  0x0024: '7',
  0x0025: '8',
  0x0026: '9',
  0x0027: '0',
  0x0028: 'ENTER',
  0x0029: 'ESC',
  0x002A: 'BACK',
  0x002B: 'TAB',
  0x002C: 'SPACE',
  0x002D: '-',
  0x002E: '=',
  0x002F: '[',
  0x0030: ']',
  0x0031: '\\',
  0x0033: ';',
  0x0034: "'",
  0x0035: '`',
  0x0036: ',',
  0x0037: '.',
  0x0038: '/',
  0x0039: 'CAPS',
  0x003A: 'F1',
  0x003B: 'F2',
  0x003C: 'F3',
  0x003D: 'F4',
  0x003E: 'F5',
  0x003F: 'F6',
  0x0040: 'F7',
  0x0041: 'F8',
  0x0042: 'F9',
  0x0043: 'F10',
  0x0044: 'F11',
  0x0045: 'F12',
  0x0046: 'PRTSC',
  0x0047: 'SCR',
  0x0048: 'PAUSE',
  0x0049: 'INS',
  0x004A: 'HOME',
  0x004B: 'PGUP',
  0x004C: 'DEL',
  0x004D: 'END',
  0x004E: 'PGDN',
  0x004F: 'RIGHT',
  0x0050: 'LEFT',
  0x0051: 'DOWN',
  0x0052: 'UP',
  0x0053: 'NUM',
  0x0054: 'K/',
  0x0055: 'K*',
  0x0056: 'K-',
  0x0057: 'K+',
  0x0058: 'K_ENT',
  0x0059: 'K1',
  0x005A: 'K2',
  0x005B: 'K3',
  0x005C: 'K4',
  0x005D: 'K5',
  0x005E: 'K6',
  0x005F: 'K7',
  0x0060: 'K8',
  0x0061: 'K9',
  0x0062: 'K0',
  0x0063: 'K.',
  0x0065: 'MENU',
  0x0066: 'POWER',
  0x0067: 'K=',
  0x00E0: 'CTRL',
  0x00E1: 'SHIFT',
  0x00E2: 'ALT',
  0x00E3: 'GUI', // Win/Cmd
  0x00E4: 'RCTRL',
  0x00E5: 'RSHIFT',
  0x00E6: 'RALT',
  0x00E7: 'RGUI',
  // Media keys
  0x007F: 'MUTE',
  0x0080: 'VOL+',
  0x0081: 'VOL-',
  0x00A5: 'NEXT',
  0x00A6: 'PREV',
  0x00A7: 'STOP',
  0x00A8: 'PLAY',
  0x00AC: 'BRI+',
  0x00AD: 'BRI-',
  0x00B5: 'NEXT',
  0x00B6: 'PREV',
  0x00B7: 'STOP',
  0x00CD: 'PLAY',
  // Custom/Layers (Simplified)
  0x5200: 'FN', // MO(1) - approximate
  0x5201: 'FN', // MO(2)
  0x5202: 'FN', // MO(3)
  // Lighting
  0x5F00: 'RGB',
  0x5F01: 'RMOD',
  0x5F02: 'RHUI',
  0x5F80: 'BRI+',
  0x5F81: 'BRI-',
};

export function getKeyLabel(keycode: number): string {
  // Handle basic keycodes
  if (QMK_KEYCODES[keycode]) {
    return QMK_KEYCODES[keycode];
  }
  
  // Handle MO(layer)
  if (keycode >= 0x5200 && keycode <= 0x521F) {
      return `FN${keycode - 0x5200}`;
  }

  // Handle TO(layer)
  if (keycode >= 0x5220 && keycode <= 0x523F) {
      return `TO${keycode - 0x5220}`;
  }

  // Handle TG(layer)
  if (keycode >= 0x5240 && keycode <= 0x525F) {
      return `TG${keycode - 0x5240}`;
  }

  return `0x${keycode.toString(16).toUpperCase()}`;
}

export function mapEventCodeToLabel(code: string, osMode: 'Mac' | 'Win' = 'Mac'): string {
  const map: Record<string, string> = {
    'Escape': 'ESC',
    'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
    'Delete': 'DEL', 'Insert': 'INS', 'Home': 'HOME', 'End': 'END', 'PageUp': 'PGUP', 'PageDown': 'PGDN',
    'Backquote': '`', 'Minus': '-', 'Equal': '=', 'Backspace': 'BACK',
    'Tab': 'TAB', 'BracketLeft': '[', 'BracketRight': ']', 'Backslash': '\\',
    'CapsLock': 'CAPS', 'Semicolon': ';', 'Quote': "'", 'Enter': 'ENTER',
    'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT',
    'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
    'AltLeft': osMode === 'Mac' ? 'OPT' : 'ALT', 'AltRight': osMode === 'Mac' ? 'OPT' : 'ALT',
    'MetaLeft': osMode === 'Mac' ? 'CMD' : 'WIN', 'MetaRight': osMode === 'Mac' ? 'CMD' : 'WIN',
    'Space': 'SPACE',
    'ArrowUp': 'UP', 'ArrowDown': 'DOWN', 'ArrowLeft': 'LEFT', 'ArrowRight': 'RIGHT',
    'Comma': ',', 'Period': '.', 'Slash': '/',
    'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
    'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E', 'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M',
    'KeyN': 'N', 'KeyO': 'O', 'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T', 'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y', 'KeyZ': 'Z',
  };
  
  return map[code] || code;
}
