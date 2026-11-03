import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import i18n, { ensureFeatureNamespace, i18nReady, type ConfiaLanguage, type FeatureNamespace } from "../index";

const languages: ConfiaLanguage[] = ["pt", "en", "es", "fr"];
const namespaces: FeatureNamespace[] = ["habits", "innerCanvas", "companion", "patternsNew"];

test("feature locale namespaces are complete in all supported languages and load on demand", async () => {
  await i18nReady;
  for (const namespace of namespaces) {
    let expectedKeys: string[] | undefined;
    for (const language of languages) {
      const path = `src/locales/features/${language}/${namespace}.json`;
      const feature = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
      const keys = Object.keys(feature).sort();
      if (expectedKeys) assert.deepEqual(keys, expectedKeys, `${namespace} keys differ in ${language}`);
      else expectedKeys = keys;

      const base = JSON.parse(readFileSync(`src/locales/${language}.json`, "utf8")) as Record<string, unknown>;
      for (const key of keys) assert.equal(base[key], undefined, `${key} must live only in the ${namespace} namespace`);

      await ensureFeatureNamespace(language, namespace);
      assert.equal(i18n.hasResourceBundle(language, namespace), true);
      assert.deepEqual(Object.keys(i18n.getResourceBundle(language, namespace) || {}).sort(), keys);
    }
  }
});
