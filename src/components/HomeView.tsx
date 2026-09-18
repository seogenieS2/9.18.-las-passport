import React, { useState, useEffect } from 'react';
import { 
  Sparkles,
  Check,
  X,
  Lock,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MealLog, HealthLog, StepLog, WaterLog, UserProfile, CharacterAvatar, HealthGoalFootprint, HealthGoalAnswer } from '../types';
import { CHARACTER_AVATAR_MAP, getUserProfile } from '../utils/profile';
import { getLocalDateKey, getHealthGoalFootprint, saveHealthGoalFootprint } from '../utils/date';

interface HomeViewProps {
  mealLogs: MealLog[];
  healthLog: HealthLog | null;
  stepLog: StepLog;
  waterLog: WaterLog;
  onNavigateToTab: (tabId: string) => void;
  onNavigateToSubpage: (pageId: string) => void;
  onAddWater: () => void;
  onResetWater?: () => void;
  userProfile?: UserProfile | null;
  
  // Companion Props
  nickname: string;
  companion: string | null;
  companionName: string;
  companionLevel: number;
  companionStars: number;
  equippedItem: string | null;
  unlockedItems: string[];
  completedMissions: string[];
  praiseCardReceived?: boolean;
  praiseMessageText?: string;
  onAddStars: (amount: number, reason: string) => void;
  onEquipItem: (itemId: string | null) => void;
  onUnlockItem: (itemId: string) => void;
  onCompleteMission: (missionId: string) => void;
  onSendPraiseRequest?: () => void;
  onReceivePraiseCard?: (messageText: string) => void;
  onClearPraise?: () => void;
  
  // New props for reactive actions
  recentAction: string | null;
  onClearRecentAction: () => void;
  appointmentKept: boolean;
  onCompleteAppointment: () => void;
  hasAppointmentToday: boolean;

  // Health Goal Footprint
  footprintAnswers?: HealthGoalFootprint;
  onUpdateFootprintAnswer?: (category: 'physical' | 'social' | 'emotional', answer: HealthGoalAnswer) => void;
}

const DECORATION_ITEMS = [
  { id: 'hat', name: '물방울 모자', emoji: '💧', cost: 5, minLevel: 1, description: '머리에 얹으면 시원한 기분이 드는 맑은 물방울 모자예요.' },
  { id: 'bag', name: '산책 가방', emoji: '🎒', cost: 10, minLevel: 1, description: '가볍게 걸을 때 간식과 물통을 쏙 넣는 빨간 가방이에요.' },
  { id: 'box', name: '건강 도시락', emoji: '🍱', cost: 15, minLevel: 2, description: '채소와 과일이 정성스럽게 담긴 영양 가득 도시락이에요.' },
  { id: 'sticker', name: '반짝반짝 별', emoji: '⭐', cost: 20, minLevel: 2, description: '캐릭터 주변에 반짝이는 건강한 에너지 스티커예요.' },
  { id: 'bg', name: '잠자는 달 밤', emoji: '🌙', cost: 25, minLevel: 3, description: '숙면을 도와주는 은은한 밤하늘과 노란 초승달 배경이에요.' }
];

