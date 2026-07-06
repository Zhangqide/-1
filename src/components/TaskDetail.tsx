import React from 'react';
import { PackingTask } from '../types';
import { ChevronLeft, QrCode, ClipboardList, CheckCircle2, Clock, Box, Package, ArrowRight, Layers, FileCode } from 'lucide-react';

interface TaskDetailProps {
  task: PackingTask;
  onBackToList: () => void;
  onEnterReceiptJob: (task: PackingTask) => void;
}

export default function TaskDetail({ task, onBackToList, onEnterReceiptJob }: TaskDetailProps) {
  const isPending = task.status === 'pending';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      
      {/* HEADER BAR */}
      <div className="bg-blue-600 px-4 py-3 shrink-0 shadow-md flex items-center justify-between z-10 text-white">
        <button
          onClick={onBackToList}
          className="flex items-center gap-1 text-blue-100 hover:text-white px-2 py-1 rounded hover:bg-blue-700/50 transition-all text-xs font-bold leading-none"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
          <span>返回列表</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-tight font-sans">装箱任务详情</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            isPending 
              ? 'bg-amber-500 text-white' 
              : 'bg-emerald-500 text-white'
          }`}>
            {isPending ? '待签收' : '已签收'}
          </span>
        </div>
        <div className="w-14"></div> {/* spacer to center */}
      </div>

      {/* TASK BODY SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        
        {/* PRIMARY FIELDS PANEL */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <ClipboardList className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-xs font-black text-slate-800">核心任务单据</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            {/* Task ID */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-bold text-[11px]">装箱任务 ID</span>
              <div className="flex items-center gap-2">
                <span className={`text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  isPending 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {isPending ? '待签收' : '已签收'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                  {task.id}
                </span>
              </div>
            </div>

            {/* Transfer Order Number */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-bold text-[11px]">调拨单号</span>
              <span className="font-mono text-xs font-bold text-blue-600 tracking-wider">
                {task.transferOrderId}
              </span>
            </div>

            {/* Signed Time (Only shows if signed) */}
            {!isPending && task.signedTime && (
              <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-emerald-600 font-black text-[11px]">实际签收时间</span>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">
                  {task.signedTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* BOX AND PACKAGE DETAILS */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Box Count Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              <Box className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 font-bold">集装箱箱数</span>
              <span className="text-sm font-black font-mono tracking-wider truncate text-slate-800">
                {task.boxCount} <span className="text-[11px] text-slate-500 font-normal">箱</span>
              </span>
            </div>
          </div>

          {/* Package Count Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 font-bold">包含包裹数</span>
              <span className="text-sm font-black font-mono tracking-wider truncate text-slate-800">
                {task.packageCount} <span className="text-[11px] text-slate-500 font-normal">包</span>
              </span>
            </div>
          </div>
        </div>

        {/* PACKING LIST CODES LIST (装箱单号 - 含有多个) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm flex flex-col">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-blue-600" />
              <span className="text-xs font-black text-slate-800">
                装箱单列表 
                <span className="ml-1.5 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-black">
                  {task.packingListNos.length}
                </span>
              </span>
            </div>
            
            {/* Scanned/Total indicator */}
            <span className="text-[11px] font-mono text-slate-500 font-bold">
              作业进度: <span className="text-blue-600 font-black">{task.scannedPackingLists.length}</span> / {task.packingListNos.length}
            </span>
          </div>

          {/* Individual packing single item list */}
          <div className="space-y-2">
            {task.packingListNos.map((no, idx) => {
              const isScanned = task.scannedPackingLists.includes(no) || !isPending;
              return (
                <div
                  key={no}
                  className={`flex justify-between items-center px-3 py-2.5 rounded-lg border text-xs font-mono transition-all ${
                    isScanned
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-semibold'
                      : 'bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold tracking-wider truncate text-slate-700">
                      {no}
                    </span>
                  </div>

                  <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-black select-none ${
                    isScanned 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-200/60 text-slate-500'
                  }`}>
                    {isScanned ? '已扫描' : '未扫描'}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* FOOTER ACTION PANEL (ONLY FOR PENDING TASKS) */}
      <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
        {isPending ? (
          <button
            onClick={() => onEnterReceiptJob(task)}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black tracking-wider shadow-md shadow-blue-100 active:scale-[0.98] transition-all"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>进入签收作业页面</span>
            <ArrowRight className="w-4 h-4 text-white hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <div className="py-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-black bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>该集箱任务已签收完毕，单据已存档</span>
          </div>
        )}
      </div>

    </div>
  );
}
