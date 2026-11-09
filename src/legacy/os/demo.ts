// Runs the WebAssembly build of the 2025 operating system. Ported from the
// old site's React component (src/components/OSDemo.tsx at a113618).

import { createWasmFilesystem, type WasmFilesystem } from './filesystem';
import { createKeyboardHandler } from './keyboard';

declare global {
  interface Window {
    OtiumOS?: (module: object) => Promise<unknown>;
  }
}

const WASM_DIR = '/legacy/os-wasm/';

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function startOsDemo(root: HTMLElement) {
  const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const runButton = $<HTMLButtonElement>('[data-run]');
  const stopButton = $<HTMLButtonElement>('[data-stop]');
  const clearButton = $<HTMLButtonElement>('[data-clear]');
  const recipes = $<HTMLSelectElement>('[data-recipes]');
  const errorBox = $<HTMLElement>('[data-error]');
  const terminal = $<HTMLPreElement>('[data-terminal]');
  const inputForm = $<HTMLFormElement>('[data-input-form]');
  const input = $<HTMLInputElement>('[data-input]');
  const canvas = $<HTMLCanvasElement>('[data-canvas]');
  const capture = $<HTMLButtonElement>('[data-capture]');
  const activity = $<HTMLElement>('[data-activity]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];

  let ready = false;
  let running = false;
  let filesystem: WasmFilesystem | null = null;
  let keyboard: ReturnType<typeof createKeyboardHandler> | null = null;
  // The OS reads keystrokes from this array, so it must stay the same object.
  const inputBuffer: number[] = [];

  function append(text: string) {
    const atBottom = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 24;
    terminal.append(text);
    if (atBottom) terminal.scrollTop = terminal.scrollHeight;
  }

  function showError(message: string | null) {
    errorBox.hidden = !message;
    errorBox.textContent = message ? `Error: ${message}` : '';
  }

  function showTab(name: 'terminal' | 'graphics') {
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
    for (const panel of panels) panel.hidden = panel.dataset.panel !== name;
  }

  function setRunning(value: boolean) {
    running = value;
    runButton.disabled = !ready || running;
    runButton.textContent = running ? 'Running…' : 'Run';
    stopButton.disabled = !running;
    clearButton.disabled = running;
    recipes.hidden = !running;
    inputForm.hidden = !running;
    capture.hidden = !running || document.activeElement === canvas;
  }

  function send(command: string) {
    for (let i = 0; i < command.length; i++) inputBuffer.push(command.charCodeAt(i));
    inputBuffer.push(13);
  }

  async function load() {
    try {
      filesystem = createWasmFilesystem();
      await filesystem.init();
      if (!window.OtiumOS) await loadScript(`${WASM_DIR}os.js`);
      ready = true;
      terminal.textContent = '';
      append('Emscripten module loaded successfully.\nClick "Run" to start the OS.\n\n');
      setRunning(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message);
      append(`\nError loading module: ${message}\n`);
    }
  }

  async function run() {
    if (!ready || running || !window.OtiumOS) return;
    setRunning(true);
    showError(null);
    append('> Starting Otium OS...\n\n');

    const fs = () => filesystem!;
    const Module = {
      locateFile: (path: string) => `${WASM_DIR}${path}`,
      print: (text: string) => { if (text != null) append(text + '\n'); },
      print2: (text: string) => { if (text != null) append(text); },
      printErr: (text: string) => {
        console.error('ERROR:', text);
        append(`[ERROR] ${text}\n`);
      },
      inputBuffer,

      graphicsInit: (width: number, height: number) => {
        canvas.width = width;
        canvas.height = height;
        activity.hidden = false;
        showTab('graphics');
        append(`Graphics initialized: ${width}x${height}\n`);
        return true;
      },
      graphicsFlush: (pixels: Uint32Array, width: number, height: number) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const image = ctx.createImageData(width, height);
        const data = image.data;
        // 0xAARRGGBB to RGBA bytes
        for (let i = 0; i < width * height; i++) {
          const pixel = pixels[i];
          const o = i * 4;
          data[o] = (pixel >> 16) & 0xff;
          data[o + 1] = (pixel >> 8) & 0xff;
          data[o + 2] = pixel & 0xff;
          data[o + 3] = (pixel >> 24) & 0xff;
        }
        ctx.putImageData(image, 0, 0);
      },
      graphicsCleanup: () => {
        activity.hidden = true;
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      },

      time_get: () => Date.now(),

      fsExists: (path: string) => fs().fsExists(path),
      fsFileSize: (path: string) => fs().fsFileSize(path),
      fsReadFile: (path: string) => fs().fsReadFile(path),
      fsWriteFile: (path: string, data: Uint8Array) => fs().fsWriteFile(path, data),
      fsCreateFile: (path: string) => fs().fsCreateFile(path),
      fsCreateDir: (path: string) => fs().fsCreateDir(path),
      fsDeleteFile: (path: string) => fs().fsDeleteFile(path),
      fsDeleteDir: (path: string) => fs().fsDeleteDir(path),
      fsListDir: (path: string) => fs().fsListDir(path),

      keyboardInit: () => {
        keyboard = createKeyboardHandler();
        return true;
      },
      keyboardPoll: () => keyboard?.poll() ?? null,
      keyboardCleanup: () => keyboard?.cleanup(),

      onRuntimeInitialized: () => {
        append('Runtime initialized. Ready for input.\nType commands and press Enter.\n\n');
      },
      onAbort: (what: unknown) => {
        const message = `Program aborted: ${what}`;
        console.error(message);
        showError(message);
        setRunning(false);
      },
      exit: () => {
        append('\n> OS exited.\n');
        setRunning(false);
      },

      noInitialRun: false,
      noExitRuntime: false,
    };

    try {
      await window.OtiumOS(Module);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message);
      append(`\nError: ${message}\n`);
      setRunning(false);
    }
  }

  runButton.addEventListener('click', run);
  // The module can't be restarted in place, so stopping reloads the page.
  stopButton.addEventListener('click', () => location.reload());
  clearButton.addEventListener('click', () => {
    terminal.textContent = '';
    showError(null);
  });

  for (const tab of tabs) tab.addEventListener('click', () => showTab(tab.dataset.tab as 'terminal' | 'graphics'));

  inputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!running || !input.value) return;
    send(input.value);
    append(`${input.value}\n`);
    terminal.scrollTop = terminal.scrollHeight;
    input.value = '';
  });

  recipes.addEventListener('change', () => {
    const command = recipes.value;
    recipes.value = '';
    if (!command || !running) return;
    send(command);
    append(`> ${command}\n`);
    terminal.scrollTop = terminal.scrollHeight;
    showTab(command.startsWith('run ') ? 'graphics' : 'terminal');
  });

  canvas.addEventListener('focus', () => { capture.hidden = true; });
  canvas.addEventListener('blur', () => { capture.hidden = !running; });
  capture.addEventListener('click', () => canvas.focus());

  canvas.addEventListener('keydown', (e) => {
    if (!running) return;
    e.preventDefault();
    e.stopPropagation();
    // Tab hands the keyboard back to the page.
    if (e.code === 'Tab') canvas.blur();
    else keyboard?.handleKeyEvent(e.code, true);
  }, true);
  canvas.addEventListener('keyup', (e) => {
    if (!running) return;
    e.preventDefault();
    e.stopPropagation();
    keyboard?.handleKeyEvent(e.code, false);
  }, true);

  load();
}
