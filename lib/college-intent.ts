export function normalizeQuestion(q:string){return q.replace(/బీటెక్|బి[ .-]?టెక్|बी[ .-]?टेक/gu,'B.Tech').replace(/ఎం[ .-]?టెక్|ఎంటెక్|एम[ .-]?टेक/gu,'M.Tech').replace(/ఎంబీఏ|ఎం[ .-]?బి[ .-]?ఏ|एमबीए/gu,'MBA').replace(/సీఎస్ఈ|సి[ .-]?ఎస్[ .-]?ఈ|सीएसई/gu,'CSE').replace(/ఈసీఈ|ఈ[ .-]?సి[ .-]?ఈ|ईसीई/gu,'ECE').replace(/ఈఈఈ|ईईई/gu,'EEE').replace(/ఐటీ|आईटी/gu,'Information Technology');}
export function branchOf(q:string){q=normalizeQuestion(q);
 if(/\b(ai.?ml|artificial intelligence|machine learning)\b/iu.test(q))return 'cseaiml';
 if(/data.?science|\bcseds\b|\bcse.?ds\b/iu.test(q))return 'cseds';
 if(/\bcse\b|computer science/iu.test(q))return 'cse';
 if(/information technology/iu.test(q)||/\bIT\b/u.test(q))return 'it';
 if(/\bece\b|electronics.{0,10}communication/iu.test(q))return 'ece';
 if(/\beee\b|electrical/iu.test(q))return 'eee';
 if(/mechanical|\bmech\b/iu.test(q))return 'mechanical';
 if(/civil/iu.test(q))return 'civil';
 if(/\bmba\b/iu.test(q))return 'mba';
 return '';
}
export function programmeOf(q:string){q=normalizeQuestion(q);if(/m[.\s-]?tech|postgraduate engineering/iu.test(q))return 'mtech';if(/\bmba\b|business administration/iu.test(q))return 'mba';if(/b[.\s-]?tech|undergraduate engineering/iu.test(q)||branchOf(q))return 'btech';return '';}
// These intents select only curated source topics; they never create a factual answer.
export function collegeIntent(q:string):{topic?:string;clarify?:'programme'|'branch';department?:string}|null{
 q=normalizeQuestion(q);const p=programmeOf(q),b=branchOf(q);
 if(/\b(and|also|plus)\b|మరియు|और/iu.test(q)&&/fee|ఫీజు|फीस/iu.test(q)&&/hostel|placement|transport|\bseats\b|intake/iu.test(q))return null;
 if(/hostel|హాస్టల్|हॉस्टल/iu.test(q)){if(/fee|cost|price|vacan|available|ఫీజు|खाली|शुल्क/iu.test(q))return null;return /facilit|accommod|wifi|laundry|security|is there|do you have|హాస్టల్ ఉందా|हॉस्टल है/iu.test(q)?{topic:'hostel-facilities'}:null;}
 if(/exam|hall.?ticket|result|పరీక్ష|परीक्षा|రెగ్యులర్|supplementary/iu.test(q)){if(/deadline|date|fee|when|marks|తేదీ|అంతిమ|अंतिम|कब/iu.test(q))return null;return {topic:'exams-portal'};}
 if(/\bfee|tuition|ఫీజు|ఫీజ|फीस|शुल्क/iu.test(q)){
  if(/deadline|last.?date|due|refund|scholarship|reimburse|discount|total.{0,15}(cost|fee)|four.?year|4.?year/iu.test(q))return null;
  if(/pay.{0,30}(online|link|portal)|online.{0,20}(pay|fee)|payment.{0,15}(link|portal)|ఫీజు.{0,10}ఎలా|ऑनलाइन/iu.test(q))return {topic:'payment-link'};
  return p?{topic:'fee-'+p}:{clarify:'programme',department:'accounts'};
 }
 if(/intake|seats|సీట్లు|సీటు|सीट/iu.test(q)){if(/available|remaining|vacan|ఖాళీ|खाली/iu.test(q))return null;return b?{topic:'intake-'+b}:{clarify:'branch',department:'admissions'};}
 if(/hod|head.{0,15}department|హెచ్.?ఓ.?డి|विभागाध्यक्ष/iu.test(q)){if(/email|e-mail|mail|phone|number|office|room/iu.test(q))return null;return b?{topic:'hod-'+b,department:b}:{clarify:'branch',department:'academics'};}
 if(/eligib|requirement|qualification|అర్హత|पात्रता/iu.test(q)){if(/scholarship|placement|hostel|quota|rank/iu.test(q))return null;return p?{topic:'eligibility-'+p}:{clarify:'programme',department:'admissions'};}
 if(/category.?b|management.?quota|మేనేజ్|मैनेजमेंट/iu.test(q))return /deadline|last.?date|when|తేదీ|अंतिम/iu.test(q)?null:{topic:'category-b'};
 if(/library|లైబ్రరీ|पुस्तकालय/iu.test(q)){
  if(/issue|return|circulation/iu.test(q)&&/time|hour|when/iu.test(q))return {topic:'library-circulation'};
  if(/how many|borrow|loan|ఎన్ని|कितनी/iu.test(q))return {topic:'library-borrow'};
  if(/hour|time|open|clos|ఎప్పుడు|సమయ|कब|समय/iu.test(q))return {topic:'library-hours'};
  if(/where|location|block|ఎక్కడ|कहाँ/iu.test(q))return {topic:'library-location'};
  return null;
 }
 if(/bus|transport|బస్సు|బస్|बस/iu.test(q))return /\b(is there|do you have|routes|transport|bus service)\b/iu.test(q)&&!/from|pickup|time|fee|cost|kukat|miyapur|ecil|alwal|narsingi|loth|lingamp|lb.?nagar|dilsukh/iu.test(q)?{topic:'transport'}:null;
 if(/placement|internship|career development|\bcdc\b|ప్లేస్|प्लेसमेंट/iu.test(q))return /highest|average|salary|package|percentage|percent|guarantee|eligible|eligibility/iu.test(q)?null:{topic:'placements'};
 if(/health.?cent|doctor|first.?aid|infirmary|మెడికల్|డాక్టర్|डॉक्टर/iu.test(q))return /is there|facility|facilities|available|ఉన్నారా|ఉందా|है/iu.test(q)?{topic:'health'}:null;
 if(/calendar|timetable|క్యాలెండర్|कैलेंडर/iu.test(q))return /date|when|start|తేదీ|कब/iu.test(q)?null:{topic:'calendar'};
 if(/student.{0,12}(login|portal)|students.?corner/iu.test(q))return {topic:'student-login'};
 if(/counselling.?code|counseling.?code|eapcet.?code|ecet.?code|icet.?code|కోడ్|कोड/iu.test(q))return {topic:'code'};
 if(/admission|డ్మిష|प्रवेश/iu.test(q)&&/contact|phone|dean|number|సంప్రద|నంబర్|संपर्क/iu.test(q))return {topic:'admissions-contact'};
 if(/where.{0,25}(college|campus|vardhaman)|college.{0,12}(address|location)|campus.{0,12}(address|location)|^(what is the )?address\??$|కాలేజీ.{0,10}ఎక్కడ|చిరునామా|पता|कॉलेज.{0,10}कहाँ/iu.test(q))return {topic:'address'};
 if(/main.{0,15}(phone|number|contact)|college.{0,15}(phone|number|contact)/iu.test(q))return {topic:'phone'};
 if(/specialis|specializ/iu.test(q)&&p==='mba')return {topic:'mba-specialisations'};
 if(/courses|programmes|programs|branches|కోర్సు|బ్రాంచ్|पाठ्यक्रम|शाखा/iu.test(q))return {topic:p==='mtech'?'mtech-courses':p==='btech'?'branches':'programmes'};
 return null;
}
export function contextualQuestion(question:string,lastQuestion:string,previousReply:string){
 const q=question.trim();
 // Inherit scope only for elliptical follow-ups, never overwrite an explicit new scope.
 if(/^(and |what about |how about |మరి |और )/iu.test(q)&&programmeOf(q)&&/fee|tuition|ఫీజు|फीस/iu.test(lastQuestion))return `tuition fee ${q}`;
 if(/^(what about |and |how about )/iu.test(q)&&branchOf(q)&&/hod|head.{0,15}department/iu.test(lastQuestion))return `HOD ${q}`;
 if(/^(what about |and |how about )/iu.test(q)&&branchOf(q)&&/intake|seats/iu.test(lastQuestion))return `intake ${q}`;
 if(q.split(/\s+/u).length<=7&&/which programme|ఏ కోర్సు|कौन सा पाठ्यक्रम/iu.test(previousReply)&&programmeOf(q))return `${lastQuestion} ${q}`;
 if(q.split(/\s+/u).length<=7&&/which branch|ఏ బ్రాంచ్|कौन सी शाखा/iu.test(previousReply)&&branchOf(q))return `${lastQuestion} ${q}`;
 if(!branchOf(q)&&/^(and |what about |how about |మరి |और )?(who is |what is )?(its |the )?(hod|head of department|seats|intake|హెచ్.?ఓ.?డి|సీట్లు|सीट)/iu.test(q)&&branchOf(lastQuestion))return `${q} ${branchOf(lastQuestion)}`;
 if(!programmeOf(q)&&/^(and |what about |how about )?(its |the )?(fee|fees|tuition|eligibility|seats|intake)(\b|\?)/iu.test(q)&&programmeOf(lastQuestion))return `${q} ${programmeOf(lastQuestion)}`;
 return q;
}
