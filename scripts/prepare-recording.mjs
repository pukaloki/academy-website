// Run locally; never transcode on the production micro VM.
import {spawnSync} from 'node:child_process';
import {realpathSync,existsSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
const [input,output]=process.argv.slice(2);
if(!input||!output||!output.endsWith('.mp4'))throw Error('Usage: node scripts/prepare-recording.mjs input.mp4 /private/output.mp4');
const publicRoot=realpathSync(new URL('../public',import.meta.url));
const outputDir=realpathSync(dirname(resolve(output)));
if(outputDir===publicRoot||outputDir.startsWith(publicRoot+sep))throw Error('Recorded lessons must not be placed in public/.');
if(existsSync(output))throw Error('Output already exists; choose a new file.');
const result=spawnSync('ffmpeg',['-hide_banner','-n','-i',resolve(input),'-map','0:v:0','-map','0:a:0?','-vf',"scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-c:v','libx264','-preset','medium','-crf','23','-maxrate','1800k','-bufsize','3600k','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',resolve(output)],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
