import React, { useState, useEffect } from 'react';
import { PackingTask } from './types';
import PDADevice from './components/PDADevice';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import TaskReceiptJob from './components/TaskReceiptJob';
import { sound } from './components/SoundUtility';
import { Plus, X, Layers, Box, Package, Archive, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'pda_packing_tasks_v1';

const INITIAL_MOCK_TASKS: PackingTask[] = [
  {
    id: 'TASK20260621001',
    boxCount: 3,
    packageCount: 120,
    transferOrderId: 'DB20260620002',
    packingListNos: ['ZX20260621001A', 'ZX20260621001B', 'ZX20260621001C'],
    scannedPackingLists: [],
    status: 'pending'
  },
  {
    id: 'TASK20260621002',
    boxCount: 2,
    packageCount: 45,
    transferOrderId: 'DB20260620005',
    packingListNos: ['ZX20260621002A', 'ZX20260621002B'],
    scannedPackingLists: ['ZX20260621002A'], // Preloaded with 1 scanned item for intuitive testing
    status: 'pending'
  },
  {
    id: 'TASK20260621003',
    boxCount: 4,
    packageCount: 190,
    transferOrderId: 'DB20260619011',
    packingListNos: ['ZX20260621003A', 'ZX20260621003B', 'ZX20260621003C', 'ZX20260621003D'],
    scannedPackingLists: [],
    status: 'pending'
  },
  {
    id: 'TASK20260621004',
    boxCount: 2,
    packageCount: 50,
    transferOrderId: 'DB20260618012',
    packingListNos: ['ZX20260621004A', 'ZX20260621004B'],
    scannedPackingLists: ['ZX20260621004A', 'ZX20260621004B'],
    status: 'signed',
    signedTime: '2026-06-21 08:30:15'
  },
  {
    id: 'TASK20260621005',
    boxCount: 5,
    packageCount: 310,
    transferOrderId: 'DB20260617024',
    packingListNos: ['ZX20260621005A', 'ZX20260621005B', 'ZX20260621005C', 'ZX20260621005D', 'ZX20260621005E'],
    scannedPackingLists: ['ZX20260621005A', 'ZX20260621005B', 'ZX20260621005C', 'ZX20260621005D', 'ZX20260621005E'],
    status: 'signed',
    signedTime: '2026-06-21 09:12:45'
  }
];

export default function App() {
  const [tasks, setTasks] = useState<PackingTask[]>([]);
  const [activeScreen, setActiveScreen] = useState<'list' | 'detail' | 'job'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Laser effect state logic
  const [laserActive, setLaserActive] = useState(false);

  // Quick custom task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskId, setNewTaskId] = useState('');
  const [newBoxCount, setNewBoxCount] = useState(2);
  const [newPkgCount, setNewPkgCount] = useState(70);
  const [newTransferId, setNewTransferId] = useState('');
  const [newListsInput, setNewListsInput] = useState('');

  // 1. Initial Load & local storage recovery
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(INITIAL_MOCK_TASKS);
      }
    } else {
      setTasks(INITIAL_MOCK_TASKS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_TASKS));
    }
  }, []);

  // 2. Persist tasks state changes
  const saveTasks = (updatedTasks: PackingTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  // Reset to original mock data
  const handleResetData = () => {
    if (window.confirm('确认恢复默认的模拟数据吗？这将重置所有签收操作进度。')) {
      saveTasks(INITIAL_MOCK_TASKS);
      setActiveScreen('list');
      setSelectedTaskId(null);
      sound.playSuccess();
    }
  };

  // Find currently selected core task object
  const currentTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Update scanned lists
  const handleUpdateScannedList = (
    taskId: string, 
    scannedList: string[],
    containerBindings?: Record<string, string>,
    mergeZoneBindings?: Record<string, string>
  ) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          scannedPackingLists: scannedList,
          containerBindings: containerBindings || t.containerBindings,
          mergeZoneBindings: mergeZoneBindings || t.mergeZoneBindings,
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Trigger brief visual laser projection line
  const handleTriggerLaser = () => {
    setLaserActive(true);
    setTimeout(() => {
      setLaserActive(false);
    }, 400);
  };

  // Handle hardware sides physical trigger button scanning simulation
  const handlePhysicalScanTrigger = () => {
    // If we are currently in sign-off operation page, simulate scanning the appropriate input field
    if (activeScreen === 'job' && currentTask && currentTask.status === 'pending') {
      const inputElem = document.getElementById('pda-scan-input') as HTMLInputElement;
      if (inputElem) {
        handleTriggerLaser();
        const placeholder = inputElem.placeholder || '';
        let scanValue = '';

        if (placeholder.includes('箱单')) {
          const pendingNos = currentTask.packingListNos.filter(
            no => !currentTask.scannedPackingLists.includes(no)
          );
          if (pendingNos.length > 0) {
            scanValue = pendingNos[0];
          }
        } else if (placeholder.includes('容器')) {
          scanValue = 'CONT-01';
        } else if (placeholder.includes('合流')) {
          // Detect designated zone from DOM or fallback
          const textContent = document.body.innerText;
          const match = textContent.match(/合流区 [A-C]-\d+/);
          if (match) {
            scanValue = match[0];
          } else {
            scanValue = '合流区 A-01';
          }
        }

        if (scanValue) {
          // Set value and trigger React's input update
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputElem, scanValue);
            inputElem.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            inputElem.value = scanValue;
          }
          
          // Submit the form
          const form = inputElem.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        } else {
          sound.playError();
        }
      } else {
        sound.playError();
      }
    } else {
      // If we are elsewhere, trigger a fun error buzz
      sound.playError();
    }
  };

  // Core Submit sign off logic
  const handleSubmitReceipt = (taskId: string) => {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'signed' as const,
          signedTime: formattedTime
        };
      }
      return t;
    });

    saveTasks(updated);
    
    // Redirect to detail page with success confirmation message
    setActiveScreen('detail');
  };

  // Custom task spawn generator
  const handleCreateCustomTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskCode = (newTaskId.trim() || `TASK${Date.now()}`).toUpperCase();
    const transOrder = (newTransferId.trim() || `DB${Math.floor(Math.random() * 90000) + 10000}`).toUpperCase();

    // Parse list input strings
    let lists: string[] = [];
    if (newListsInput.trim()) {
      lists = newListsInput.split(/[\n,，]+/).map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
    }

    // Default mock list items if empty
    if (lists.length === 0) {
      lists = [
        `ZX${taskCode.replace(/\D/g, '') || Math.floor(Math.random() * 90000) + 10000}A`,
        `ZX${taskCode.replace(/\D/g, '') || Math.floor(Math.random() * 90000) + 10000}B`
      ];
    }

    const newTask: PackingTask = {
      id: taskCode,
      boxCount: Math.max(1, Number(newBoxCount) || lists.length),
      packageCount: Math.max(1, Number(newPkgCount)),
      transferOrderId: transOrder,
      packingListNos: lists,
      scannedPackingLists: [],
      status: 'pending'
    };

    // Append to list
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    
    // Close & sound chime
    setShowCreateModal(false);
    sound.playSubmit();

    // Clear form
    setNewTaskId('');
    setNewTransferId('');
    setNewListsInput('');
  };

  return (
    <PDADevice 
      onPhysicalScanTrigger={handlePhysicalScanTrigger} 
      scannerLaserActive={laserActive}
    >
      
      {/* RENDER ACTIVE SCREEN BASED ON ROUTING */}
      {activeScreen === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <TaskList
            tasks={tasks}
            onSelectTask={(task) => {
              setSelectedTaskId(task.id);
              setActiveScreen('detail');
            }}
            onResetData={handleResetData}
          />

          {/* QUICK CREATE CUSTOM FLOATING BUTTON */}
          <button
            onClick={() => setShowCreateModal(true)}
            title="快捷创建测试任务单"
            className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center shadow-lg active:scale-95 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer z-20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {activeScreen === 'detail' && currentTask && (
        <TaskDetail
          task={currentTask}
          onBackToList={() => {
            setActiveScreen('list');
            setSelectedTaskId(null);
          }}
          onEnterReceiptJob={(task) => {
            setActiveScreen('job');
          }}
        />
      )}

      {activeScreen === 'job' && currentTask && (
        <TaskReceiptJob
          task={currentTask}
          onBackToDetail={() => {
            setActiveScreen('detail');
          }}
          onUpdateScannedList={handleUpdateScannedList}
          onSubmitReceipt={handleSubmitReceipt}
          triggerLaserEffect={handleTriggerLaser}
        />
      )}

      {/* QUICK CREATE TASK MODAL BACKDROP & BODY */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[360px] p-4 space-y-4 animate-scale-up shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-500">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold font-mono tracking-wide text-white">快捷创建测试任务单</span>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTaskSubmit} className="space-y-3 text-xs text-slate-300">
              {/* Task ID input block */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">装箱任务 ID (留空随机)</label>
                <input
                  type="text"
                  value={newTaskId}
                  onChange={e => setNewTaskId(e.target.value)}
                  placeholder="例: TASK2026xxxx"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              {/* Transfer Order input block */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">调拨单号 (留空随机)</label>
                <input
                  type="text"
                  value={newTransferId}
                  onChange={e => setNewTransferId(e.target.value)}
                  placeholder="例: DB2026xxxx"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 font-mono text-white focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              {/* Box count & Pack count */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">箱数 (Box)</label>
                  <input
                    type="number"
                    min={1}
                    value={newBoxCount}
                    onChange={e => setNewBoxCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-bold">包裹数 (Pack)</label>
                  <input
                    type="number"
                    min={1}
                    value={newPkgCount}
                    onChange={e => setNewPkgCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Multiple individual packing slip input */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">
                  包含装箱单号 (用逗号或换行分隔)
                </label>
                <textarea
                  rows={2}
                  value={newListsInput}
                  onChange={e => setNewListsInput(e.target.value)}
                  placeholder="例: ZX001, ZX002, ZX003"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500 uppercase"
                />
                <span className="text-[9px] text-slate-500 block leading-tight">
                  提示：作业中需全额扫描此处填写的这组单号。
                </span>
              </div>

              {/* Form submit handlers */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-center rounded bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-center rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wider transition-all"
                >
                  创建并保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PDADevice>
  );
}