export default function HomeView({ 
  mealLogs, 
  healthLog, 
  stepLog, 
  waterLog, 
  onNavigateToTab, 
  onNavigateToSubpage,
  onAddWater,
  userProfile,
  
  nickname,
  companion,
  companionName,
  companionLevel,
  companionStars,
  equippedItem,
  unlockedItems = [],
  praiseCardReceived,
  praiseMessageText,
  onAddStars,
  onEquipItem,
  onUnlockItem,
  onSendPraiseRequest,
  onClearPraise,
  
  recentAction,
  onClearRecentAction,
  appointmentKept,
  onCompleteAppointment,
  hasAppointmentToday,
  footprintAnswers,
  onUpdateFootprintAnswer
}: HomeViewProps) {
  const [isDressUpModalOpen, setIsDressUpModalOpen] = useState<boolean>(false);

  const [consecutiveDays, setConsecutiveDays] = useState<number>(0);

  // Health Goal Footprint state (local time based)
  const [answers, setAnswers] = useState<HealthGoalFootprint>(() => {
    return footprintAnswers || getHealthGoalFootprint(getLocalDateKey());
  });

  useEffect(() => {
    if (footprintAnswers) {
      setAnswers(footprintAnswers);
    }
  }, [footprintAnswers]);

  const handleSelectAnswer = (category: 'physical' | 'social' | 'emotional', answer: 'yes' | 'no') => {
    const todayKey = getLocalDateKey();
    const updated = {
      ...answers,
      [category]: answer,
    };
    setAnswers(updated);
    saveHealthGoalFootprint(todayKey, updated);
    if (onUpdateFootprintAnswer) {
      onUpdateFootprintAnswer(category, answer);
    }
  };

  const isPhysicalActive = answers.physical === 'yes';
  const isSocialActive = answers.social === 'yes';
  const isEmotionalActive = answers.emotional === 'yes';

  // Sync consecutive days from localStorage
  useEffect(() => {
    const streak = parseInt(localStorage.getItem('las_consecutive_days') || '0');
    setConsecutiveDays(streak);
  }, [recentAction, stepLog, waterLog, mealLogs]);

  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isLevelingUp, setIsLevelingUp] = useState<boolean>(false);
  const [prevLevel, setPrevLevel] = useState<number>(companionLevel);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const healthGoals = [
    {
      id: 'physical',
      label: '신체적 건강',
      goal:
        localStorage.getItem('las_physical_health_goal')?.trim() ||
        '아직 입력한 목표가 없어요.',
      dotClass: 'bg-blue-500',
      cardClass: 'bg-blue-50/60 border-blue-100',
    },
    {
      id: 'social',
      label: '사회적 건강',
      goal:
        localStorage.getItem('las_social_health_goal')?.trim() ||
        '아직 입력한 목표가 없어요.',
      dotClass: 'bg-indigo-500',
      cardClass: 'bg-indigo-50/60 border-indigo-100',
    },
    {
      id: 'emotional',
      label: '정서적 건강',
      goal:
        localStorage.getItem('las_emotional_health_goal')?.trim() ||
        '아직 입력한 목표가 없어요.',
      dotClass: 'bg-rose-500',
      cardClass: 'bg-rose-50/60 border-rose-100',
    },
  ];

  // Track recentAction to trigger reactions
  useEffect(() => {
    if (recentAction) {
      setActiveReaction(recentAction);
      const timer = setTimeout(() => {
        setActiveReaction(null);
        onClearRecentAction();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentAction]);

  // Track level up to trigger celebration
  useEffect(() => {
    if (companionLevel > prevLevel) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => {
        setIsLevelingUp(false);
        setPrevLevel(companionLevel);
      }, 4500);
      return () => clearTimeout(timer);
    } else if (companionLevel < prevLevel) {
      setPrevLevel(companionLevel);
    }
  }, [companionLevel, prevLevel]);

  const todayMeals = mealLogs.filter(m => m.date === todayStr);
  const mealsCount = todayMeals.length;

  // Companion Character Emoji
  const getCompanionEmoji = () => {
    switch (companion) {
      case 'dog': return '🐶';
      case 'rabbit': return '🐰';
      case 'bear': return '🐻';
      case 'sprout': return '🌱';
      default: return '🐶';
    }
  };

  const getLevelTitle = (lvl: number) => {
    if (lvl <= 1) return '처음 만난 친구 🐾';
    if (lvl === 2) return '건강 새싹 🌱';
    if (lvl === 3) return '튼튼 친구 💪';
    if (lvl === 4) return '반짝 친구 ✨';
    return '건강 수호자 👑';
  };

  // Passport Stamp evaluation (Water mission target is now 7)
  const isWaterStampActive = waterLog.count >= 7;
  const isWalkStampActive = stepLog.count >= stepLog.goal;
  const isMealStampActive = mealsCount >= 1;

  const handleItemClick = (item: typeof DECORATION_ITEMS[0]) => {
    const isUnlocked = unlockedItems.includes(item.id);
    const isEquipped = equippedItem === item.id;
    const canUnlock = companionStars >= item.cost && companionLevel >= item.minLevel;

    if (isUnlocked) {
      // Toggle equip/unequip
      onEquipItem(isEquipped ? null : item.id);
    } else {
      if (canUnlock) {
        // Unlock and automatically equip for convenient UX
        onUnlockItem(item.id);
        onEquipItem(item.id);
      }
    }
  };

  // Find the next locked item to show in preview
  const nextItem = DECORATION_ITEMS.find(item => !unlockedItems.includes(item.id));

  return (
    <div className="w-full pb-6 relative animate-fadeIn max-w-md mx-auto">
      {/* Level-up Celebratory Overlay */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/40 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-400 relative overflow-hidden"
            >
              <div className="absolute -top-10 left-10 text-4xl animate-bounce delay-100">🎉</div>
              <div className="absolute top-10 -right-10 text-4xl animate-bounce delay-300">⭐</div>
              <div className="absolute -bottom-10 left-1/2 text-4xl animate-bounce delay-500">✨</div>
              <div className="absolute top-1/2 -left-10 text-4xl animate-bounce delay-200">💖</div>
              
              <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6 border-2 border-amber-300 shadow-lg">
                <span className="text-6xl animate-pulse">{getCompanionEmoji()}</span>
              </div>
              
              <h2 className="text-3xl font-black text-amber-500 tracking-tight mb-2">레벨 업! 🎉</h2>
              <p className="text-sm font-bold text-on-surface-variant leading-relaxed">
                축하합니다! 대단해요!<br />
                {companionName}의 레벨이 <span className="text-primary font-extrabold text-lg">Lv.{companionLevel}</span>로 올랐어요!<br />
                더 튼튼하고 멋진 모습으로 변신했습니다!
              </p>
              
              <div className="mt-4 px-4 py-2.5 bg-amber-50 rounded-2xl text-xs font-black text-amber-700 flex items-center justify-center gap-1.5 border border-amber-200">
                <Sparkles className="w-4 h-4 fill-amber-400 stroke-amber-500" />
                <span>{getLevelTitle(companionLevel)} 칭호 획득!</span>
              </div>

              <button 
                onClick={() => setIsLevelingUp(false)}
                className="mt-6 w-full py-3 bg-amber-400 hover:bg-amber-500 text-on-surface font-extrabold rounded-2xl transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                고마워, {companionName}! ❤️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Top Header App Bar */}
      <header className="flex items-center justify-between py-3 border-b border-surface-container-high mb-4 sticky top-0 bg-white/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5">
          <div 
            onClick={() => onNavigateToTab('myinfo')}
            className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden shrink-0 card-shadow border border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
            title="내 정보 보기"
          >
            {userProfile?.avatarType === 'photo' && userProfile.avatarValue ? (
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover" 
                src={userProfile.avatarValue} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xl select-none">
                {CHARACTER_AVATAR_MAP[userProfile?.avatarValue as CharacterAvatar]?.emoji || '🙂'}
              </span>
            )}
          </div>
          <div className="text-left">
            <h1 className="text-base font-extrabold text-primary tracking-tight leading-none">라스 패스포트</h1>
          </div>
        </div>
      </header>

      {/* 2. 나의 건강 목표 */}
      <section className="bg-white rounded-2xl p-4 border border-surface-container text-left mb-4 shadow-3xs">
        <div className="mb-3">
          <h3 className="font-extrabold text-sm text-on-surface">나의 건강 목표</h3>
          <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">내가 세운 세 가지 목표를 자주 확인해요.</p>
        </div>

        <div className="space-y-2.5">
          {healthGoals.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border ${item.cardClass} transition-all`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${item.dotClass} shrink-0`} />
                <h4 className="text-xs font-black text-slate-800 leading-snug">
                  {item.label}
                </h4>
              </div>
              <p className="text-xs font-bold text-slate-700 leading-relaxed break-words whitespace-pre-wrap pl-3.5">
                {item.goal}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 오늘의 건강 발자국 */}
      <section className="bg-white rounded-2xl p-4 border border-surface-container text-left mb-4 shadow-3xs">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
            <span className="text-xs">👣</span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-on-surface">오늘의 건강 발자국</h3>
          </div>
        </div>
        <p className="text-[11px] font-bold text-on-surface-variant mb-3 pl-7.5">
          내가 세운 건강 목표를 지켰나요?
        </p>

        {/* 3대 건강 목표 예/아니오 체크 카드 */}
        <div className="space-y-2.5">
          {[
            {
              id: 'physical' as const,
              label: '신체 건강',
              emoji: '💪',
              isActive: isPhysicalActive,
              selected: answers.physical,
            },
            {
              id: 'social' as const,
              label: '사회 건강',
              emoji: '🤝',
              isActive: isSocialActive,
              selected: answers.social,
            },
            {
              id: 'emotional' as const,
              label: '정서 건강',
              emoji: '💖',
              isActive: isEmotionalActive,
              selected: answers.emotional,
            },
          ].map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                item.isActive 
                  ? 'bg-emerald-50/40 border-emerald-200/80' 
                  : item.selected === 'no'
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-2xl shadow-3xs transition-opacity duration-200 ${
                    item.isActive ? 'opacity-100' : 'opacity-25'
                  }`}
                >
                  <span className="select-none">{item.emoji}</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {item.label}
                  </h4>
                  <span className={`text-[10px] font-bold block mt-0.5 ${
                    item.isActive ? 'text-emerald-700' : item.selected === 'no' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {item.isActive ? '실천 성공! 🎉' : item.selected === 'no' ? '내일 다시 도전해요 💪' : '실천했는지 선택해 주세요'}
                  </span>
                </div>
              </div>

              {/* 예 / 아니오 라디오 버튼 */}
              <div 
                className="flex items-center gap-1.5 shrink-0" 
                role="radiogroup" 
                aria-label={`${item.label} 달성 여부`}
              >
                {/* 예 버튼 */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={item.selected === 'yes'}
                  onClick={() => handleSelectAnswer(item.id, 'yes')}
                  className={`px-3 py-2 min-w-[54px] rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border active:scale-95 ${
                    item.selected === 'yes'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.selected === 'yes' && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>예</span>
                </button>

                {/* 아니오 버튼 */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={item.selected === 'no'}
                  onClick={() => handleSelectAnswer(item.id, 'no')}
                  className={`px-3 py-2 min-w-[54px] rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border active:scale-95 ${
                    item.selected === 'no'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.selected === 'no' && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>아니오</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- POPUP DRESS-UP MODAL (라미 꾸미기 방) --- */}
      <AnimatePresence>
        {isDressUpModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-left">
                  <span className="text-xl">🎒</span>
                  <div>
                    <h3 className="font-extrabold text-base text-on-surface">라미 꾸미기 방</h3>
                    <p className="text-[10px] text-on-surface-variant font-bold">건강별로 악세사리를 수집해 봐요!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDressUpModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stars summary & Level */}
              <div className="my-3 py-2 px-3 bg-amber-50 border border-amber-200/50 rounded-xl flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">내 성장: Lv.{companionLevel}</span>
                <span className="text-amber-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  현재 {companionStars} 별 보유 중
                </span>
              </div>

              {/* List Container with Scrolling */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-2 max-h-[50vh]">
                {DECORATION_ITEMS.map((item) => {
                  const isUnlocked = unlockedItems.includes(item.id);
                  const isEquipped = equippedItem === item.id;
                  const levelLocked = companionLevel < item.minLevel;
                  const starsLocked = companionStars < item.cost && !isUnlocked;
                  const canUnlock = !levelLocked && !starsLocked;

                  return (
                    <div 
                      key={item.id}
                      onClick={() => !levelLocked && (!starsLocked || isUnlocked) && handleItemClick(item)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex items-center gap-3 cursor-pointer ${
                        isEquipped 
                          ? 'border-primary bg-blue-50/50 ring-2 ring-primary/20 shadow-xs' 
                          : isUnlocked 
                            ? 'border-slate-200 bg-white hover:bg-slate-50/50'
                            : levelLocked 
                              ? 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                              : starsLocked 
                                ? 'border-slate-200 bg-stone-50/60'
                                : 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50'
                      }`}
                    >
                      {/* Avatar Item Emoji */}
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-3xl border border-slate-100 shrink-0">
                        {item.emoji}
                      </div>

                      {/* Info block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className="text-xs font-black text-on-surface leading-none">{item.name}</h4>
                          
                          {/* Badges */}
                          {levelLocked ? (
                            <span className="bg-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                              <Lock className="w-2 h-2" />
                              Lv.{item.minLevel} 필요
                            </span>
                          ) : isEquipped ? (
                            <span className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">
                              장착 중 👕
                            </span>
                          ) : isUnlocked ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">
                              보유 중
                            </span>
                          ) : (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${
                              canUnlock ? 'bg-amber-400 text-on-surface' : 'bg-stone-200 text-stone-500'
                            }`}>
                              ⭐ {item.cost}개
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-on-surface-variant font-semibold mt-1 leading-normal">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button at bottom */}
              <button 
                onClick={() => setIsDressUpModalOpen(false)}
                className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-transform active:scale-95 cursor-pointer"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
