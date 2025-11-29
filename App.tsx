
import React, { useState, useEffect, useRef } from 'react';
import { Quadrant } from './components/Quadrant';
import { SettingsModal } from './components/SettingsModal';
import { WallpaperLayout } from './components/WallpaperLayout';
import { analyzeTaskWithGemini } from './services/geminiService';
import { Task, QuadrantId, SubTask, AppSettings } from './types';
import { Sparkles, Plus, Loader2, LayoutGrid, RotateCcw, Image as ImageIcon, Undo2, Settings, Download, Moon, Sun } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 
import html2canvas from 'html2canvas';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState(false);
  const [manualQuadrant, setManualQuadrant] = useState<QuadrantId | 'auto'>('auto');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ 
    apiKey: '', 
    apiBaseUrl: '', 
    wallpaperPath: '',
    wallpaperResolution: '1920x1080',
    wallpaperStyle: {
      titleFontSize: 40,
      taskFontSize: 26,
      paddingPercent: 10,
      lineGap: 42
    }
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const wallpaperContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('eisenhower-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eisenhower-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eisenhower-theme', 'light');
    }
  };

  // Load Tasks from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('eisenhower-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, []);

  // Save Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Load Settings from LocalStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('eisenhower-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Merge defaults in case of new fields
        setAppSettings(prev => ({
          ...prev,
          ...parsed,
          wallpaperStyle: {
             ...prev.wallpaperStyle,
             ...(parsed.wallpaperStyle || {})
          }
        }));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem('eisenhower-settings', JSON.stringify(newSettings));
  };

  const handleImportTasks = (importedTasks: Task[]) => {
    if(window.confirm("导入将覆盖当前所有任务（或您可以选择合并）。点击确定覆盖，取消合并。")) {
       setTasks(importedTasks);
    } else {
       // Merge: add tasks that don't exist by ID
       setTasks(prev => {
         const existingIds = new Set(prev.map(t => t.id));
         const newUniqueTasks = importedTasks.filter(t => !existingIds.has(t.id));
         return [...prev, ...newUniqueTasks];
       });
    }
  };

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const currentInput = inputValue;
    setInputValue(''); // Optimistic clear
    setIsAnalyzing(true);

    try {
      let targetQuadrant: QuadrantId;
      let aiSubtasks: SubTask[] = [];
      let reasoning = "";
      let isAi = false;

      if (manualQuadrant !== 'auto') {
        targetQuadrant = manualQuadrant;
      } else {
        // AI Magic - pass settings
        const analysis = await analyzeTaskWithGemini(currentInput, appSettings);
        targetQuadrant = analysis.quadrant;
        reasoning = analysis.reasoning;
        isAi = true;
        
        if (analysis.subtasks && analysis.subtasks.length > 0) {
          aiSubtasks = analysis.subtasks.map(st => ({
            id: generateId(),
            content: st,
            completed: false
          }));
        }
      }

      const newTask: Task = {
        id: generateId(),
        content: currentInput,
        quadrant: targetQuadrant,
        createdAt: Date.now(),
        completed: false,
        subtasks: aiSubtasks,
        isAiGenerated: isAi
      };

      setTasks(prev => [...prev, newTask]);

      // Reset manual selector after add
      setManualQuadrant('auto');

    } catch (err) {
      console.error("Error adding task:", err);
      // Fallback if AI fails
      const newTask: Task = {
        id: generateId(),
        content: currentInput,
        quadrant: QuadrantId.Schedule,
        createdAt: Date.now(),
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
    } finally {
      setIsAnalyzing(false);
      // Keep focus
      inputRef.current?.focus();
    }
  };

  const handleDropTask = (taskId: string, targetQuadrant: QuadrantId) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, quadrant: targetQuadrant } : t
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleQuickAdd = (qid: QuadrantId) => {
    setManualQuadrant(qid);
    inputRef.current?.focus();
  };

  const handleClearCompleted = () => {
    if(window.confirm("确定要清除所有已完成的任务吗？")) {
      setTasks(prev => prev.filter(t => !t.completed));
    }
  };

  const handleSetWallpaper = async () => {
    if (!wallpaperContainerRef.current) return;
    
    setIsGeneratingWallpaper(true);
    
    // 强制显示 WallpaperLayout
    const layoutEl = wallpaperContainerRef.current;
    layoutEl.style.display = 'block';

    try {
      const canvas = await html2canvas(layoutEl, {
        scale: 1, // Layout is already at target resolution
        useCORS: true,
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', // slate-950 or slate-50
        logging: false
      });

      // 创建下载链接
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `eisenhower-matrix-${dateStr}.png`;
      link.click();
      
      if (appSettings.wallpaperPath) {
        alert(`图片已生成并触发下载。\n请手动将其保存到: ${appSettings.wallpaperPath}`);
      }
      
    } catch (error) {
      console.error("Wallpaper generation failed:", error);
      alert("生成壁纸失败，请重试。");
    } finally {
      layoutEl.style.display = 'none';
      setIsGeneratingWallpaper(false);
    }
  };

  const handleResetWallpaper = () => {
    alert("这是网页版应用，无法直接修改您的系统桌面。请使用“设置成壁纸”功能下载图片，然后手动设置为桌面背景。");
  };

  // Derived state for quadrants
  const getTasksFor = (qid: QuadrantId) => tasks.filter(t => t.quadrant === qid);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Hidden Wallpaper Layout */}
      <div 
        ref={wallpaperContainerRef} 
        style={{ display: 'none', position: 'fixed', top: 0, left: 0, zIndex: -1000 }}
      >
        <WallpaperLayout 
          tasks={tasks} 
          resolution={appSettings.wallpaperResolution} 
          isDarkMode={isDarkMode} 
          style={appSettings.wallpaperStyle}
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
        tasks={tasks}
        onImportTasks={handleImportTasks}
      />

      {/* Main App Container */}
      <div className="flex flex-col min-h-screen">
        
        {/* Header / Input Area */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-200 p-4 md:p-6 pb-2">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">艾森豪威尔 AI 矩阵</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gemini 驱动的智能任务优先级管理</p>
                </div>
              </div>

              {/* Controls */}
              <div 
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap"
              >
                 <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                 <button 
                  onClick={handleSetWallpaper}
                  disabled={isGeneratingWallpaper}
                  className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                >
                  {isGeneratingWallpaper ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />} 
                  {isGeneratingWallpaper ? '生成中...' : '设置成壁纸'}
                </button>
                 <button 
                  onClick={handleResetWallpaper}
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Undo2 size={14} /> 还原壁纸
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                 <button 
                  onClick={handleClearCompleted}
                  className="flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <RotateCcw size={14} /> 清除已完成
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="设置"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Smart Input Bar */}
            <form 
              onSubmit={handleAddTask} 
              className="relative max-w-3xl mx-auto w-full mb-2"
            >
              <div className={`
                flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1.5 pl-4 
                focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-700 focus-within:shadow-md transition-all
                ${isAnalyzing ? 'opacity-80' : ''}
              `}>
                
                {/* Manual Quadrant Selector Dropdown */}
                <select
                  value={manualQuadrant}
                  onChange={(e) => setManualQuadrant(e.target.value as any)}
                  className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 max-w-[80px] md:max-w-none"
                >
                  <option value="auto" className="dark:bg-slate-800">✨ AI 自动</option>
                  <option value={QuadrantId.DoFirst} className="dark:bg-slate-800">🔥 重要紧急</option>
                  <option value={QuadrantId.Schedule} className="dark:bg-slate-800">📅 重要不紧急</option>
                  <option value={QuadrantId.Delegate} className="dark:bg-slate-800">👥 紧急不重要</option>
                  <option value={QuadrantId.Delete} className="dark:bg-slate-800">🗑️ 不重要不紧急</option>
                </select>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={manualQuadrant === 'auto' ? "描述任务 (例如: '周五前完成报税')..." : "输入任务内容..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={isAnalyzing}
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isAnalyzing}
                  className={`
                    p-2.5 rounded-full text-white transition-all duration-200
                    ${!inputValue.trim() 
                      ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed' 
                      : manualQuadrant === 'auto' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105 hover:shadow-lg'
                        : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600'
                    }
                  `}
                >
                  {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : manualQuadrant === 'auto' ? <Sparkles size={20} /> : <Plus size={20} />}
                </button>
              </div>
              
              {/* Status Text */}
              <div className="absolute top-full left-0 w-full text-center mt-2">
                 {isAnalyzing && (
                   <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium animate-pulse">
                     AI 正在分析任务的紧急程度与重要性...
                   </span>
                 )}
              </div>
            </form>
          </div>
        </header>

        {/* Main Grid */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[calc(100vh-200px)]">
            
            <Quadrant 
              id={QuadrantId.DoFirst}
              tasks={getTasksFor(QuadrantId.DoFirst)}
              onDropTask={handleDropTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onQuickAdd={handleQuickAdd}
            />
            
            <Quadrant 
              id={QuadrantId.Schedule}
              tasks={getTasksFor(QuadrantId.Schedule)}
              onDropTask={handleDropTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onQuickAdd={handleQuickAdd}
            />
            
            <Quadrant 
              id={QuadrantId.Delegate}
              tasks={getTasksFor(QuadrantId.Delegate)}
              onDropTask={handleDropTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onQuickAdd={handleQuickAdd}
            />
            
            <Quadrant 
              id={QuadrantId.Delete}
              tasks={getTasksFor(QuadrantId.Delete)}
              onDropTask={handleDropTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onQuickAdd={handleQuickAdd}
            />

          </div>
        </main>
      </div>
    </div>
  );
}
