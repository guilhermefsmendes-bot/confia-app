import assert from "node:assert/strict";
import test from "node:test";

const localStorageValues = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
  },
});

const [{ default: i18n }, { initLanguage, setLanguage }] = await Promise.all([
  import("./index"),
  import("./language"),
]);

test("loads only the selected locale and keeps all four language choices available", async () => {
  localStorageValues.set("confia_language", "pt");
  await initLanguage();

  assert.equal(i18n.language, "pt");
  assert.equal(i18n.hasResourceBundle("pt", "translation"), true);
  assert.equal(i18n.hasResourceBundle("en", "translation"), false);
  assert.equal(i18n.hasResourceBundle("es", "translation"), false);
  assert.equal(i18n.hasResourceBundle("fr", "translation"), false);

  await setLanguage("fr");
  assert.equal(i18n.language, "fr");
  assert.equal(i18n.hasResourceBundle("fr", "translation"), true);
  assert.equal(i18n.hasResourceBundle("es", "translation"), false);
});

test("auto language resolves to a supported language", async () => {
  await setLanguage("auto");
  assert.ok(["pt", "en", "es", "fr"].includes(i18n.language));
});
