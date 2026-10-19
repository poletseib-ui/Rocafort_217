// Work in cents so the two monthly contributions always add up to the rent.
export function contributions(settings, totals={pol:0,partner:0}) {
  const total=Math.round(settings.rent*100);
  let pol;
  if(settings.split==='percentage')pol=Math.round(total*settings.share/100);
  else if(settings.split==='amount')pol=Math.round(settings.share*100);
  else if(settings.split==='presence'){
    const hours=totals.pol+totals.partner;
    if(!hours)return {pol:NaN,partner:NaN};
    pol=Math.round(total*totals.pol/hours);
  }else pol=Math.round(total/2);
  return {pol:pol/100,partner:(total-pol)/100};
}
