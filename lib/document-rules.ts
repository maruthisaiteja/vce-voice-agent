export const DOCUMENT_SECTION_SIZE=8000;
export const DOCUMENT_TEXT_LIMIT=200000;
export function documentSections(text:string){
 const sections:string[]=[];let remaining=text.trim();
 while(remaining){let end=Math.min(DOCUMENT_SECTION_SIZE,remaining.length);if(end<remaining.length){const boundary=remaining.lastIndexOf('\n',end);if(boundary>end/2)end=boundary;}sections.push(remaining.slice(0,end));remaining=remaining.slice(end).trimStart();}
 return sections;
}
export function evidencePresent(text:string,quote:string){const normalize=(v:string)=>v.replace(/\s+/g,' ').trim();return quote.trim().length>=15&&normalize(text).includes(normalize(quote));}
