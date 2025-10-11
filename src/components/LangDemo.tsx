import { useState } from 'react'

import { Lexer } from '../../otium/lang/lexer';
import { Parser } from '../../otium/lang/parser';
import { translateString, PRELUDE } from '../../otium/lang/translate';
import { EofValue } from '../../otium/lang/values';

type DemoMode = 'lex' | 'parse' | 'translate';

export default function DemoApp() {
  const [source, setSource] = useState('print("hello world")');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<DemoMode>('translate');

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
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'lex': return 'Tokenize';
      case 'parse': return 'Parse';
      case 'translate': return 'Translate';
    }
  };

  const getOutputPlaceholder = () => {
    switch (mode) {
      case 'lex': return 'Lexer tokens will appear here...';
      case 'parse': return 'Parse tree will appear here...';
      case 'translate': return 'JavaScript code will appear here...';
    }
  };

  return (
    <div className="min-w-[50vw] text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Otium Language Demo</h1>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {(['lex', 'parse', 'translate'] as const).map((modeOption) => (
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