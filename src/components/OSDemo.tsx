import { useState, useRef, useEffect } from "react";
import {
  createWasmFilesystem,
  type WasmFilesystem,
} from "../lib/wasm-filesystem";
import { createKeyboardHandler } from "../lib/wasm-keyboard";

declare global {
  interface Window {
    OtiumOS: any;
  }
}

const RECIPES = [
  { name: "Select a recipe...", command: "" },
  { name: "Hello World", command: 'puts "hello world"' },
];

export default function OSDemo() {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "graphics">(
    "terminal",
  );
  const [graphicsActive, setGraphicsActive] = useState(false);
  const moduleInstanceRef = useRef<any>(null);
  const outputBufferRef = useRef<string[]>([]);
  const inputBufferRef = useRef<number[]>([]);
  const terminalRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filesystemRef = useRef<WasmFilesystem | null>(null);
  const keyboardHandlerRef = useRef<ReturnType<
    typeof createKeyboardHandler
  > | null>(null);

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
          const script = document.createElement("script");
          const gitSha = import.meta.env.PUBLIC_GIT_SHA || "dev";
          script.src = `/os-wasm/os.js?v=${gitSha}`;
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load os.js"));
            document.body.appendChild(script);
          });
        }

        if (mounted) {
          setWasmReady(true);
          appendOutput(
            'Emscripten module loaded successfully.\nClick "Run" to start the OS.\n\n',
          );
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
      const keepFocus = keyboardHandlerRef.current?.handleKeyEvent(
        e.code,
        true,
      );
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

    canvas.addEventListener("keydown", handleKeyDown, true);
    canvas.addEventListener("keyup", handleKeyUp, true);

    return () => {
      canvas.removeEventListener("keydown", handleKeyDown, true);
      canvas.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [canvasFocused, isRunning]);

  const appendOutput = (text: string) => {
    outputBufferRef.current.push(text);
    setOutput(outputBufferRef.current.join(""));
  };

  const clearTerminal = () => {
    outputBufferRef.current = [];
    setOutput("");
    setError(null);
  };

  const runWasm = async () => {
    if (!wasmReady || !window.OtiumOS) {
      setError("Module not loaded");
      return;
    }

    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setError(null);
    appendOutput("> Starting Otium OS...\n\n");

    try {
      // Create module configuration
      const gitSha = import.meta.env.PUBLIC_GIT_SHA || "dev";
      const Module = {
        // Cache busting for wasm and data files
        locateFile: (path: string) => {
          return `/os-wasm/${path}?v=${gitSha}`;
        },

        // Print function - called by the OS for console output
        print: (text: string) => {
          if (text === undefined || text === null) return;
          appendOutput(text + "\n");
        },

        // Direct print without newline
        print2: (text: string) => {
          if (text === undefined || text === null) return;
          appendOutput(text);
        },

        printErr: (text: string) => {
          console.error("ERROR:", text);
          appendOutput(`[ERROR] ${text}\n`);
        },

        // Input buffer for the OS to read from
        inputBuffer: inputBufferRef.current,

        // Graphics callbacks for canvas rendering
        graphicsInit: (width: number, height: number) => {
          console.log(`Graphics init: ${width}x${height}`);
          const canvas = canvasRef.current;
          if (!canvas) {
            console.error("Canvas not available");
            return false;
          }

          canvas.width = width;
          canvas.height = height;
          setGraphicsActive(true);
          setActiveTab("graphics");
          appendOutput(`Graphics initialized: ${width}x${height}\n`);
          return true;
        },

        graphicsFlush: (pixels: Uint32Array, width: number, height: number) => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Create ImageData and copy pixels
          const imageData = ctx.createImageData(width, height);
          const data = imageData.data;

          // Convert from BGRA (0xAARRGGBB) to RGBA
          for (let i = 0; i < width * height; i++) {
            const pixel = pixels[i];
            const offset = i * 4;

            data[offset + 0] = (pixel >> 16) & 0xff; // R
            data[offset + 1] = (pixel >> 8) & 0xff; // G
            data[offset + 2] = pixel & 0xff; // B
            data[offset + 3] = (pixel >> 24) & 0xff; // A
          }

          ctx.putImageData(imageData, 0, 0);
        },

        graphicsCleanup: () => {
          console.log("Graphics cleanup");
          setGraphicsActive(false);
          // Clear the canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        },

        time_get: () => {
          return Date.now();
        },

        // Filesystem callbacks
        fsExists: (path: string) =>
          filesystemRef.current?.fsExists(path) ?? null,
        fsFileSize: (path: string) =>
          filesystemRef.current?.fsFileSize(path) ?? -1,
        fsReadFile: (path: string) =>
          filesystemRef.current?.fsReadFile(path) ?? null,
        fsWriteFile: (path: string, data: Uint8Array) =>
          filesystemRef.current?.fsWriteFile(path, data) ?? false,
        fsCreateFile: (path: string) =>
          filesystemRef.current?.fsCreateFile(path) ?? false,
        fsCreateDir: (path: string) =>
          filesystemRef.current?.fsCreateDir(path) ?? false,
        fsDeleteFile: (path: string) =>
          filesystemRef.current?.fsDeleteFile(path) ?? false,
        fsDeleteDir: (path: string) =>
          filesystemRef.current?.fsDeleteDir(path) ?? false,

        // Keyboard callbacks
        keyboardInit: () => {
          console.log("[OSDemo] Initializing keyboard handler");
          keyboardHandlerRef.current = createKeyboardHandler();
          return true;
        },

        keyboardPoll: () => {
          return keyboardHandlerRef.current?.poll() ?? null;
        },

        keyboardCleanup: () => {
          console.log("[OSDemo] Cleaning up keyboard handler");
          keyboardHandlerRef.current?.cleanup();
        },

        // Called when runtime is ready
        onRuntimeInitialized: () => {
          appendOutput("Runtime initialized. Ready for input.\n");
          appendOutput("Type commands and press Enter.\n\n");
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
          appendOutput("\n> OS exited.\n");
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
    setInputValue("");
  };

  const handleRecipeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const command = e.target.value;
    if (!command || !isRunning) return;

    // Add each character to the input buffer
    for (let i = 0; i < command.length; i++) {
      inputBufferRef.current.push(command.charCodeAt(i));
    }
    // Add carriage return (13)
    inputBufferRef.current.push(13);

    // Show the input in the terminal
    appendOutput(`> ${command}\n`);

    // Switch to terminal tab
    setActiveTab("terminal");

    // Scroll terminal to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 0);

    // Reset the dropdown to the default option
    e.target.value = "";
  };

  const stopProgram = () => {
    if (moduleInstanceRef.current && moduleInstanceRef.current.exit) {
      try {
        moduleInstanceRef.current.exit();
      } catch (err) {
        console.error("Error stopping program:", err);
      }
    }
    setIsRunning(false);
    setGraphicsActive(false);
    appendOutput("\n> Program stopped by user.\n");
  };

  return (
    <div className="os-demo w-full max-w-[1024px] text-gray-100">
      {/* Resolution Warning - only shows on small screens */}
      <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded-md text-yellow-300 hidden max-[1024px]:block">
        <strong>Note:</strong> This demo is optimized for screens 1024x700 or larger. You may need to scroll or zoom out.
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-2 items-center">
        <button
          onClick={runWasm}
          disabled={!wasmReady || isRunning}
          className={`px-4 py-1.5 font-medium rounded-md border ${!wasmReady || isRunning
            ? "bg-gray-800 text-gray-500 border-gray-700"
            : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
            }`}
        >
          {isRunning ? "Running..." : "Run"}
        </button>
        <button
          onClick={stopProgram}
          disabled={!isRunning}
          className={`px-4 py-1.5 font-medium rounded-md border ${!isRunning
            ? "bg-gray-800 text-gray-500 border-gray-700"
            : "bg-red-600 hover:bg-red-500 text-white border-red-500"
            }`}
        >
          Stop
        </button>
        <button
          onClick={clearTerminal}
          disabled={isRunning}
          className={`px-4 py-1.5 font-medium rounded-md border ${isRunning
            ? "bg-gray-800 text-gray-500 border-gray-700"
            : "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
            }`}
        >
          Clear
        </button>
        {isRunning && (
          <>
            <div className="h-6 w-px bg-gray-700" />
            <select
              onChange={handleRecipeSelect}
              className="px-4 py-1.5 font-medium rounded-md border bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 focus:outline-none focus:border-gray-400"
            >
              {RECIPES.map((recipe, i) => (
                <option key={i} value={recipe.command}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`px-4 py-1.5 font-medium rounded-md border ${activeTab === "terminal"
            ? "text-white bg-sky-600 border-sky-500"
            : "text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700 hover:text-white"
            }`}
        >
          Terminal
        </button>
        <button
          onClick={() => setActiveTab("graphics")}
          className={`px-4 py-1.5 font-medium rounded-md border flex items-center gap-2 ${activeTab === "graphics"
            ? "text-white bg-sky-600 border-sky-500"
            : "text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700 hover:text-white"
            }`}
        >
          <span>Graphics</span>
          {graphicsActive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Container - fixed dimensions to match canvas */}
      <div className="relative w-full" style={{ minHeight: "700px" }}>
        {/* Terminal Tab */}
        <div className={activeTab === "terminal" ? "flex flex-col w-full" : "hidden"}>
          <pre
            id="terminal"
            ref={terminalRef}
            className="w-full h-64 p-4 bg-black border border-gray-600 rounded-md font-mono text-sm text-white overflow-auto whitespace-pre-wrap"
            style={{
              fontFamily: "Courier New, monospace",
            }}
          >
            {output || '> Ready. Click "Run" to start the OS.\n'}
          </pre>

          {/* Input Field */}
          {isRunning && (
            <div className="w-full mt-4 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleInputSubmit();
                  }
                }}
                placeholder="Type command and press Enter..."
                className="flex-1 px-4 py-2 bg-black border border-gray-600 rounded-md font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                style={{
                  fontFamily: "Courier New, monospace",
                }}
              />
              <button
                onClick={handleInputSubmit}
                className="px-4 py-1.5 font-medium rounded-md border bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
              >
                Send
              </button>
            </div>
          )}
        </div>

        {/* Graphics Tab */}
        <div
          className={`relative ${activeTab === "graphics" ? "inline-block" : "hidden"}`}
        >
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onFocus={() => setCanvasFocused(true)}
            onBlur={() => setCanvasFocused(false)}
            width={1024}
            height={700}
            className={`border rounded-md bg-black outline-none transition-all ${canvasFocused
              ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              : "border-gray-600"
              }`}
            style={{
              imageRendering: "pixelated",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {/* Focus overlay - shown when canvas is not focused */}
          {isRunning && !canvasFocused && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-md"
              onClick={() => canvasRef.current?.focus()}
            >
              <span className="text-white text-sm font-medium px-4 py-2 bg-black/80 rounded border border-gray-600">
                Click to capture keyboard (Tab to release)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
