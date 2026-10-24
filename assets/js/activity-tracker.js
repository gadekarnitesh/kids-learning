(() => {
  const params=new URLSearchParams(location.search);
  const meta={code:params.get('code')||null,classId:params.get('class')||'jr',week:params.get('week')||'week-1',section:params.get('section')||'Other activities',type:params.get('type')||'reveal',file:params.get('file')||'',mode:params.get('mode')||'learn'};
  const key=[meta.classId,meta.week,meta.section,meta.type,meta.file,meta.mode].join(':');
  function update(action){
    const profile=JSON.parse(sessionStorage.getItem('kidsLearningProfile')||'null');
    if(!profile)return;
    profile.activities ||= {};
    action(profile.activities);
    sessionStorage.setItem('kidsLearningProfile',JSON.stringify(profile));
  }
  window.activityTracker={
    start(label){update(activities=>{
      const item=activities[key] ||= {...meta,label,seconds:0,retries:0,visits:0};
      if(meta.code)item.code=meta.code;
      if(item.openedAt)return;
      item.visits++;item.openedAt=Date.now();
    });},
    retry(){update(activities=>{if(activities[key])activities[key].retries++;});},
    finish(){update(activities=>{const item=activities[key];if(item?.openedAt){item.seconds+=(Date.now()-item.openedAt)/1000;delete item.openedAt;}});}
  };
  const label=params.get('label')||meta.file;
  window.activityTracker.start(label);
  window.addEventListener('pagehide',()=>window.activityTracker.finish());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.activityTracker.finish();else window.activityTracker.start(label);});
})();
