// The 2025 language demo. Ported from the old site's React component
// (src/components/LangDemo.tsx at a113618).

import { Lexer } from './lang/lexer';
import { Parser } from './lang/parser';
import { translateString } from './lang/translate';
import { EofValue, type OtExpr } from './lang/values';

type Mode = 'lex' | 'parse' | 'translate' | 'eval';

const EXAMPLE = `
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

const LABELS: Record<Mode, { button: string; output: string; placeholder: string }> = {
  lex: { button: 'Tokenize', output: 'Lexer output', placeholder: 'Lexer tokens will appear here…' },
  parse: { button: 'Parse', output: 'Parser output', placeholder: 'Parse tree will appear here…' },
  translate: { button: 'Translate', output: 'JavaScript output', placeholder: 'JavaScript code will appear here…' },
  eval: { button: 'Run', output: 'Terminal output', placeholder: 'Console output will appear here…' },
};

// Translated programs run in a worker with console output sent back here.
const WORKER = `
const send = (type) => (...args) => postMessage({ type, args: args.map(String) });
console.log = send('log');
console.warn = send('warn');
console.error = send('error');
self.onmessage = (e) => {
  try {
    (0, eval)(e.data);
  } catch (error) {
    postMessage({ type: 'error', args: [String(error)] });
  }
  postMessage({ type: 'done' });
};
`;

export function startLangDemo(root: HTMLElement) {
  const source = root.querySelector<HTMLTextAreaElement>('[data-source]')!;
  const output = root.querySelector<HTMLTextAreaElement>('[data-output]')!;
  const outputLabel = root.querySelector<HTMLElement>('[data-output-label]')!;
  const button = root.querySelector<HTMLButtonElement>('[data-process]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-mode]')];

  let mode: Mode = 'eval';
  let worker: Worker | null = null;
  source.value = EXAMPLE;

  function setMode(next: Mode) {
    mode = next;
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    button.textContent = LABELS[mode].button;
    outputLabel.textContent = LABELS[mode].output;
    output.placeholder = LABELS[mode].placeholder;
  }

  // A fresh worker per run, so a program that never finishes can be replaced.
  function evaluate(code: string) {
    worker?.terminate();
    const url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
    const current = new Worker(url);
    URL.revokeObjectURL(url);
    worker = current;
    const lines: string[] = [];
    output.value = '';
    current.onmessage = (e) => {
      if (e.data.type === 'done') {
        current.terminate();
        return;
      }
      lines.push((e.data.type === 'error' ? 'Error: ' : '') + e.data.args.join(' '));
      output.value = lines.join('\n');
    };
    current.postMessage(code);
  }

  function process() {
    try {
      const text = source.value;
      if (mode === 'lex') {
        output.value = JSON.stringify(new Lexer(text, 'demo').tokenize(), null, 2);
      } else if (mode === 'parse') {
        const parser = new Parser(new Lexer(text, 'demo'));
        const expressions: OtExpr[] = [];
        for (;;) {
          const [, exp] = parser.nextExpr();
          if (exp === EofValue) break;
          expressions.push(exp);
        }
        output.value = JSON.stringify(expressions, null, 2);
      } else if (mode === 'translate') {
        output.value = translateString(text, 'input');
      } else {
        evaluate(translateString(text, 'input'));
      }
    } catch (error) {
      output.value = `Error: ${error}`;
    }
  }

  for (const tab of tabs) tab.addEventListener('click', () => setMode(tab.dataset.mode as Mode));
  button.addEventListener('click', process);
  setMode('eval');
}
