import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, Heart, Award, Smile, Coffee, Users, Sparkles } from 'lucide-react';
import { Objective } from '../types';

interface ObjectivosListProps {
  objectives: Objective[];
  onToggleComplete: (id: string) => void;
  onAddCustomObjective: (text: string, category: 'corporeo' | 'mental' | 'social' | 'nutricao') => void;
  onDeleteObjective: (id: string) => void;
}

export const ObjectivosList: React.FC<ObjectivosListProps> = ({
  objectives,
  onToggleComplete,
  onAddCustomObjective,
  onDeleteObjective
}) => {
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'corporeo' | 'mental' | 'social' | 'nutricao'>('mental');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddCustomObjective(newText.trim(), newCategory);
    setNewText('');
    setShowForm(false);
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'corporeo':
        return {
          bg: 'bg-[#E5A88B]/10 text-[#C97B5E] border-[#E5A88B]/20',
          badge: 'bg-[#E5A88B]/10 text-[#C97B5E] border border-[#E5A88B]/20',
          icon: <Heart size={14} />,
          label: 'Físico'
        };
      case 'mental':
        return {
          bg: 'bg-[#F5D6C6]/20 text-[#A06050] border-[#F5D6C6]/30',
          badge: 'bg-[#F5D6C6]/20 text-[#A06050] border border-[#F5D6C6]/30',
          icon: <Smile size={14} />,
          label: 'Mental'
        };
      case 'social':
        return {
          bg: 'bg-[#FFF0E8] text-[#8A5C50] border-[#FFF0E8]',
          badge: 'bg-[#FFF0E8] text-[#8A5C50] border border-[#E5A88B]/15',
          icon: <Users size={14} />,
          label: 'Social'
        };
      case 'nutricao':
      default:
        return {
          bg: 'bg-[#FAF5F0] text-[#7A4E43] border-[#FAF5F0]',
          badge: 'bg-[#FAF5F0] text-[#7A4E43] border border-[#E5A88B]/15',
          icon: <Coffee size={14} />,
          label: 'Nutrição'
        };
    }
  };

  const completedCount = objectives.filter(o => o.completed).length;

  return (
    <div className="max-w-md mx-auto space-y-5 py-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#4E3B36] flex items-center gap-1.5 font-display">
            <span className="text-[#E5A88B]">🎯</span> Pequenas Conquistas
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Metas fáceis e realistas para hoje. Cada objetivo dá pontos ao teu Amigo!
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-tr from-[#E5A88B]/10 to-[#FFF0E8]/5 p-5 rounded-[24px] border border-[#E5A88B]/25 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-[#C97B5E] uppercase tracking-widest font-display">Metas Diárias</span>
          <h3 className="text-sm font-black text-[#4E3B36]">
            Concluíste {completedCount} de {objectives.length} objetivos
          </h3>
        </div>
        <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full border border-[#E5A88B]/30 shadow-md">
          <Award size={20} className="text-[#C97B5E] animate-pulse" />
        </div>
      </div>

      {/* Custom Objective Trigger Button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 bg-white hover:bg-[#FFF0E8] text-[#C97B5E] border border-[#E5A88B]/25 border-dashed rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Adicionar Objetivo Personalizado
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5A88B]/15 rounded-[24px] p-5 space-y-4 shadow-xl shadow-amber-100/10"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4E3B36]">O que queres alcançar hoje?</label>
            <input
              type="text"
              placeholder="Ex: Ler 2 páginas de um livro, regar as plantas..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] text-[#4E3B36]"
              maxLength={70}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4E3B36]">Categoria do Objetivo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['mental', 'corporeo', 'social', 'nutricao'] as const).map(cat => {
                const styles = getCategoryStyles(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`p-2.5 border text-[10px] font-bold rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      newCategory === cat
                        ? 'bg-[#E5A88B] border-[#E5A88B] text-white shadow-md shadow-[#E5A88B]/25'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {styles.icon}
                    <span>{styles.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-xs text-slate-500 hover:bg-slate-50 rounded-xl font-bold border border-slate-200/60 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs bg-gradient-to-r from-[#E5A88B] to-[#D59375] hover:from-[#D59375] hover:to-[#C68060] text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-md shadow-[#E5A88B]/20 cursor-pointer"
            >
              Gravar Objetivo
            </button>
          </div>
        </motion.form>
      )}

      {/* Objectives Stack */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {objectives.map(objective => {
            const catStyles = getCategoryStyles(objective.category);
            return (
              <motion.div
                key={objective.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={`flex items-center justify-between p-4 bg-white border rounded-[24px] shadow-sm hover:shadow-md transition-all ${
                  objective.completed ? 'border-[#E5A88B]/30 bg-[#E5A88B]/5' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                  <button
                    onClick={() => onToggleComplete(objective.id)}
                    className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      objective.completed
                        ? 'bg-[#E5A88B] border-[#E5A88B] text-white shadow-sm shadow-[#E5A88B]/20'
                        : 'border-slate-200 hover:border-[#E5A88B] hover:bg-[#E5A88B]/10'
                    }`}
                  >
                    {objective.completed && <Check size={14} strokeWidth={3} />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p className={`text-xs font-bold leading-relaxed ${
                      objective.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-400'
                    }`}>
                      {objective.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-0.5 ${catStyles.badge}`}>
                        {catStyles.icon}
                        <span>{catStyles.label}</span>
                      </span>
                      <span className="text-[9px] font-bold text-amber-600 font-mono flex items-center gap-0.5">
                        <Sparkles size={10} /> +{objective.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>

                {objective.isCustom && (
                  <button
                    onClick={() => onDeleteObjective(objective.id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50/50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
