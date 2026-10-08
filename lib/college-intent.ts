export function normalizeQuestion(q:string){return q.replace(/బీటెక్|బి[ .-]?టెక్|बी[ .-]?टेक/gu,'B.Tech').replace(/ఎం[ .-]?టెక్|ఎంటెక్|एम[ .-]?टेक/gu,'M.Tech').replace(/ఎంబీఏ|ఎం[ .-]?బి[ .-]?ఏ|एमबीए/gu,'MBA').replace(/సీఎస్ఈ|సి[ .-]?ఎస్[ .-]?ఈ|सीएसई/gu,'CSE').replace(/ఈసీఈ|ఈ[ .-]?సి[ .-]?ఈ|ईसीई/gu,'ECE').replace(/ఈఈఈ|ईईई/gu,'EEE').replace(/ఐటీ|आईटी/gu,'Information Technology').replace(/\b(epz|epcet|e-p-z|eamcet|amcet|tgeamcet|tgeapcet)\b/gi,'EAPCET').replace(/\b(pgset|pg-cet|pg-set|tgpgecet)\b/gi,'PGECET').replace(/\b(iset|i-set|tgicet)\b/gi,'ICET').replace(/\b(vmeg|vmag|w-m-e-g)\b/gi,'VMEG').replace(/\b(aml|ai-ml)\b/gi,'AIML');}
export function branchOf(q:string){q=normalizeQuestion(q);
 if(/\b(ai.?ml|artificial intelligence|machine learning|aiml)\b/iu.test(q))return 'cseaiml';
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
// A request for an entire department is a navigation turn, not permission to
// substitute a fee, intake or HOD fact for a complete overview.
export function broadBranch(q:string){
 const b=branchOf(q);if(!b)return '';
 if(/fee|tuition|seats|intake|hod|faculty|subject|syllabus|curriculum|eligib|admission|placement|scholarship|deadline|date|ఫీజు|సీట్లు|విషయ|फीस|सीट|पाठ्यक्रम/iu.test(q))return '';
 return /detail|overview|tell me about|know about|information (about|on)|explain|వివర|గురించి|जानकारी|बारे/iu.test(q)||/^(information technology|IT|CSE|ECE|EEE|civil|mechanical)( branch)?[.!?]*$/iu.test(q.trim())?b:'';
}
// These intents select only curated source topics; they never create a factual answer.
export function collegeIntent(q:string):{topic?:string;clarify?:'programme'|'branch'|'exam-rules';department?:string}|null{
 q=normalizeQuestion(q);const p=programmeOf(q),b=branchOf(q);
 if(/autonomous|accredit|naac|nba|affiliated|affiliation|which university/iu.test(q))return {topic:'accreditation',department:'general'};
 if(/cut.?off|cutoff|closing.?rank|last.?rank|\brank\b/iu.test(q)&&/eapcet|pgecet|icet|admission|seat|cse|btech|can i get|my son|got around|cutoff|last year/iu.test(q))return {topic:'cutoffs',department:'admissions'};
 if(/(difference|compare|which has more seats)/iu.test(q)&&/cse/iu.test(q)&&/(ai|ml|data.?science|ds|aiml)/iu.test(q))return {topic:'branch-diff',department:'admissions'};
 if(/hostel/iu.test(q)&&/transport|bus/iu.test(q)&&/fee|cost|separate|include/iu.test(q))return {topic:'hostel-transport-fees',department:'accounts'};
 if(/reimburse|epass|scholarship/iu.test(q)&&/fee|how much|pay|from our side|dues/iu.test(q))return {topic:'fee-reimbursement',department:'accounts'};
 if(/loan|receipt/iu.test(q)&&/fee|bank|estimation/iu.test(q))return {topic:'fee-loan-receipt',department:'accounts'};
 if(/late.?fine|late.?fee|penalty/iu.test(q)||(/last.?date/iu.test(q)&&/over|fine|penalty/iu.test(q)))return {topic:'fee-late',department:'accounts'};
 if(/provisional|certificate|bonafide|marks memo|cmm|migration/iu.test(q)&&!/calendar|timetable/iu.test(q)&&/provisional|cmm|graduation/iu.test(q))return {topic:'certificates',department:'exams'};
 if(/lateral|diploma/iu.test(q)&&/ecet|entry|admission|join|second.?year|2nd.?year/iu.test(q))return {topic:'lateral-entry',department:'admissions'};
 // Student branches are professional societies, never degree programmes.
 if(/student.?branch|student.?chapter|professional societ|\bieee\b|\bacm\b/iu.test(q))return /join|fee|register|event|date|when|today|tomorrow/iu.test(q)?null:{topic:'student-chapters'};
 if(/club|co.?curricular|extra.?curricular/iu.test(q))return /join|fee|register|president|coordinator|date|when|today|tomorrow/iu.test(q)?null:{topic:'student-clubs'};
 if(/exam/iu.test(q)&&/conduct|evaluation|assessment|how.*work/iu.test(q))return /marks|weight|pass|percentage|regulation|pattern/iu.test(q)?{clarify:'exam-rules',department:'exams'}:{topic:'exam-process'};
 if(/exam/iu.test(q)&&/marks|weight|pass|percentage|regulation|pattern/iu.test(q))return /\br\d|semester|year/iu.test(q)?null:{clarify:'exam-rules',department:'exams'};
 if(b==='it'&&/hod|head.{0,15}department/iu.test(q)&&/phone|contact number|mobile/iu.test(q)&&!/email|mail/iu.test(q))return {topic:'it-hod-phone',department:'it'};
 if(b==='it'&&/faculty/iu.test(q)&&!/email|phone|contact|salary|recruit|vacan|all|list|each/iu.test(q))return {topic:'it-faculty',department:'it'};
 if(b==='it'&&/subject|curriculum|syllabus/iu.test(q)&&!/semester|regulation|\br\d|year|exam|credit/iu.test(q))return {topic:'it-study',department:'it'};
 if(/admission/iu.test(q)&&p==='btech'&&/detail|process|how|apply/iu.test(q)&&!/contact|phone|fee|deadline|date|when|document|scholarship|rank|cut.?off|eligib|category|quota|lateral/iu.test(q))return {topic:'admission-process-btech',department:'admissions'};
 if(/\b(and|also|plus)\b|మరియు|और/iu.test(q)&&/fee|ఫీజు|फीस/iu.test(q)&&/hostel|placement|transport|\bseats\b|intake/iu.test(q))return null;
 if(/hostel|హాస్టల్|हॉस्टल/iu.test(q)){if(/fee|cost|price|vacan|available|ఫీజు|खाली|शुल्क/iu.test(q))return null;return /facilit|accommod|wifi|laundry|security|is there|do you have|హాస్టల్ ఉందా|हॉस्टल है/iu.test(q)?{topic:'hostel-facilities'}:null;}
 if((/exam|hall.?ticket|result|పరీక్ష|परीक्षा|రెగ్యులర్|supplementary/iu.test(q))&&!/entrance.?exam|entrance.?test|admissions?/iu.test(q)){if(/deadline|date|fee|when|marks|తేదీ|అంతిమ|अंतिम|कब/iu.test(q))return null;return {topic:'exams-portal'};}
 if(/\bfee|tuition|ఫీజు|ఫీజ|फीस|शुल्क/iu.test(q)){
  if(/deadline|last.?date|due|refund|discount/iu.test(q)&&!/total|annual|per.?year/iu.test(q))return null;
  if(/pay.{0,30}(online|link|portal)|online.{0,20}(pay|fee)|payment.{0,15}(link|portal)|fee.{0,15}(online|link|portal)|ఫీజు.{0,10}ఎలా|ऑनलाइन/iu.test(q))return {topic:'payment-link'};
  return p?{topic:'fee-'+p}:{clarify:'programme',department:'accounts'};
 }
 if(/intake|seats|సీట్లు|సీటు|सीट/iu.test(q)){if(/available|remaining|vacan|ఖాళీ|खाली/iu.test(q))return null;return b?{topic:'intake-'+b}:{clarify:'branch',department:'admissions'};}
 if(/hod|head.{0,15}department|హెచ్.?ఓ.?డి|विभागाध्यक्ष/iu.test(q)){if(/email|e-mail|mail|phone|number|office|room/iu.test(q))return null;return b?{topic:'hod-'+b,department:b}:{clarify:'branch',department:'academics'};}
 if(/eligib|requirement|qualification|entrance|అర్హత|पात्रता/iu.test(q)){if(/scholarship|placement|hostel|quota|rank/iu.test(q))return null;return p?{topic:'eligibility-'+p}:{clarify:'programme',department:'admissions'};}
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
 if(/counselling.?code|counseling.?code|eapcet.?code|ecet.?code|icet.?code|web.?option|college.?code|కోడ్|कोड/iu.test(q)||(/code|కోడ్|कोड/iu.test(q)&&/college|vmeg|eapcet|ecet|icet|web/iu.test(q)))return {topic:'code'};
 if(/admission|డ్మిష|प्रवेश/iu.test(q)&&/contact|phone|dean|number|సంప్రద|నంబర్|संपर्क/iu.test(q))return {topic:'admissions-contact'};
 if(/where.{0,25}(college|campus|vardhaman)|college.{0,12}(address|location)|campus.{0,12}(address|location)|^(what is the )?address\??$|కాలేజీ.{0,10}ఎక్కడ|చిరునామా|पता|कॉलेज.{0,10}कहाँ/iu.test(q))return {topic:'address'};
 if(/main.{0,15}(phone|number|contact)|college.{0,15}(phone|number|contact)/iu.test(q))return {topic:'phone'};
 if(/specialis|specializ/iu.test(q)&&p==='mba')return {topic:'mba-specialisations'};
 if(/courses|programmes|programs|branches|కోర్సు|బ్రాంచ్|पाठ्यक्रम|शाखा/iu.test(q))return {topic:p==='mtech'?'mtech-courses':p==='btech'?'branches':'programmes'};
 return null;
}
export function contextualQuestion(question:string,lastQuestion:string,previousReply:string){
 const q=question.trim();
 if(/^(information technology|IT|CSE|ECE|EEE|civil|mechanical)[.!?]*$/iu.test(q)&&/hod|head.{0,15}department|faculty/iu.test(lastQuestion))return `${/faculty/iu.test(lastQuestion)?'Faculty and HOD':'HOD'} ${q}`;
 const branch=branchOf(lastQuestion),label=branch==='it'?'Information Technology':branch;
 // Natural follow-ups can be longer than a terse menu selection. Inherit
 // only department-specific requests; hostel/exam/club questions reset scope.
 if(!branchOf(q)&&branch&&!/hostel|exam|club|student.?branch|student.?chapter|library|transport/iu.test(q)){
  if(/faculty|\bhod\b|head.{0,15}department|syllabus|curriculum/iu.test(q))return `${q} ${label}`;
  if(/\b(his|her|their)\b/iu.test(q)&&/contact|phone|number|email/iu.test(q)&&/hod|head.{0,15}department/iu.test(lastQuestion))return `${q} HOD ${label}`;
 }
 // Inherit a department only for a short menu selection. An explicit new
 // branch always wins; an unrelated new question never inherits it.
 if(!branchOf(q)&&branchOf(lastQuestion)&&q.split(/\s+/u).length<=10&&/^(?:(?:and|what about|tell me about|its|the|okay|please)\s+)*(?:fees?|tuition|subjects?|syllabus|curriculum|faculty|admissions?|eligibility|seats|intake|hod|placements?|scholarships?|ఫీజు|సీట్లు|అడ్మిషన్|విషయాలు|फीस|विषय|प्रवेश)(?:\s+(?:please|details))?[.!?]*$/iu.test(q))return `${q} ${branchOf(lastQuestion)==='it'?'Information Technology':branchOf(lastQuestion)}`;
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
