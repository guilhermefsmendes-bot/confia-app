import test from "node:test";
import assert from "node:assert/strict";
import pt from "../../locales/pt.json";
import en from "../../locales/en.json";
import es from "../../locales/es.json";
import fr from "../../locales/fr.json";

function leafKeys(value: unknown, prefix = ""): Set<string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Set([prefix]);
  const result = new Set<string>();
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const leaf of leafKeys(child, path)) result.add(leaf);
  }
  return result;
}

test("all supported locales contain the complete baseline dictionary without an English fallback download", () => {
  const baseline = leafKeys(pt);
  for (const [language, dictionary] of Object.entries({ en, es, fr })) {
    const missing = [...baseline].filter(key => !leafKeys(dictionary).has(key));
    assert.deepEqual(missing, [], `${language} is missing translation keys`);
  }
});
