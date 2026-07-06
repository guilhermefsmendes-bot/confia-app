import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Heart, MessageSquarePlus, Smile, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { SharePost } from '../types';

interface PartilhaFeedProps {
  posts: SharePost[];
  onAddPost: (feeling: string, message: string) => void;
  onLikePost: (id: string) => void;
}

const FEELINGS_LIST = [
  { text: 'Aliviado', emoji: '🌿', color: 'bg-[#FFF0E8] text-[#C97B5E] border-[#E5A88B]/20' },
  { text: 'Calmo', emoji: '🧘‍♂️', color: 'bg-[#FAF5F0] text-[#8B5C4D] border-[#E5A88B]/15' },
  { text: 'Grato', emoji: '🥰', color: 'bg-[#FFF9F6] text-[#A06050] border-[#E5A88B]/15' },
  { text: 'Ansioso', emoji: '🥺', color: 'bg-[#F5D6C6]/20 text-[#A06050] border-[#F5D6C6]/30' },
  { text: 'Agitado', emoji: '⚡', color: 'bg-[#FFF5EE] text-[#7A4E43] border-[#FFF5EE]' },
  { text: 'Focado', emoji: '🎯', color: 'bg-white text-[#C97B5E] border-[#E5A88B]/20' }
];

export const PartilhaFeed: React.FC<PartilhaFeedProps> = ({ posts, onAddPost, onLikePost }) => {
  const [selectedFeeling, setSelectedFeeling] = useState('Calmo');
  const [message, setMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onAddPost(selectedFeeling, message.trim());
    setMessage('');
    setShowCompose(false);
    setSuccessMsg(true);

    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  const getFeelingStyles = (feeling: string) => {
    const found = FEELINGS_LIST.find(f => f.text.toLowerCase() === feeling.toLowerCase());
    if (found) return found;
    return { text: feeling, emoji: '💭', color: 'bg-[#FAF5F0] text-[#8B5C4D] border-slate-250' };
  };

  return (
    <div className="max-w-md mx-auto space-y-5 py-4">
      {/* Header Banner */}
      <div className="text-center space-y-1 w-full">
        <h2 className="text-xl font-black text-[#4E3B36] flex items-center justify-center gap-2 font-display">
          <span className="text-[#E5A88B]">🤝</span> Cantinho da Partilha
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
          Partilha sentimentos e vitórias de forma totalmente anónima e sinta que não estás sozinho nesta caminhada.
        </p>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-[#FFF0E8] border border-[#E5A88B]/25 rounded-2xl flex items-center gap-2 text-[#C97B5E] text-xs font-bold shadow-sm"
          >
            <CheckCircle size={16} className="text-[#C97B5E] shrink-0" />
            <span>Obrigado por partilhar! A sua mensagem foi enviada para o painel de partilha.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Write Post */}
      {!showCompose ? (
        <button
          onClick={() => setShowCompose(true)}
          className="w-full p-5 bg-gradient-to-r from-[#E5A88B]/10 to-[#FFF0E8]/5 border border-[#E5A88B]/20 rounded-[24px] flex items-center justify-between text-left group transition-all hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-[#E5A88B] rounded-xl shadow-sm">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#4E3B36]">Como te sentes agora?</h3>
              <p className="text-[10px] text-[#C97B5E] font-semibold mt-0.5">Partilha de forma livre e segura</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#C97B5E] group-hover:translate-x-1 transition-transform">
            Escrever &rarr;
          </span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 space-y-4 shadow-xl shadow-amber-100/15"
        >
          {/* Tag Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#4E3B36] flex items-center gap-1">
              <Smile size={14} className="text-[#E5A88B]" /> Qual é o teu sentimento atual?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FEELINGS_LIST.map(feeling => (
                <button
                  key={feeling.text}
                  type="button"
                  onClick={() => setSelectedFeeling(feeling.text)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedFeeling === feeling.text
                      ? 'bg-[#E5A88B] border-[#E5A88B] text-white shadow-md shadow-[#E5A88B]/20'
                      : 'bg-[#FAF5F0] border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <span>{feeling.emoji}</span>
                  <span>{feeling.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <textarea
              placeholder="Descreve as tuas sensações ou vitórias hoje de forma reconfortante... Ex: 'Hoje senti os meus batimentos subir, mas lembrei-me de fechar os olhos e contar até 10...'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={220}
              rows={3}
              required
              className="w-full p-4 text-xs border border-slate-200/80 rounded-2xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] resize-none leading-relaxed text-[#4E3B36]"
            />
            <div className="flex justify-end text-[10px] text-slate-400 font-mono">
              {message.length} / 220 caracteres
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCompose(false)}
              className="flex-1 py-3 text-xs text-slate-500 hover:bg-slate-50 rounded-xl font-bold border border-slate-200/60 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#E5A88B] hover:bg-[#D59375] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#E5A88B]/20 cursor-pointer"
            >
              <Send size={13} /> Enviar Mensagem
            </button>
          </div>
        </motion.form>
      )}

      {/* Feed Stack */}
      <div className="space-y-3.5">
        <AnimatePresence initial={false}>
          {posts.map(post => {
            const tag = getFeelingStyles(post.feeling);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-white border border-[#E5A88B]/15 rounded-[32px] shadow-sm hover:shadow-md transition-all space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Generates a gentle placeholder initials / avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#E5A88B]/10 border border-[#E5A88B]/15 flex items-center justify-center text-[10px] font-black text-[#E5A88B]">
                      {post.userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#4E3B36]">{post.userName}</h4>
                      <p className="text-[9px] text-slate-400 font-bold">{post.timestamp}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${tag.color}`}>
                    <span>{tag.emoji}</span>
                    <span>{tag.text}</span>
                  </span>
                </div>

                {/* Message text */}
                <p className="text-xs text-[#4E3B36] leading-relaxed font-semibold">
                  {post.message}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      post.likedByUser
                        ? 'bg-[#E5A88B]/10 text-[#C97B5E] border border-[#E5A88B]/20'
                        : 'bg-[#FAF5F0] text-slate-400 border border-[#E5A88B]/10 hover:text-[#C97B5E] hover:bg-[#FFF0E8]'
                    }`}
                  >
                    <Heart size={12} fill={post.likedByUser ? 'currentColor' : 'none'} />
                    <span>Apoiar ({post.likes})</span>
                  </button>

                  <div className="text-[10px] text-slate-300 font-mono select-none flex-1 text-right">
                    #comunidadeConfia
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
