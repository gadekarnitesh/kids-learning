(async function () {
  const root=document.getElementById('activity-root');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {
    const data=await fetch(window.activityDataUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
    const pageSize=Math.max(1,Number(data.questionsPerPage)||data.tasks.length);
    const learning=window.activityMode!=='challenge';
    const completed=new Set();let page=0;
    function render(){
      const tasks=data.tasks.slice(page*pageSize,(page+1)*pageSize);
      const numbers=shuffleChoices(data.numbers||tasks.map(task=>task.count),`count-page-${page}`);
      root.innerHTML=`<h1>${escape(data.title||'Count & Drag')}</h1><p class="instruction">${escape(data.instruction||'Count the pictures, then drag the matching number.')}</p><div class="count-board">${tasks.map((task,i)=>`<article class="count-card"><div class="count-objects" aria-label="${task.count} ${escape(task.label)}">${Array.from({length:task.count},()=>`<span class="count-object" aria-hidden="true">${escape(task.emoji)}</span>`).join('')}</div><p class="count-prompt">How many ${escape(task.label)}?</p><button type="button" class="count-slot" data-answer="${task.count}" data-index="${page*pageSize+i}" aria-label="Answer for ${escape(task.label)}">?</button></article>`).join('')}</div><div class="number-bank">${numbers.map(number=>`<button type="button" class="number-tile" draggable="false" data-value="${number}" aria-label="Number ${number}">${number}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p>${data.tasks.length>pageSize?`<nav class="count-pagination" aria-label="Counting pages"><button class="try-again" id="count-prev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1} of ${Math.ceil(data.tasks.length/pageSize)}</span><button class="try-again" id="count-next" ${(page+1)*pageSize>=data.tasks.length?'disabled':''}>Next →</button></nav>`:''}<button class="try-again" id="count-reset">Start over</button>`;
      const slots=[...root.querySelectorAll('.count-slot')],choices=[...root.querySelectorAll('.number-tile')],feedback=root.querySelector('.feedback');let locked=false;const pending=new Map();
      function accept(slot,choice){slot.textContent=choice.dataset.value;slot.classList.add('correct');choice.classList.add('used');choice.disabled=true;}
      slots.forEach(slot=>{if(completed.has(Number(slot.dataset.index))){const choice=choices.find(c=>!c.disabled&&c.dataset.value===slot.dataset.answer);if(choice)accept(slot,choice);}});
      bindDragChoices({choices,slots,blocked:()=>locked,place(slot,choice){
        if(completed.has(Number(slot.dataset.index))||pending.has(slot))return;
        if(!learning){
          slot.textContent=choice.dataset.value;choice.classList.add('used');choice.disabled=true;pending.set(slot,choice);
          if(slots.every(s=>completed.has(Number(s.dataset.index))||pending.has(s))){
            const wrong=[];
            pending.forEach((tile,target)=>{if(tile.dataset.value===target.dataset.answer){completed.add(Number(target.dataset.index));accept(target,tile);}else{target.classList.add('wrong');wrong.push([target,tile]);}});
            if(wrong.length){
              locked=true;feedback.className='feedback error';feedback.textContent='Count the pink boxes again.';window.activityTracker?.retry();
              setTimeout(()=>{wrong.forEach(([target,tile])=>{target.textContent='?';target.classList.remove('wrong');tile.classList.remove('used');tile.disabled=false;pending.delete(target);});locked=false;},700);
            }else{feedback.className='feedback success';feedback.textContent='Wonderful counting!';window.kidsFun?.celebrate(root,'Wonderful counting!');}
          }
          return;
        }
        slot.textContent=choice.dataset.value;choice.classList.add('used');
        if(choice.dataset.value===slot.dataset.answer){
          completed.add(Number(slot.dataset.index));accept(slot,choice);
          feedback.className='feedback success';feedback.textContent='Correct!';
          if(slots.every(s=>completed.has(Number(s.dataset.index)))){feedback.textContent='Wonderful counting!';window.kidsFun?.celebrate(root,'Wonderful counting!');}
        }else{
          locked=true;slot.classList.add('wrong');feedback.className='feedback error';feedback.textContent='Count once more and try again.';window.activityTracker?.retry();
          setTimeout(()=>{slot.textContent='?';slot.classList.remove('wrong');choice.classList.remove('used');choice.classList.add('returning');setTimeout(()=>choice.classList.remove('returning'),500);locked=false;},700);
        }
      }});
      if(data.tasks.length>pageSize){root.querySelector('#count-prev').onclick=()=>{page--;render();};root.querySelector('#count-next').onclick=()=>{page++;render();};}
      root.querySelector('#count-reset').onclick=()=>{completed.clear();page=0;render();};
    }
    render();
  }catch{root.innerHTML='<h1>Oops!</h1><p class="instruction">This counting activity could not be loaded.</p>';}
}());
