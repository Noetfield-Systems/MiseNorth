import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ORDER_TRANSITIONS,RESERVATION_TRANSITIONS,canTransition,canFitReservation,reservationSeatLimit,allowedStatuses} from "../lib/workflow-rules.mjs";
const scenarios=JSON.parse(readFileSync(new URL("../fixtures/demo-scenarios.json",import.meta.url),"utf8"));
test("ten independent Vancouver sample tenants have complete synthetic fixtures",()=>{
 assert.equal(scenarios.length,10);assert.equal(new Set(scenarios.map(x=>x.slug)).size,10);
 assert.equal(new Set(scenarios.map(x=>x.area)).size,10);
 for(const s of scenarios){
  assert.match(s.slug,/^demo-/);assert.match(s.ownerEmail,/\.demo\.test$/);assert.equal(s.city,"Vancouver");assert.equal(s.province,"BC");
  assert.ok(s.categories.length>=2);assert.ok(s.tables.length>=1);assert.equal(s.guests.length,3);assert.equal(s.orders.length,3);assert.ok(s.campaign);
  for(const g of s.guests)assert.match(g.email,/\.test$/);
  for(const o of s.orders)assert.ok(Object.hasOwn(ORDER_TRANSITIONS,o.status));
  for(const b of s.reservations)assert.ok(Object.hasOwn(RESERVATION_TRANSITIONS,b.status));
 }
});
test("order workflow prevents skipped kitchen stages and terminal reversals",()=>{
 assert.equal(canTransition("new","accepted",ORDER_TRANSITIONS),true);assert.equal(canTransition("new","completed",ORDER_TRANSITIONS),false);assert.equal(canTransition("preparing","ready",ORDER_TRANSITIONS),true);assert.equal(canTransition("completed","preparing",ORDER_TRANSITIONS),false);assert.equal(canTransition("cancelled","accepted",ORDER_TRANSITIONS),false);
});
test("reservation workflow keeps confirmation and seating explicit",()=>{
 assert.equal(canTransition("requested","confirmed",RESERVATION_TRANSITIONS),true);assert.equal(canTransition("requested","seated",RESERVATION_TRANSITIONS),false);assert.equal(canTransition("confirmed","seated",RESERVATION_TRANSITIONS),true);assert.equal(canTransition("seated","completed",RESERVATION_TRANSITIONS),true);assert.equal(canTransition("completed","confirmed",RESERVATION_TRANSITIONS),false);
});
test("reservation capacity uses configured covers or the conservative soft cap",()=>{
 assert.equal(reservationSeatLimit(12),12);assert.equal(reservationSeatLimit(0),20);assert.equal(canFitReservation(12,8,4),true);assert.equal(canFitReservation(12,8,5),false);assert.equal(canFitReservation(0,18,2),true);assert.equal(canFitReservation(0,18,3),false);
});
test("owner controls display only legal next statuses",()=>{
 assert.deepEqual(allowedStatuses("new",ORDER_TRANSITIONS),["new","accepted","cancelled"]);
 assert.deepEqual(allowedStatuses("ready",ORDER_TRANSITIONS),["ready","completed","cancelled"]);
 assert.deepEqual(allowedStatuses("completed",ORDER_TRANSITIONS),["completed"]);
 assert.deepEqual(allowedStatuses("requested",RESERVATION_TRANSITIONS),["requested","confirmed","cancelled","no_show"]);
 assert.deepEqual(allowedStatuses("seated",RESERVATION_TRANSITIONS),["seated","completed"]);
});
