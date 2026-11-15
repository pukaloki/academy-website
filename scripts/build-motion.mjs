import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await build({entryPoints:['src/hero-three.js'],bundle:true,format:'esm',minify:true,target:['es2020'],outfile:'public/assets/hero-three.js',legalComments:'eof'});
await mkdir('public/assets/licenses',{recursive:true});
await copyFile('node_modules/three/LICENSE','public/assets/licenses/three.txt');
console.log('Custom Three.js hero bundled.');
