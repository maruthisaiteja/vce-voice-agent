import {createClient, type Client, type InValue} from '@libsql/client';

let client: Client | undefined;
function connection() {
 if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) throw new Error('Database connection is not configured');
 return client ??= createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
}
class Statement {
 constructor(readonly sql:string,readonly args:InValue[]=[]){}
 bind(...args:unknown[]){return new Statement(this.sql,args as InValue[]);}
 async all(){const r=await connection().execute({sql:this.sql,args:this.args});return {results:r.rows,success:true,meta:{changes:r.rowsAffected}};}
 async first<T=Record<string,unknown>>(column?:string):Promise<T|null>{const r=await this.all();return (column?r.results[0]?.[column]:r.results[0]) as T??null;}
 async run(){return this.all();}
}
const db={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){const results=await connection().batch(statements.map(s=>({sql:s.sql,args:s.args})),'write');return results.map(r=>({results:r.rows,success:true,meta:{changes:r.rowsAffected}}));}};
// Preserve the small D1-shaped repository API while using durable remote SQLite.
export function runtime(){return {...process.env,DB:db as unknown as D1Database,RECORDINGS:undefined} as Cloudflare.Env;}
