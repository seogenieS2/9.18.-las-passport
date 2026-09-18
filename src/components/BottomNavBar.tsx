import React from 'react';
import { 
  Home, 
  ClipboardList, 
  PlayCircle,
  Users, 
  User 
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onResetOnboarding?: () => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'practice', label: '실천', icon: ClipboardList },
    { 
      id: 'video', 
      label: '영상 보기', 
      icon: PlayCircle,
      isExternal: true,
      url: 'https://www.youtube.com/watch?v=LbQFq4HxRYA&list=PLZzJXgd0FSvxLSGK4Cc02mKqiY_mESo2m'
    },
    { id: 'community', label: '커뮤니티', icon: Users },
    { id: 'my-info', label: '내 정보', icon: User },
  ];

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.isExternal && tab.url) {
      window.open(
        tab.url,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    onTabChange(tab.id);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t-2 border-slate-200 shadow-2xl z-40 rounded-t-3xl max-w-lg mx-auto w-full min-h-[92px] sm:min-h-[98px] px-1.5 sm:px-3 flex justify-between items-center pb-safe select-none"
      aria-label="하단 메뉴"
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className="flex-1 flex flex-col items-center justify-center min-h-[72px] sm:min-h-[76px] py-1 px-1 relative cursor-pointer active:scale-95 transition-all touch-manipulation group"
            aria-label={tab.label}
          >
            {isActive ? (
              <div className="bg-primary/10 rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex flex-col items-center justify-center transition-all w-full max-w-[76px]">
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-primary stroke-[2.4]" />
                <span className="text-[14px] sm:text-[15px] font-black mt-1 text-primary tracking-tight whitespace-nowrap leading-tight">
                  {tab.label}
                </span>
              </div>
            ) : (
              <div className="rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex flex-col items-center justify-center transition-all w-full max-w-[76px] hover:bg-slate-50">
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500 group-hover:text-primary group-hover:scale-105 stroke-[2] transition-transform" />
                <span className="text-[14px] sm:text-[15px] font-bold mt-1 text-slate-600 group-hover:text-primary tracking-tight whitespace-nowrap leading-tight">
                  {tab.label}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}

