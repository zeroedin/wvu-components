import type { Plugin } from 'esbuild';
import type { LitCSSOptions } from 'esbuild-plugin-lit-css';

import esbuild from 'esbuild';
import { litCssPlugin } from 'esbuild-plugin-lit-css';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals';
import { packageVersion } from './package-version.js';

import { fileURLToPath } from 'url';

/** best guess at abs-path to repo root */
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/node_modules\/$/, '');

export interface esbuildSingleFileOptions {
  /** list of NPM package names to bundle alongside the repo's components */
  additionalPackages?: string[];
  /** String contents of an entry point file for all elements to be bundled. Defaults to an entry point containing all installed pfe-* elements. */
  componentsEntryPointContents?: string;
  outfile?: string;
  litCssOptions?: LitCSSOptions;
  plugins?: Plugin[];
  minify?: boolean;
  external?: string[];
}

export interface basePluginOptions {
  minify?: boolean,
  litCssOptions?: LitCSSOptions;
}

/** Generate a temporary file containing namespace exports of all components */
export async function componentsEntryPoint(options?: { additionalPackages?: string[] }) {
  const additionalImports =
    options?.additionalPackages
      ?.reduce((acc, specifier) => `${acc}\nexport * from '${specifier}';`, '') ?? '';

  return additionalImports;
}

/**
 * The basic set of plugins that all esbuild jobs should apply
 * - Minify CSS
 * - optionally minify lit-html templates
 * - replace the package version in component sources
 */
export function getBasePlugins({ minify, litCssOptions }: basePluginOptions = {}): Plugin[] {
  return [
    // import css files as LitElement CSSResult objects
    litCssPlugin(litCssOptions ?? {
      filter: /\.css$/,
    }),
    ...!minify ? [] : [
      // minify lit-html templates
      minifyHTMLLiteralsPlugin(),
    ],
    // replace `{{version}}` with each package's version
    packageVersion(),
  ] as Plugin[];
}

/** Create a single-file production bundle of the elements */
export async function singleFileBuild(options?: esbuildSingleFileOptions) {
  try {
    const contents = options?.componentsEntryPointContents ??
      await componentsEntryPoint({ additionalPackages: options?.additionalPackages });
    const result = await esbuild.build({
      absWorkingDir: REPO_ROOT,
      allowOverwrite: true,
      bundle: true,
      stdin: {
        contents,
        resolveDir: REPO_ROOT,
        sourcefile: 'components.ts',
        loader: 'ts',
      },
      external: options?.external,
      format: 'esm',
      keepNames: true,
      legalComments: 'linked',
      logLevel: 'info',
      minify: options?.minify ?? true,
      minifyWhitespace: options?.minify ?? true,
      outfile: options?.outfile ?? 'component.min.js',
      sourcemap: true,
      treeShaking: true,
      watch: false,
      define: {
        // eslint-disable-next-line no-useless-escape
        'process.env.NODE_ENV': JSON.stringify( 'production' ),
      },
      plugins: [
        ...getBasePlugins(options),
        ...options?.plugins ?? [],
      ],
    });
    result.stop?.();
    return result.outputFiles?.map(x => x.path) ?? [];
  } catch {
    process.exit(1);
  }
}
