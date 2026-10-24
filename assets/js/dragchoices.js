// Shared mouse, touch and keyboard interaction for square answer banks.
window.bindDragChoices = function ({ choices, slots, place, blocked = () => false }) {
  let selected = null;
  const unavailable = choice => blocked() || choice.disabled || choice.classList.contains('used');
  choices.forEach(choice => {
    let drag = null, suppressClick = false;
    choice.addEventListener('click', () => {
      if (suppressClick || unavailable(choice)) return;
      choices.forEach(item => item.classList.remove('selected'));
      selected = choice;
      choice.classList.add('selected');
    });
    choice.addEventListener('pointerdown', event => {
      if (event.button !== 0 || unavailable(choice)) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ghost: null };
      choice.setPointerCapture(event.pointerId);
    });
    choice.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.ghost && Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5) {
        const rect=choice.getBoundingClientRect();
        drag.ghost=choice.cloneNode(true);
        drag.ghost.classList.add('drag-choice-ghost');
        drag.ghost.style.width=`${rect.width}px`;
        drag.ghost.style.height=`${rect.height}px`;
        drag.ghost.setAttribute('aria-hidden','true');
        document.body.append(drag.ghost);
        choice.classList.add('dragging');
      }
      if (drag.ghost) {
        drag.ghost.style.left=`${event.clientX-drag.ghost.offsetWidth/2}px`;
        drag.ghost.style.top=`${event.clientY-drag.ghost.offsetHeight/2}px`;
      }
    });
    function endDrag(event) {
      if (!drag || drag.id!==event.pointerId) return;
      const moved=Boolean(drag.ghost);
      drag.ghost?.remove(); drag=null;
      choice.classList.remove('dragging');
      if (choice.hasPointerCapture(event.pointerId)) choice.releasePointerCapture(event.pointerId);
      if (!moved) return;
      suppressClick=true;
      setTimeout(()=>{suppressClick=false;},0);
      const target=event.type==='pointerup' && slots.find(slot=>{
        const r=slot.getBoundingClientRect();
        return event.clientX>=r.left && event.clientX<=r.right && event.clientY>=r.top && event.clientY<=r.bottom;
      });
      selected=null;
      choices.forEach(item=>item.classList.remove('selected'));
      if (target && !unavailable(choice)) place(target,choice);
      else {
        choice.classList.add('returning');
        setTimeout(()=>choice.classList.remove('returning'),500);
      }
    }
    choice.addEventListener('pointerup',endDrag);
    choice.addEventListener('pointercancel',endDrag);
    choice.addEventListener('lostpointercapture',endDrag);
  });
  slots.forEach(slot=>slot.addEventListener('click',()=>{
    if (!selected || unavailable(selected)) return;
    const choice=selected;selected=null;
    choice.classList.remove('selected');place(slot,choice);
  }));
  return () => {
    selected=null;
    choices.forEach(choice=>choice.classList.remove('selected'));
  };
};
