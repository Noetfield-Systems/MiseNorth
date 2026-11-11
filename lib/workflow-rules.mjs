export const ORDER_TRANSITIONS=Object.freeze({new:["accepted","cancelled"],accepted:["preparing","cancelled"],preparing:["ready","cancelled"],ready:["completed","cancelled"],completed:[],cancelled:[]});
export const RESERVATION_TRANSITIONS=Object.freeze({requested:["confirmed","cancelled","no_show"],confirmed:["seated","cancelled","no_show"],seated:["completed"],completed:[],cancelled:[],no_show:[]});
export function canTransition(current,next,transitions){return current===next||(Object.hasOwn(transitions,current)&&transitions[current].includes(next));}
export function reservationSeatLimit(configured,fallback=20){return Number.isInteger(configured)&&configured>0?configured:fallback;}
export function canFitReservation(configured,booked,requested,fallback=20){if(![configured,booked,requested,fallback].every(Number.isInteger)||booked<0||requested<1||fallback<1)return false;return booked+requested<=reservationSeatLimit(configured,fallback);}

export function allowedStatuses(current,transitions){return [current,...(Object.hasOwn(transitions,current)?transitions[current]:[])];}
