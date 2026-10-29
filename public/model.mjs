export const KEY = 'afinah.personal.v1';
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shiftDate(date, days) { const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()+days); return dateKey(d); }
export const categories = ['Home','Family','Health','Finances','Education','Business','Real Estate','Software','Nonprofit','Personal'];
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T12:00:00'))&&dateKey(new Date(s+'T12:00:00'))===s;
export function seed(today = dateKey()) {
  const task = (title, category, repeat='none', day=null, notes='') => ({id:crypto.randomUUID(),title,category,repeat,day,due:today,time:'',reminder:false,priority:false,person:'',notes,done:[],created:today});
  return {version:1,tasks:[
    task('Clean one area · 30 minutes','Home','daily',null,'5 min trash · 10 min put away · 10 min clean one surface · 5 min finish. Keep stray items in a basket. One room, one timer, one task.'),
    task('Wash one load of laundry','Home','daily',null,'Wash, dry, fold, and put away one load.'),
    {...task('Friday detailed laundry','Home','weekly',5,'Wash, dry, fold, put away clothes, and organize the laundry area.'),due:shiftDate(today,(5-new Date(today+'T12:00:00').getDay()+7)%7)}
  ].map((t,i)=>({...t,time:['10:15','12:00','11:00'][i],reminder:true})),notes:[],notified:[],settings:{}};
}
export function validate(s) {
  if (!s || s.version!==1 || !Array.isArray(s.tasks) || !Array.isArray(s.notes) || s.tasks.length>10000 || s.notes.length>10000) throw Error('This is not an Afinah backup.');
  const ids=new Set();
  for (const t of s.tasks) {
    if (!t || typeof t.id!=='string' || ids.has(t.id) || typeof t.title!=='string' || !t.title.trim() || t.title.length>300 || !categories.includes(t.category) || !['none','daily','weekly','monthly'].includes(t.repeat) || !Array.isArray(t.done) || t.done.some(x=>typeof x!=='string') || !/^\d{4}-\d{2}-\d{2}$/.test(t.due||'') && t.due!=='' || t.repeat!=='none'&&!t.due || typeof t.notes!=='string' || typeof t.person!=='string' || !/^(?:[0-2]\d:[0-5]\d)?$/.test(t.time||'')) throw Error('Invalid task in backup.');
    if(t.due&&!validDate(t.due)||t.done.some(d=>d!=='once'&&!validDate(d))||t.time&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t.time)||typeof t.priority!=='boolean'||typeof t.reminder!=='boolean')throw Error('Invalid dates or reminder settings in backup.');
    ids.add(t.id);
  }
  for(const n of s.notes) if(!n || typeof n.id!=='string' || typeof n.text!=='string' || typeof n.updated!=='string') throw Error('Invalid note in backup.');
  return {...s,notified:Array.isArray(s.notified)?s.notified:[],settings:s.settings||{}};
}
export function load(storage) { const raw=storage.getItem(KEY); return raw===null?seed():validate(JSON.parse(raw)); }
export function save(storage,state) { validate(state); storage.setItem(KEY,JSON.stringify(state)); }
// A recurring occurrence has its own completion key; finishing today never finishes tomorrow.
export function occurs(t, day) {
  if(t.repeat==='none') return !t.due || t.due<=day;
  if(day<t.due) return false;
  const d=new Date(day+'T12:00:00'), start=new Date(t.due+'T12:00:00');
  return t.repeat==='daily' || t.repeat==='weekly' && d.getDay()===start.getDay() || t.repeat==='monthly' && d.getDate()===Math.min(start.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate());
}
export const completionKey=(t,day)=>t.repeat==='none'?'once':day;
export const completed=(t,day)=>t.done.includes(completionKey(t,day));
export function toggle(t,day) { const key=completionKey(t,day); return {...t,done:t.done.includes(key)?t.done.filter(k=>k!==key):[...t.done,key]}; }
export const cleaningFocus=day=>['Light reset or rest','Kitchen','Living room','Bathrooms','Bedrooms','Laundry and detailed organization','Declutter one small area'][new Date(day+'T12:00:00').getDay()];
const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
export function calendar(tasks) {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Afinah//Personal Planner//EN','CALSCALE:GREGORIAN'];
  for(const t of tasks.filter(t=>t.due && t.reminder)) {
    lines.push('BEGIN:VEVENT',`UID:${esc(t.id)}@afinah`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`);
    lines.push(`DTSTART:${t.due.replaceAll('-','')}T${(t.time||'09:00').replace(':','')}00`,'DURATION:PT30M',`SUMMARY:${esc(t.title)}`,`DESCRIPTION:${esc([t.person,t.notes].filter(Boolean).join('\n'))}`);
    if(t.repeat!=='none') {let rule=`RRULE:FREQ=${t.repeat.toUpperCase()}`;const date=Number(t.due.slice(8));if(t.repeat==='monthly'&&date>=28)rule+=`;BYMONTHDAY=${Array.from({length:date-27},(_,i)=>28+i).join(',')};BYSETPOS=-1`;lines.push(rule);}
    lines.push('BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY',`DESCRIPTION:${esc(t.title)}`,'END:VALARM','END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // Fold by UTF-8 octets (RFC 5545), including non-ASCII task titles.
  return lines.map(line=>{let result='',size=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(size+n>73){result+='\r\n ';size=1;}result+=ch;size+=n;}return result;}).join('\r\n')+'\r\n';
}
