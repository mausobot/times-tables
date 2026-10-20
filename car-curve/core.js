export const normalise = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function findCar(cars,make,model,trim) { return cars.find(c=>normalise(c.make)===normalise(make)&&normalise(c.model)===normalise(model)&&normalise(c.trim)===normalise(trim)); }
export function validate({year,price,horizon,tail,retention,basis},nowYear) {
 if (!Number.isInteger(year)||year<2000||year>nowYear) throw Error(`Enter a registration year between 2000 and ${nowYear}.`);
 if (!Number.isFinite(price)||price<500||price>2000000) throw Error('Enter a price between £500 and £2,000,000.');
 if (!Number.isInteger(horizon)||horizon<1||horizon>10) throw Error('Choose a period from 1 to 10 years.');
 if (!Number.isFinite(tail)||tail<.01||tail>.5) throw Error('Annual depreciation must be between 1% and 50%.');
 if (!Number.isFinite(retention)||retention<.05||retention>.99) throw Error('Three-year retention must be between 5% and 99%.');
 if (!['new','today'].includes(basis)) throw Error('Choose a starting-price basis.');
}
// Source benchmark: constant percentage interpolation passes through both published points.
// Beyond three years, decay is a user-editable assumption, not a source forecast.
export function ratio(age,retention,tail=.15,generic=false) {
 if (!Number.isFinite(age)||age<0) throw Error('Age must be non-negative.');
 if(age===0)return 1;
 if(generic&&age<=1)return Math.pow(.75,age);
 if(generic&&age<=3)return .75*Math.pow(retention/.75,(age-1)/2);
 if(age<=3)return Math.pow(retention,age/3);
 return retention*Math.pow(1-tail,age-3);
}
export function makeCurve(input,nowYear=new Date().getFullYear()) {
 validate(input,nowYear);
 const {year,price,horizon,tail,retention,basis,generic=false}=input;
 const startAge=basis==='today'?nowYear-year:0;
 const startYear=basis==='today'?nowYear:year;
 // A current-value scenario starts from the user's quote. No inferred past prices.
 const valueAt=t=>basis==='today'?price*Math.pow(1-tail,t):price*ratio(t,retention,tail,generic);
 const points=Array.from({length:horizon+1},(_,t)=>({t,age:startAge+t,year:startYear+t,value:valueAt(t)}));
 const end=points.at(-1).value,loss=price-end;
 return {points,startAge,startYear,end,loss,monthly:loss/(horizon*12),retained:end/price,valueAt};
}
export function csvFor(input,curve,sourceLabel) {
 const safe=s=>{s=String(s);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['Vehicle',input.label],['Basis',input.basis==='today'?'User-entered value today':'Price when new'],['Data',sourceLabel],['Note','Modelled scenario, not observed price history or a live valuation'],[],['Calendar year','Vehicle age (approx years)','Years from start','Modelled value GBP','Cumulative loss GBP']];
 for(const p of curve.points)rows.push([p.year,p.age,p.t,Math.round(p.value),Math.round(input.price-p.value)]);
 return rows.map(r=>r.map(safe).join(',')).join('\r\n');
}
