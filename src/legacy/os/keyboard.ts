// wasm-keyboard.ts - Browser keyboard handler for WASM OS
//
// Provides keyboard event handling compatible with the WASM keyboard backend
// (ot/user/keyboard/backend-wasm.hpp). Manages focus, queues events, and
// converts DOM keycodes to Linux input codes.

// Key flags matching C++ KeyEvent structure
const KEY_FLAG_PRESSED = 0x01;
const KEY_FLAG_SHIFT = 0x02;
const KEY_FLAG_CTRL = 0x04;
const KEY_FLAG_ALT = 0x08;

// DOM key code to Linux input code mapping
// Matches wasm-support.js (lines 308-325)
const DOM_TO_LINUX_KEYCODE: Record<string, number> = {
  Escape: 1,
  Digit1: 2,
  Digit2: 3,
  Digit3: 4,
  Digit4: 5,
  Digit5: 6,
  Digit6: 7,
  Digit7: 8,
  Digit8: 9,
  Digit9: 10,
  Digit0: 11,
  Minus: 12,
  Equal: 13,
  Backspace: 14,
  Tab: 15,
  KeyQ: 16,
  KeyW: 17,
  KeyE: 18,
  KeyR: 19,
  KeyT: 20,
  KeyY: 21,
  KeyU: 22,
  KeyI: 23,
  KeyO: 24,
  KeyP: 25,
  BracketLeft: 26,
  BracketRight: 27,
  Enter: 28,
  KeyA: 30,
  KeyS: 31,
  KeyD: 32,
  KeyF: 33,
  KeyG: 34,
  KeyH: 35,
  KeyJ: 36,
  KeyK: 37,
  KeyL: 38,
  Semicolon: 39,
  Quote: 40,
  Backquote: 41,
  Backslash: 43,
  KeyZ: 44,
  KeyX: 45,
  KeyC: 46,
  KeyV: 47,
  KeyB: 48,
  KeyN: 49,
  KeyM: 50,
  Comma: 51,
  Period: 52,
  Slash: 53,
  Space: 57,
  ShiftLeft: 42,
  ShiftRight: 54,
  ControlLeft: 29,
  ControlRight: 97,
  AltLeft: 56,
  AltRight: 100,
};

interface KeyEvent {
  code: number; // Linux keycode (uint16)
  flags: number; // KEY_FLAG_PRESSED | modifiers (uint8)
}

function isModifierKey(code: number): boolean {
  return (
    code === 42 ||
    code === 54 || // Shift
    code === 29 ||
    code === 97 || // Ctrl
    code === 56 ||
    code === 100
  ); // Alt
}

export function createKeyboardHandler() {
  const eventQueue: KeyEvent[] = [];
  const modifiers = { shift: false, ctrl: false, alt: false };

  return {
    /**
     * Handle a keyboard event from the browser.
     *
     * @param domCode - DOM KeyboardEvent.code (e.g., "KeyA", "Enter")
     * @param isKeyDown - true for keydown, false for keyup
     * @returns false if the key should release focus (Tab), true otherwise
     */
    handleKeyEvent(domCode: string, isKeyDown: boolean): boolean {
      // Tab releases focus
      if (domCode === "Tab") {
        return false;
      }

      const linuxCode = DOM_TO_LINUX_KEYCODE[domCode];
      if (linuxCode === undefined) {
        console.log(`[KB] Unknown DOM code: ${domCode}`);
        return true;
      }

      // Update modifier state
      if (linuxCode === 42 || linuxCode === 54) {
        modifiers.shift = isKeyDown;
      } else if (linuxCode === 29 || linuxCode === 97) {
        modifiers.ctrl = isKeyDown;
      } else if (linuxCode === 56 || linuxCode === 100) {
        modifiers.alt = isKeyDown;
      }

      // Build flags
      let flags = 0;
      if (isKeyDown) flags |= KEY_FLAG_PRESSED;
      if (modifiers.shift) flags |= KEY_FLAG_SHIFT;
      if (modifiers.ctrl) flags |= KEY_FLAG_CTRL;
      if (modifiers.alt) flags |= KEY_FLAG_ALT;

      // Don't queue modifier-only events (matches wasm-support.js line 357)
      if (!isModifierKey(linuxCode)) {
        eventQueue.push({ code: linuxCode, flags });
      }

      return true;
    },

    /**
     * Poll for the next keyboard event.
     * Called by Module.keyboardPoll() from WASM.
     *
     * @returns {code, flags} or null if no events queued
     */
    poll(): KeyEvent | null {
      return eventQueue.shift() ?? null;
    },

    /**
     * Clean up keyboard state.
     * Called by Module.keyboardCleanup() from WASM.
     */
    cleanup() {
      eventQueue.length = 0;
      modifiers.shift = false;
      modifiers.ctrl = false;
      modifiers.alt = false;
    },
  };
}
