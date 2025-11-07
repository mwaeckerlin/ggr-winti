import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto'
      }),
      typescript({ tsconfig: './tsconfig.json' })
    ],
    external: ['class-validator', 'class-transformer']
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs({
        transformMixedEsModules: true,
        requireReturnsDefault: 'auto'
      }),
      typescript({ tsconfig: './tsconfig.json' })
    ],
    external: ['class-validator', 'class-transformer']
  }
] 