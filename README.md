# canvas-to-html

Convert a React canvas JSX file (Tailwind CSS + lucide-react) into a single standalone HTML file that runs **fully offline** in any browser — no server, no build step on the viewer's machine.

## Install

```bash
npm install -g canvas-to-html
```

Or use locally inside a project:

```bash
npm install --save-dev canvas-to-html
```

## CLI

```bash
canvas-to-html <input.jsx> [output.html] [options]
```

| Option | Description |
|---|---|
| `--title <text>` | Override the HTML `<title>` tag |
| `--no-minify` | Skip JS minification (useful for debugging) |
| `--quiet`, `-q` | Suppress progress output |
| `--help`, `-h` | Show help |

**Examples:**

```bash
# Output next to the source file (slides.html)
canvas-to-html slides.jsx

# Custom output path and title
canvas-to-html slides.jsx dist/slides.html --title "AI Governance 2026"

# Unminified output, silent
canvas-to-html slides.jsx --no-minify --quiet
```

## SDK

```js
const { convert } = require('canvas-to-html');

// Minimal — output written next to the source file
await convert('slides.jsx');

// Full options
const { outputFile, sizeKb } = await convert(
  'slides.jsx',
  'dist/slides.html',
  {
    title:   'AI Governance 2026', // overrides <title>
    minify:  true,                 // default: true
    verbose: false,                // suppress console output
  }
);

console.log(`Written to ${outputFile} (${sizeKb} KB)`);
```

### Return value

```ts
{
  outputFile: string,  // absolute path to the generated HTML
  sizeKb: string       // file size in KB, e.g. "264.4"
}
```

## How it works

| Step | Tool | What |
|---|---|---|
| 1 | **esbuild** | Bundles JSX + React + lucide-react into a minified `<script>` |
| 2 | **Tailwind CSS v3** | Scans the source for class names, generates only the CSS that is actually used |
| 3 | Assembly | Inlines both into a single `.html` file with zero external dependencies |

## Requirements

- Node.js ≥ 18
- JSX file must `export default` a React component

## Releasing (maintainers)

```bash
# Bump version, create git tag, push → GitHub Actions publishes to npm
npm version patch   # or minor / major
git push && git push --tags
```
