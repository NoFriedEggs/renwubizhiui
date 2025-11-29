
import React from 'react';
import { Task, QuadrantId, QUADRANT_CONFIG } from '../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface QuadrantProps {
  id: QuadrantId;
  tasks: Task[];
  onDropTask: (taskId: string, targetQuadrant: QuadrantId) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onQuickAdd: (quadrantId: QuadrantId) => void;
}

export const Quadrant: React.FC<QuadrantProps> = ({ 
  id, 
  tasks, 
  onDropTask, 
  onDeleteTask, 
  onToggleTask,
  onQuickAdd
}) => {
  const config = QUADRANT_CONFIG[id];
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, id);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col h-full min-h-[300px] rounded-2xl border transition-all duration-300
        ${config.bg} 
        ${isOver ? 'ring-2 ring-offset-2 ring-blue-400 border-blue-300 bg-opacity-80 dark:ring-offset-slate-900' : config.border}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/50 dark:border-black/20 flex justify-between items-start">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${config.color}`}>
            <span>{config.icon}</span> {config.title}
          </h2>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 opacity-80 mt-0.5">{config.subtitle}</p>
        </div>
        <button 
          onClick={() => onQuickAdd(id)}
          className={`p-1.5 rounded-full hover:bg-white/60 dark:hover:bg-black/20 transition-colors ${config.color}`}
          title="快速添加到此象限"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 overflow-y-auto quadrant-scroll">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 opacity-50 space-y-2">
            <span className="text-4xl filter grayscale opacity-20">{config.icon}</span>
            <span className="text-sm">空</span>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDragStart={handleDragStart}
              onDelete={onDeleteTask}
              onToggle={onToggleTask}
            />
          ))
        )}
      </div>
    </div>
  );
};