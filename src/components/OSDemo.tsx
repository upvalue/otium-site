import { useState, useRef, useEffect } from 'react'
import { createWasmFilesystem, type WasmFilesystem } from '../lib/wasm-filesystem'
import { createKeyboardHandler } from '../lib/wasm-keyboard'

declare global {
  interface Window {
    OtiumOS: any;
  }
}

export default function OSDemo() {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [canvasFocused, setCanvasFocused] = useState(false);
  const moduleInstanceRef = useRef<any>(null);
  const outputBufferRef = useRef<string[]>([]);
  const inputBufferRef = useRef<number[]>([]);
  const terminalRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filesystemRef = useRef<WasmFilesystem | null>(null);
  const keyboardHandlerRef = useRef<ReturnType<typeof createKeyboardHandler> | null>(null);

  // Initialize filesystem and load Emscripten module on mount
  useEffect(() => {
    let mounted = true;

    async function loadEmscriptenModule() {
      try {
        setError(null);

        // Initialize filesystem
        if (!filesystemRef.current) {
          const fs = createWasmFilesystem();
          await fs.init();
          filesystemRef.current = fs;
        }

        // Check if the script is already loaded
        if (!window.OtiumOS) {
          // Create script element to load the Emscripten JS module
          const script = document.createElement('script');
          const gitSha = import.meta.env.PUBLIC_GIT_SHA || 'dev';
          script.src = `/os-wasm/os.js?v=${gitSha}`;
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load os.js'));
            document.body.appendChild(script);
          });
        }

        if (mounted) {
          setWasmReady(true);
          appendOutput('Emscripten module loaded successfully.\nClick "Run" to start the OS.\n\n');
        }
      } catch (err) {
        if (mounted) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg);
          appendOutput(`Error loading module: ${errorMsg}\n`);
        }
      }
    }

    loadEmscriptenModule();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Set up keyboard event listeners on canvas with capture phase
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasFocused || !isRunning) return;
      e.preventDefault();
      e.stopPropagation();
      const keepFocus = keyboardHandlerRef.current?.handleKeyEvent(e.code, true);
      if (!keepFocus) {
        canvas.blur();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!canvasFocused || !isRunning) return;
      e.preventDefault();
      e.stopPropagation();
      keyboardHandlerRef.current?.handleKeyEvent(e.code, false);
    };

    canvas.addEventListener('keydown', handleKeyDown, true);
    canvas.addEventListener('keyup', handleKeyUp, true);

    return () => {
      canvas.removeEventListener('keydown', handleKeyDown, true);
      canvas.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [canvasFocused, isRunning]);

  const appendOutput = (text: string) => {
    outputBufferRef.current.push(text);
    setOutput(outputBufferRef.current.join(''));
  };

  const clearTerminal = () => {
    outputBufferRef.current = [];
    setOutput('');
    setError(null);
  };

  const runWasm = async () => {
    if (!wasmReady || !window.OtiumOS) {
      setError('Module not loaded');
      return;
    }

    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setError(null);
    appendOutput('> Starting Otium OS...\n\n');

    try {
      // Create module configuration
      const gitSha = import.meta.env.PUBLIC_GIT_SHA || 'dev';
      const Module = {
        // Cache busting for wasm and data files
        locateFile: (path: string) => {
          return `/os-wasm/${path}?v=${gitSha}`;
        },

        // Print function - called by the OS for console output
        print: (text: string) => {
          if (text === undefined || text === null) return;
          appendOutput(text + '\n');
        },

        // Direct print without newline
        print2: (text: string) => {
          if (text === undefined || text === null) return;
          appendOutput(text);
        },

        printErr: (text: string) => {
          console.error('ERROR:', text);
          appendOutput(`[ERROR] ${text}\n`);
        },

        // Input buffer for the OS to read from
        inputBuffer: inputBufferRef.current,

        // Graphics callbacks for canvas rendering
        graphicsInit: (width: number, height: number) => {
          console.log(`Graphics init: ${width}x${height}`);
          const canvas = canvasRef.current;
          if (!canvas) {
            console.error('Canvas not available');
            return false;
          }

          canvas.width = width;
          canvas.height = height;
          appendOutput(`Graphics initialized: ${width}x${height}\n`);
          return true;
        },

        graphicsFlush: (pixels: Uint32Array, width: number, height: number) => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Create ImageData and copy pixels
          const imageData = ctx.createImageData(width, height);
          const data = imageData.data;

          // Convert from BGRA (0xAARRGGBB) to RGBA
          for (let i = 0; i < width * height; i++) {
            const pixel = pixels[i];
            const offset = i * 4;

            data[offset + 0] = (pixel >> 16) & 0xFF; // R
            data[offset + 1] = (pixel >> 8) & 0xFF;  // G
            data[offset + 2] = pixel & 0xFF;         // B
            data[offset + 3] = (pixel >> 24) & 0xFF; // A
          }

          ctx.putImageData(imageData, 0, 0);
        },

        graphicsCleanup: () => {
          console.log('Graphics cleanup');
          // Clear the canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        },

        time_get: () => {
          return Date.now();
        },

        // Filesystem callbacks
        fsExists: (path: string) => filesystemRef.current?.fsExists(path) ?? null,
        fsFileSize: (path: string) => filesystemRef.current?.fsFileSize(path) ?? -1,
        fsReadFile: (path: string) => filesystemRef.current?.fsReadFile(path) ?? null,
        fsWriteFile: (path: string, data: Uint8Array) =>
          filesystemRef.current?.fsWriteFile(path, data) ?? false,
        fsCreateFile: (path: string) => filesystemRef.current?.fsCreateFile(path) ?? false,
        fsCreateDir: (path: string) => filesystemRef.current?.fsCreateDir(path) ?? false,
        fsDeleteFile: (path: string) => filesystemRef.current?.fsDeleteFile(path) ?? false,
        fsDeleteDir: (path: string) => filesystemRef.current?.fsDeleteDir(path) ?? false,

        // Keyboard callbacks
        keyboardInit: () => {
          console.log('[OSDemo] Initializing keyboard handler');
          keyboardHandlerRef.current = createKeyboardHandler();
          return true;
        },

        keyboardPoll: () => {
          return keyboardHandlerRef.current?.poll() ?? null;
        },

        keyboardCleanup: () => {
          console.log('[OSDemo] Cleaning up keyboard handler');
          keyboardHandlerRef.current?.cleanup();
        },

        // Called when runtime is ready
        onRuntimeInitialized: () => {
          appendOutput('Runtime initialized. Ready for input.\n');
          appendOutput('Type commands and press Enter.\n\n');
        },

        // Handle abort
        onAbort: (what: any) => {
          const msg = `Program aborted: ${what}`;
          console.error(msg);
          setError(msg);
          setIsRunning(false);
        },

        // Exit handler
        exit: () => {
          appendOutput('\n> OS exited.\n');
          setIsRunning(false);
        },

        // Run main() automatically
        noInitialRun: false,
        noExitRuntime: false,
      };

      // Create and run the module
      const instance = await window.OtiumOS(Module);
      moduleInstanceRef.current = instance;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      appendOutput(`\nError: ${errorMsg}\n`);
      setIsRunning(false);
    }
  };

  const handleInputSubmit = () => {
    if (!isRunning || !inputValue) return;

    // Add each character to the input buffer
    for (let i = 0; i < inputValue.length; i++) {
      inputBufferRef.current.push(inputValue.charCodeAt(i));
    }
    // Add carriage return (13) like in the Node version
    inputBufferRef.current.push(13);

    // Show the input in the terminal
    appendOutput(`> ${inputValue}\n`);

    // Clear the input field
    setInputValue('');
  };

  const stopProgram = () => {
    if (moduleInstanceRef.current && moduleInstanceRef.current.exit) {
      try {
        moduleInstanceRef.current.exit();
      } catch (err) {
        console.error('Error stopping program:', err);
      }
    }
    setIsRunning(false);
    appendOutput('\n> Program stopped by user.\n');
  };

  return (
    <div className="min-w-[50vw] text-gray-100">
      <p>
        The OS demo currently is a <a href="https://upvalue.io/posts/trialing-zig-and-rust-by-writing-a-tcl-interpreter/">tcl</a> interpreter with a few interactive commands you can execute.
      </p>

      <p> Read a bit more in the <a href="/os/about">about</a> page.</p>


      {/* Controls */}
      <div className="mb-4 flex gap-3">
        <button className="hidden" />

        <button
          onClick={runWasm}
          disabled={!wasmReady || isRunning}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${!wasmReady || isRunning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
        <button
          onClick={stopProgram}
          disabled={!isRunning}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${!isRunning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-red-700 hover:bg-red-600 text-white'
            }`}
        >
          Stop
        </button>
        <button
          onClick={clearTerminal}
          disabled={isRunning}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${isRunning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
        >
          Clear
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Terminal Display */}
      <div className="mb-2">
        <label htmlFor="terminal" className="block text-sm font-medium mb-2 text-green-400">
          Terminal Output
        </label>
      </div>
      <pre
        id="terminal"
        ref={terminalRef}
        className="w-full h-96 p-4 bg-black border-2 border-green-700 rounded-md font-mono text-sm text-green-400 overflow-auto whitespace-pre-wrap"
        style={{
          textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
          fontFamily: 'Courier New, monospace'
        }}
      >
        {output || '> Ready. Click "Run" to start the OS.\n'}
      </pre>

      {/* Input Field */}
      {isRunning && (
        <div className="mt-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputSubmit();
              }
            }}
            placeholder="Type command and press Enter..."
            className="flex-1 px-4 py-2 bg-black border-2 border-green-700 rounded-md font-mono text-sm text-green-400 placeholder-green-600 focus:outline-none focus:border-green-500"
            style={{
              textShadow: '0 0 5px rgba(0, 255, 0, 0.3)',
              fontFamily: 'Courier New, monospace'
            }}
          />
          <button
            onClick={handleInputSubmit}
            className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
          >
            Send
          </button>
        </div>
      )}

      {/* Canvas for graphics output */}
      <div className="mt-4 mb-4">
        <label className="block text-sm font-medium mb-2 text-green-400">
          Graphics Output
        </label>
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onFocus={() => setCanvasFocused(true)}
            onBlur={() => setCanvasFocused(false)}
            className={`border-2 rounded-md bg-black outline-none transition-all ${
              canvasFocused
                ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'
                : 'border-green-700'
            }`}
            style={{
              imageRendering: 'pixelated',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          {/* Focus overlay - shown when canvas is not focused */}
          {isRunning && !canvasFocused && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-md"
              onClick={() => canvasRef.current?.focus()}
            >
              <span className="text-green-400 text-sm font-medium px-4 py-2 bg-black/80 rounded border border-green-700">
                Click to capture keyboard (Esc/Tab to release)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
