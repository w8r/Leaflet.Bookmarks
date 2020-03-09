import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import buble from '@rollup/plugin-buble';
import { terser } from 'rollup-plugin-terser';

import { version, author, license, description } from './package.json';

const moduleName = 'L.Control.Bookmarks';

const banner = `\
/**
 * ${moduleName} v${version}
 * ${description}
 *
 * @author ${author}
 * @license ${license}
 * @preserve
 */
`;

export default [{
  external: ['leaflet'],
  input: './index.js',
  output: {
    file: `dist/${moduleName}.js`,
    name: moduleName,
    sourcemap: true,
    format: 'umd',
    banner,
    globals: { 'leaflet': 'L' }
  },
  plugins: [resolve(), commonjs(), buble()]
}, {
  external: ['leaflet'],
  input: './index.js',
  output: {
    file: `dist/${moduleName}.min.js`,
    name: moduleName,
    sourcemap: true,
    format: 'umd',
    banner,
    globals: { 'leaflet': 'L' }
  },
  plugins: [resolve(), commonjs(), buble(), terser()]
}, {
  input: './examples/app.js',
  output: {
    file: `examples/bundle.js`,
    name: moduleName,
    sourcemap: true,
    format: 'iife',
    banner
  },
  plugins: [resolve(), commonjs()]
}];
