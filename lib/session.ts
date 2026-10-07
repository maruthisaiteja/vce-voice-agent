import {SignJWT,jwtVerify} from 'jose';
export const sessionCookie='campus_staff';
function key(){const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error('Staff authentication is not configured');return new TextEncoder().encode(value);}
export async function createSession(){return new SignJWT({role:'staff'}).setProtectedHeader({alg:'HS256'}).setIssuer('campus-desk').setAudience('campus-staff').setSubject('administrator').setIssuedAt().setExpirationTime('8h').sign(key());}
export async function verifySession(token?:string){if(!token)return null;try{const {payload}=await jwtVerify(token,key(),{issuer:'campus-desk',audience:'campus-staff',algorithms:['HS256']});return payload.role==='staff'&&payload.sub==='administrator'?'staff:administrator':null;}catch{return null;}}
export async function equalSecret(a:string,b:string){const hash=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [x,y]=await Promise.all([hash(a),hash(b)]);let n=0;for(let i=0;i<x.length;i++)n|=x[i]^y[i];return n===0;}
