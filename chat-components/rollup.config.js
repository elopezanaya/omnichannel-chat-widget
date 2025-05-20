import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/index.ts",
        output: [
            {
                dir: "lib/esm",
                format: "esm",
                preserveModules: true,
                preserveModulesRoot: "src",
                exports: "named"
            },
            {
                dir: "lib/cjs",
                format: "cjs",
                preserveModules: true,
                preserveModulesRoot: "src",
                exports: "named"
            }
        ],
        external: ["globalize"], // this seems to be the trick to do not included globalize js AMD
        plugins: [
            resolve({ extensions: [".js", ".ts", ".tsx"] }),
            commonjs(),
            typescript(),
            babel({
                babelHelpers: "bundled",
                extensions: [".js", ".ts", ".tsx"],
                exclude: "node_modules/**"
            })
        ]
    }
];