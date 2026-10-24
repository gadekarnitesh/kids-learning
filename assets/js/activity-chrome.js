// Publish the rendered JSON title to the surrounding tablet, including rerenders.
(() => {
  if (window.parent === window) return;
  try {
    if (typeof window.parent.setActivityTitle !== 'function') return;
    document.documentElement.classList.add('embedded-activity');
    const root=document.getElementById('activity-root');
    let lastTitle='';
    function syncTitle(){
      const title=root.querySelector('h1')?.textContent.trim();
      if(!title || title===lastTitle)return;
      lastTitle=title;
      window.parent.setActivityTitle(title,window.location.href);
    }
    const observer=new MutationObserver(syncTitle);
    observer.observe(root,{childList:true,subtree:true,characterData:true});
    syncTitle();
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  } catch {/* Standalone or cross-origin frames keep their own title. */}
})();
