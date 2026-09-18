import React, { useState, useEffect } from 'react';
import { 
  Award, 
  User, 
  TrendingUp,
  Calendar,
  ChevronLeft,
  Activity,
  Camera,
  Check,
  Smile
} from 'lucide-react';
import { MealLog, HealthLog, StepLog, WaterLog, UserProfile, AvatarType, CharacterAvatar, HealthGoalFootprint } from '../types';
import { PRACTICE_GOALS, PracticeAnswers } from './PracticeHubView';
import { CHARACTER_AVATARS, CHARACTER_AVATAR_MAP, getUserProfile, saveUserProfile } from '../utils/profile';
import { getWeekFootprintRecords, getMonthFootprintData, getLocalDateKey } from '../utils/date';

const STAMP_ANGLES = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3];

function PassportStamp({ dateStr, angle }: { dateStr: string; angle: number }) {
  const formattedDate = dateStr 
    ? dateStr.replace(/-/g, '.') 
    : new Date().toISOString().split('T')[0].replace(/-/g, '.');

  return (
    <div
      className="relative flex items-center justify-center select-none pointer-events-none transition-transform duration-300 transform-gpu my-auto"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {/* Outer circular border with double line effect and subtle cyan glow */}
      <div className="w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] rounded-full border-2 border-dashed border-[#009fb0] p-[2.5px] flex items-center justify-center bg-[#009fb0]/5 shadow-xs">
        {/* Inner solid circular border */}
        <div className="w-full h-full rounded-full border-2 border-[#009fb0] flex flex-col items-center justify-between py-1.5 px-1 relative text-[#009fb0]">
          {/* Top star and dot decorations */}
          <div className="flex items-center justify-center gap-1 text-[7px] sm:text-[8px] font-black text-[#009fb0] tracking-wider">
            <span>★</span>
            <span className="text-[5px]">●</span>
            <span>★</span>
          </div>

          {/* Center text: 실천 완료 */}
          <div className="text-center my-auto">
            <span className="block text-[13px] sm:text-[14px] font-black tracking-tight text-[#008ca1] leading-none">
              실천 완료
            </span>
          </div>

          {/* Bottom date with subtle divider */}
          <div className="w-full flex flex-col items-center">
            <div className="w-10 h-[1px] bg-[#009fb0]/60 mb-0.5"></div>
            <span className="text-[9px] sm:text-[10px] font-black font-mono tracking-tighter text-[#007b8e] leading-none">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MyInfoViewProps {
  totalStepsThisWeek: number;
  waterDrunkThisWeek: number;
  averageWeight: number;
  userRole?: string;
  nickname?: string;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (profile: UserProfile) => void;
  onResetOnboarding?: () => void;
  onNavigateToSubpage?: (pageId: string) => void;
  onNavigateToTab?: (tabId: string) => void;
  waterLog?: WaterLog;
  stepLog?: StepLog;
  mealLogs?: MealLog[];
  healthLog?: HealthLog | null;
  praiseCardReceived?: boolean;
  practiceAnswers?: PracticeAnswers;
  todayFootprint?: HealthGoalFootprint;
}

export default function MyInfoView({ 
  totalStepsThisWeek, 
  waterDrunkThisWeek, 
  averageWeight,
  userRole = 'youth',
  nickname = '김민수',
  userProfile,
  onUpdateProfile,
  onResetOnboarding,
  onNavigateToSubpage,
  onNavigateToTab,
  waterLog = { date: '', count: 0, goal: 4 },
  stepLog = { date: '', count: 0, goal: 5000, distanceKm: 0, caloriesKcal: 0 },
  mealLogs = [],
  healthLog = null,
  praiseCardReceived = false,
  practiceAnswers,
  todayFootprint
}: MyInfoViewProps) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    return userProfile || getUserProfile() || {
      name: nickname || '김민수',
      role: 'challenger',
      avatarType: 'character',
      avatarValue: 'smile',
    };
  });

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    } else {
      const p = getUserProfile();
      if (p) setProfile(p);
    }
  }, [userProfile]);

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editAvatarType, setEditAvatarType] = useState<AvatarType>('character');
  const [editAvatarValue, setEditAvatarValue] = useState<CharacterAvatar | string>('smile');
  const modalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);

  const openEditModal = () => {
    setEditName(profile.name || nickname || '');
    setEditAvatarType(profile.avatarType || 'character');
    setEditAvatarValue(profile.avatarValue || 'smile');
    setIsEditProfileOpen(true);
  };

  const handleModalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditAvatarType('photo');
        setEditAvatarValue(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const trimmedName = editName.trim();
    const updated: UserProfile = {
      name: trimmedName || profile.name || nickname || '사용자',
      role: 'challenger',
      avatarType: editAvatarType,
      avatarValue: editAvatarValue,
    };
    saveUserProfile(updated);
    setProfile(updated);
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    setIsEditProfileOpen(false);
  };

  const [youthGoals, setYouthGoals] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month' | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const activePracticeAnswers = practiceAnswers ?? (() => {
    try {
      const saved = localStorage.getItem(`las_practice_answers_${todayStr}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading practice answers:', e);
    }
    return {};
  })();

  interface DayData {
    dateStr: string;
    dayName: string;
    steps: number;
    stepsGoal: number;
    water: number;
    waterGoal: number;
    hasMood: boolean;
    mood: number;
    sleepHours: number;
    mealCount: number;
    weight: number;
  }

  const getDaysData = (count: number): DayData[] => {
    const list: DayData[] = [];
    
    let allMeals: any[] = [];
    try {
      const savedMeals = localStorage.getItem('las_meals');
      if (savedMeals) allMeals = JSON.parse(savedMeals);
    } catch (e) {}

    for (let i = 0; i < count; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateKey(d);
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];

      const savedSteps = localStorage.getItem(`las_steps_${dateStr}`);
      const savedWater = localStorage.getItem(`las_water_${dateStr}`);
      const savedHealth = localStorage.getItem(`las_health_${dateStr}`);
      
      const dayMealsCount = allMeals.filter((m: any) => m.date === dateStr).length;

      let steps = 0;
      let stepsGoal = 10000;
      let water = 0;
      let waterGoal = 8;
      let hasMood = false;
      let mood = 0;
      let sleepHours = 0;
      let mealCount = dayMealsCount;
      let weight = 65.0;

      if (savedSteps) {
        try {
          const parsed = JSON.parse(savedSteps);
          steps = parsed.count || 0;
          stepsGoal = parsed.goal || 10000;
        } catch (e) {}
      }
      if (savedWater) {
        try {
          const parsed = JSON.parse(savedWater);
          water = parsed.count || 0;
          waterGoal = parsed.goal || 8;
        } catch (e) {}
      }
      if (savedHealth) {
        try {
          const parsed = JSON.parse(savedHealth);
          hasMood = true;
          mood = parsed.mood || 0;
          if (parsed.sleepDurationMinutes) {
            sleepHours = parseFloat((parsed.sleepDurationMinutes / 60).toFixed(1));
          } else if (parsed.sleepTime && parsed.wakeTime) {
            const [sh, sm] = parsed.sleepTime.split(':').map(Number);
            const [wh, wm] = parsed.wakeTime.split(':').map(Number);
            let diffMin = (wh * 60 + wm) - (sh * 60 + sm);
            if (diffMin < 0) diffMin += 24 * 60;
            sleepHours = parseFloat((diffMin / 60).toFixed(1));
          } else {
            sleepHours = 0;
          }
          weight = parsed.weight || 65.0;
        } catch (e) {}
      }

      list.push({
        dateStr,
        dayName,
        steps,
        stepsGoal,
        water,
        waterGoal,
        hasMood,
        mood,
        sleepHours,
        mealCount,
        weight
      });
    }
    return list;
  };

  const renderDailyFootprintsSection = (isParent = false) => {
    const isWeek = viewMode === 'week';
    const weekRecords = getWeekFootprintRecords(new Date(), todayFootprint);
    const monthData = getMonthFootprintData(new Date(), todayFootprint);

    const weeklyPhysicalDays = weekRecords.filter(d => !d.isFuture && d.answers.physical === 'yes').length;
    const weeklySocialDays = weekRecords.filter(d => !d.isFuture && d.answers.social === 'yes').length;
    const weeklyEmotionalDays = weekRecords.filter(d => !d.isFuture && d.answers.emotional === 'yes').length;

    return (
      <section className="bg-white rounded-2xl p-5 border border-surface-container card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-500 fill-amber-50" />
            {isWeek ? '이번 주 매일매일 건강 발자국' : '이번 달 매일매일 건강 발자국'}
          </h3>
          {!isWeek && (
            <span className="text-xs font-black text-on-surface-variant font-sans">
              {monthData.year}년 {monthData.month}월
            </span>
          )}
        </div>

        {isWeek ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 pt-1">
              {weekRecords.map((day, idx) => {
                const hasPhysical = !day.isFuture && day.answers.physical === 'yes';
                const hasSocial = !day.isFuture && day.answers.social === 'yes';
                const hasEmotional = !day.isFuture && day.answers.emotional === 'yes';
                const hasAny = hasPhysical || hasSocial || hasEmotional;

                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-center p-1.5 rounded-xl border text-center transition-all ${
                      day.isToday 
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' 
                        : day.isFuture 
                          ? 'bg-slate-50/40 border-slate-100 opacity-40' 
                          : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <span className={`text-[11px] font-black ${
                      day.dayName === '일' 
                        ? 'text-rose-500' 
                        : day.dayName === '토' 
                          ? 'text-blue-500' 
                          : 'text-on-surface-variant'
                    }`}>
                      {day.dayName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">
                      {day.date.getDate()}일
                    </span>

                    <div className="flex flex-col gap-1 items-center justify-center min-h-[72px]">
                      {hasPhysical && (
                        <span title="신체 건강 달성" className="text-base leading-none select-none">💪</span>
                      )}
                      {hasSocial && (
                        <span title="사회 건강 달성" className="text-base leading-none select-none">🤝</span>
                      )}
                      {hasEmotional && (
                        <span title="정서 건강 달성" className="text-base leading-none select-none">💖</span>
                      )}
                      {!hasAny && (
                        <span className="text-[11px] text-slate-300 font-bold">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 이번 주 실천 칭찬 한마디 */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-xl space-y-2">
              <p className="text-xs font-extrabold text-blue-900 flex items-center gap-1">
                ✨ 이번 주 실천 칭찬 한마디
              </p>
              <div className="text-xs font-bold text-blue-800/95 space-y-1.5 pl-1">
                <p>• 이번 주에 신체 건강 목표를 <span className="text-blue-600 font-black">{weeklyPhysicalDays}일</span>이나 성공했어요!</p>
                <p>• 이번 주에 사회 건강 목표를 <span className="text-blue-600 font-black">{weeklySocialDays}일</span>이나 성공했어요!</p>
                <p>• 이번 주에 정서 건강 목표를 <span className="text-blue-600 font-black">{weeklyEmotionalDays}일</span>이나 성공했어요!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 text-center pb-1 border-b border-slate-100">
              {['일', '월', '화', '수', '목', '금', '토'].map((name, i) => (
                <span 
                  key={name} 
                  className={`text-[11px] font-black ${
                    i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-1 pt-1">
              {/* 앞쪽 빈칸 */}
              {Array.from({ length: monthData.firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-12" />
              ))}

              {monthData.days.map((day) => {
                return (
                  <div 
                    key={day.dayNum} 
                    className={`flex flex-col items-center justify-between p-1 rounded-xl border text-center h-12 transition-all ${
                      day.isToday 
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20' 
                        : day.isFuture 
                          ? 'bg-slate-50/30 border-transparent opacity-40' 
                          : 'bg-white border-slate-100'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${
                      day.isToday ? 'text-blue-700 font-black' : 'text-slate-600'
                    }`}>
                      {day.dayNum}
                    </span>
                    
                    <div className="flex items-center justify-center h-5">
                      {day.isFuture ? null : day.statusSymbol === 'O' ? (
                        <span 
                          title="세 목표 모두 실천 (O)"
                          className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs"
                        >
                          O
                        </span>
                      ) : day.statusSymbol === '△' ? (
                        <span 
                          title="한두 목표 실천 (△)"
                          className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs"
                        >
                          △
                        </span>
                      ) : (
                        <span 
                          title="실천한 목표 없음 (X)"
                          className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 font-black text-[10px] flex items-center justify-center"
                        >
                          X
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <p className="text-[10px] font-bold text-slate-500 text-center pt-1">
              O 세 목표 모두 실천 · △ 한두 목표 실천 · X 실천한 목표 없음
            </p>

            {/* 이번 달 실천 칭찬 한마디 */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-xl space-y-2">
              <p className="text-xs font-extrabold text-blue-900 flex items-center gap-1">
                ✨ 이번 달 실천 칭찬 한마디
              </p>
              <div className="text-xs font-bold text-blue-800/95 space-y-1.5 pl-1">
                <p>• 이번 달에 신체 건강 목표를 <span className="text-blue-600 font-black">{monthData.physicalCount}일</span>이나 성공했어요!</p>
                <p>• 이번 달에 사회 건강 목표를 <span className="text-blue-600 font-black">{monthData.socialCount}일</span>이나 성공했어요!</p>
                <p>• 이번 달에 정서 건강 목표를 <span className="text-blue-600 font-black">{monthData.emotionalCount}일</span>이나 성공했어요!</p>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderYouthView = () => {
    return (
      <div className="w-full text-left animate-fadeIn">
        {renderDailyFootprintsSection(false)}
      </div>
    );
  };

  useEffect(() => {
    try {
      const yg = localStorage.getItem('las_youth_goals');
      if (yg) setYouthGoals(JSON.parse(yg));
    } catch (e) {
      console.error('Error reading goals from localStorage:', e);
    }
  }, []);

  const getRoleLabel = () => {
    return '건강 도전자';
  };

  const renderInterestChips = () => {
    const goalsToDisplay: string[] = youthGoals && youthGoals.length > 0 ? youthGoals : [];

    if (goalsToDisplay.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-blue-100">
          나에게 맞는 건강 목표를 찾아가는 중
        </span>
      );
    }

    const maxToShow = 3;
    const shownGoals = goalsToDisplay.slice(0, maxToShow);
    const extraCount = goalsToDisplay.length - maxToShow;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {shownGoals.map((goal, idx) => (
          <span 
            key={idx} 
            className="inline-flex items-center bg-blue-50 text-blue-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-blue-100 shrink-0"
          >
            {goal}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="text-[11px] font-black text-blue-800 bg-blue-100/60 px-2 py-0.5 rounded-md shrink-0">
            외 {extraCount}개
          </span>
        )}
      </div>
    );
  };

  if (viewMode) {
    return (
      <div className="w-full pb-16 animate-fadeIn text-left">
        {/* Header with Back Button */}
        <header className="flex items-center gap-3 py-3.5 border-b border-surface-container-high mb-4 sticky top-0 bg-background/95 backdrop-blur-md z-30">
          <button 
            onClick={() => setViewMode(null)}
            className="p-2 hover:bg-surface-container rounded-xl transition-all cursor-pointer text-on-surface-variant flex items-center justify-center bg-slate-50 border border-slate-100"
          >
            <ChevronLeft className="w-6 h-6 animate-pulse" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-on-surface">
              {viewMode === 'week' ? '이번 주 건강 발자국 👣' : '이번 달 건강 발자국 📈'}
            </h1>
            <p className="text-xs font-bold text-on-surface-variant">
              {nickname}님의 건강 실천 기록 모음집이에요
            </p>
          </div>
        </header>

        {renderYouthView()}
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-surface-container-high mb-6 sticky top-0 bg-background/95 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-extrabold text-on-surface">내 정보 &amp; 건강기록</h1>
        </div>
      </header>

      {/* Main Container */}
      <div className="space-y-6">
        
        {/* 1. Profile Section */}
        <section className="bg-white rounded-2xl p-6 card-shadow border border-surface-container text-left flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          
          {/* Avatar Display */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 shadow-md bg-blue-50/80 flex items-center justify-center">
            {profile.avatarType === 'photo' && profile.avatarValue ? (
              <img 
                src={profile.avatarValue} 
                alt="프로필 사진" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-4xl select-none">
                {CHARACTER_AVATAR_MAP[profile.avatarValue as CharacterAvatar]?.emoji || '🙂'}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1 w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h2 className="text-lg font-extrabold text-on-surface">
                  {(profile.name?.trim() || nickname?.trim() || '사용자')} 님
                </h2>
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {getRoleLabel()}
                </span>
              </div>
              <button
                type="button"
                onClick={openEditModal}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black rounded-full border border-blue-200 shadow-3xs flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Smile className="w-3.5 h-3.5 text-blue-600" />
                <span>프로필 바꾸기</span>
              </button>
            </div>
          </div>
        </section>

        {/* 큰 건강 여권 도장 카드 (10개 목표 2열 × 5행) */}
        <section className="bg-white rounded-3xl p-6 border border-surface-container text-left space-y-4">
          <div>
            <h3 className="font-extrabold text-lg text-on-surface">나의 건강 여권 도장 판 🎟️</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-1">
            {PRACTICE_GOALS.map((goal, index) => {
              const isStamped = activePracticeAnswers[goal.id] === 'yes';

              return (
                <div 
                  key={goal.id} 
                  id={`passport-stamp-slot-${index + 1}`}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between min-h-[136px] sm:min-h-[148px] overflow-hidden ${
                    isStamped 
                      ? 'bg-[#009fb0]/5 border-2 border-[#009fb0]/40 shadow-xs' 
                      : 'bg-slate-50/60 border-2 border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <h4 className="text-xs sm:text-sm font-black text-slate-700 leading-snug">
                      목표 {index + 1}
                    </h4>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-1">
                    {isStamped ? (
                      <PassportStamp 
                        dateStr={todayStr} 
                        angle={STAMP_ANGLES[index % STAMP_ANGLES.length]} 
                      />
                    ) : (
                      <div className="w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full border border-dashed border-slate-200/90 flex items-center justify-center select-none">
                        <span className="text-[10px] text-slate-300 font-bold">도장 자리</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 나의 건강 발자국 카드 */}
        <section className="bg-white rounded-2xl p-6 card-shadow border border-surface-container text-left space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-on-surface">나의 건강 발자국 👣</h3>
              <p className="text-xs font-bold text-on-surface-variant mt-0.5">
                이번 주와 이번 달의 건강 기록을 볼 수 있어요.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              onClick={() => setViewMode('week')}
              className="py-3 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-blue-100"
            >
              <Calendar className="w-4 h-4" />
              이번 주 보기
            </button>
            <button
              onClick={() => setViewMode('month')}
              className="py-3 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-indigo-100"
            >
              <TrendingUp className="w-4 h-4" />
              이번 달 보기
            </button>
          </div>
        </section>

        {/* 6. Restart Onboarding Settings Action */}
        <section className="bg-white rounded-2xl p-5 border border-surface-container text-center space-y-2.5">
          <p className="text-xs text-on-surface-variant">
            회원정보 질문을 다시 답변하고 싶으신가요?
          </p>
          <button
            onClick={onResetOnboarding}
            className="w-full h-11 bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant font-bold text-xs rounded-xl border border-surface-container-high flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>시작하기 / 온보딩 설정 다시 하기</span>
          </button>
        </section>
      </div>

      {/* Profile Edit Modal */}
      {isEditProfileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-surface-container space-y-5 animate-scaleUp text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Smile className="w-5 h-5 text-primary" />
                프로필을 바꿀까요?
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1) Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-on-surface-variant block">
                이름 또는 닉네임
              </label>
              <input
                type="text"
                placeholder="이름을 적어주세요"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-12 px-3.5 bg-surface-container border-2 border-surface-variant rounded-xl text-base font-bold focus:border-primary focus:ring-0 text-left"
              />
            </div>

            {/* 2) 5 Default Characters */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-on-surface-variant block">
                기본 캐릭터 고르기
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CHARACTER_AVATARS.map((char) => {
                  const isSelected = editAvatarType === 'character' && editAvatarValue === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setEditAvatarType('character');
                        setEditAvatarValue(char.id);
                      }}
                      className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer relative active:scale-95 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-2xl mb-1 select-none">{char.emoji}</span>
                      <span className={`text-[10px] font-black leading-tight ${isSelected ? 'text-blue-700 font-black' : 'text-slate-600'}`}>
                        {char.name.replace(' 친구', '').replace('기본 ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3) Photo Upload & Preview */}
            <div className="space-y-2 pt-1 border-t border-surface-container">
              <label className="text-xs font-extrabold text-on-surface-variant block">
                내 사진으로 설정
              </label>
              <input
                ref={modalPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleModalPhotoUpload}
                className="hidden"
              />

              {editAvatarType === 'photo' && typeof editAvatarValue === 'string' ? (
                <div className="p-3 bg-blue-50/80 border-2 border-blue-600 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-600 shadow-sm shrink-0 bg-white">
                      <img
                        src={editAvatarValue}
                        alt="내 프로필 사진"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-950">내 사진 선택됨</p>
                      <p className="text-[10px] font-bold text-blue-700">이 사진으로 프로필이 바뀌어요.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => modalPhotoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-[11px] font-black rounded-lg border border-blue-200 transition-all cursor-pointer active:scale-95"
                    >
                      다른 사진
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => modalPhotoInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>내 사진 넣기</span>
                </button>
              )}
            </div>

            {/* 4) Modal Action Buttons: Cancel and Save */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-surface-container">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-sm rounded-xl transition-all cursor-pointer active:scale-95"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-3 bg-primary hover:bg-primary-container text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
