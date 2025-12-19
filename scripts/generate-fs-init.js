#!/usr/bin/env node

/**
 * Generate TypeScript code to initialize the WASM filesystem with files from otium/os/fs-in
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FS_IN_DIR = path.join(__dirname, '..', 'otium', 'os', 'fs-in');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'lib', 'wasm-filesystem-init.ts');

function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function generateInit() {
  const files = [];

  function scanDir(dirPath, virtualPath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const vPath = virtualPath + '/' + entry.name;

      if (entry.isDirectory()) {
        scanDir(fullPath, vPath);
      } else if (entry.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        files.push({
          path: vPath,
          content: content,
        });
      }
    }
  }

  scanDir(FS_IN_DIR);

  // Generate TypeScript code
  const code = `/**
 * Auto-generated filesystem initialization
 *
 * Generated from otium/os/fs-in directory
 * Run 'just update-fs-init' to regenerate
 */

export interface FsInitFile {
  path: string;
  content: string;
}

export const FS_INIT_FILES: FsInitFile[] = [
${files.map(f => `  {
    path: ${JSON.stringify(f.path)},
    content: \`${escapeString(f.content)}\`,
  }`).join(',\n')}
];
`;

  return code;
}

// Generate and write
const code = generateInit();
fs.writeFileSync(OUTPUT_FILE, code, 'utf8');
console.log(`Generated ${OUTPUT_FILE} with ${code.match(/path:/g).length} files`);
