
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {isAbsolute,resolve} from 'node:path';
const key=createHash('sha256').update(resolve('.')).digest('hex').slice(0,16);
const custom=process.env.DEMO_DATA_DIR;
if(custom&&!isAbsolute(custom))throw new Error('DEMO_DATA_DIR must be absolute');
export const dataDir=custom||resolve(process.env.LOCALAPPDATA||resolve(homedir(),'.local','share'),'KlausConcept',key);

