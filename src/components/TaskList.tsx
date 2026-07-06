import React, { useState } from 'react';
import { PackingTask, SearchFilters } from '../types';
import { Search, Calendar, ChevronRight, Filter, RefreshCw, Layers, CheckCircle2, Box, Package, Archive, X, QrCode, AlertTriangle } from 'lucide-react';

interface TaskListProps {
  tasks: PackingTask[];
  onSelectTask: (task: PackingTask) => void;
  onResetData: () => void;
}

export default function TaskList({ tasks, onSelectTask, onResetData }: TaskListProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');
  
  // Scanning state
  const [scanQuery, setScanQuery] = useState('');
  const [scanStatus, setScanStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Advanced filters state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    packingTaskID: '',
    packingListNo: '',
    signedTimeRange: 'all', // all, today, 3days, 7days, custom
    customStartDate: '',
    customEndDate: '',
  });

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanQuery.trim();
    if (!query) return;

    // Search for a matching task by Task ID, Transfer Order ID, or Packing List No
    const foundTask = tasks.find(task => {
      const matchId = task.id.toLowerCase() === query.toLowerCase();
      const matchTransfer = task.transferOrderId.toLowerCase() === query.toLowerCase();
      const matchPackingList = task.packingListNos.some(no => no.toLowerCase() === query.toLowerCase());
      return matchId || matchTransfer || matchPackingList;
    });

    if (foundTask) {
      setScanStatus({
        type: 'success',
        message: `匹配成功: "${foundTask.id}"，正在进入详情...`,
      });
      setTimeout(() => {
        onSelectTask(foundTask);
        setScanQuery('');
        setScanStatus({ type: 'idle', message: '' });
      }, 800);
    } else {
      // Treat as filters search as fallback so list updates in real-time
      setFilters(prev => ({
        ...prev,
        packingTaskID: query,
      }));
      setScanStatus({
        type: 'error',
        message: `未发现完全匹配的单据，已自动应用为列表搜索过滤: "${query}"`,
      });
      // Clear message after a short timeout
      setTimeout(() => {
        setScanStatus(prev => prev.type === 'error' ? { type: 'idle', message: '' } : prev);
      }, 4000);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      packingTaskID: '',
      packingListNo: '',
      signedTimeRange: 'all',
      customStartDate: '',
      customEndDate: '',
    });
    setScanQuery('');
  };

  // Helper to check if signed time matches the selected range
  const matchesSignedTime = (signedTimeString: string | undefined, range: string) => {
    if (range === 'all') return true;
    if (!signedTimeString) return false;

    try {
      if (range === 'custom') {
        const taskDateStr = signedTimeString.split(' ')[0]; // '2026-06-21'
        if (filters.customStartDate && taskDateStr < filters.customStartDate) {
          return false;
        }
        if (filters.customEndDate && taskDateStr > filters.customEndDate) {
          return false;
        }
        return true;
      }

      const signedDate = new Date(signedTimeString.replace(/-/g, '/'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - signedDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (range === 'today') {
        // Simple check if it's today
        const signedStr = signedTimeString.split(' ')[0];
        const nowStr = new Date().toISOString().split('T')[0];
        return signedStr === nowStr;
      }
      if (range === '3days') {
        return diffDays <= 3;
      }
      if (range === '7days') {
        return diffDays <= 7;
      }
    } catch (e) {
      return true; // fallback
    }
    return true;
  };

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    // 1. Tab mismatch
    if (activeTab === 'pending' && task.status !== 'pending') return false;
    if (activeTab === 'signed' && task.status !== 'signed') return false;

    // 2. Packing Task ID filter
    if (filters.packingTaskID.trim()) {
      const taskIdLower = task.id.toLowerCase();
      const queryLower = filters.packingTaskID.trim().toLowerCase();
      if (!taskIdLower.includes(queryLower)) return false;
    }

    // 3. Packing List Number (装箱单号) filter
    if (filters.packingListNo.trim()) {
      const queryLower = filters.packingListNo.trim().toLowerCase();
      const listMatches = task.packingListNos.some(no => 
        no.toLowerCase().includes(queryLower)
      );
      if (!listMatches) return false;
    }

    // 4. Receipt/Signed Time filter (only relevant for signed tab)
    if (activeTab === 'signed') {
      if (!matchesSignedTime(task.signedTime, filters.signedTimeRange)) {
        return false;
      }
    }

    return true;
  });

  // Calculate active filters count
  const activeFiltersCount = 
    (filters.packingTaskID ? 1 : 0) + 
    (filters.packingListNo ? 1 : 0) + 
    (filters.signedTimeRange !== 'all' && activeTab === 'signed' ? 1 : 0);

  // Stats
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const signedCount = tasks.filter(t => t.status === 'signed').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      
      {/* HEADER SECTION */}
      <div className="bg-blue-600 p-3 px-4 shrink-0 shadow-md z-10 flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-white" />
            <h1 className="text-base font-bold tracking-tight text-white font-sans">集箱任务签收</h1>
          </div>
          
          <div className="flex items-center gap-2 relative">
            {/* Reset mock data button */}
            <button 
              onClick={onResetData}
              title="重置模拟数据"
              className="p-1.5 rounded-md hover:bg-blue-700 text-blue-100 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Filter Toggle Button */}
            <button
              id="filter-toggle-btn"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-1.5 px-3 rounded-md relative flex items-center gap-1 leading-none text-xs transition-all ${
                activeFiltersCount > 0 
                  ? 'bg-white text-blue-600 font-bold shadow-sm' 
                  : 'bg-blue-700/60 hover:bg-blue-700 text-white border border-blue-500/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>筛选</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[8px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* COMPACT ACTIVE FILTER TAGS */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-0.5">
            {filters.packingTaskID && (
              <span className="inline-flex items-center gap-0.5 bg-blue-700/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                任务: {filters.packingTaskID}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-200 ml-1" onClick={() => setFilters({ ...filters, packingTaskID: '' })} />
              </span>
            )}
            {filters.packingListNo && (
              <span className="inline-flex items-center gap-0.5 bg-blue-700/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                单号: {filters.packingListNo}
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-200 ml-1" onClick={() => setFilters({ ...filters, packingListNo: '' })} />
              </span>
            )}
            {filters.signedTimeRange !== 'all' && activeTab === 'signed' && (
              <span className="inline-flex items-center gap-0.5 bg-blue-700/80 text-white text-[10px] px-2 py-0.5 rounded animate-fade-in">
                时间: {
                  filters.signedTimeRange === 'today' ? '今天' :
                  filters.signedTimeRange === '3days' ? '最近3天' :
                  filters.signedTimeRange === '7days' ? '最近7天' :
                  (filters.customStartDate || filters.customEndDate)
                    ? `${filters.customStartDate || ''} 至 ${filters.customEndDate || ''}`
                    : '自定义'
                }
                <X className="w-2.5 h-2.5 cursor-pointer hover:text-red-200 ml-1" onClick={() => setFilters({ ...filters, signedTimeRange: 'all', customStartDate: '', customEndDate: '' })} />
              </span>
            )}
            <button 
              onClick={handleClearFilters}
              className="text-[10px] text-blue-200 hover:text-white font-bold ml-auto whitespace-nowrap pl-2 underline"
            >
              清空
            </button>
          </div>
        )}
      </div>

      {/* FILTER DROPDOWN OVERLAY (SMART MODAL PANEL) */}
      {showFilterPanel && (
        <div className="absolute inset-x-0 top-[80px] bg-white border-b border-slate-200 shadow-xl z-30 p-4 space-y-4 text-slate-800 animate-slide-down">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">高级筛选条件</span>
            <button 
              onClick={() => setShowFilterPanel(false)}
              className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Task ID filter input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">装箱任务 ID (模糊搜索)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={filters.packingTaskID}
                onChange={e => setFilters({ ...filters, packingTaskID: e.target.value })}
                placeholder="请输入任务ID，例: TASK..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Packing list input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500">装箱单号 (模糊搜索)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={filters.packingListNo}
                onChange={e => setFilters({ ...filters, packingListNo: e.target.value })}
                placeholder="请输入装箱单号，例: ZX..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
              />
            </div>
          </div>

          {/* Signed Time Filter (Only applicable to signed tab) */}
          <div className={`space-y-1 ${activeTab === 'pending' ? 'opacity-40' : ''}`}>
            <label className="block text-[11px] font-bold text-slate-500 flex justify-between">
              <span>签收时间筛选</span>
              {activeTab === 'pending' && <span className="text-red-500 text-[10px] font-normal">(仅适用于已签收)</span>}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '不限', val: 'all' },
                { label: '今天', val: 'today' },
                { label: '3天内', val: '3days' },
                { label: '7天内', val: '7days' },
                { label: '自定义', val: 'custom' }
              ].map(item => (
                <button
                  key={item.val}
                  disabled={activeTab === 'pending'}
                  onClick={() => setFilters({ ...filters, signedTimeRange: item.val })}
                  className={`flex-1 min-w-[55px] py-1.5 text-center text-[10px] font-semibold rounded-md transition-all ${
                    filters.signedTimeRange === item.val && activeTab === 'signed'
                      ? 'bg-blue-600 text-white shadow-sm font-bold border border-blue-500'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filters.signedTimeRange === 'custom' && activeTab === 'signed' && (
              <div className="grid grid-cols-2 gap-2 mt-2 px-0.5 pt-2 border-t border-dashed border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">开始日期</span>
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={e => setFilters({ ...filters, customStartDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">结束日期</span>
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={e => setFilters({ ...filters, customEndDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={handleClearFilters}
              className="flex-1 py-2 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
            >
              清空重置
            </button>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="flex-1 py-2 text-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-100 transition-all"
            >
              确认筛选 ({filteredTasks.length} 项)
            </button>
          </div>
        </div>
      )}

      {/* QUICK SCANNING AREA ABOVE TABS */}
      <div className="bg-white border-b border-slate-200 p-3 shrink-0 shadow-sm">
        <form onSubmit={handleScanSubmit} className="relative">
          <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-lg overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <QrCode className="w-4 h-4 ml-3 text-blue-600 shrink-0" />
            <input
              type="text"
              value={scanQuery}
              onChange={e => setScanQuery(e.target.value)}
              placeholder="请红外扫描/输入任务ID、调拨单或箱单号"
              className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 rounded-lg py-2 pl-2 pr-10 text-xs font-bold font-mono tracking-wider focus:outline-none"
              autoComplete="off"
            />
            {scanQuery && (
              <button
                type="button"
                onClick={() => setScanQuery('')}
                className="absolute right-10 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        {scanStatus.type !== 'idle' && (
          <div className={`mt-2 px-2.5 py-1.5 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all ${
            scanStatus.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border border-red-200 text-red-800 shadow-sm'
          }`}>
            {scanStatus.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            )}
            <span>{scanStatus.message}</span>
          </div>
        )}
      </div>

      {/* DOUBLE NAVIGATION TAB VIEW */}
      <div className="flex bg-white border-b border-slate-200 divide-x divide-slate-100 shrink-0 shadow-sm z-0">
        {/* Pending Tab */}
        <button
          onClick={() => {
            setActiveTab('pending');
          }}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'pending' 
              ? 'bg-blue-50/10 text-blue-600 font-bold border-b-2 border-blue-600' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider font-bold">待签收</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {pendingCount}
            </span>
          </div>
        </button>

        {/* Signed Tab */}
        <button
          onClick={() => {
            setActiveTab('signed');
          }}
          className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'signed' 
              ? 'bg-blue-50/10 text-emerald-600 font-bold border-b-2 border-emerald-500' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/20'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider font-bold">已签收</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'signed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {signedCount}
            </span>
          </div>
        </button>
      </div>

      {/* LIST CONTENT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-100/60 scrollbar-thin">
        
        {/* Results Counter / Filter Indicator */}
        <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 font-semibold select-none">
          <span>当前列表: {filteredTasks.length} 个装箱任务</span>
          {(activeFiltersCount > 0) && (
            <span className="text-blue-600 font-bold">已启用高级筛选</span>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-150 flex items-center justify-center mb-4 border border-slate-200">
              <Archive className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-600 text-xs font-bold leading-normal">
              {activeFiltersCount > 0 ? '未匹配到符合筛选条件的任务' : '此标签下暂无任何签收任务'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-3 text-xs text-blue-600 font-bold hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:shadow-sm"
              >
                重置筛选条件
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 active:bg-blue-50/10 p-3.5 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 relative select-none"
            >
              {/* Row 1: Task ID & Transfer Order ID */}
              <div className="flex justify-between items-center mb-2.5">
                <div className="overflow-hidden">
                  <span className="font-mono text-xs font-black text-slate-800 tracking-wide">
                    {task.id}
                  </span>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                    调拨单号: <span className="font-mono text-blue-600">{task.transferOrderId}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Row 2: Box Count & Package Count */}
              <div className="grid grid-cols-2 gap-3 py-2 border-t border-slate-100 text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold">箱数</span>
                    <span className="text-xs font-bold font-mono tracking-wider text-slate-800">{task.boxCount} 箱</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold">包裹数</span>
                    <span className="text-xs font-bold font-mono tracking-wider text-slate-800">{task.packageCount} 包</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
