export type TransitionTable=Readonly<Record<string,readonly string[]>>;
export const ORDER_TRANSITIONS:TransitionTable;
export const RESERVATION_TRANSITIONS:TransitionTable;
export function canTransition(current:string,next:string,transitions:TransitionTable):boolean;
export function reservationSeatLimit(configured:number,fallback?:number):number;
export function canFitReservation(configured:number,booked:number,requested:number,fallback?:number):boolean;

export function allowedStatuses(current:string,transitions:TransitionTable):string[];
