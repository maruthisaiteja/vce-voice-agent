import {createClient} from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw new Error('Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before deploying.');
const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
await client.execute('CREATE TABLE IF NOT EXISTS campus_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
for(const name of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){
 const transaction=await client.transaction('write');
 try {const applied=await transaction.execute({sql:'SELECT name FROM campus_migrations WHERE name=?',args:[name]});if(!applied.rows.length){const sql=fs.readFileSync(path.join('drizzle',name),'utf8');for(const statement of sql.split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))await transaction.execute(statement);await transaction.execute({sql:'INSERT INTO campus_migrations (name,applied_at) VALUES (?,?)',args:[name,new Date().toISOString()]});console.log('Applied',name);}await transaction.commit();}catch(e){await transaction.rollback();throw e;}finally{transaction.close();}
}
client.close();
