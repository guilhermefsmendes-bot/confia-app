import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sun,
  Moon,
  Sparkles,
  Compass,
  Users,
  TrendingUp,
  Award,
  AlertCircle,
  Brain,
  CheckCircle2,
  Calendar,
  Gift
} from 'lucide-react';

import { AvatarState, Objective, DailyRating, SharePost } from './types';
import { INITIAL_OBJECTIVES, INITIAL_POSTS } from './data/initialData';

// Component imports
import { Avatar } from './components/Avatar';
import { TriageModal } from './components/TriageModal';
import { AbracoTimer } from './components/AbracoTimer';
import { ObjectivosList } from './components/ObjectivosList';
import { PartilhaFeed } from './components/PartilhaFeed';
import { ProgressoDashboard } from './components/ProgressoDashboard';
import { FocoMente } from './components/FocoMente';

const STORAGE_KEYS = {
  AVATAR: 'confia_avatar_v2',
  OBJECTIVES: 'confia_objectives_v2',
  RATINGS: 'confia_ratings_v2',
  POSTS: 'confia_posts_v2',
  DAILY_PET_COUNT: 'confia_daily_pet_count_v2',
  LAST_PET_DATE: 'confia_last_pet_date_v2'
};

// Past few days logs so the progress graph is instantly drawn on first load
const PRE_LOGGED_RATINGS: DailyRating[] = [
  { date: '2026-06-27', morning: 4, afternoon: 6, note: 'Tive picos de ansiedade de manhã, mas acalmei à tarde' },
  { date: '2026-06-28', morning: 5, afternoon: 7, note: 'Um dia estável, o passeio ajudou imenso' },
  { date: '2026-06-29', morning: 6, afternoon: 6, note: 'Senti-me bem de manhã, um pouco cansado à tarde' },
  { date: '2026-06-30', morning: 7, afternoon: 8, note: 'Senti muito progresso na respiração lenta' }
];

