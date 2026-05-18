#!/usr/bin/env node
'use strict';
/**
 * canvas-to-html CLI
 *
 * Usage:
 *   canvas-to-html <input.jsx> [output.html] [options]
 *
 * Options:
 *   --title <text>   Override the HTML <title> tag
 *   --no-minify      Skip JS minification (useful for debugging)
 *   --quiet, -q      Suppress progress output
 *   --help,  -h      Show this help
 */

const { convert } = require('./index');

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const positional = [];
const options = {};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
    } else if (arg === '--no-minify') {
        options.minify = false;
    } else if (arg === '--quiet' || arg === '-q') {
        options.verbose = false;
    } else if (arg === '--title') {
        if (!args[i + 1]) { die('--title requires a value'); }
        options.title = args[++i];
    } else if (arg.startsWith('--')) {
        die(`Unknown option: ${arg}`);
    } else {
        positional.push(arg);
    }
}

const [inputArg, outputArg] = positional;

if (!inputArg) {
    printHelp();
    process.exit(1);
}

// ── Run ───────────────────────────────────────────────────────────────────────
convert(inputArg, outputArg, options).catch(err => {
    die(err.message);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function printHelp() {
    console.log(`
canvas-to-html — Convert React canvas JSX files to a single offline HTML file

Usage:
  canvas-to-html <input.jsx> [output.html] [options]

Options:
  --title <text>   Override the HTML <title> tag
  --no-minify      Skip JS minification (useful for debugging)
  --quiet, -q      Suppress progress output
  --help, -h       Show this help

Examples:
  canvas-to-html slides.jsx
  canvas-to-html slides.jsx dist/slides.html --title "AI Governance 2026"
  jsx-to-html slides.jsx --no-minify --quiet
`.trim());
}

function die(msg) {
    console.error(`❌  ${msg}`);
    process.exit(1);
}
