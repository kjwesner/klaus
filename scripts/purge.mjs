import {get,run,atomic,audit} from '../lib/db.mjs';
const days=Number(JSON.parse(get("SELECT value FROM settings WHERE key='retentionDays'").value));
if(!Number.isInteger(days)||days<1||days>365)throw Error('Invalid retention setting');
atomic(()=>{const applications=run("DELETE FROM applications WHERE created_at < datetime('now',?)",'-'+days+' days');const mail=run("DELETE FROM outbox WHERE created_at < datetime('now',?)",'-'+days+' days');audit(null,'retention',JSON.stringify({applications:applications.changes,outbox:mail.changes}));console.log('Removed expired applications and local outbox items.');});
