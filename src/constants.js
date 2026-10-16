// Constants and time-option helper for the booking form.

export const STEPS = ['Event details','Contact info','AV & Food','Floor plan','Review & submit'];
export const CAPS  = { a:105, ab:250 };
export const LIMITS = {
  a:  { tables:8,  rect:5, chairs:6, looseChairs:105, cruisers:9 },
  ab: { tables:10, rect:5, chairs:6, looseChairs:120, cruisers:9 }
};

// `minExclusive` (an "HH:MM" string) drops every option at or before that time,
// so a later dropdown can only offer times strictly after an earlier one.
export function timeOptions(selected='', minExclusive=''){
  let opts = '<option value="">Select time</option>';
  for(let h=8;h<=22;h++){
    for(let m=0;m<60;m+=15){
      if(h===22&&m>0) break;
      const hh = h.toString().padStart(2,'0');
      const mm = m.toString().padStart(2,'0');
      const val = `${hh}:${mm}`;
      if(minExclusive && val<=minExclusive) continue;
      const ampm = h<12?'AM':h===12?'PM':'PM';
      const hr12 = h>12?h-12:h===0?12:h;
      const label = `${hr12}:${mm} ${ampm}`;
      opts += `<option value="${val}"${selected===val?' selected':''}>${label}</option>`;
    }
  }
  return opts;
}
