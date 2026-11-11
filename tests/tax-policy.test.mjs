import test from "node:test";
import assert from "node:assert/strict";
import {canAcceptOrdersWithTax} from "../lib/tax-policy.mjs";

test("new merchant tax is not verified by default",()=>{
  assert.equal(canAcceptOrdersWithTax({tax_rate:0,tax_rate_verified:false}),false);
});
test("legacy twelve percent values remain blocked until merchant verification",()=>{
  assert.equal(canAcceptOrdersWithTax({tax_rate:0.12,tax_rate_verified:false}),false);
});
test("a verified merchant rate within the platform's configured range is accepted",()=>{
  assert.equal(canAcceptOrdersWithTax({tax_rate:0.05,tax_rate_verified:true}),true);
  assert.equal(canAcceptOrdersWithTax({tax_rate:"0.12",tax_rate_verified:true}),true);
  assert.equal(canAcceptOrdersWithTax({tax_rate:0,tax_rate_verified:true}),true);
});
test("missing, non-finite and out-of-range tax rates fail closed",()=>{
  assert.equal(canAcceptOrdersWithTax({tax_rate:0.12}),false);
  assert.equal(canAcceptOrdersWithTax({tax_rate:NaN,tax_rate_verified:true}),false);
  assert.equal(canAcceptOrdersWithTax({tax_rate:null,tax_rate_verified:true}),false);
  assert.equal(canAcceptOrdersWithTax({tax_rate:0.26,tax_rate_verified:true}),false);
});
