
import React, { useState, useEffect } from 'react';
import { AppSettings, Task, QuadrantId, QUADRANT_CONFIG, WallpaperStyle } from '../types';
import { X, Save, Download, Upload, Image as ImageIcon, Palette, Eye, Cpu, Database, LayoutTemplate } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  tasks: Task[];
  onImportTasks: (tasks: Task[]) => void;
}

type TabKey = 'appearance' | 'wallpaper' | 'system';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings,
  tasks,
  onImportTasks
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');
  const [formData, setFormData] = useState<AppSettings>(settings);
  
  // Sync props to state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      // Reset to first tab on open
      setActiveTab('appearance');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStyleChange = (key: keyof WallpaperStyle, value: number) => {
    setFormData(prev => ({
      ...prev,
      wallpaperStyle: {
        ...prev.wallpaperStyle!,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `eisenhower-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          alert('数据导入成功！');
        } else {
          alert('文件格式错误：必须是任务数组 JSON');
        }
      } catch (err) {
        alert('无法解析 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const style = formData.wallpaperStyle || {
    titleFontSize: 40,
    taskFontSize: 26,
    paddingPercent: 10,
    lineGap: 42
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            设置
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <TabButton 
            active={activeTab === 'appearance'} 
            onClick={() => setActiveTab('appearance')} 
            icon={<Palette size={16} />} 
            label="外观预览" 
          />
          <TabButton 
            active={activeTab === 'wallpaper'} 
            onClick={() => setActiveTab('wallpaper')} 
            icon={<LayoutTemplate size={16} />} 
            label="壁纸配置" 
          />
          <TabButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon={<Cpu size={16} />} 
            label="AI 与数据" 
          />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* TAB 1: Appearance (Split View) */}
          {activeTab === 'appearance' && (
            <div className="h-full flex flex-col md:flex-row">
              {/* Controls */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Palette size={16} className="text-indigo-500"/> 样式微调
                </h3>
                
                <div className="space-y-8">
                   <RangeControl 
                      label="标题字体大小" 
                      value={style.titleFontSize} 
                      min={20} max={80} unit="px"
                      onChange={(v) => handleStyleChange('titleFontSize', v)}
                   />
                   <RangeControl 
                      label="任务字体大小" 
                      value={style.taskFontSize} 
                      min={14} max={50} unit="px"
                      onChange={(v) => handleStyleChange('taskFontSize', v)}
                   />
                   <RangeControl 
                      label="边距大小" 
                      value={style.paddingPercent} 
                      min={2} max={20} unit="%"
                      onChange={(v) => handleStyleChange('paddingPercent', v)}
                   />
                   <RangeControl 
                      label="行间距" 
                      value={style.lineGap} 
                      min={10} max={100} step={2} unit="px"
                      onChange={(v) => handleStyleChange('lineGap', v)}
                   />
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 bg-gray-100 dark:bg-black/40 p-6 flex flex-col items-center justify-center min-h-[300px]">
                <div className="mb-4 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                   <Eye size={14} /> 实时预览 (单卡片)
                </div>
                
                <div 
                  className="relative shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 origin-center ring-1 ring-black/5 dark:ring-white/10"
                  style={{
                    width: '432px', // 960 * 0.45
                    height: '243px', // 540 * 0.45
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      transform: 'scale(0.45)',
                      transformOrigin: 'top left',
                      width: '960px',
                      height: '540px',
                    }}
                  >
                      <PreviewQuadrant style={style} />
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-gray-400 text-center max-w-xs">
                  * 预览展示了“重要且紧急”象限在 1080P 分辨率下的布局比例。
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Wallpaper Config */}
          {activeTab === 'wallpaper' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar">
               <div className="max-w-2xl mx-auto space-y-8">
                  <SectionHeader icon={<ImageIcon/>} title="输出设置" />
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分辨率</label>
                      <select
                        name="wallpaperResolution"
                        value={formData.wallpaperResolution || '1920x1080'}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      >
                        <option value="1920x1080">Full HD (1920 x 1080)</option>
                        <option value="2560x1440">2K QHD (2560 x 1440)</option>
                        <option value="3840x2160">4K UHD (3840 x 2160)</option>
                      </select>
                      <p className="mt-2 text-xs text-gray-500">决定了生成壁纸的清晰度和文件大小。</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">默认保存位置</label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <input
                              type="text" name="wallpaperPath" value={formData.wallpaperPath || ''} onChange={handleChange}
                              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                              placeholder="例如: D:\Wallpapers"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                               <LayoutTemplate size={16}/>
                            </div>
                         </div>
                         {/* Visual only button */}
                         <button className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                            浏览...
                         </button>
                      </div>
                      <p className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                         * 由于浏览器安全限制，此设置仅作为备忘提示，文件仍会下载到浏览器的默认下载文件夹。
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB 3: System (AI & Data) */}
          {activeTab === 'system' && (
             <div className="h-full p-6 overflow-y-auto custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-8">
                  
                  {/* AI Section */}
                  <div className="space-y-6">
                    <SectionHeader icon={<Cpu/>} title="人工智能模型配置" />
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                       <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-4">
                          应用默认使用内置的免费额度。如果您有自己的 Google Gemini API Key，可以在此处填入以获得更稳定的体验。
                       </p>
                       <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">API Key</label>
                            <input
                              type="password" name="apiKey" value={formData.apiKey} onChange={handleChange}
                              className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                              placeholder="sk-..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">API Base URL</label>
                            <input
                              type="text" name="apiBaseUrl" value={formData.apiBaseUrl || ''} onChange={handleChange}
                              className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                              placeholder="默认 (https://generativelanguage.googleapis.com)"
                            />
                            <p className="mt-1 text-xs text-gray-400">仅在使用代理或自定义网关时需要修改。</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-slate-800"/>

                  {/* Data Section */}
                  <div className="space-y-6">
                    <SectionHeader icon={<Database/>} title="数据管理" />
                    
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                          <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">
                            <Download size={24}/>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">导出备份 (.json)</span>
                       </button>

                       <div className="relative">
                          <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                          <button className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                            <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">
                              <Upload size={24}/>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">恢复数据</span>
                          </button>
                       </div>
                    </div>
                  </div>

                </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">取消</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 font-medium transition-all hover:scale-105 active:scale-95">
            <Save size={18} /> 保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative
      ${active 
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}
    `}
  >
    {icon}
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-500" />
    )}
  </button>
);

const RangeControl = ({ label, value, min, max, step = 1, unit, onChange }: { label: string, value: number, min: number, max: number, step?: number, unit: string, onChange: (v: number) => void }) => (
  <div>
    <div className="flex justify-between mb-2">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{label}</label>
      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
        {value}{unit}
      </span>
    </div>
    <input 
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
    />
  </div>
);

const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
     <span className="text-gray-400 dark:text-gray-500">{icon}</span>
     <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
  </div>
);

