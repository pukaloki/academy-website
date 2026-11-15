import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const target=resolve('output/deployment/release');
await rm(target,{recursive:true,force:true});
await mkdir(`${target}/public/assets`,{recursive:true});
for(const file of ['server.mjs','lib','config']) await cp(file,`${target}/${file}`,{recursive:true});
for(const file of ['app.js','motion.js','styles.css','fonts.css','motion.css','editorial.css','animations.css']) await cp(`public/${file}`,`${target}/public/${file}`);
await cp('public/assets',`${target}/public/assets`,{recursive:true});
await writeFile(`${target}/package.json`,JSON.stringify({name:'shortcut-academy-production',version:'1.0.0',private:true,type:'module',engines:{node:'>=22.13.0'},scripts:{start:'node server.mjs'},dependencies:{'google-auth-library':'11.1.0'}},null,2)+'\n');
console.log(`Production files staged at ${target}. No credentials, databases, reference projects, or development dependencies included.`);
