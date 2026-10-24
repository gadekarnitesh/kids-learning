window.shuffleChoices = function (items, scope = 'default') {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  if(result.length<2)return result;
  // Avoid repeating the previous arrangement when reopening the same bank.
  try{
    const identity=items.map(x=>JSON.stringify(x)).sort().join('|');
    const key=`kids-choice-order:${location.pathname}:${new URLSearchParams(location.search).get('week')}:${new URLSearchParams(location.search).get('file')}:${scope}:${identity}`;
    const previous=sessionStorage.getItem(key);
    if(JSON.stringify(result)===previous)result.push(result.shift());
    sessionStorage.setItem(key,JSON.stringify(result));
  }catch{/* Shuffling still works when storage is unavailable. */}
  return result;
};
