import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { buyItem, getEquipped, getInventory } from "./homeInventory";

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
let values: Map<string, string>;
let failWrites = false;

beforeEach(() => {
  values = new Map();
  failWrites = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failWrites) throw new Error("storage-unavailable");
        values.set(key, String(value));
      },
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; },
    },
  });
});

afterEach(() => {
  if (originalStorage) {
    Object.defineProperty(globalThis, "localStorage", originalStorage);
  } else {
    Reflect.deleteProperty(globalThis, "localStorage");
  }
});

describe("home inventory persistence", () => {
  it("preserves legacy item IDs when reading the inventory", () => {
    localStorage.setItem("home_inventory", JSON.stringify(["legacy_hat", "confia_bow_cream"]));
    assert.deepEqual(getInventory(), ["legacy_hat", "confia_bow_cream"]);
    assert.deepEqual(JSON.parse(localStorage.getItem("home_inventory") ?? "[]"), ["legacy_hat", "confia_bow_cream"]);
  });

  it("preserves legacy equipment IDs when reading equipped items", () => {
    localStorage.setItem("home_equipped", JSON.stringify(["legacy_cape", "confia_scarf_terra"]));
    assert.deepEqual(getEquipped(), ["legacy_cape", "confia_scarf_terra"]);
    assert.deepEqual(JSON.parse(localStorage.getItem("home_equipped") ?? "[]"), ["legacy_cape", "confia_scarf_terra"]);
  });

  it("accepts a purchase only once", () => {
    assert.equal(buyItem("confia_bow_cream"), true);
    assert.equal(buyItem("confia_bow_cream"), false);
    assert.deepEqual(getInventory(), ["confia_bow_cream"]);
  });

  it("rejects IDs outside the Confia catalogue namespace", () => {
    assert.equal(buyItem("legacy_hat"), false);
    assert.deepEqual(getInventory(), []);
  });

  it("does not report a purchase when persistence fails", () => {
    failWrites = true;
    assert.equal(buyItem("confia_bow_cream"), false);
  });
});
