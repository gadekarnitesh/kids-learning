(async function () {
  const root=document.getElementById('activity-root');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {
    const data=await fetch(window.activityDataUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
    data.tasks.forEach(task => { task.choices = shuffleChoices(task.choices); });
    let page=0;
    const completed=new Map();
    function render() {
      const task=data.tasks[page];
      const answers=completed.get(page)||{};
      completed.set(page,answers);
      root.innerHTML=`<h1>${escape(data.title)}</h1><p class="instruction">${escape(data.instruction)}</p><div class="order-board"><p class="order-direction">Smallest → Biggest</p><div class="order-slots">${task.sequence.map((_,i)=>`<button type="button" class="count-slot" data-index="${i}" aria-label="Position ${i+1}">?</button>`).join('')}</div><div class="order-bank"><p class="advance-options-label">Numbers to arrange</p><div class="advance-options">${task.choices.map(value=>`<button type="button" class="connect-number advance-option" draggable="false" data-value="${escape(value)}">${escape(value)}</button>`).join('')}</div></div><p class="feedback" aria-live="polite"></p></div><button class="try-again" id="order-reset">Start over</button>${data.tasks.length>1?`<div class="advance-pagination"><button class="try-again" id="order-prev" ${page===0?'disabled':''}>← Previous</button><span>Round ${page+1} of ${data.tasks.length}</span><button class="try-again" id="order-next" ${page===data.tasks.length-1?'disabled':''}>Next →</button></div>`:''}`;
      const slots=[...root.querySelectorAll('.count-slot')], choices=[...root.querySelectorAll('.advance-option')], feedback=root.querySelector('.feedback');
      let locked=false;
      function accept(slot,choice) {
        slot.textContent=choice.dataset.value;slot.classList.add('correct');choice.classList.add('used');choice.disabled=true;
      }
      Object.entries(answers).forEach(([index,value])=>accept(slots[index],choices.find(c=>c.dataset.value===value)));
      bindDragChoices({choices,slots,blocked:()=>locked,place(slot,choice){
        const index=Number(slot.dataset.index);
        if (answers[index]!==undefined) return;
        slot.textContent=choice.dataset.value;choice.classList.add('used');
        if(choice.dataset.value===String(task.sequence[index])){
          answers[index]=choice.dataset.value;accept(slot,choice);
          feedback.className='feedback success';
          feedback.textContent=Object.keys(answers).length===slots.length?'Great job! All the numbers are in order!':'Correct! Keep going.';
        }else{
          locked=true;slot.classList.add('wrong');feedback.className='feedback error';feedback.textContent='Try another number for this box.';
          window.activityTracker?.retry();
          setTimeout(()=>{slot.textContent='?';slot.classList.remove('wrong');choice.classList.remove('used');choice.classList.add('returning');setTimeout(()=>choice.classList.remove('returning'),500);locked=false;},700);
        }
      }});
      root.querySelector('#order-reset').onclick=()=>{completed.delete(page);task.choices=shuffleChoices(task.choices);render();};
      if(data.tasks.length>1){
        root.querySelector('#order-prev').onclick=()=>{page--;render();};
        root.querySelector('#order-next').onclick=()=>{page++;render();};
      }
    }
    render();
  } catch {root.innerHTML='<h1>Oops!</h1><p class="instruction">This number activity could not be loaded.</p>';}
}());
