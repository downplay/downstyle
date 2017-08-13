import babel from "rollup-plugin-babel";
import babelrc from "babelrc-rollup";
import commonjs from "rollup-plugin-commonjs";

import pkg from "./package.json";

const plugins = [babel(babelrc({ addModuleOptions: false }))];

export default [
    // browser-friendly UMD build
    {
        entry: "source/index.js",
        dest: pkg.browser,
        format: "umd",
        moduleName: "downstyle",
        external: ["react"],
        globals: {
            react: "React"
        },
        plugins: [commonjs()].concat(plugins)
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
