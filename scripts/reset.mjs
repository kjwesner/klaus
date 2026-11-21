import {rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {dataDir} from '../lib/location.mjs';
if(!process.argv.includes('--confirm-local-demo')){console.error('Stop the server, then run: node scripts/reset.mjs --confirm-local-demo');process.exit(1);}
for(const file of ['prototype.sqlite','prototype.sqlite-shm','prototype.sqlite-wal'])rmSync(resolve(dataDir,file),{force:true});
console.log('Local demo database removed. It will be seeded on next launch.');
