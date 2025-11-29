
import React, { useState } from 'react';
import { Task, QuadrantId, QUADRANT_CONFIG } from '../types';
import { Trash2, GripVertical, CheckCircle, Circle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onToggle, onDragStart }) => {
  const [expanded, setExpanded] = useState(false);
  
  const config = QUADRANT_CONFIG[task.quadrant];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`
        group relative p-3 mb-3 rounded-xl shadow-sm border border-transparent 
        transition-all duration-200 hover:shadow-md cursor-move
        bg-white dark:bg-slate-800
        ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-slate-800/50' : 'hover:-translate-y-0.5'}
        ${config.hover} border-l-4 ${config.border.replace('border', 'border-l')}
      `}
      style={{ borderLeftColor: task.completed ? undefined : undefined }} // Let class handle it, but can override if needed
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle (Visual only, whole card is draggable) */}
        <div className="mt-1 text-gray-300 dark:text-slate-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-slate-500 hover:text-gray-400 dark:hover:text-slate-400'}`}
        >
          {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium break-words ${task.completed ? 'line-through text-gray-500 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'}`}>
            {task.content}
          </p>
          
          {/* AI Badge & Subtasks Toggle */}
          <div className="flex items-center gap-2 mt-1.5">
            {task.isAiGenerated && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Sparkles size={10} /> AI 分类
              </span>
            )}
            
            {hasSubtasks && (
              <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 flex items-center gap-1"
              >
                {task.subtasks?.length} 个子任务
                {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              </button>
            )}
          </div>

          {/* Expanded Subtasks */}
          {expanded && hasSubtasks && (
            <div className="mt-3 pl-2 space-y-1 border-l-2 border-gray-100 dark:border-slate-700">
              {task.subtasks?.map((st) => (
                <div key={st.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                  <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-slate-500" />
                  <span>{st.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Action */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
          aria-label="删除任务"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};