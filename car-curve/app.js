import {cars,makes,sources,checked} from './data.js';
import {normalise,findCar,makeCurve,csvFor} from './core.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gbp=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
const pct=n=>(n*100).toFixed(1)+'%';
const date=s=>new Date(s+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const nowYear=new Date().getFullYear();
let horizon=5,current=null,toastTimer,hoverAge=3;
let saved=[];try{const x=JSON.parse(localStorage.getItem('carcurve:saved')||'[]');if(Array.isArray(x))saved=x.slice(0,3).filter(r=>r&&r.input&&typeof r.input.label==='string');}catch{}
$('year').max=nowYear;
$('coverage').textContent=`${cars.length} derivatives`;$('count-source').textContent=cars.length;
$('makes').innerHTML=makes.map(m=>`<option value="${esc(m)}"></option>`).join('');
const sorted=[...cars].sort((a,b)=>(a.make+a.model).localeCompare(b.make+b.model));
$('example').innerHTML='<option value="">Choose a reference…</option>'+sorted.map(c=>`<option value="${c.id}">${esc(c.make+' '+c.model+' · '+c.trim)}</option>`).join('');
$('source-list').innerHTML=Object.entries(sources).map(([key,s])=>`<div><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)} ↗</a><small>${s.date?'Published '+date(s.date)+' · ':''}${key==='cap'?'Investigated; not connected':key==='rac'?'Generic context, not model-specific data':'Dated UK forecasts, not live values'}</small></div>`).join('');
function matching(){return findCar(cars,$('make').value,$('model').value,$('trim').value);}
function isBenchmark(){const c=matching();return c&&+$('year').value===c.referenceYear&&$('basis').value==='new';}
function updateLists(){
 const list=cars.filter(c=>normalise(c.make)===normalise($('make').value));
 $('models').innerHTML=[...new Set(list.map(c=>c.model))].map(m=>`<option value="${esc(m)}"></option>`).join('');
 $('trims').innerHTML=list.filter(c=>normalise(c.model)===normalise($('model').value)).map(c=>`<option value="${esc(c.trim)}"></option>`).join('');
}
function syncMatch(){
 const c=matching(),benchmark=isBenchmark(),today=$('basis').value==='today';
 $('match').classList.toggle('unmatched',!benchmark);
 if(benchmark)$('match').innerHTML=`<strong>✓ Published derivative reference</strong>${date(sources[c.source].date)} · new-car forecast · 36,000 miles at year 3. Not a live valuation or verification of your specific car.`;
 else if(today)$('match').innerHTML='<strong>Your price. Your scenario.</strong>Starts from a value you provide today. No published new-car forecast will be applied.';
 else if(c)$('match').innerHTML=`<strong>No benchmark for ${esc($('year').value||'this year')}</strong>This derivative’s reference is from ${c.referenceYear}. It is not automatically applied to a different registration year.`;
 else $('match').innerHTML='<strong>No published match in this library</strong>Enter your own price to explore a generic scenario. There is no vehicle-specific valuation behind it.';
 $('scenario-gate').hidden=!!benchmark;
 $('retention-control').hidden=!!benchmark||today;
 $('price-label').textContent=today?'Your value / purchase price today (£)':'Price when new (£)';
 $('price-hint').textContent=today?'Enter a current quote or what you would pay now.':benchmark?'Published list price prefilled. You can use your actual new purchase price.':'Enter the original new price. We do not invent prices for unlisted years or trims.';
 $('tail-value').textContent=$('tail').value+'%';$('retention-value').textContent=$('retention').value+'%';
}
function invalidate(){
 current=null;$('error').hidden=true;$('result-title').textContent='Ready for your next car';$('result-subtitle').textContent='Complete the details and show the curve.';$('result-kind').textContent='CHOOSE YOUR SCENARIO';
 ['stat-start','stat-end','stat-loss'].forEach(id=>$(id).textContent='—');$('stat-monthly').textContent='';$('chart').innerHTML='<text x="380" y="175" text-anchor="middle">Your next curve will appear here</text>';$('result-notice').textContent='No results calculated for the current inputs.';$('chart-caption').textContent='';$('evidence').textContent='Source details will appear with your result.';$('table-body').innerHTML='';$('retained-text').textContent='';$('inspect-output').textContent='';$('download').disabled=true;$('save').disabled=true;$('inspect').disabled=true;$('chart-tooltip').hidden=true;$('anchor-legend').hidden=true;
}
function selectReference(id){
 const c=cars.find(c=>c.id===id);if(!c)return;
 $('example').value=c.id;$('make').value=c.make;$('model').value=c.model;$('trim').value=c.trim;$('year').value=c.referenceYear;$('price').value=c.price;$('basis').value='new';$('tail').value=15;$('retention').value=50;$('allow-generic').checked=false;updateLists();syncMatch();calculate();
}
$('example').addEventListener('change',()=>selectReference($('example').value));
for(const id of ['make','model','trim','year'])$(id).addEventListener('input',()=>{ $('price').value='';$('example').value='';$('allow-generic').checked=false;updateLists();syncMatch();const c=matching();if(isBenchmark())$('price').value=c.price;invalidate(); });
$('basis').addEventListener('change',()=>{$('price').value='';$('allow-generic').checked=false;syncMatch();if(isBenchmark())$('price').value=matching().price;invalidate();});
for(const id of ['price','tail','retention','allow-generic'])$(id).addEventListener('input',()=>{syncMatch();invalidate();});
function readInput(){
 const c=matching(),benchmark=isBenchmark();
 if(!['make','model','trim'].every(id=>$(id).value.trim()))throw Error('Please enter a make, model and trim.');
 if(!benchmark&&!$('allow-generic').checked)throw Error('No matching published benchmark. Tick “Build an illustrative scenario instead” to use your own price and assumptions.');
 return {make:$('make').value.trim(),model:$('model').value.trim(),trim:$('trim').value.trim(),label:[$('make').value,$('model').value,$('trim').value].join(' '),year:+$('year').value,price:+$('price').value,basis:$('basis').value,horizon,tail:+$('tail').value/100,retention:benchmark?c.residual/c.price:+$('retention').value/100,generic:!benchmark,carId:benchmark?c.id:null};
}
function calculate(){
 try{
 const input=readInput(),curve=makeCurve(input,nowYear),car=cars.find(c=>c.id===input.carId);
 current={input,curve,car};$('error').hidden=true;render();return true;
 }catch(e){$('error').textContent=e.message;$('error').hidden=false;return false;}
}
$('car-form').addEventListener('submit',e=>{e.preventDefault();if(calculate()&&innerWidth<761)$('result-title').scrollIntoView({behavior:'smooth',block:'start'});});
function sourceLabel(){return current.car?`${sources[current.car.source].name}; published ${sources[current.car.source].date}; checked ${checked}`:current.input.basis==='today'?'User price and user-editable annual depreciation assumption':'RAC broad guidance + app assumptions; not model-specific';}
function render(){
 const {input:i,curve:c,car}=current,today=i.basis==='today',modified=!!car&&i.price!==car.price,exactAnchor=!!car&&!modified;
 $('result-kind').textContent=today?'CUSTOM CURRENT-VALUE SCENARIO':car?(modified?'CUSTOM PRICE · REFERENCE RETENTION':'DATED PUBLISHED BENCHMARK SCENARIO'):'ILLUSTRATIVE SCENARIO · NOT VEHICLE-SPECIFIC';
 $('result-title').textContent=`${i.make} ${i.model}`;$('result-subtitle').textContent=`${i.trim} · ${i.year} registration year`;
 $('result-notice').classList.toggle('warning',!car);
 $('result-notice').textContent=car?`Uses a ${date(sources[car.source].date)} new-car forecast, not a current ${nowYear} valuation. ${modified?'Your price is scaled by the reference retained percentage.':'Only the new price and 3-year forecast are published.'}`:today?'Anchored to your entered value today. All later values use your chosen annual loss rate; no model-specific forecast is available.':'No data match: this is a generic what-if curve. The entered make, model and trim do not change the depreciation calculation.';
 $('stat-start-label').textContent=today?'Your starting value':'Price when new';$('stat-start').textContent=gbp(i.price);$('stat-end-label').textContent=`Value after ${i.horizon} years`;$('stat-end').textContent=gbp(c.end);$('stat-loss').textContent=gbp(c.loss);$('stat-monthly').textContent=`${gbp(c.monthly)}/month · depreciation only`;
 $('retained-text').textContent=`${pct(c.retained)} of starting value retained`;
 $('chart-caption').textContent=today?`Starts in ${nowYear} at your price. ${Math.round(i.tail*100)}% annual loss throughout; calendar age is approximate. No historic price series is inferred.`:car?`Line = modelled interpolation; ${exactAnchor?'dot = original published 3-year/36,000-mile resale forecast':'no source dot: price has been customised'}. Beyond year 3: assumed ${Math.round(i.tail*100)}% annual loss. This is not actual price history.`:`RAC-context scenario: 25% loss in year 1, ${Math.round((1-i.retention)*100)}% loss by year 3; then ${Math.round(i.tail*100)}% annually. These are assumptions, not forecasts for ${i.make} ${i.model}.`;
 $('anchor-legend').hidden=!exactAnchor;
 $('evidence').innerHTML=car?`<div class="evidence-grid"><div><span>Published new list price</span><strong>${gbp(car.price)}</strong></div><div><span>Published 3-year resale forecast</span><strong>${gbp(car.residual)}</strong></div><div><span>Forecast basis</span><strong>3 years · 36,000 miles · UK</strong></div><div><span>Published / checked</span><strong>${date(sources[car.source].date)} / ${date(checked)}</strong></div></div><a class="source-link" href="${sources[car.source].url}" target="_blank" rel="noopener">Read the original What Car? forecast ↗</a><p>Derived retention: ${pct(car.residual/car.price)}. Resale-price channel is not specified in the article; do not assume a dealer offer or retail asking price. ${modified?'The displayed curve uses your custom starting price.':''}</p>${car.note?`<p>${esc(car.note)}</p>`:''}`:`<p><strong>${today?'Your entered current value':'Generic UK context — no derivative-level source'}</strong></p><p>${today?`Starting at ${gbp(i.price)} and applying your ${Math.round(i.tail*100)}% annual depreciation assumption.`:'RAC reports new cars can lose 15–35% in the first year and 40–60% over three years. The default curve uses the midpoints; it is not RAC’s forecast for your car.'}</p><p>Use a reputable current quote for your exact derivative, mileage and condition before making a buying decision.</p><a class="source-link" href="${sources.rac.url}" target="_blank" rel="noopener">Read RAC’s depreciation guidance ↗</a> · <a class="source-link" href="https://www.whatcar.com/car-valuation" target="_blank" rel="noopener">Get a separate vehicle valuation ↗</a>`;
 $('table-body').innerHTML=c.points.map(p=>`<tr><td>${p.year}</td><td>${p.age} years</td><td>${gbp(p.value)}</td><td>${gbp(i.price-p.value)}</td></tr>`).join('');
 $('inspect').disabled=false;$('inspect').max=i.horizon;hoverAge=Math.min(hoverAge,i.horizon);$('inspect').value=hoverAge;
 $('download').disabled=false;$('save').disabled=false;
 document.querySelectorAll('[data-years]').forEach(b=>{b.classList.toggle('active',+b.dataset.years===horizon);b.setAttribute('aria-pressed',String(+b.dataset.years===horizon));});
 drawChart();inspect(hoverAge);
}
const chartBox={left:62,right:736,top:28,bottom:293};
function drawChart(){
 const {input:i,curve:c,car}=current,{left:L,right:R,top:T,bottom:B}=chartBox;
 const top=Math.ceil(i.price/4/1000)*1000*4;
 const x=t=>L+(R-L)*t/i.horizon,y=v=>B-(B-T)*v/top;
 current.xy={x,y,top};
 const path=(from,to)=>{const n=Math.max(1,Math.ceil((to-from)*20));return Array.from({length:n+1},(_,a)=>{const t=from+(to-from)*a/n;return `${a?'L':'M'}${x(t).toFixed(2)},${y(c.valueAt(t)).toFixed(2)}`;}).join(' ');};
 let svg=`<title>${esc(i.label)}: modelled depreciation over ${i.horizon} years</title><desc>Starting at ${gbp(i.price)}, ending at ${gbp(c.end)}. Values are scenarios, not observed transactions. A year-by-year table follows.</desc><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d3bc" stop-opacity=".5"/><stop offset="1" stop-color="#e6f0e0" stop-opacity=".15"/></linearGradient></defs>`;
 for(let j=0;j<=4;j++){const v=top*j/4,yy=y(v);svg+=`<line x1="${L}" y1="${yy}" x2="${R}" y2="${yy}" stroke="#e9eee5"/><text x="${L-12}" y="${yy+4}" text-anchor="end">£${Math.round(v/1000)}k</text>`;}
 for(let j=0;j<=i.horizon;j++){if(i.horizon===10&&j%2)continue;svg+=`<text x="${x(j)}" y="${B+25}" text-anchor="middle">${c.startYear+j}</text><text x="${x(j)}" y="${B+42}" text-anchor="middle" style="font-size:9px">${j===0?'Start':`+${j} yr`}</text>`;}
 svg+=`<path d="${path(0,i.horizon)} L${R},${B} L${L},${B} Z" fill="url(#fill)"/>`;
 if(i.basis==='today')svg+=`<path d="${path(0,i.horizon)}" fill="none" stroke="#147c70" stroke-width="3" stroke-dasharray="7 5"/>`;
 else {svg+=`<path d="${path(0,Math.min(3,i.horizon))}" fill="none" stroke="#147c70" stroke-width="3"/>`;if(i.horizon>3)svg+=`<path d="${path(3,i.horizon)}" fill="none" stroke="#147c70" stroke-width="3" stroke-dasharray="7 5"/>`;}
 if(car&&i.price===car.price&&i.horizon>=3){svg+=`<circle cx="${x(3)}" cy="${y(car.residual)}" r="5" fill="#173132" stroke="white" stroke-width="2"/><text x="${x(3)+(i.horizon===3?-12:12)}" y="${y(car.residual)-14}" text-anchor="${i.horizon===3?'end':'start'}" style="fill:#173132;font-size:10px">Published: ${gbp(car.residual)}</text>`;}
 svg+=`<line id="focus-line" x1="${L}" x2="${L}" y1="${T}" y2="${B}" stroke="#719c8b" stroke-dasharray="3 5" opacity=".65"/><circle id="focus-dot" cx="${L}" cy="${y(i.price)}" r="5" fill="#fff" stroke="#147c70" stroke-width="2"/><rect id="plot-hit" x="${L}" y="${T}" width="${R-L}" height="${B-T}" fill="transparent"/>`;
 $('chart').innerHTML=svg;
}
function inspect(t,tooltip=false){
 if(!current)return;hoverAge=t;const {curve:c,xy}=current,v=c.valueAt(t);
 $('inspect-output').textContent=`${c.startYear+t} · ${gbp(v)} · ${gbp(current.input.price-v)} lost`;
 $('focus-line').setAttribute('x1',xy.x(t));$('focus-line').setAttribute('x2',xy.x(t));$('focus-dot').setAttribute('cx',xy.x(t));$('focus-dot').setAttribute('cy',xy.y(v));
 if(tooltip){const box=$('chart').getBoundingClientRect(),tip=$('chart-tooltip');tip.textContent=`${c.startYear+t} · ${gbp(v)}`;tip.hidden=false;tip.style.left=`${Math.max(0,Math.min(box.width-145,xy.x(t)/760*box.width-55))}px`;tip.style.top=`${Math.max(0,xy.y(v)/350*box.height-43)}px`;}
}
$('inspect').addEventListener('input',()=>inspect(+$('inspect').value));
$('chart').addEventListener('pointermove',e=>{if(!current)return;const box=$('chart').getBoundingClientRect(),xx=(e.clientX-box.left)*760/box.width,t=Math.max(0,Math.min(horizon,Math.round((xx-chartBox.left)/(chartBox.right-chartBox.left)*horizon)));$('inspect').value=t;inspect(t,true);});
$('chart').addEventListener('pointerleave',()=>$('chart-tooltip').hidden=true);
for(const b of document.querySelectorAll('[data-years]'))b.addEventListener('click',()=>{horizon=+b.dataset.years;if(current)calculate();else{document.querySelectorAll('[data-years]').forEach(x=>x.classList.toggle('active',x===b));}});
$('download').addEventListener('click',()=>{if(!current)return;const blob=new Blob(['\ufeff'+csvFor(current.input,current.curve,sourceLabel())],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='car-curve-uk.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function persist(){try{localStorage.setItem('carcurve:saved',JSON.stringify(saved));}catch{toast('Saved for this session only; browser storage is unavailable.');}renderSaved();}
function renderSaved(){
 const valid=[];for(const r of saved){try{valid.push({...r,curve:makeCurve(r.input,nowYear)});}catch{}}saved=valid.map(({input,source})=>({input,source}));
 $('comparisons').hidden=!valid.length;
 $('comparison-grid').innerHTML=valid.map((r,n)=>`<article class="comparison"><h3>${esc(r.input.make+' '+r.input.model)}</h3><p>${esc(r.input.trim)} · ${r.input.year}</p><p>${r.input.horizon} years · ${r.input.basis==='today'?'from value today':'from new'} · start ${gbp(r.input.price)}</p><strong>${gbp(r.curve.loss)}</strong><p>value lost · ${gbp(r.curve.monthly)}/month</p><p>${esc(r.source||'Custom scenario')}</p><button data-remove="${n}">Remove</button></article>`).join('');
 document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{saved.splice(+b.dataset.remove,1);persist();}));
}
$('save').addEventListener('click',()=>{if(!current)return;if(saved.length>=3){toast('Three scenarios saved. Remove one to add another.');return;}saved.push({input:{...current.input},source:current.car?`Reference: ${date(sources[current.car.source].date)}`:'Illustrative; not vehicle-specific'});persist();toast('Scenario saved below for comparison.');});
$('clear-saved').addEventListener('click',()=>{saved=[];persist();});
renderSaved();selectReference(cars.find(c=>c.model==='Macan').id);
