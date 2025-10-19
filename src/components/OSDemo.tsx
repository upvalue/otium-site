import { useState, useRef, useEffect } from 'react'

export default function OSDemo() {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const wasmModuleRef = useRef<WebAssembly.Module | null>(null);
  const outputBufferRef = useRef<string[]>([]);
  const terminalRef = useRef<HTMLPreElement>(null);

  // Load WASM on mount
  useEffect(() => {
    let mounted = true;

    async function loadWasm() {
      try {
        setError(null);
        const response = await fetch('/os-wasm/kernel.elf.wasm');

        if (!response.ok) {
          throw new Error(`Failed to load WASM: ${response.status} ${response.statusText}`);
        }

        const wasmBinary = await response.arrayBuffer();
        const module = await WebAssembly.compile(wasmBinary);

        if (mounted) {
          wasmModuleRef.current = module;
          setWasmReady(true);
          appendOutput('WASM module loaded successfully.\nType "Run" to start the kernel.\n\n');
        }
      } catch (err) {
        if (mounted) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg);
          appendOutput(`Error loading WASM: ${errorMsg}\n`);
        }
      }
    }

    loadWasm();

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
    if (!wasmModuleRef.current) {
      setError('WASM module not loaded');
      return;
    }

    if (isRunning) {
      return;
    }

    setIsRunning(true);
    setError(null);
    appendOutput('> Starting kernel...\n');

    try {
      // Create host imports
      const imports = {
        env: {
          host_putchar: (charCode: number) => {
            const char = String.fromCharCode(charCode);
            appendOutput(char);
          },
          host_print: (ptr: number, len: number) => {
            if (!instance) return;
            const memory = instance.exports.memory as WebAssembly.Memory;
            const bytes = new Uint8Array(memory.buffer, ptr, len);
            const text = new TextDecoder().decode(bytes);
            appendOutput(text);
          },
          host_exit: () => {
            appendOutput('\n> Kernel exited.\n');
          },
          host_readln: () => {
            // Not implemented yet
            return 0;
          }
        }
      };

      // Instantiate the WASM module
      const instance = await WebAssembly.instantiate(wasmModuleRef.current, imports);

      // Check what's exported
      const exports = instance.exports as any;
      console.log(exports);

      if (typeof exports.kernel_enter === 'function') {
        appendOutput('> Calling kernel_enter()...\n\n');
        exports.kernel_enter();
        appendOutput('\n\n> Program completed.\n');
      } else {
        appendOutput('> No entry point found in WASM module\n');
        appendOutput('> Available exports: ' + Object.keys(exports).join(', ') + '\n');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      appendOutput(`\nError: ${errorMsg}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-w-[50vw] text-gray-100">
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
        {output || '> Ready. Click "Run" to start the OS kernel.\n'}
      </pre>
    </div>
  )
}