export default function App() {
  // Global App States
  const [avatar, setAvatar] = useState<AvatarState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AVATAR);
    if (saved) return JSON.parse(saved);
    return {
      level: 1,
      xp: 15,
      maxXp: 100,
      name: 'Paz',
      evolutionStage: 'Ovo da Serenidade',
      points: 10
    };
  });

  const [objectives, setObjectives] = useState<Objective[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OBJECTIVES);
    if (saved) return JSON.parse(saved);
    return INITIAL_OBJECTIVES;
  });

  const [ratings, setRatings] = useState<DailyRating[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RATINGS);
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [posts, setPosts] = useState<SharePost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (saved) return JSON.parse(saved);
    return INITIAL_POSTS;
  });

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [triageOpen, setTriageOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [prevLevel, setPrevLevel] = useState(avatar.level);
  const [showSplash, setShowSplash] = useState(true);

  // Automatically dismiss splash screen after 2.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Today rating active inputs
  const [morningRating, setMorningRating] = useState<number>(5);
  const [afternoonRating, setAfternoonRating] = useState<number>(5);
  const [todayLogged, setTodayLogged] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Save states to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OBJECTIVES, JSON.stringify(objectives));
  }, [objectives]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts]);

  // Check if today is already logged on load/ratings change
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const loggedToday = ratings.find(r => r.date === todayStr);
    if (loggedToday) {
      setTodayLogged(true);
      if (loggedToday.morning !== null) setMorningRating(loggedToday.morning);
      if (loggedToday.afternoon !== null) setAfternoonRating(loggedToday.afternoon);
      if (loggedToday.note) setNoteText(loggedToday.note);
    } else {
      setTodayLogged(false);
    }
  }, [ratings]);

  // Handle XP increments and level ups
  const addXp = (amount: number) => {
    setAvatar(prev => {
      let nextXp = prev.xp + amount;
      let nextLevel = prev.level;
      let nextMaxXp = prev.maxXp;
      let nextPoints = prev.points + Math.round(amount / 2);

      while (nextXp >= nextMaxXp) {
        nextXp -= nextMaxXp;
        nextLevel += 1;
        nextMaxXp = Math.round(nextMaxXp * 1.3);
        nextPoints += 30; // bonus points for level up
        setPrevLevel(nextLevel);
        setLevelUpOpen(true);
      }

      return {
        ...prev,
        level: nextLevel,
        xp: nextXp,
        maxXp: nextMaxXp,
        points: nextPoints
      };
    });
  };

  // Pet Amigo (Interaction)
  const handlePetAvatar = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastPetDate = localStorage.getItem(STORAGE_KEYS.LAST_PET_DATE);
    const petCountStr = localStorage.getItem(STORAGE_KEYS.DAILY_PET_COUNT);
    let petCount = petCountStr ? parseInt(petCountStr, 10) : 0;

    if (lastPetDate !== todayStr) {
      petCount = 0;
      localStorage.setItem(STORAGE_KEYS.LAST_PET_DATE, todayStr);
    }

    if (petCount < 5) {
      addXp(5); // +5 XP for the first 5 pets of the day
      localStorage.setItem(STORAGE_KEYS.DAILY_PET_COUNT, (petCount + 1).toString());
    } else {
      // Award only points beyond limit
      setAvatar(prev => ({ ...prev, points: prev.points + 1 }));
    }
  };

  // Log today mood ratings
  const handleSaveRatings = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextRatings = [...ratings];
    const existingIdx = nextRatings.findIndex(r => r.date === todayStr);

    const newRating: DailyRating = {
      date: todayStr,
      morning: morningRating,
      afternoon: afternoonRating,
      note: noteText.trim() || undefined
    };

    if (existingIdx >= 0) {
      nextRatings[existingIdx] = newRating;
    } else {
      nextRatings.push(newRating);
      // Give XP first time rating today
      addXp(15);
    }

    setRatings(nextRatings);
    setTodayLogged(true);
  };

  // Toggle single objective completion
  const handleToggleObjective = (id: string) => {
    setObjectives(prev =>
      prev.map(obj => {
        if (obj.id === id) {
          const nextCompleted = !obj.completed;
          if (nextCompleted) {
            // Reward XP on check
            addXp(obj.xpReward);
          } else {
            // Deduct points/XP if unchecked (optional/safe)
            setAvatar(a => ({ ...a, points: Math.max(0, a.points - Math.round(obj.xpReward / 2)) }));
          }
          return { ...obj, completed: nextCompleted };
        }
        return obj;
      })
    );
  };

  // Create objective
  const handleAddCustomObjective = (text: string, category: 'corporeo' | 'mental' | 'social' | 'nutricao') => {
    const newObj: Objective = {
      id: `obj-custom-${Date.now()}`,
      text,
      category,
      xpReward: 20,
      completed: false,
      isCustom: true
    };
    setObjectives(prev => [newObj, ...prev]);
  };

  // Delete objective
  const handleDeleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id));
  };

  // Create Community Post
  const handleAddPost = (feeling: string, message: string) => {
    const newPost: SharePost = {
      id: `post-custom-${Date.now()}`,
      userName: `Guardião Anon_${Math.floor(100 + Math.random() * 900)}`,
      feeling,
      message,
      timestamp: 'Agora mesmo',
      likes: 0,
      likedByUser: false
    };
    setPosts(prev => [newPost, ...prev]);
    addXp(10); // Reward active sharing with +10 XP
  };

  // Like Community Post
  const handleLikePost = (id: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === id) {
          const nextLiked = !post.likedByUser;
          return {
            ...post,
            likedByUser: nextLiked,
            likes: nextLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );
  };

  // Visual text helper for slider values (0-10)
  const getRatingLabel = (val: number) => {
    if (val <= 2) return { text: 'Muita Agitação', emoji: '🥺', color: 'text-[#C97B5E]' };
    if (val <= 4) return { text: 'Inquieto', emoji: '😐', color: 'text-[#C97B5E]' };
    if (val <= 6) return { text: 'Estável / Neutro', emoji: '🙂', color: 'text-[#8B5C4D]' };
    if (val <= 8) return { text: 'Calmo', emoji: '🌿', color: 'text-[#8B5C4D]' };
    return { text: 'Em Plena Paz', emoji: '🥰', color: 'text-[#734A3F]' };
  };

  const completedObjectivesCount = objectives.filter(o => o.completed).length;

  return (
    <div className="min-h-screen bg-[#FAF5F0] flex flex-col antialiased text-[#4E3B36]">
      {/* Splash Welcome Screen Overlay */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setShowSplash(false)}
          >
            <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
              {/* Pulsing app icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-[#E5A88B] via-[#F5D6C6] to-[#FFF0E8] shadow-xl border border-[#E5A88B]/20 relative"
              >
                {/* Rippling glow ring */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-[#E5A88B]/30"
                />
                <span className="text-4xl filter drop-shadow select-none">🌿</span>
              </motion.div>

              <div className="space-y-2">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-2xl font-black text-[#4E3B36] font-display tracking-tight"
                >
                  Confia
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-[#C97B5E] text-xs font-extrabold tracking-[0.2em] uppercase font-display"
                >
                  Olá, bem-vindo!
                </motion.p>
              </div>

              {/* Subtitle / instruction */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="text-[10px] text-slate-400 font-semibold absolute bottom-12 cursor-pointer uppercase tracking-widest font-display"
              >
                Toca no ecrã para saltar
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Top Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5A88B]/15 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-[#E5A88B] to-[#C97B5E] bg-clip-text text-transparent font-display">
            Confia
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Level badge quick indicator */}
          <div className="flex items-center gap-1.5 bg-[#E5A88B]/10 text-[#C97B5E] px-3 py-1.5 rounded-xl border border-[#E5A88B]/25 text-xs font-black font-mono">
            <Sparkles size={13} className="text-[#E5A88B] animate-pulse" />
            Nível {avatar.level}
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 pb-24 px-4 max-w-lg mx-auto w-full pt-4">
        <AnimatePresence mode="wait">
          {currentTab === 0 && (
            /* TAB 1: MENU PRINCIPAL */
            <motion.div
              key="main-menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Interactive Amigo Panel */}
              <div className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 shadow-sm space-y-4">
                {/* Logo da App */}
                <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center space-y-2 border-b border-slate-50 pb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#E5A88B] via-[#F5D6C6] to-[#FFF0E8] shadow-md border border-[#E5A88B]/20">
                    <span className="text-xl filter drop-shadow">🌿</span>
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-base font-black tracking-tight text-[#4E3B36] font-display">
                      Confia
                    </h2>
                    <p className="text-[9px] text-[#C97B5E] font-extrabold uppercase tracking-widest font-display">
                      O teu refúgio de serenidade
                    </p>
                  </div>
                </div>

                <Avatar avatar={avatar} onPet={handlePetAvatar} />
              </div>

              {/* Crisis Screening SOS Button */}
              <button
                onClick={() => setTriageOpen(true)}
                className="w-full p-5 bg-[#FFF0E8] border border-[#E5A88B]/35 rounded-[32px] flex items-center justify-between group shadow-sm transition-all hover:bg-[#FFE8DE] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#E5A88B] text-white rounded-2xl shadow-md shadow-[#E5A88B]/20 animate-pulse">
                    <Brain size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#4E3B36] font-display">Sentes a ansiedade a subir?</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">Toca para iniciar o apoio imediato de crise</p>
                  </div>
                </div>
                <span className="text-xs font-black text-[#C97B5E] group-hover:translate-x-1 transition-transform font-display">
                  SOS &rarr;
                </span>
              </button>

              {/* Day Rating Panel */}
              <div className="bg-white border border-[#E5A88B]/15 rounded-[32px] p-6 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#4E3B36] flex items-center gap-1.5 font-display uppercase tracking-wider">
                    <Calendar size={15} className="text-[#E5A88B]" /> Classificar o teu Dia
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    O teu bem-estar flutua. Regista a manhã e a tarde para analisar padrões no teu histórico.
                  </p>
                </div>

                {/* Morning Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#4E3B36]">
                    <span className="flex items-center gap-1 text-[#C97B5E] font-display uppercase tracking-wider">
                      <Sun size={15} /> Manhã: {morningRating} / 10
                    </span>
                    <span className={`font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 ${getRatingLabel(morningRating).color} font-display`}>
                      <span>{getRatingLabel(morningRating).emoji}</span>
                      <span>{getRatingLabel(morningRating).text}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={morningRating}
                    onChange={(e) => setMorningRating(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">
                    <span>0 (Difícil)</span>
                    <span>10 (Em Paz)</span>
                  </div>
                </div>

                {/* Afternoon Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-[#4E3B36]">
                    <span className="flex items-center gap-1 text-[#C97B5E] font-display uppercase tracking-wider">
                      <Moon size={15} /> Tarde: {afternoonRating} / 10
                    </span>
                    <span className={`font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 ${getRatingLabel(afternoonRating).color} font-display`}>
                      <span>{getRatingLabel(afternoonRating).emoji}</span>
                      <span>{getRatingLabel(afternoonRating).text}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={afternoonRating}
                    onChange={(e) => setAfternoonRating(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#E5A88B]"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">
                    <span>0 (Difícil)</span>
                    <span>10 (Em Paz)</span>
                  </div>
                </div>

                {/* Diary commentary note */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-[#4E3B36]">Nota ou sensação sobre o dia (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: 'Senti-me bem à tarde após alongar.'"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    maxLength={100}
                    className="w-full px-4 py-3 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#E5A88B] focus:ring-2 focus:ring-[#E5A88B]/15 bg-[#FAF5F0] font-bold text-[#4E3B36]"
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSaveRatings}
                  className="w-full py-4 bg-gradient-to-r from-[#E5A88B] to-[#D59375] hover:from-[#D59375] hover:to-[#C68060] text-white font-extrabold text-xs uppercase tracking-wider font-display rounded-2xl transition-all shadow-lg shadow-[#E5A88B]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  {todayLogged ? 'Atualizar Registo de Hoje' : 'Gravar Registo Diário (+15 XP)'}
                </button>
              </div>

              {/* Foco da Mente Menu */}
              <FocoMente onAddXp={addXp} />
            </motion.div>
          )}

          {currentTab === 1 && (
            /* TAB 2: ABRAÇO (TIMER DE RESPIRAÇÃO) */
            <motion.div
              key="embrace-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white border border-slate-100/80 rounded-[32px] p-6 shadow-sm">
                <AbracoTimer onAddXp={addXp} />
              </div>
            </motion.div>
          )}

          {currentTab === 2 && (
            /* TAB 3: OBJECTIVOS */
            <motion.div
              key="goals-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white border border-slate-100/80 rounded-[32px] p-6 shadow-sm">
                <ObjectivosList
                  objectives={objectives}
                  onToggleComplete={handleToggleObjective}
                  onAddCustomObjective={handleAddCustomObjective}
                  onDeleteObjective={handleDeleteObjective}
                />
              </div>
            </motion.div>
          )}

          {currentTab === 3 && (
            /* TAB 4: PARTILHA */
            <motion.div
              key="share-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PartilhaFeed
                posts={posts}
                onAddPost={handleAddPost}
                onLikePost={handleLikePost}
              />
            </motion.div>
          )}

          {currentTab === 4 && (
            /* TAB 5: PROGRESSO */
            <motion.div
              key="progress-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProgressoDashboard
                ratings={ratings}
                avatarLevel={avatar.level}
                avatarXp={avatar.xp}
                completedObjectivesCount={completedObjectivesCount}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Triage / Screening Help Modal */}
      <TriageModal
        isOpen={triageOpen}
        onClose={() => setTriageOpen(false)}
        onAddXp={addXp}
      />

      {/* Celebratory Level Up Overlay */}
      <AnimatePresence>
        {levelUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] p-7 text-center max-w-sm border border-[#E5A88B]/20 shadow-2xl space-y-4"
            >
              <div className="w-16 h-16 bg-[#FFF0E8] rounded-full flex items-center justify-center mx-auto text-[#C97B5E] animate-bounce">
                <Gift size={32} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-[#4E3B36] font-display">Evolução do Companheiro!</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Ao cuidares de ti, ajudas o teu guardião a ganhar energia. O teu Amigo evoluiu com sucesso!
                </p>
                <div className="py-2.5 px-4 bg-[#E5A88B]/15 text-[#C97B5E] border border-[#E5A88B]/30 rounded-2xl text-xs font-black font-display">
                  Nível {prevLevel} Alcançado 🎉
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-wider">
                Ganhaste +30 Pontos de evolução extra de recompensa!
              </p>
              <button
                onClick={() => setLevelUpOpen(false)}
                className="w-full py-3 bg-[#E5A88B] hover:bg-[#D59375] text-white shadow-lg shadow-[#E5A88B]/25 font-black text-xs uppercase tracking-wider font-display rounded-xl cursor-pointer"
              >
                Continuar a Caminhada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Tab Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5A88B]/15 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {[
            { label: 'Principal', icon: '🏡', index: 0 },
            { label: 'Abraço', icon: '🫂', index: 1 },
            { label: 'Objetivos', icon: '🎯', index: 2 },
            { label: 'Partilha', icon: '🤝', index: 3 },
            { label: 'Progresso', icon: '📈', index: 4 }
          ].map(tab => (
            <button
              key={tab.index}
              onClick={() => setCurrentTab(tab.index)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all relative cursor-pointer ${
                currentTab === tab.index ? 'text-[#C97B5E] font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {/* Highlight bar above active tab icon */}
              {currentTab === tab.index && (
                <motion.div
                  layoutId="active-bar"
                  className="absolute -top-3 w-10 h-1 rounded-full bg-[#E5A88B]"
                />
              )}
              <span className="text-lg mb-0.5">{tab.icon}</span>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