const PreviewQuadrant: React.FC<{ style: WallpaperStyle }> = ({ style }) => {
  const config = QUADRANT_CONFIG[QuadrantId.DoFirst];
  
  return (
    <div className={`
      h-full w-full flex flex-col border-[2px] rounded-[16px]
      ${config.bg} ${config.border}
    `}
    style={{ padding: `${style.paddingPercent}%` }}
    >
      <div className={`flex items-center gap-[16px] mb-[24px] pb-[16px] border-b border-black/10 dark:border-white/10`}>
        <span style={{ fontSize: `${style.titleFontSize}px` }}>{config.icon}</span>
        <div>
          <h2 className={`font-bold ${config.color}`} style={{ fontSize: `${style.titleFontSize}px` }}>
            {config.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 opacity-70" style={{ fontSize: `${style.titleFontSize * 0.6}px` }}>
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-0" style={{ display: 'flex', flexDirection: 'column', gap: `${style.lineGap}px` }}>
        {/* Sample Tasks */}
        <PreviewTask content="完成 2024 年度财务报表审计" style={style} urgent />
        <PreviewTask content="准备周五的产品发布演示文稿" style={style} urgent />
        <PreviewTask content="回复客户关于合同条款的紧急邮件" style={style} urgent />
      </div>
    </div>
  );
}

const PreviewTask: React.FC<{ content: string, style: WallpaperStyle, urgent?: boolean }> = ({ content, style, urgent }) => {
  return (
    <div className={`
      relative pl-[1.2em] 
      before:content-[''] before:absolute before:left-0 before:top-[0.4em] before:w-[0.4em] before:h-[0.4em] before:rounded-full
      ${urgent ? 'before:bg-red-500 dark:before:bg-red-400' : 'before:bg-gray-400'}
    `}
    style={{ fontSize: `${style.taskFontSize}px` }}
    >
      <span className="font-medium leading-tight block text-slate-800 dark:text-slate-100">
        {content}
      </span>
    </div>
  )
}
