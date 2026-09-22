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
  it("does not manufacture a positive result when worse dominates", () => {
    const result=experimentSummary({...base,checks:[{date:"1",done:true,effect:"worse"},{date:"2",done:true,effect:"worse"},{date:"3",done:true,effect:"better"}]});
    assert.equal(result.direction,"worse");
  });
});
