
import React from 'react';
import { Task, QuadrantId, QUADRANT_CONFIG, WallpaperStyle } from '../types';

interface WallpaperLayoutProps {
  tasks: Task[];
  resolution?: string;
  isDarkMode?: boolean;
  style?: WallpaperStyle;
}

export const WallpaperLayout: React.FC<WallpaperLayoutProps> = ({ 
  tasks, 
  resolution = '1920x1080', 
  isDarkMode = false,
  style = {
    titleFontSize: 40,
    taskFontSize: 26,
    paddingPercent: 10,
    lineGap: 42
  }
}) => {
  const getTasksFor = (qid: QuadrantId) => tasks.filter(t => t.quadrant === qid);
  
  // Parse resolution
  const [widthStr, heightStr] = resolution.split('x');
  const width = parseInt(widthStr) || 1920;
  const height = parseInt(heightStr) || 1080;
  
  // Calculate scale factor relative to 1080p
  // We use this to scale pixel values provided by the user (which are based on 1080p)
  // So 40px at 1080p becomes 80px at 4K.
  const scale = height / 1080;

  const titleSize = style.titleFontSize * scale;
  const taskSize = style.taskFontSize * scale;
  const gapSize = style.lineGap * scale;
  // Padding percent is relative to container, so we just use it as CSS percentage
  const paddingVal = `${style.paddingPercent}%`;

  return (
    <div 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        // Base font size for em units if needed, though we use px mostly now
        fontSize: `${16 * scale}px` 
      }}
      className={`${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-[32px] font-sans box-border overflow-hidden flex flex-col`}
    >
       {/* Wallpaper Header */}
       <div 
        className="flex items-center gap-[1em] mb-[2em] opacity-80"
        style={{ fontSize: `${16 * scale}px` }} // Keep header size somewhat static or scaled generally
       >
          <div className="p-[0.5em] bg-indigo-600 rounded-xl text-white">
             {/* Simple Grid Icon SVG */}
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5em', height: '1.5em' }}>
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
             </svg>
          </div>
          <div>
            <h1 className="text-[1.5em] font-bold tracking-tight">艾森豪威尔 AI 矩阵</h1>
            <p className={`text-[0.8em] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
       </div>

       {/* Grid */}
       <div className="flex-1 grid grid-cols-2 gap-[24px]">
         {[QuadrantId.DoFirst, QuadrantId.Schedule, QuadrantId.Delegate, QuadrantId.Delete].map(qid => {
            const config = QUADRANT_CONFIG[qid];
            const qTasks = getTasksFor(qid);
            
            return (
              <div 
                key={qid} 
                className={`
                  rounded-[24px] border-[2px] flex flex-col
                  ${isDarkMode ? config.bg.split(' ')[1] || config.bg : config.bg.split(' ')[0]}
                  ${isDarkMode ? config.border.split(' ')[1] || config.border : config.border.split(' ')[0]}
                `}
                style={{ padding: paddingVal }}
              >
                 {/* Title */}
                 <div className={`flex items-center gap-[0.5em] mb-[1em] pb-[0.5em] border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                    <span style={{ fontSize: `${titleSize}px` }}>{config.icon}</span>
                    <div>
                      <h2 className={`font-bold ${isDarkMode ? config.color.split(' ')[1] : config.color.split(' ')[0]}`} style={{ fontSize: `${titleSize}px` }}>
                          {config.title}
                      </h2>
                      <p className={`font-medium opacity-70 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} style={{ fontSize: `${titleSize * 0.6}px` }}>
                          {config.subtitle}
                      </p>
                    </div>
                 </div>

                 {/* List */}
                 <div className="flex-1 content-start" style={{ display: 'flex', flexDirection: 'column', gap: `${gapSize}px` }}>
                    {qTasks.length === 0 ? (
                       <div className="h-full flex items-center justify-center opacity-30">
                          <span style={{ fontSize: `${taskSize}px` }}>无任务</span>
                       </div>
                    ) : (
                      qTasks.map(t => (
                        <div 
                          key={t.id} 
                          className={`
                            relative pl-[1.2em] 
                            before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-[0.4em] before:h-[0.4em] before:rounded-full
                            ${t.completed ? 'opacity-50 line-through' : ''}
                            ${qid === QuadrantId.DoFirst ? (isDarkMode ? 'before:bg-red-400' : 'before:bg-red-500') : ''}
                            ${qid === QuadrantId.Schedule ? (isDarkMode ? 'before:bg-blue-400' : 'before:bg-blue-500') : ''}
                            ${qid === QuadrantId.Delegate ? (isDarkMode ? 'before:bg-green-400' : 'before:bg-green-500') : ''}
                            ${qid === QuadrantId.Delete ? (isDarkMode ? 'before:bg-gray-400' : 'before:bg-gray-500') : ''}
                          `}
                          style={{ fontSize: `${taskSize}px` }}
                        >
                          <span className="font-medium leading-tight block">
                            {t.content}
                          </span>
                          {t.subtasks && t.subtasks.length > 0 && (
                             <div className="mt-[0.3em] pl-[0.2em] flex flex-wrap gap-[0.5em] opacity-80">
                                {t.subtasks.map(st => (
                                   <span key={st.id} className="text-[0.7em] px-[0.5em] py-[0.1em] rounded-md bg-black/5 dark:bg-white/10">
                                      {st.content}
                                   </span>
                                ))}
                             </div>
                          )}
                        </div>
                      ))
                    )}
                 </div>
              </div>
            );
         })}
       </div>
    </div>
  );
};
