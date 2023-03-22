import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import buble from "@rollup/plugin-buble";
import { terser } from "rollup-plugin-terser";

import { version, author, license, description } from "./package.json";

const moduleName = "L.Control.Bookmarks";

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

export default [
  {
    external: ["leaflet"],
    input: "./index.js",
    output: {
      file: `dist/index.js`,
      name: moduleName,
      sourcemap: true,
      format: "umd",
      banner,
      globals: { leaflet: "L" },
    },
    plugins: [resolve(), commonjs(), buble()],
  },
  {
    external: ["leaflet"],
    input: "./index.js",
    output: {
      file: `dist/index.min.js`,
      name: moduleName,
      sourcemap: true,
      format: "umd",
      banner,
      globals: { leaflet: "L" },
    },
    plugins: [resolve(), commonjs(), buble(), terser()],
  },
  {
    external: ["leaflet"],
    input: "./index.js",
    output: {
      file: `dist/index.mjs`,
      name: moduleName,
      sourcemap: true,
      format: "esm",
      banner,
      globals: { leaflet: "L" },
    },
    plugins: [resolve(), commonjs(), buble()],
  },
  {
    input: "./docs/app.js",
    output: {
      file: `docs/bundle.js`,
      name: moduleName,
      sourcemap: true,
      format: "iife",
      banner,
    },
    plugins: [resolve(), commonjs()],
  },
];
