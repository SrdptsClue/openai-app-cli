#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetRoot = path.resolve(process.argv[2] || process.cwd());
const ignoredDirectories = new Set(['node_modules', '.git']);

function readDocLine(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).slice(0, 5);
  for (const line of lines) {
    const match = line.match(/DOC:\s*(.*)/);
    if (match) {
      return match[1].replace(/\*\/.*/, '').trim();
    }
  }
  return '';
}

function printTree(currentPath, depth) {
  const name = depth === 0 ? path.basename(currentPath) || currentPath : path.basename(currentPath);
  const indent = '  '.repeat(depth);
  if (depth === 0) {
    console.log(`${name}/`);
  } else {
    console.log(`${indent}${name}/`);
  }

  const entries = fs
    .readdirSync(currentPath, { withFileTypes: true })
    .filter((entry) => !ignoredDirectories.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry) => {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      printTree(fullPath, depth + 1);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const doc = readDocLine(fullPath);
      const lineIndent = '  '.repeat(depth + 1);
      const description = doc || '(未找到 DOC 注释)';
      console.log(`${lineIndent}- ${entry.name}: ${description}`);
    }
  });
}

printTree(targetRoot, 0);
