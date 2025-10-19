import { useState, useRef, useEffect } from 'react'

import { Lexer } from '../../otium/lang/lexer';
import { Parser } from '../../otium/lang/parser';
import { translateString, PRELUDE } from '../../otium/lang/translate';
import { EofValue } from '../../otium/lang/values';

type DemoMode = 'lex' | 'parse' | 'translate' | 'eval';

const EXAMPLE_PROGRAM = `
// fib.ot -- the simple recursive fibonacci calculator
fib := fn(n) {
  if(n < 2) {
    n
  } {
    fib(n - 1) + fib(n - 2)
  }
}

print(fib(10))
`.trim();

export default function DemoApp() {
  const [source, setSource] = useState(EXAMPLE_PROGRAM);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<DemoMode>('eval');
  const workerRef = useRef<Worker | null>(null);
  const outputBufferRef = useRef<string[]>([]);

  // Create web worker for eval mode
  useEffect(() => {
    const workerCode = `
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
      };

      console.log = function(...args) {
        postMessage({ type: 'log', args: args.map(a => String(a)) });
      };

      console.error = function(...args) {
        postMessage({ type: 'error', args: args.map(a => String(a)) });
      };

      console.warn = function(...args) {
        postMessage({ type: 'warn', args: args.map(a => String(a)) });
      };

      self.onmessage = function(e) {
        if (e.data.type === 'execute') {
          try {
            eval(e.data.code);
            postMessage({ type: 'done' });
          } catch (error) {
            postMessage({ type: 'error', args: [String(error)] });
          }
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    workerRef.current = worker;

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  const handleProcess = () => {
    try {
      const lexer = new Lexer(source, 'demo');

      if (mode === 'lex') {
        const tokens = lexer.tokenize();
        setOutput(JSON.stringify(tokens, null, 2));
      } else if (mode === 'parse') {
        const parser = new Parser(lexer);
        const expressions = [];
        let exp: any;

        while (true) {
          [, exp] = parser.nextExpr();
          if (exp === EofValue) {
            break;
          }
          expressions.push(exp);
        }

        setOutput(JSON.stringify(expressions, null, 2));
      } else if (mode === 'translate') {
        let exp: any;

        const result = translateString(source, 'input');

        console.log('result', result);



        setOutput(result);
      } else if (mode === 'eval') {
        const translatedCode = translateString(source, 'input');

        outputBufferRef.current = [];
        setOutput('');

        if (!workerRef.current) {
          setOutput('Error: Worker not initialized');
          return;
        }

        const worker = workerRef.current;

        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'log' || e.data.type === 'warn') {
            const line = e.data.args.join(' ');
            outputBufferRef.current.push(line);
            setOutput(outputBufferRef.current.join('\n'));
          } else if (e.data.type === 'error') {
            const line = 'Error: ' + e.data.args.join(' ');
            outputBufferRef.current.push(line);
            setOutput(outputBufferRef.current.join('\n'));
          } else if (e.data.type === 'done') {
            worker.removeEventListener('message', handleMessage);
          }
        };

        worker.addEventListener('message', handleMessage);
        worker.postMessage({ type: 'execute', code: translatedCode });
      }
    } catch (error) {
      setOutput(`Error: ${error}`);
    }
  };

  const getOutputLabel = () => {
    switch (mode) {
      case 'lex': return 'Lexer Output';
      case 'parse': return 'Parser Output';
      case 'translate': return 'JavaScript Output';
      case 'eval': return 'Terminal Output';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'lex': return 'Tokenize';
      case 'parse': return 'Parse';
      case 'translate': return 'Translate';
      case 'eval': return 'Run';
    }
  };

  const getOutputPlaceholder = () => {
    switch (mode) {
      case 'lex': return 'Lexer tokens will appear here...';
      case 'parse': return 'Parse tree will appear here...';
      case 'translate': return 'JavaScript code will appear here...';
      case 'eval': return 'Console output will appear here...';
    }
  };

  return (
    <div className="min-w-[50vw] text-gray-100">
      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          <button className="hidden" />
          {(['lex', 'parse', 'translate', 'eval'] as const).map((modeOption) => (
            <button
              key={modeOption}
              onClick={() => setMode(modeOption)}
              className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${mode === modeOption
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
            >
              {modeOption}
            </button>
          ))}
        </div>
      </div>

      {/* Source Code */}
      <div className="mb-6">
        <label htmlFor="source" className="block text-sm font-medium mb-2">
          Source Code
        </label>
        <textarea
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full h-48 p-3 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm"
          placeholder="Enter Otium code here..."
        />
        <button
          onClick={handleProcess}
          className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
        >
          {getButtonText()}
        </button>
      </div>

      {/* Output */}
      <div>
        <label htmlFor="output" className="block text-sm font-medium mb-2">
          {getOutputLabel()}
        </label>
        <textarea
          id="output"
          value={output}
          readOnly
          className="w-full h-48 p-3 bg-gray-800 border border-gray-600 rounded-md font-mono text-sm"
          placeholder={getOutputPlaceholder()}
        />
      </div>
    </div>
  )
}