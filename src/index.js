'use strict';
/**
 * jsx-to-html SDK
 *
 * Converts a React JSX/TSX file (Tailwind CSS + lucide-react) into a single
 * standalone HTML file that runs fully offline in any browser.
 *
 * @example
 * const { convert } = require('jsx-to-html');
 * await convert('slides.jsx');
 * await convert('slides.jsx', 'out/slides.html', { title: 'My Slides', minify: true });
 */

const esbuild = require('esbuild');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Resolve package node_modules so esbuild can find React etc. from a temp dir
const PKG_NODE_MODULES = path.join(__dirname, '..', 'node_modules');

/**
 * Convert a React JSX/TSX file into a single standalone offline HTML file.
 *
 * @param {string}  inputFile              Path to the source .jsx / .tsx file
 * @param {string}  [outputFile]           Output .html path (defaults to same dir, .html ext)
 * @param {object}  [options]
 * @param {string}  [options.title]        Override the HTML <title> tag
 * @param {boolean} [options.minify=true]  Minify the JS bundle
 * @param {boolean} [options.verbose=true] Print progress to stdout
 * @returns {Promise<{ outputFile: string, sizeKb: string }>}
 */
async function convert(inputFile, outputFile, options = {}) {
    const { title: titleOverride, minify = true, verbose = true } = options;

    inputFile = path.resolve(inputFile);
    outputFile = outputFile
        ? path.resolve(outputFile)
        : inputFile.replace(/\.(jsx?|tsx?)$/, '.html');

    if (!fs.existsSync(inputFile)) {
        throw new Error(`File not found: ${inputFile}`);
    }

    const log = verbose ? (...a) => console.log(...a) : () => { };
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsx-to-html-'));

    try {
        // ── 1. Bundle JS ──────────────────────────────────────────────────────────
        const entryFile = path.join(tmpDir, 'entry.jsx');
        fs.writeFileSync(entryFile, [
            `import React from 'react';`,
            `import { createRoot } from 'react-dom/client';`,
            `import App from '${inputFile.replace(/\\/g, '/')}';`,
            `createRoot(document.getElementById('root')).render(<App />);`,
        ].join('\n'));

        log('🔧  Bundling JS…');
        const bundle = await esbuild.build({
            entryPoints: [entryFile],
            bundle: true,
            write: false,
            format: 'iife',
            target: ['es2020'],
            minify,
            jsx: 'automatic',
            loader: { '.jsx': 'jsx', '.js': 'jsx', '.ts': 'ts', '.tsx': 'tsx' },
            nodePaths: [PKG_NODE_MODULES],
        });

        const js = Buffer.from(bundle.outputFiles[0].contents).toString();

        // ── 2. Generate scoped Tailwind CSS ───────────────────────────────────────
        log('🎨  Generating Tailwind CSS…');
        const rawSource = fs.readFileSync(inputFile, 'utf8');
        const cssInput = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';

        const cssResult = await postcss([
            tailwindcss({
                content: [{ raw: rawSource, extension: 'jsx' }],
                theme: { extend: {} },
                plugins: [],
            }),
            autoprefixer(),
        ]).process(cssInput, { from: undefined });

        const css = cssResult.css;

        // ── 3. Assemble HTML ──────────────────────────────────────────────────────
        const title = titleOverride
            ?? path.basename(inputFile, path.extname(inputFile)).replace(/[_-]/g, ' ');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
${css.split('\n').map(l => '    ' + l).join('\n')}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>${js}</script>
</body>
</html>`;

        fs.writeFileSync(outputFile, html, 'utf8');
        const sizeKb = (fs.statSync(outputFile).size / 1024).toFixed(1);
        log(`✅  Done! ${outputFile}  (${sizeKb} KB)`);
        log('    Open the file in any browser — no internet needed.');

        return { outputFile, sizeKb };

    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

module.exports = { convert };
