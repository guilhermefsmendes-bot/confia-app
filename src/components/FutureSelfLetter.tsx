import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, Mail, Pencil, Trash2 } from "lucide-react";

type FutureLetterRecord = {
  id: string;
  content: string;
  createdAt: string;
  returnDate: string;
  readAt?: string;
};

const STORAGE_KEY = "confia_future_self_letters_v1";

function localDate(value: Date) {
  return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
}

function defaultReturnDate() {
  const date = new Date();
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 6);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return localDate(date);
}

function readLetters(): FutureLetterRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FutureLetterRecord =>
      Boolean(item) && typeof item.id === "string" &&
      typeof item.content === "string" && typeof item.createdAt === "string" &&
      typeof item.returnDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.returnDate)
    ).slice(-100);
  } catch {
    return [];
  }
}

export default function FutureSelfLetter() {
  const { t, i18n } = useTranslation();
  const [letters, setLetters] = useState<FutureLetterRecord[]>(readLetters);
  const [draft, setDraft] = useState("");
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [saved, setSaved] = useState(false);
  const today = localDate(new Date());

  const ordered = useMemo(
    () => [...letters].sort((a, b) => a.returnDate.localeCompare(b.returnDate) || b.createdAt.localeCompare(a.createdAt)),
    [letters],
  );
  const ready = ordered.filter(letter => letter.returnDate <= today && !letter.readAt);
  const historyLetters = ordered.filter(letter => letter.returnDate > today || Boolean(letter.readAt));
  const dateLabel = (value: string) => {
    const date = new Date(value + "T12:00:00");
    return Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(date)
      : value;
  };

  const persist = (next: FutureLetterRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-100)));
      setLetters(next.slice(-100));
      setStorageError(false);
      setSaved(true);
      return true;
    } catch {
      setStorageError(true);
      setSaved(false);
      return false;
    }
  };

  const resetEditor = () => {
    setDraft("");
    setReturnDate(defaultReturnDate());
    setEditingId(null);
    setSaved(false);
  };

  const save = () => {
    const content = draft.trim();
    if (!content || !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) return;
    const existing = editingId ? letters.find(letter => letter.id === editingId) : undefined;
    const nextLetter: FutureLetterRecord = {
      id: existing?.id || "future_letter_" + Date.now().toString(36),
      content,
      createdAt: existing?.createdAt || new Date().toISOString(),
      returnDate,
      ...(existing?.readAt && existing.content === content && existing.returnDate === returnDate ? { readAt: existing.readAt } : {}),
    };
    const next = existing
      ? letters.map(letter => letter.id === existing.id ? nextLetter : letter)
      : [...letters, nextLetter];
    if (persist(next)) {
      resetEditor();
      setSaved(true);
    }
  };

  const edit = (letter: FutureLetterRecord) => {
    setEditingId(letter.id);
    setDraft(letter.content);
    setReturnDate(letter.returnDate);
    setSaved(false);
  };

  const remove = (letter: FutureLetterRecord) => {
    if (!window.confirm(t("personalMap.future.confirmDelete"))) return;
    persist(letters.filter(item => item.id !== letter.id));
    if (editingId === letter.id) resetEditor();
  };

  const markRead = (letter: FutureLetterRecord) => {
    persist(letters.map(item => item.id === letter.id ? { ...item, readAt: new Date().toISOString() } : item));
  };

  return (
    <section className="mt-4 rounded-[30px] border border-[#E8DDD7] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3E9E4] text-[#934A38]">
          <Mail size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#B86B52]">{t("personalMap.future.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-black text-[#3F2C27]">{t("personalMap.future.sectionTitle")}</h2>
          <p className="mt-2 text-xs leading-5 text-[#806D65]">{t("personalMap.future.title")}</p>
        </div>
      </div>

      {ready.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#D8E4D7] bg-[#F4F8F2] p-4">
          <p className="text-xs font-black text-[#49664D]">{t("personalMap.future.ready", { count: ready.length })}</p>
          <div className="mt-3 space-y-3">
            {ready.map(letter => (
              <article key={letter.id} className="rounded-xl bg-white p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#49362F]">{letter.content}</p>
                <p className="mt-2 text-[10px] text-[#806D65]">{t("personalMap.future.writtenOn", { date: dateLabel(letter.createdAt.slice(0, 10)) })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => markRead(letter)} className="min-h-10 rounded-full bg-[#E7F0E4] px-4 text-xs font-bold text-[#49664D]">{t("personalMap.future.markRead")}</button>
                  <button type="button" onClick={() => edit(letter)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"><Pencil size={12} />{t("personalMap.future.edit")}</button>
                  <button type="button" onClick={() => remove(letter)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"><Trash2 size={12} />{t("personalMap.future.delete")}</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-[#F8F3F0] p-4">
        <label htmlFor="confia-future-letter" className="block text-xs font-bold text-[#594A43]">{t("personalMap.future.writeLabel")}</label>
        <textarea id="confia-future-letter" value={draft} onChange={event => { setDraft(event.target.value); setSaved(false); }} maxLength={4000} rows={5} placeholder={t("personalMap.future.placeholder")} className="mt-2 min-h-28 w-full rounded-xl border border-[#E8DDD7] bg-white p-3 text-sm leading-6 text-[#49362F] outline-none focus:border-[#A66C55]" />
        <label htmlFor="confia-future-date" className="mt-3 flex items-center gap-2 text-xs font-bold text-[#594A43]">
          <CalendarClock size={15} />
          {t("personalMap.future.dateLabel")}
        </label>
        <input id="confia-future-date" type="date" min={editingId ? undefined : today} value={returnDate} onChange={event => setReturnDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#E8DDD7] bg-white px-3 text-sm text-[#49362F]" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!draft.trim() || !returnDate || (!editingId && returnDate < today)} onClick={save} className="min-h-11 rounded-full bg-[#934A38] px-4 py-2 text-xs font-black text-white disabled:opacity-40">{t("personalMap.future.saveLetter")}</button>
          {editingId && <button type="button" onClick={resetEditor} className="min-h-11 rounded-full border border-[#E8DDD7] bg-white px-4 py-2 text-xs font-bold text-[#806D65]">{t("personalMap.future.cancel")}</button>}
        </div>
        {saved && <p role="status" className="mt-2 text-[10px] text-[#587563]">{t("personalMap.future.saved")}</p>}
        {storageError && <p role="alert" className="mt-2 text-[10px] text-red-700">{t("personalMap.future.storageError")}</p>}
        <p className="mt-2 text-[10px] leading-4 text-[#8A7971]">{t("personalMap.future.localOnly")}</p>
      </div>

      {historyLetters.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs font-black text-[#49362F]">{t("personalMap.future.history")}</h3>
          <div className="mt-2 space-y-2">
            {historyLetters.map(letter => (
              <details key={letter.id} className="rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-3">
                <summary className="min-h-10 cursor-pointer text-xs font-bold text-[#594A43]">
                  {t("personalMap.future.returnDate", { date: dateLabel(letter.returnDate) })}
                  {letter.readAt ? " · " + t("personalMap.future.read") : ""}
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#594A43]">{letter.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(letter)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"><Pencil size={12} />{t("personalMap.future.edit")}</button>
                  <button type="button" onClick={() => remove(letter)} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[#E8DDD7] bg-white px-3 text-[10px] font-bold text-[#806D65]"><Trash2 size={12} />{t("personalMap.future.delete")}</button>
                </div>
              </details>
            ))}
          </div>
        </div>
      ) : ready.length === 0 ? (
        <p className="mt-4 text-xs leading-5 text-[#806D65]">{t("personalMap.future.empty")}</p>
      ) : null}
    </section>
  );
}
