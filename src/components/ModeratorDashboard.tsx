import { useEffect, useMemo, useState } from "react";
import { onSnapshot, collection, query, where, orderBy, limit, updateDoc, doc, serverTimestamp, getDoc, getDocs, type Timestamp } from "firebase/firestore";
import { auth, onAuthStateChanged } from "../firebaseAuth";
import { db } from "../firebaseFirestore";

type ReportStatus = "pending" | "in_review" | "reviewed" | "actioned" | "dismissed";
type ReportRecord = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  postId: string;
  reason: string;
  kind?: string;
  circleId?: string;
  status: ReportStatus;
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  moderatorNotes?: string;
  legalHold?: boolean;
  legalHoldReason?: string;
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Recebida",
  in_review: "Em análise",
  reviewed: "Analisada (registo anterior)",
  actioned: "Resolvida",
  dismissed: "Rejeitada",
};

function formatDate(value?: Timestamp) {
  if (!value || typeof value.toDate !== "function") return "Data não disponível";
  return value.toDate().toLocaleString("pt-PT");
}

export default function ModeratorDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [pendingReports, setPendingReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    let unsubscribeReports: (() => void) | undefined;
    let unsubscribePending: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      unsubscribeReports?.();
      unsubscribePending?.();
      unsubscribeReports = undefined;
      unsubscribePending = undefined;
      if (!user) {
        if (!cancelled) { setAuthorized(false); setAuthChecked(true); setLoading(false); }
        return;
      }
      setLoading(true);
      void user.getIdTokenResult(true).then(token => {
        if (cancelled) return;
        const isModerator = token.claims.moderator === true;
        setAuthorized(isModerator);
        setAuthChecked(true);
        if (!isModerator) { setLoading(false); return; }

        const mapReport = (item: any): ReportRecord => {
          const data = item.data();
          const status = ["pending", "in_review", "reviewed", "actioned", "dismissed"].includes(data.status) ? data.status as ReportStatus : "pending";
          return {
            id: item.id,
            reporterId: typeof data.reporterId === "string" ? data.reporterId : "",
            reportedUserId: typeof data.reportedUserId === "string" ? data.reportedUserId : "",
            postId: typeof data.postId === "string" ? data.postId : "",
            reason: typeof data.reason === "string" ? data.reason : "Sem motivo indicado",
            kind: typeof data.kind === "string" ? data.kind : undefined,
            circleId: typeof data.circleId === "string" ? data.circleId : undefined,
            status,
            createdAt: data.createdAt,
            reviewedAt: data.reviewedAt,
            reviewedBy: typeof data.reviewedBy === "string" ? data.reviewedBy : undefined,
            moderatorNotes: typeof data.moderatorNotes === "string" ? data.moderatorNotes : undefined,
            legalHold: data.legalHold === true,
            legalHoldReason: typeof data.legalHoldReason === "string" ? data.legalHoldReason : undefined,
          };
        };
        // The pending queue is oldest-first and independent of the latest-100 archive,
        // so a high volume of resolved reports cannot hide older pending reports.
        const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(100));
        const pendingQuery = query(collection(db, "reports"), where("status", "in", ["pending", "in_review"]), orderBy("createdAt", "asc"), limit(100));
        unsubscribeReports = onSnapshot(reportsQuery, snapshot => {
          if (cancelled) return;
          setReports(snapshot.docs.map(mapReport));
          setLoading(false);
          setError("");
        }, listenerError => {
          console.error("Erro ao consultar o arquivo de denúncias:", listenerError);
          setError("Não foi possível carregar o arquivo de denúncias. Confirma a autorização de moderador e as regras Firestore.");
          setLoading(false);
        });
        unsubscribePending = onSnapshot(pendingQuery, snapshot => {
          if (cancelled) return;
          setPendingReports(snapshot.docs.map(mapReport));
          setLoading(false);
          setError("");
        }, listenerError => {
          console.error("Erro ao consultar a fila pendente:", listenerError);
          setError("Não foi possível carregar a fila pendente. Confirma a autorização de moderador e os índices Firestore.");
          setLoading(false);
        });
      }).catch(authError => {
        console.error("Erro ao verificar autorização de moderação:", authError);
        if (!cancelled) { setError("Não foi possível verificar a autorização de moderação."); setAuthChecked(true); setLoading(false); }
      });
    });
    return () => {
      cancelled = true;
      unsubscribeReports?.();
      unsubscribePending?.();
      unsubscribeAuth();
    };
  }, []);

  const visibleReports = useMemo(() => filter === "pending" ? pendingReports : reports, [reports, pendingReports, filter]);
  const pendingCount = pendingReports.length;

  const loadContext = async (report: ReportRecord) => {
    if (contexts[report.id] !== undefined || contextLoading === report.id) return;
    setContextLoading(report.id);
    try {
      if (report.circleId) {
        const messages = await getDocs(query(collection(db, "experienceMatchCircles", report.circleId, "messages"), orderBy("createdAt", "desc"), limit(30)));
        const lines = messages.docs.reverse().map(message => {
          const data = message.data();
          const when = formatDate(data.createdAt);
          const text = typeof data.text === "string" ? data.text : "[mensagem sem texto]";
          return `${when} · ${typeof data.senderId === "string" ? data.senderId : "Utilizador"}: ${text}`;
        });
        setContexts(current => ({ ...current, [report.id]: lines.length ? lines.join("\n") : "Não foram encontradas mensagens nesta conversa." }));
      } else if (report.kind === "private_chat" || report.postId.startsWith("listen_")) {
        const messages = await getDocs(query(collection(db, "chats", report.postId, "messages"), orderBy("createdAt", "desc"), limit(30)));
        const lines = messages.docs.reverse().map(message => {
          const data = message.data();
          const when = formatDate(data.createdAt);
          const text = typeof data.text === "string" ? data.text : "[mensagem sem texto]";
          return `${when} · ${typeof data.senderId === "string" ? data.senderId : "Utilizador"}: ${text}`;
        });
        setContexts(current => ({ ...current, [report.id]: lines.length ? lines.join("\n") : "Não foram encontradas mensagens nesta conversa." }));
      } else {
        const post = await getDoc(doc(db, "posts", report.postId));
        if (!post.exists()) setContexts(current => ({ ...current, [report.id]: "A publicação já não existe ou não está disponível." }));
        else {
          const data = post.data();
          setContexts(current => ({ ...current, [report.id]: `${typeof data.userName === "string" ? data.userName : "Utilizador"} · ${typeof data.feeling === "string" ? data.feeling : ""}\n\n${typeof data.message === "string" ? data.message : "[sem texto]"}` }));
        }
      }
    } catch (contextError) {
      console.error("Erro ao carregar contexto da denúncia:", contextError);
      setContexts(current => ({ ...current, [report.id]: "Não foi possível consultar o contexto. Confirma as regras Firestore e a autorização de moderador." }));
    } finally {
      setContextLoading(null);
    }
  };

  const toggleLegalHold = async (report: ReportRecord) => {
    const user = auth.currentUser;
    if (!user || !authorized) return;
    const reason = (notes[report.id] ?? report.moderatorNotes ?? "").trim().slice(0, 500);
    if (!report.legalHold && reason.length < 8) {
      setError("Regista uma justificação com pelo menos 8 caracteres antes de ativar a retenção legal.");
      return;
    }
    setSaving(report.id);
    setError("");
    try {
      await updateDoc(doc(db, "reports", report.id), {
        legalHold: !report.legalHold,
        legalHoldReason: report.legalHold ? "" : reason,
        legalHoldAt: serverTimestamp(),
        legalHoldBy: user.uid,
      });
    } catch (holdError) {
      console.error("Erro ao atualizar retenção legal:", holdError);
      setError("Não foi possível atualizar a retenção legal.");
    } finally {
      setSaving(null);
    }
  };

  const updateReport = async (report: ReportRecord, status: ReportStatus) => {
    const user = auth.currentUser;
    if (!user || !authorized) return;
    setSaving(report.id);
    setError("");
    try {
      await updateDoc(doc(db, "reports", report.id), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        moderatorNotes: (notes[report.id] ?? report.moderatorNotes ?? "").trim().slice(0, 1000),
      });
    } catch (updateError) {
      console.error("Erro ao atualizar denúncia:", updateError);
      setError("Não foi possível guardar a decisão. Verifica a autorização e tenta novamente.");
    } finally {
      setSaving(null);
    }
  };

  if (!authChecked || !authorized) return null;

  return (
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm" aria-label="Painel de moderação">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Acesso restrito</p>
          <h3 className="mt-1 text-base font-black text-[#2F2926]">Moderação da Comunidade</h3>
          <p className="mt-1 text-xs text-[var(--cf-text-soft)]">Fila de denúncias e registo das decisões.</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">{pendingCount >= 100 ? "100+" : pendingCount} por tratar</span>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setFilter("pending")} aria-pressed={filter === "pending"} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === "pending" ? "bg-[#934A38] text-white" : "bg-[#F7F1ED] text-[#5F514B]"}`}>Por tratar</button>
        <button type="button" onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === "all" ? "bg-[#934A38] text-white" : "bg-[#F7F1ED] text-[#5F514B]"}`}>Todas as denúncias</button>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {loading ? <p className="py-6 text-center text-xs text-slate-500">A carregar denúncias…</p> : visibleReports.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">Não existem denúncias nesta vista.</p> : (
        <div className="mt-4 space-y-3">
          {visibleReports.map(report => (
            <article key={report.id} className="rounded-2xl border border-[#E8DDD7] bg-[#FFFCFA] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700">{STATUS_LABELS[report.status]}</span>
                <time className="text-[10px] text-slate-500">{formatDate(report.createdAt)}</time>
              </div>
              <p className="mt-3 text-sm font-bold text-[#382F2B]">{report.reason}</p>
              <button type="button" onClick={() => void loadContext(report)} disabled={contextLoading === report.id} className="mt-3 rounded-xl border border-[#B85F48]/30 bg-[#F3E3DC] px-3 py-2 text-[10px] font-bold text-[#934A38] disabled:opacity-50">{contextLoading === report.id ? "A carregar contexto…" : contexts[report.id] !== undefined ? "Contexto consultado" : "Consultar conteúdo / conversa"}</button>
              {contexts[report.id] !== undefined && <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-3 text-[10px] leading-relaxed text-slate-700">{contexts[report.id]}</pre>}
              <dl className="mt-2 grid grid-cols-1 gap-1 text-[10px] text-slate-600 sm:grid-cols-2">
                <div><dt className="inline font-bold">Denunciado: </dt><dd className="inline break-all">{report.reportedUserId || "Não indicado"}</dd></div>
                <div><dt className="inline font-bold">Denunciante: </dt><dd className="inline break-all">{report.reporterId || "Não indicado"}</dd></div>
                <div><dt className="inline font-bold">Conteúdo: </dt><dd className="inline break-all">{report.postId || "Não indicado"}</dd></div>
                {report.circleId && <div><dt className="inline font-bold">Grupo: </dt><dd className="inline break-all">{report.circleId}</dd></div>}
                {report.kind && <div><dt className="inline font-bold">Tipo: </dt><dd className="inline">{report.kind}</dd></div>}
              </dl>
              {report.status !== "pending" && <p className="mt-2 text-[10px] text-slate-500">Decisão: {STATUS_LABELS[report.status]} · {formatDate(report.reviewedAt)} · {report.reviewedBy || "Moderador não indicado"}</p>}
              {report.legalHold && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[10px] font-bold text-amber-800">Retenção legal ativa: {report.legalHoldReason || "Sem justificação registada"}</p>}
              <label className="mt-3 block text-[10px] font-bold text-slate-700" htmlFor={`moderator-note-${report.id}`}>Notas internas (máximo 1000 caracteres)</label>
              <textarea id={`moderator-note-${report.id}`} rows={2} maxLength={1000} value={notes[report.id] ?? report.moderatorNotes ?? ""} onChange={event => setNotes(current => ({ ...current, [report.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-[#934A38]" placeholder="Regista a análise e a justificação da decisão…" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={saving === report.id} onClick={() => void toggleLegalHold(report)} className={`rounded-xl px-3 py-2 text-[10px] font-bold disabled:opacity-50 ${report.legalHold ? "bg-amber-100 text-amber-900" : "border border-amber-200 bg-white text-amber-800"}`}>{report.legalHold ? "Retirar retenção legal" : "Manter por motivo legal"}</button>
                {report.status === "pending" && <button type="button" disabled={saving === report.id} onClick={() => void updateReport(report, "in_review")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 disabled:opacity-50">Iniciar análise</button>}
                {(report.status === "pending" || report.status === "in_review" || report.status === "reviewed") && <>
                  <button type="button" disabled={saving === report.id} onClick={() => void updateReport(report, "actioned")} className="rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">Resolver</button>
                  <button type="button" disabled={saving === report.id} onClick={() => void updateReport(report, "dismissed")} className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-700 disabled:opacity-50">Rejeitar</button>
                </>}
                {saving === report.id && <span className="self-center text-[10px] text-slate-500">A guardar…</span>}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] leading-relaxed text-slate-500">Acesso apenas a contas com a autorização Firebase <code>moderator: true</code>. As decisões ficam registadas na denúncia. Esta fila não substitui um protocolo de resposta a situações de perigo imediato.</p>
    </section>
  );
}
