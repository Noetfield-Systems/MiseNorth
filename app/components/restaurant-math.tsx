"use client";
import {useState} from "react";
export default function RestaurantMath(){
 const [requests,setRequests]=useState(2),[ticket,setTicket]=useState(35);
 const potential=requests*ticket*30;
 const money=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(n);
 return <div className="mn-math">
  <div className="mn-math-settings"><label htmlFor="mn-requests">Additional fulfilled guest requests per day <strong>{requests}</strong></label><input id="mn-requests" type="range" min="0" max="10" value={requests} onChange={e=>setRequests(Number(e.target.value))}/><div className="mn-range-ends"><span>0</span><span>10</span></div><label htmlFor="mn-ticket">Average sale value, if fulfilled <strong>{money(ticket)}</strong></label><input id="mn-ticket" type="range" min="10" max="100" step="5" value={ticket} onChange={e=>setTicket(Number(e.target.value))}/><div className="mn-range-ends"><span>$10</span><span>$100</span></div></div>
  <div className="mn-math-result"><small>HYPOTHETICAL MONTHLY GROSS SALES</small><strong>{money(potential)}</strong><span>{requests} additional fulfilled requests × {money(ticket)} × 30 days</span><div className="mn-math-split"><span>MiseNorth proposed subscription</span><b>$99/month</b></div><p>This is scenario arithmetic, not a sales forecast. No increase in requests, fulfilment rate or profit is assumed to occur. Food payments remain with your existing provider. Costs, fees, taxes and the one-time setup are excluded.</p></div>
 </div>;
}
