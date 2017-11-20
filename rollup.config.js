import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import minify from 'rollup-plugin-babel-minify';
import conditional from "rollup-plugin-conditional";
import sass from 'rollup-plugin-sass';
import copy from 'rollup-plugin-copy';

const isProduction = process.env.NODE_ENV === "production";

export default {
    input : 'src/main.js',
    name : 'UuwGoComponent',
    sourcemap : true,
    output : {
        file: 'dist/uuw-go-component.js',
        format: 'iife'
    },
    plugins : [
        sass({insert: true}),
        nodeResolve({jsnext: true}),
        babel({exclude: 'node_modules/**'}),
        conditional(isProduction, [minify()]),
        copy({"node_modules/babel-polyfill/dist/polyfill.min.js": "dist/polyfill.min.js", "node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js": "dist/custom-elements-es5-adapter.js", "node_modules/@webcomponents/webcomponentsjs/webcomponents-lite.js": "dist/webcomponents-lite.js"})
    ]
};