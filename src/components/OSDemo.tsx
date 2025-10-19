import { useState, useRef, useEffect } from 'react'

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
  const moduleInstanceRef = useRef<any>(null);
  const outputBufferRef = useRef<string[]>([]);
  const inputBufferRef = useRef<number[]>([]);
  const terminalRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Emscripten module on mount
  useEffect(() => {
    let mounted = true;

    async function loadEmscriptenModule() {
      try {
        setError(null);

        // Check if the script is already loaded
        if (!window.OtiumOS) {
          // Create script element to load the Emscripten JS module
          const script = document.createElement('script');
          script.src = '/os-wasm/kernel.js';
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load kernel.js'));
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
      const Module = {
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
    </div>
  )
}
