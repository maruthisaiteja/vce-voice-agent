import {database,uid,now,runtime,log,redact} from './store';
import {departmentNames} from './policy';
export function recipientCurrent(row:any,at=Date.now()){
 const verified=Date.parse(row?.verified_at??''),expires=Date.parse(row?.verified_until??'');
 return !!row?.email&&!!row?.verified_by&&Number.isFinite(verified)&&verified<=at&&Number.isFinite(expires)&&expires>at;
}
export async function prepareEmail(input:{requestId:string;callId?:string|null;department:string;summary:string;replyTo:string;consent:boolean;confirmed:boolean},actor:string){
 if(!input.consent||!input.confirmed)throw new Error('Confirm the department, summary and callback email with the caller and obtain consent first');
 const db=database();const existing=await db.prepare('SELECT * FROM email_outbox WHERE request_id=?').bind(input.requestId).first();
 if(existing){if(existing.department!==input.department||existing.reply_to!==input.replyTo||existing.body!==`Caller-authorised request\nDepartment: ${departmentNames[input.department]}\n\n${redact(input.summary)}\n\nCallback email: ${input.replyTo||'Not supplied'}\n\nPrepared by Campus Desk AI. This is a request, not an approved college decision.`)throw new Error('This request ID already belongs to a different email');return {id:existing.id,status:existing.status,reply:'That email request is already saved. It has not been sent again.'};}
 if(input.callId){const c=await db.prepare('SELECT status FROM calls WHERE id=?').bind(input.callId).first();if(!c||c.status!=='active')throw new Error('An active call is required');}
 const directory=await db.prepare('SELECT * FROM email_directory WHERE id=?').bind(input.department).first();if(!directory)throw new Error('Unknown department');
 const verified=recipientCurrent(directory);
 const id=uid(),subject=`College enquiry — ${departmentNames[input.department]}`;
 const body=`Caller-authorised request\nDepartment: ${departmentNames[input.department]}\n\n${redact(input.summary)}\n\nCallback email: ${input.replyTo||'Not supplied'}\n\nPrepared by Campus Desk AI. This is a request, not an approved college decision.`;
 const inserted=await db.prepare('INSERT INTO email_outbox (id,request_id,call_id,department,recipient,recipient_name,subject,body,reply_to,consent,status,detail,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?) ON CONFLICT(request_id) DO NOTHING RETURNING id').bind(id,input.requestId,input.callId??null,input.department,verified?directory.email:'',directory.recipient_name,subject,body,input.replyTo,verified?'draft':'recipient_needed',verified?'Awaiting staff review and SMTP configuration':'Department email must be verified before sending',now(),now()).first();
 if(!inserted)return prepareEmail(input,actor);
 await log(actor,'email.prepared',id,input.department);
 return {id,status:verified?'draft':'recipient_needed',reply:'I’ve prepared your department email. It is saved for review and has not been sent.'};
}
export async function sendDepartmentEmail(id:string,actor:string){
 if(!actor.startsWith('staff:'))throw new Error('Staff review is required before sending');
 const db=database(),row=await db.prepare('SELECT * FROM email_outbox WHERE id=?').bind(id).first();if(!row)throw new Error('Email draft not found');
 if(['sending','sent','uncertain','failed'].includes(String(row.status)))return {status:row.status,reply:'This message has already been attempted. Check its recorded outcome before taking another action.'};
 const directory=await db.prepare('SELECT * FROM email_directory WHERE id=?').bind(row.department).first();
 if(!recipientCurrent(directory))throw new Error('Verify the department recipient first; verification is missing or expired');
 if(!row.reviewed_by||row.recipient_verified_at!==directory!.verified_at)throw new Error('Staff must review this draft against the current recipient verification');
 if(row.recipient!==directory!.email||row.recipient_name!==directory!.recipient_name)throw new Error('The recipient changed. Prepare a new reviewed draft for the verified address');
 if(!row.consent)throw new Error('Caller consent is required');
 const url=runtime().SMTP_ADAPTER_URL,token=runtime().SMTP_ADAPTER_TOKEN;
 if(!url||!token)return {status:'not_sent',reply:'SMTP is not configured. Your email remains saved and unsent.'};
 if(!url.startsWith('https://'))throw new Error('SMTP adapter requires HTTPS');
 // Atomic claim prevents concurrent send clicks. Never retry an ambiguous outcome.
 const claim=await db.prepare("UPDATE email_outbox SET status='sending',updated_at=? WHERE id=? AND status='draft' AND body=? AND subject=? AND reviewed_by=? AND EXISTS (SELECT 1 FROM email_directory d WHERE d.id=email_outbox.department AND d.email=email_outbox.recipient AND d.verified_at=email_outbox.recipient_verified_at AND d.verified_until>?) RETURNING id").bind(now(),id,row.body,row.subject,row.reviewed_by,now()).first();
 if(!claim)return {status:'not_sent',reply:'This draft is not ready to send. Prepare a new draft after recipient verification.'};
 let status='uncertain',detail='Delivery outcome is uncertain. Staff must check the sender mailbox before retrying.';
 try{const res=await fetch(url.replace(/\/$/,'')+'/email/send',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,'Idempotency-Key':id},body:JSON.stringify({id,to:row.recipient,subject:row.subject,body:row.body,replyTo:row.reply_to}),signal:AbortSignal.timeout(25000)});
  if(res.ok){const data:any=await res.json();if(data.status==='sent'){status='sent';detail='SMTP server accepted the email; inbox delivery is not confirmed.';}else if(data.status==='not_configured'||data.status==='failed'){status='failed';detail='SMTP did not accept this email. Review the gateway before retrying.';}}
 }catch{}
 await db.prepare('UPDATE email_outbox SET status=?,detail=?,updated_at=?,sent_at=? WHERE id=?').bind(status,detail,now(),status==='sent'?now():null,id).run();await log(actor,'email.'+status,id,String(row.department));return {status,reply:status==='sent'?'The SMTP server accepted the email. Inbox delivery is not confirmed.':detail};
}
