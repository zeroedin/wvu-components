#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { singleFileBuild } from '../lib/esbuild.js';

const external = [
  'lit*',
  'tslib',
];

function toExportStatements(acc = '', x) {
  return `${acc}\nexport * from '${x}';`;
}

export async function build(options) {
  const elements = await readdir(new URL('../src', import.meta.url));

  const entryPoints = elements.map(x =>
    fileURLToPath(new URL(`../src/${x}/${x}`, import.meta.url)));

    const additionalPackages = options?.additionalPackages ?? [];
    const componentsEntryPointContents =
    `${entryPoints.reduce(toExportStatements, '')}
${additionalPackages.reduce(toExportStatements, '')}`;

  console.log(componentsEntryPointContents);

  await singleFileBuild({
    componentsEntryPointContents,
    outfile: options?.outfile ?? 'wvu.min.js',
    allowOverwrite: true,
    external: external,
    minify: false,
    litCssOptions: {
      include: /src\/wvu-(.*)\/(.*)\.css$/,
      uglify: true,
    },
  });
}

const stripExtension = x => x.replace(/\.\w+$/, '');
const eqeqeq = (x, y) => x === y;

/* eslint-env node */
/** Was the module was run directly? */
const INVOKED_VIA_CLI = [process.argv[1], fileURLToPath(import.meta.url)]
  .map(stripExtension) // fun with functional programming
  .reduce(eqeqeq);

if (INVOKED_VIA_CLI) {
  console.log(import.meta.url);
  await build();
}
