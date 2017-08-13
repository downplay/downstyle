import babel from "rollup-plugin-babel";
import babelrc from "babelrc-rollup";

import pkg from "./package.json";

// import resolve from "rollup-plugin-node-resolve";
// import commonjs from "rollup-plugin-commonjs";

const plugins = [babel(babelrc({ addModuleOptions: false }))];

export default [
    // browser-friendly UMD build
    {
        entry: "source/index.js",
        dest: pkg.browser,
        format: "umd",
        moduleName: "downstyle",
        plugins: plugins.concat(
            [
                // resolve(), // so Rollup can find `ms`
                // commonjs() // so Rollup can convert `ms` to an ES module
            ]
        )
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // the `targets` option which can specify `dest` and `format`)
    {
        entry: "source/index.js",
        external: ["react"],
        // external: ["ms"],
        targets: [
            { dest: pkg.main, format: "cjs" },
            { dest: pkg.module, format: "es" }
        ],
        plugins
    }
];
