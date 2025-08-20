
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'esm' ? '.js' : '.cjs',
  }),
  dts: true,
  minify: true,
  clean: true,
  target: 'es2017',
  // Optional: if you want sourcemaps
  sourcemap: true,
});