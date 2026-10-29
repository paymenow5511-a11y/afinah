// Calendar records stay separate from to-dos: checking off a task never edits Outlook.
export const OUTLOOK_CACHE='afinah.outlook.events.v1';
export const OUTLOOK_PREFS='afinah.outlook.preferences.v1';
export const SCOPES=['https://graph.microsoft.com/Calendars.ReadBasic'];
export const validClientId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'');
export function graphURL(value) {
  const u=new URL(value,'https://graph.microsoft.com/v1.0/');
  if(u.protocol!=='https:'||u.hostname!=='graph.microsoft.com'||u.port||u.username||u.password||!u.pathname.startsWith('/v1.0/me/'))throw Error('Unexpected calendar response address.');
  return u.href;
}
export async function graphPages(path,token,fetcher=fetch) {
  let url=graphURL(path),rows=[],seen=new Set();
  while(url){
    if(seen.has(url)||seen.size>=100)throw Error('The calendar is too large to refresh safely. Select fewer calendars.');
    seen.add(url);
    const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Prefer:'outlook.timezone="UTC", IdType="ImmutableId"'},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(30000)});
    if(!response.ok){const e=Error(response.status===401?'Microsoft sign-in expired. Reconnect Outlook.':response.status===403?'Microsoft did not allow calendar access. Reconnect and allow calendar reading, or contact your Microsoft administrator.':response.status===429?'Outlook is busy. Please wait a few minutes before refreshing.':'Outlook could not be refreshed. Your last saved appointments are still available.');e.status=response.status;throw e;}
    const body=await response.json();if(!Array.isArray(body.value))throw Error('Outlook returned an invalid calendar response.');
    rows.push(...body.value);if(rows.length>20000)throw Error('Too many appointments. Select fewer calendars.');
    url=body['@odata.nextLink']?graphURL(body['@odata.nextLink']):null;
  }
  return rows;
}
export function syncWindow(day){const start=new Date(day+'T00:00:00'),end=new Date(day+'T00:00:00');start.setDate(start.getDate()-30);end.setDate(end.getDate()+181);return{start:start.toISOString(),end:end.toISOString()};}
function utc(value){if(typeof value!=='string')return null;const normalized=/Z$|[+-]\d\d:\d\d$/.test(value)?value:value+'Z';const d=new Date(normalized);return isNaN(d)?null:d.toISOString();}
export function normalizeEvent(event,calendar){
  if(event.isCancelled||event.responseStatus?.response==='declined')return null;
  const start=utc(event.start?.dateTime),end=utc(event.end?.dateTime);
  if(typeof event.id!=='string'||!start||!end||end<=start)return null;
  let link='';try{const u=new URL(event.webLink);if(u.protocol==='https:'&&['outlook.live.com','outlook.office.com','outlook.office365.com'].includes(u.hostname))link=u.href;}catch{}
  return {id:`${calendar.id}:${event.id}`,title:typeof event.subject==='string'?event.subject:'Appointment',start,end,allDay:!!event.isAllDay,location:typeof event.location?.displayName==='string'?event.location.displayName:'',calendar:calendar.name||'Outlook',link};
}
export function eventsForDay(events,day){const start=new Date(day+'T00:00:00'),end=new Date(day+'T00:00:00');end.setDate(end.getDate()+1);return events.filter(e=>new Date(e.start)<end&&new Date(e.end)>start).sort((a,b)=>Number(b.allDay)-Number(a.allDay)||a.start.localeCompare(b.start)||a.title.localeCompare(b.title));}
export async function fetchSnapshot(token,calendars,selected,day,fetcher=fetch){
  const window=syncWindow(day),events=[];
  for(const calendar of calendars.filter(c=>selected.includes(c.id))){const query=new URLSearchParams({startDateTime:window.start,endDateTime:window.end,'$top':'250','$select':'id,subject,start,end,isAllDay,isCancelled,location,webLink,responseStatus'});const rows=await graphPages(`me/calendars/${encodeURIComponent(calendar.id)}/calendarView?${query}`,token,fetcher);for(const row of rows){const event=normalizeEvent(row,calendar);if(event)events.push(event);}}
  // Replace the complete window only after all pages/calendars succeed. Deleted and moved events disappear.
  return {version:1,...window,synced:new Date().toISOString(),events:[...new Map(events.map(e=>[e.id,e])).values()]};
}
export function readCache(storage){try{const data=JSON.parse(storage.getItem(OUTLOOK_CACHE)||'null');if(data?.version===1&&Array.isArray(data.events)&&typeof data.account==='string'&&data.events.every(e=>typeof e.id==='string'&&typeof e.title==='string'&&typeof e.start==='string'&&typeof e.end==='string'))return data;}catch{}return null;}
