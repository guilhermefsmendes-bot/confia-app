import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Sun, Moon, Calendar, Award, Sparkles, Smile, MessageCircle } from 'lucide-react';
import { DailyRating } from '../types';

interface ProgressoDashboardProps {
  ratings: DailyRating[];
  avatarLevel: number;
  avatarXp: number;
  completedObjectivesCount: number;
}

export const ProgressoDashboard: React.FC<ProgressoDashboardProps> = ({
  ratings,
  avatarLevel,
  avatarXp,
  completedObjectivesCount
}) => {
  // Sort ratings chronologically to render chart
  const sortedRatings = [...ratings].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);

  // Helper to format date label
  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parts[2];
    const month = parts[1];
    return `${day}/${month}`;
  };

  // Compute stats
  const validMorningRatings = ratings.filter(r => r.morning !== null) as { morning: number }[];
  const validAfternoonRatings = ratings.filter(r => r.afternoon !== null) as { afternoon: number }[];

  const avgMorning = validMorningRatings.length
    ? (validMorningRatings.reduce((sum, r) => sum + r.morning, 0) / validMorningRatings.length).toFixed(1)
    : 'N/A';

  const avgAfternoon = validAfternoonRatings.length
    ? (validAfternoonRatings.reduce((sum, r) => sum + r.afternoon, 0) / validAfternoonRatings.length).toFixed(1)
    : 'N/A';

  // SVG Chart Dimensions
  const width = 360;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Render SVG points for rating lines
  const getPointsCoords = (type: 'morning' | 'afternoon') => {
    if (sortedRatings.length < 2) return '';

    return sortedRatings
      .map((rating, idx) => {
        const val = rating[type];
        if (val === null) return null;

        // X coordinate (spread across chartWidth)
        const x = paddingLeft + (idx / (sortedRatings.length - 1)) * chartWidth;
        // Y coordinate (0-10 mapped to chartHeight)
        const y = paddingTop + chartHeight - (val / 10) * chartHeight;

        return `${x},${y}`;
      })
      .filter(p => p !== null)
      .join(' ');
  };

  const morningPoints = getPointsCoords('morning');
  const afternoonPoints = getPointsCoords('afternoon');

  return (
    <div className="max-w-md mx-auto space-y-5 py-4">
      {/* Header Banner */}
      <div className="text-center space-y-1 w-full">
        <h2 className="text-xl font-black text-[#4E3B36] flex items-center justify-center gap-2 font-display">
          <span className="text-[#E5A88B]">📈</span> Diário de Evolução
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
          O teu bem-estar merece ser acompanhado. Vê como o teu estado de espírito evolui e celebra os teus sucessos.
        </p>
      </div>

      {/* Grid of Averages */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#FFF0E8]/50 via-[#FFF0E8]/20 to-transparent p-4 rounded-2xl border border-[#E5A88B]/25 space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#C97B5E] font-bold">
            <Sun size={15} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest font-display">Média Manhã</span>
          </div>
          <p className="text-2xl font-mono font-black text-[#4E3B36]">
            {avgMorning} <span className="text-xs text-slate-400 font-bold font-sans">/ 10</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FAF5F0]/70 via-[#FAF5F0]/30 to-transparent p-4 rounded-2xl border border-[#E5A88B]/20 space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-[#8B5C4D] font-bold">
            <Moon size={15} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest font-display">Média Tarde</span>
          </div>
          <p className="text-2xl font-mono font-black text-[#4E3B36]">
            {avgAfternoon} <span className="text-xs text-slate-400 font-bold font-sans">/ 10</span>
          </p>
        </div>
      </div>

      {/* Pure SVG Line Chart Card */}
      <div className="bg-white border border-[#E5A88B]/15 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-[#4E3B36] flex items-center gap-1.5 font-display uppercase tracking-wider">
              <TrendingUp size={14} className="text-[#E5A88B]" /> Variação do Humor Diário
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Últimos 7 dias registados</p>
          </div>
          {/* Chart Legends */}
          <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
            <span className="flex items-center gap-1 text-[#C97B5E] bg-[#FFF0E8] px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C97B5E]" /> Manhã
            </span>
            <span className="flex items-center gap-1 text-[#8B5C4D] bg-[#FAF5F0] px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5C4D]" /> Tarde
            </span>
          </div>
        </div>

        {sortedRatings.length < 2 ? (
          <div className="h-44 flex items-center justify-center text-center p-4 bg-[#FAF5F0] rounded-2xl border border-[#E5A88B]/15 border-dashed">
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
              Precisas de pelo menos dois dias de classificação de Manhã e Tarde para traçar o gráfico do teu progresso.
            </p>
          </div>
        ) : (
          <div className="relative w-full flex items-center justify-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              {/* Y-Axis Grid Lines & Labels */}
              {[0, 2, 4, 6, 8, 10].map(val => {
                const y = paddingTop + chartHeight - (val / 10) * chartHeight;
                return (
                  <g key={val} className="opacity-40">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={paddingLeft - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-slate-400 font-bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis labels */}
              {sortedRatings.map((rating, idx) => {
                const x = paddingLeft + (idx / (sortedRatings.length - 1)) * chartWidth;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={height - 6}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-slate-400 font-bold"
                  >
                    {formatDateLabel(rating.date)}
                  </text>
                );
              })}

              {/* Morning Line */}
              {morningPoints && (
                <polyline
                  fill="none"
                  stroke="#E5A88B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={morningPoints}
                />
              )}

              {/* Afternoon Line */}
              {afternoonPoints && (
                <polyline
                  fill="none"
                  stroke="#8B5C4D"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={afternoonPoints}
                />
              )}

              {/* Dot Markers */}
              {sortedRatings.map((rating, idx) => {
                const x = paddingLeft + (idx / (sortedRatings.length - 1)) * chartWidth;

                return (
                  <g key={idx}>
                    {rating.morning !== null && (
                      <circle
                        cx={x}
                        cy={paddingTop + chartHeight - (rating.morning / 10) * chartHeight}
                        r="4"
                        fill="#E5A88B"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}
                    {rating.afternoon !== null && (
                      <circle
                        cx={x}
                        cy={paddingTop + chartHeight - (rating.afternoon / 10) * chartHeight}
                        r="4"
                        fill="#8B5C4D"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* History Log Card */}
      <div className="bg-white border border-[#E5A88B]/15 rounded-3xl p-5 shadow-sm space-y-3.5">
        <h3 className="text-xs font-black text-[#4E3B36] flex items-center gap-1.5 font-display uppercase tracking-wider">
          <Calendar size={14} className="text-[#E5A88B]" /> Histórico de Registos Diários
        </h3>

        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {ratings.map((rating, index) => {
            return (
              <div
                key={rating.date}
                className="flex items-center justify-between p-4 bg-[#FAF5F0] rounded-2xl border border-[#E5A88B]/10"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#4E3B36] font-mono flex items-center gap-1">
                    🗓️ {rating.date === new Date().toISOString().split('T')[0] ? 'Hoje' : rating.date}
                  </span>
                  {rating.note && (
                    <p className="text-[10px] text-slate-500 font-semibold italic">
                      "{rating.note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-[10px] font-bold font-mono text-[#C97B5E] bg-[#FFF0E8] px-2.5 py-1 rounded-xl border border-[#E5A88B]/15">
                    <Sun size={11} /> M: {rating.morning !== null ? `${rating.morning}/10` : '-'}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold font-mono text-[#8B5C4D] bg-[#FAF5F0] px-2.5 py-1 rounded-xl border border-[#E5A88B]/15">
                    <Moon size={11} /> T: {rating.afternoon !== null ? `${rating.afternoon}/10` : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Streaks Card */}
      <div className="bg-gradient-to-tr from-[#E5A88B]/10 via-[#FFF0E8]/5 to-transparent border border-[#E5A88B]/20 p-5 rounded-[24px] space-y-3 shadow-sm shadow-[#E5A88B]/5">
        <h4 className="text-xs font-bold text-[#C97B5E] flex items-center gap-1 font-display uppercase tracking-widest">
          <Sparkles size={14} className="text-[#C97B5E] animate-pulse" /> Conquistas do Guardião
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-[#E5A88B]/10 space-y-0.5 shadow-sm shadow-[#E5A88B]/5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amigo</span>
            <p className="font-extrabold text-[#4E3B36]">Nível {avatarLevel}</p>
            <p className="text-[9px] text-slate-400 font-bold">{avatarXp} XP Acumulados</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-[#E5A88B]/10 space-y-0.5 shadow-sm shadow-[#E5A88B]/5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Objetivos Diários</span>
            <p className="font-extrabold text-[#4E3B36]">{completedObjectivesCount} Concluídos</p>
            <p className="text-[9px] text-slate-400 font-bold">Frequência positiva ativa</p>
          </div>
        </div>
      </div>
    </div>
  );
};
