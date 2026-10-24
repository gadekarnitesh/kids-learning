(() => {
  const profile=JSON.parse(sessionStorage.getItem('kidsLearningProfile')||'null');
  if(!profile){location.replace('index.html');return;}
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.getElementById('title').textContent=`${profile.name}'s learning summary`;
  const entries=Object.values(profile.activities||{});
  // Close any unfinished visit before taking the snapshot.
  entries.forEach(item=>{if(item.openedAt){item.seconds=(item.seconds||0)+(Date.now()-item.openedAt)/1000;delete item.openedAt;}});
  sessionStorage.setItem('kidsLearningProfile',JSON.stringify(profile));
  const duration=seconds=>{const value=Math.round(seconds||0);return value<60?`${value} sec`:`${Math.floor(value/60)} min${value%60?` ${value%60} sec`:''}`;};
  const groups=new Map();
  entries.forEach(item=>{const name=item.section||'Earlier activities (section not recorded)';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(item);});
  const total=entries.reduce((sum,item)=>sum+(item.seconds||0),0);
  document.getElementById('summary').innerHTML=`<p><strong>${entries.length}</strong> activities explored · <strong>${duration(total)}</strong> in activities</p>${[...groups].map(([section,items])=>{
    const seconds=items.reduce((sum,item)=>sum+(item.seconds||0),0),retries=items.reduce((sum,item)=>sum+(item.retries||0),0);
    return `<section class="summary-section"><h2>${escape(section)}</h2><p>${items.length} ${items.length===1?'activity':'activities'} · ${duration(seconds)} · ${retries} ${retries===1?'retry':'retries'}</p><ul>${items.sort((a,b)=>Number((a.week||'').replace('week-',''))-Number((b.week||'').replace('week-',''))).map(item=>`<li><span class="summary-week">${item.week?escape(item.week.replace('week-','Week ')):'Earlier session'}</span><strong>${escape(item.label||'Activity')}${item.code ? ` [${escape(item.code)}]` : ''}</strong><span>${duration(item.seconds)} · ${item.retries||0} ${(item.retries||0)===1?'retry':'retries'}</span></li>`).join('')}</ul></section>`;
  }).join('')||'<p>Come back after exploring an activity!</p>'}`;
  document.getElementById('done').onclick=()=>sessionStorage.removeItem('kidsLearningProfile');
})();
