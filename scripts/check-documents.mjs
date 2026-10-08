import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),mammothRequire=createRequire(require.resolve('mammoth')),Zip=mammothRequire('jszip');
const base=process.env.DESK_TEST_URL||'http://localhost:5175',origin=new URL(base).origin;
const login=await fetch(base+'/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({key:process.env.STAFF_LOGIN_KEY})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
const headers={cookie,Origin:origin};const ids=[];
async function json(r){const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;}
async function command(body){return json(await fetch(base+'/api/documents',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)}));}
assert.notEqual((await fetch(base+'/api/documents')).status,200);
const text='INTEGRATION TEST ONLY. The synthetic library desk opens at nine in the morning and closes at five in the evening. This is a test fixture, not college information.';
function pdf(){const stream=`BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let out='%PDF-1.4\n',offsets=[0];objects.forEach((v,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${v}\nendobj\n`;});const start=out.length;out+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return out;}
try{
 const zip=new Zip();zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');zip.file('word/document.xml',`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`);const docx=await zip.generateAsync({type:'nodebuffer'});
 for(const ext of ['txt','pdf','docx']){
  const form=new FormData();form.set('title','INTEGRATION TEST ONLY '+ext+' '+Date.now());form.set('department','general');form.set('effectiveFrom','2026-01-01');form.set('expiresOn','2099-01-01');form.set('file',new Blob([ext==='pdf'?pdf():ext==='docx'?docx:text]),'synthetic.'+ext);
  const saved=await json(await fetch(base+'/api/documents',{method:'POST',headers,body:form}));ids.push(saved.id);const doc=await json(await fetch(base+'/api/documents?id='+saved.id,{headers}));assert.match(doc.content,/synthetic library desk/);assert.ok(doc.sections.length);
  const duplicate=await json(await fetch(base+'/api/documents',{method:'POST',headers,body:form}));assert.equal(duplicate.id,saved.id);assert.equal(duplicate.duplicate,true);
  if(ext==='txt'&&process.env.TEST_DOCUMENT_AI==='1'){const result=await command({operation:'suggest',id:saved.id,section:0});assert.ok(result.suggestions.length>0);for(const s of result.suggestions)assert.ok(s.evidence.length>=15);console.log('Sarvam document suggestions passed.');}
 }
 console.log('Document authorization, TXT/PDF/DOCX extraction, sectioning and duplicate detection passed.');
}finally{for(const id of ids){await command({operation:'withdraw',id});const doc=await json(await fetch(base+'/api/documents?id='+id,{headers}));assert.equal(doc.status,'withdrawn');}console.log('Synthetic documents withdrawn; no answers approved.');}
