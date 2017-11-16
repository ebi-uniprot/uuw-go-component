import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import sass from 'rollup-plugin-sass';

export default {
    entry : 'src/main.js',
    format : 'iife',
    moduleName : 'GoVis',
    dest : 'dist/uuw-go-component.js',
    sourceMap : true,
    plugins : [
        sass({insert: true}),
        resolve({jsnext: true, main: true}),
        babel({exclude: 'node_modules/**'})
    ]
};