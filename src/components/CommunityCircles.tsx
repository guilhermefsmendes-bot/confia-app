import { useMemo, useState } from "react";
import { HeartHandshake, X } from "lucide-react";
import type { SharePost } from "../types";

type Props = {
  posts: SharePost[];
  onOpenChat: (post: SharePost) => void;
};

const topics = [
  ["ansiedade", "Ansiedade"],
  ["stress", "Stress"],
  ["cansaco", "Cansaço"],
  ["solidao", "Solidão"],
  ["sono", "Sono"],
  ["familia", "Família"],
  ["relacoes", "Relações"],
] as const;

export default function CommunityCircles({ posts, onOpenChat }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const grouped = useMemo(() => topics.map(([id, label]) => ({
    id,
    label,
    posts: posts.filter(post => post.topic === id).slice(0, 8),
  })).filter(group => group.posts.length > 0), [posts]);

  if (!grouped.length) return null;

  const selected = grouped.find(group => group.id === active);

  return (
    <section className="rounded-[28px] border border-[#E8DDD7] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F4E7DF] text-[#934A38]"><HeartHandshake size={18}/></div>
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#B85F48]">Círculos CONFIA</p><h3 className="text-sm font-black text-[#2F2926]">Pessoas a passar por algo semelhante</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">Sem seguidores nem rankings. Apenas apoio entre pessoas.</p></div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {grouped.map(group => <button key={group.id} type="button" onClick={() => setActive(group.id)} className="min-h-10 shrink-0 rounded-full bg-[#FFF7F2] px-3 text-[10px] font-black text-[#795B50]">{group.label} · {group.posts.length}</button>)}
      </div>
      {selected && <div className="mt-4 rounded-2xl border border-[#F0E3DC] bg-[#FFF9F5] p-3">
        <div className="flex items-center justify-between"><b className="text-xs text-[#3F2C27]">{selected.label}</b><button type="button" onClick={() => setActive(null)} className="p-2 text-slate-400"><X size={14}/></button></div>
        <div className="mt-2 space-y-2">{selected.posts.map(post => <button key={post.id} type="button" onClick={() => onOpenChat(post)} className="block w-full rounded-xl bg-white p-3 text-left"><span className="text-[9px] font-black text-[#B85F48]">{post.feeling}</span><p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-[#5E4A43]">{post.message}</p><span className="mt-2 block text-[9px] font-black text-[#587563]">Apoiar / conversar</span></button>)}</div>
      </div>}
    </section>
  );
}
