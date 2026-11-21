
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {isAbsolute,resolve} from 'node:path';
const cloudflareRuntime=Boolean(globalThis.__KLAUS_CLOUDFLARE__);
const key=cloudflareRuntime?'cloudflare':createHash('sha256').update(resolve('.')).digest('hex').slice(0,16);
const custom=cloudflareRuntime?'':process.env.DEMO_DATA_DIR;
if(custom&&!isAbsolute(custom))throw new Error('DEMO_DATA_DIR must be absolute');
export const dataDir=cloudflareRuntime?'':custom||resolve(process.env.LOCALAPPDATA||resolve(homedir(),'.local','share'),'KlausConcept',key);

