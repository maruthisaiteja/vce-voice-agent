import nodemailer from 'nodemailer';
export const smtpConfigured=()=>Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS&&process.env.SMTP_FROM);
export async function deliverMail(message:{id:string;to:string;subject:string;body:string;replyTo:string}){
 const port=Number(process.env.SMTP_PORT||587);
 if(![465,587].includes(port))throw new Error('SMTP requires a TLS port');
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000});
 try{const result=await transport.sendMail({from:process.env.SMTP_FROM,to:message.to,subject:message.subject,text:message.body,...(message.replyTo?{replyTo:message.replyTo}:{}),headers:{'X-Campus-Request-ID':message.id},disableFileAccess:true,disableUrlAccess:true});return result.accepted.length>0&&result.rejected.length===0;}finally{transport.close();}
}
