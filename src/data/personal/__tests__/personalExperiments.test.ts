import { EXPERIMENT_TEMPLATES } from "../personalExperiments";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { experimentSummary, type PersonalExperiment } from "../personalExperiments";

const base: PersonalExperiment = { id:"x", hypothesis:"h", metric:"m", startedAt:"2026-09-01", status:"complete", checks:[] };

describe("personal experiment evidence", () => {
  it("does not claim enough evidence before three completed checks", () => {
    const result=experimentSummary({...base,checks:[{date:"1",done:true,effect:"better"},{date:"2",done:true,effect:"better"}]});
    assert.equal(result.enough,false);
  });
  it("summarises direction only from completed intervention days", () => {
    const result=experimentSummary({...base,checks:[{date:"1",done:true,effect:"better"},{date:"2",done:true,effect:"better"},{date:"3",done:true,effect:"same"},{date:"4",done:false,effect:null}]});
    assert.equal(result.enough,true); assert.equal(result.direction,"better"); assert.equal(result.done,3); assert.equal(result.better,2);
  });
  it("requires at least half the planned days before summarising a 7- or 14-day experiment", () => {
    const checks = Array.from({length: 4}, (_, index) => ({date:String(index),done:true,effect:"better" as const}));
    assert.equal(experimentSummary({...base,durationDays:7,checks}).enough,true);
    assert.equal(experimentSummary({...base,durationDays:14,checks}).enough,false);
  });
  it("does not manufacture a positive result when worse dominates", () => {
    const result=experimentSummary({...base,checks:[{date:"1",done:true,effect:"worse"},{date:"2",done:true,effect:"worse"},{date:"3",done:true,effect:"better"}]});
    assert.equal(result.direction,"worse");
  });
});


describe("personal experiment durations", () => {
  it("offers only 7-day or 14-day starter experiments", () => {
    assert.ok(EXPERIMENT_TEMPLATES.length > 0);
    assert.ok(EXPERIMENT_TEMPLATES.every(template => template.days === 7 || template.days === 14));
  });
});
