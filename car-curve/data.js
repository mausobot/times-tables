export const checked = '2026-10-20';
export const sources = {
 slowSUV:{name:'What Car? · Slowest-depreciating SUVs',date:'2025-06-08',url:'https://www.whatcar.com/best/slowest-depreciating-suvs/n24866'},
 fastSUV:{name:'What Car? · Fastest-depreciating SUVs',date:'2025-06-21',url:'https://www.whatcar.com/best/the-10-fastest-depreciating-suvs/n24885'},
 slow:{name:'What Car? · Slowest-depreciating cars',date:'2025-03-19',url:'https://www.whatcar.com/best/the-10-slowest-depreciating-cars/n17098'},
 fast:{name:'What Car? · Fastest-depreciating cars',date:'2025-03-10',url:'https://www.whatcar.com/best/the-10-fastest-depreciating-cars/n17027'},
 rac:{name:'RAC · Buying a new car in the UK',date:'2025-02-17',url:'https://www.rac.co.uk/drive/advice/buying-and-selling-guides/tips-and-advice-for-buying-a-new-car-in-the-uk/'},
 cap:{name:'CAP HPI · UK valuation API',url:'https://api.cap-hpi.co.uk/docs/index.html'}
};
// Facts transcribed from each article's Model / List price / 36k/3yr resale line.
// These are dated new-car forecasts, NOT observed sales or present valuations.
const raw = [
 ['Lamborghini','Urus','4.0 TFSI V8 S',197054,137525,'slowSUV'],
 ['Mercedes-Benz','G-Class','G580 EQ Tech AMG Line',154870,99800,'slowSUV'],
 ['Land Rover','Defender 90','3.0 D350 X-Dynamic SE 3dr',65240,41100,'slowSUV'],
 ['Fiat','Grande Panda','1.2 Hybrid 110 Icon',18540,10975,'slowSUV'],
 ['Porsche','Macan','T',61000,35800,'slowSUV'],
 ['Land Rover','Range Rover Sport','3.0 D250 S',76350,44475,'slowSUV'],
 ['Lexus','LBX','1.5 Urban',30915,17550,'slowSUV'],
 ['Mercedes-Benz','GLE Coupé','400e 4Matic Urban Edition',83490,47250,'slowSUV'],
 ['DS','3 E-Tense','Pallas',39210,9675,'fastSUV'],
 ['Vauxhall','Mokka Electric','GS 54kWh',34280,10375,'fastSUV','The article’s price-drop field is inconsistent. This app calculates depreciation from its published list and resale prices, which agree with its retained percentage.'],
 ['Peugeot','e-2008','GT 54kWh',37450,11750,'fastSUV'],
 ['Lexus','UX 300e','Takumi',51145,16075,'fastSUV'],
 ['Volvo','EC40','Plus 69kWh',52410,17200,'fastSUV'],
 ['Mercedes-Benz','EQA','250+ AMG Line Premium Plus',58215,19625,'fastSUV'],
 ['Genesis','GV60','77.4kWh Comfort',54855,18550,'fastSUV'],
 ['Citroën','ë-C4','You 50kWh Standard Range',27650,9375,'fastSUV'],
 ['Toyota','bZ4X','Vision 71.4kWh',49910,17825,'fastSUV'],
 ['DS','7','1.5 BlueHDi Etoile EAT8',44600,16050,'fastSUV'],
 ['Volkswagen','California','2.0 TDI Beach Camper',63376,43875,'slow'],
 ['Bentley','Flying Spur','4.0 V8 Hybrid Mulliner',244145,148875,'slow'],
 ['Porsche','911','Carrera',99800,59525,'slow'],
 ['MINI','Cooper','1.5 C Classic',25265,14475,'slow'],
 ['Vauxhall','Corsa Electric','Design 50kWh',29045,8300,'fast'],
 ['DS','9','1.6 E-Tense 4x4 Opera',61800,18200,'fast'],
 ['Mazda','MX-30 EV','Makoto',32395,9900,'fast'],
 ['Jeep','Compass','1.3 T4 GSE PHEV Summit',44655,13875,'fast'],
 ['Audi','A8','55 TFSI quattro Sport Tiptronic',82485,25900,'fast'],
 ['BMW','8 Series','M850i xDrive',117975,37975,'fast'],
 ['Audi','A6','50 TFSIe quattro Sport S Tronic',60585,19825,'fast'],
 ['Peugeot','e-208','Allure',29950,9925,'fast']
];
export const cars = raw.map(([make,model,trim,price,residual,source,note],i)=>({id:`uk-${i+1}`,make,model,trim,price,residual,source,note,referenceYear:2025,miles:36000,term:3}));
export const makes = [...new Set([...cars.map(c=>c.make),'Ford','Honda','Hyundai','Kia','Nissan','Renault','SEAT','Škoda','Tesla'])].sort();
