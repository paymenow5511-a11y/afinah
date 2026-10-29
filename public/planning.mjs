import {dateKey,occurs,completed} from './model.mjs';
export const periods=['','anytime','morning','afternoon','evening'];
export function periodFor(task){if(task.time){const hour=Number(task.time.slice(0,2));return hour<12?'morning':hour<17?'afternoon':'evening';}return task.period||'anytime';}
export function moveTask(state,id,{date,time='',period=''},fromDay=dateKey()){
  const t=state.tasks.find(t=>t.id===id);if(!t)throw Error('Task no longer exists.');
  const d=new Date(date+'T12:00:00');if(isNaN(d)||dateKey(d)!==date||!periods.includes(period)||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Choose a valid day and time.');
  if(t.reminder&&!time)throw Error('Choose an exact time for this task’s reminder.');
  if(t.repeat==='none')return {...state,tasks:state.tasks.map(x=>x.id===id?{...x,due:date,time,period}:x)};
  if(!occurs(t,fromDay))throw Error('Select a day when this routine is scheduled before moving it.');
  const moved={...t,id:crypto.randomUUID(),repeat:'none',due:date,time,period,done:completed(t,fromDay)?['once']:[],sourceTaskId:id,sourceDate:fromDay};delete moved.skippedDates;
  return {...state,tasks:[...state.tasks.map(x=>x.id===id?{...x,skippedDates:[...new Set([...(x.skippedDates||[]),fromDay])]}:x),moved]};
}
export function goalPace(goal,today=dateKey()){
  const days=Math.round((new Date(goal.due+'T12:00:00')-new Date(today+'T12:00:00'))/86400000),remaining=Math.max(0,goal.target-goal.current);
  return {days,remaining,complete:goal.progressEntered&&remaining===0,weekly:remaining*7/Math.max(1,days)};
}
