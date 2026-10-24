(async function () {
  const root=document.getElementById('activity-root');
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {
    const data=await fetch(window.activityDataUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
    data.questions.forEach((q,index)=>{q.choices=shuffleChoices(q.choices,`question-${index}`);});
    const solved=new Map();let page=0;
    function render(){
      const questions=data.questions.slice(page*2,page*2+2);
      root.innerHTML=`<h1>${escape(data.title)}</h1><p class="instruction">${escape(data.instruction)}</p><div class="picture-questions">${questions.map((q,i)=>`<article class="picture-question"><h2 id="question-${i}">${escape(q.prompt)}</h2><div class="picture-options" role="group" aria-labelledby="question-${i}">${q.choices.map(c=>`<button type="button" class="picture-option" data-id="${escape(c.id)}" aria-pressed="false"><img src="${escape(c.image)}" alt="${escape(c.alt)}"><span class="choice-tick" aria-hidden="true"></span></button>`).join('')}</div><p class="feedback" aria-live="polite"></p></article>`).join('')}</div>${data.questions.length>2?`<div class="picture-pagination"><button class="try-again" id="picture-prev" ${page===0?'disabled':''}>← Previous</button><span>Page ${page+1} of ${Math.ceil(data.questions.length/2)}</span><button class="try-again" id="picture-next" ${(page+1)*2>=data.questions.length?'disabled':''}>Next →</button></div>`:''}<button type="button" class="try-again" id="picture-reset">Start over</button>`;
      root.querySelectorAll('.picture-question').forEach((card,i)=>{
        const q=questions[i],index=page*2+i,buttons=[...card.querySelectorAll('.picture-option')],feedback=card.querySelector('.feedback');
        function accept(button){
          buttons.forEach(b=>{b.classList.remove('wrong');b.disabled=true;b.setAttribute('aria-pressed',String(b===button));});
          button.classList.add('correct');button.querySelector('.choice-tick').textContent='✓';
          feedback.className='feedback success';feedback.textContent=q.success || 'Correct! Well done.';
        }
        if(solved.has(index))accept(buttons.find(b=>b.dataset.id===solved.get(index)));
        buttons.forEach(button=>button.addEventListener('click',()=>{
          if(solved.has(index))return;
          if(button.dataset.id===q.answer){solved.set(index,q.answer);accept(button);}
          else{button.classList.add('wrong');feedback.className='feedback error';feedback.textContent='Look again and try the other picture.';window.activityTracker?.retry();setTimeout(()=>button.classList.remove('wrong'),600);}
        }));
      });
      if(data.questions.length>2){root.querySelector('#picture-prev').onclick=()=>{page--;render();};root.querySelector('#picture-next').onclick=()=>{page++;render();};}
      root.querySelector('#picture-reset').onclick=()=>{solved.clear();data.questions.forEach((q,index)=>{q.choices=shuffleChoices(q.choices,`question-${index}`);});page=0;render();};
    }
    render();
  }catch{root.innerHTML='<h1>Oops!</h1><p class="instruction">This picture activity could not be loaded.</p>';}
}());
