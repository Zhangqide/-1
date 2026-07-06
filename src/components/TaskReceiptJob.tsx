import React, { useState, useEffect, useRef } from 'react';
import { PackingTask } from '../types';
import { 
  ChevronLeft, QrCode, Search, CheckCircle2, AlertTriangle, 
  Play, Layers, Info, Check, Sparkles, RefreshCw, ArrowRight 
} from 'lucide-react';
import { sound } from './SoundUtility';

interface TaskReceiptJobProps {
  task: PackingTask;
  onBackToDetail: () => void;
  onUpdateScannedList: (
    taskId: string, 
    scannedList: string[],
    containerBindings?: Record<string, string>,
    mergeZoneBindings?: Record<string, string>
  ) => void;
  onSubmitReceipt: (taskId: string) => void;
  triggerLaserEffect: () => void;
}

// Consistent deterministic helper to pick a merging zone for a box
const getDesignatedMergeZone = (packingListNo: string) => {
  let hash = 0;
  for (let i = 0; i < packingListNo.length; i++) {
    hash += packingListNo.charCodeAt(i);
  }
  const zones = ['合流区 A-01', '合流区 A-02', '合流区 B-01', '合流区 B-02', '合流区 C-01'];
  return zones[hash % zones.length];
};

export default function TaskReceiptJob({ 
  task, 
  onBackToDetail, 
  onUpdateScannedList, 
  onSubmitReceipt,
  triggerLaserEffect
}: TaskReceiptJobProps) {
  
  const [scanInput, setScanInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 3-step pipeline state for the currently active box/packing list
  const [activePackingList, setActivePackingList] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [scannedContainer, setScannedContainer] = useState<string>('');
  const [designatedZone, setDesignatedZone] = useState<string>('');

  // Auto-focus the scanning input box on load and keep it focused
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStep, activePackingList]);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Process a barcode value according to the current step
  const processBarCode = (barcode: string) => {
    const code = barcode.trim().toUpperCase();
    if (!code) return;

    // Trigger visual red laser flash
    triggerLaserEffect();

    if (currentStep === 1) {
      // Step 1: 扫描签收
      if (task.packingListNos.includes(code)) {
        if (task.scannedPackingLists.includes(code)) {
          setErrorMessage(`箱单 [${code}] 已完成合流签收`);
          setSuccessMessage('');
          sound.playError();
        } else {
          setActivePackingList(code);
          setCurrentStep(2);
          setScannedContainer('');
          setDesignatedZone(getDesignatedMergeZone(code));
          setSuccessMessage(`箱单 [${code}] 签收成功，请扫码绑定容器`);
          setErrorMessage('');
          sound.playSuccess();
        }
      } else {
        setErrorMessage(`无效条码：不属于当前任务`);
        setSuccessMessage('');
        sound.playError();
      }
    } else if (currentStep === 2) {
      // Step 2: 扫描绑定容器
      if (task.packingListNos.includes(code)) {
        setErrorMessage(`防错提示：请扫描容器条码，勿扫箱单条码`);
        setSuccessMessage('');
        sound.playError();
      } else {
        setScannedContainer(code);
        setCurrentStep(3);
        setSuccessMessage(`已绑定容器 [${code}]，请前往并扫描 [${designatedZone}] 条码`);
        setErrorMessage('');
        sound.playSuccess();
      }
    } else if (currentStep === 3) {
      // Step 3: 扫描合流区条码
      const expectedCodeSuffix = designatedZone.replace('合流区 ', '').replace('-', '').toUpperCase(); // "A01"
      const cleanedInput = code.replace('ZONE', '').replace('合流', '').replace('区', '').replace('-', '').trim().toUpperCase();

      const isMatch = cleanedInput.includes(expectedCodeSuffix) || 
                      code === 'ZONE-A01' || code === 'ZONE-A02' || code === 'ZONE-B01' || code === 'ZONE-B02' || code === 'ZONE-C01' ||
                      cleanedInput === expectedCodeSuffix ||
                      code.length <= 8;

      if (isMatch) {
        const newList = [...task.scannedPackingLists, activePackingList!];
        
        const updatedContainerBindings = { ...(task.containerBindings || {}) };
        const updatedMergeZoneBindings = { ...(task.mergeZoneBindings || {}) };
        
        updatedContainerBindings[activePackingList!] = scannedContainer;
        updatedMergeZoneBindings[activePackingList!] = designatedZone;

        onUpdateScannedList(task.id, newList, updatedContainerBindings, updatedMergeZoneBindings);

        const completedBox = activePackingList;
        setActivePackingList(null);
        setCurrentStep(1);
        setScannedContainer('');
        setDesignatedZone('');
        
        setSuccessMessage(`箱单 [${completedBox}] 已成功合流至 [${designatedZone}]`);
        setErrorMessage('');
        sound.playSubmit();
      } else {
        setErrorMessage(`防错提示：请扫描指定合流区 [${designatedZone}] 的条码`);
        setSuccessMessage('');
        sound.playError();
      }
    }
    setScanInput('');
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarCode(scanInput);
  };

  const handleSimulateScanPackingList = (no: string) => {
    if (task.scannedPackingLists.includes(no)) return;
    if (activePackingList && activePackingList !== no) {
      setErrorMessage(`请先完成当前箱单 [${activePackingList}] 的后续流程`);
      return;
    }
    processBarCode(no);
  };

  const handleCancelCurrentBox = () => {
    setActivePackingList(null);
    setCurrentStep(1);
    setScannedContainer('');
    setDesignatedZone('');
    setErrorMessage('已取消当前箱，请重新扫码');
    setSuccessMessage('');
    sound.playSuccess();
  };

  const handleClearProgress = () => {
    if (window.confirm('确认清空本次扫描作业的全部绑定和签收进度吗？')) {
      onUpdateScannedList(task.id, [], {}, {});
      setActivePackingList(null);
      setCurrentStep(1);
      setScannedContainer('');
      setDesignatedZone('');
      setErrorMessage('');
      setSuccessMessage('进度已重置');
      sound.playSuccess();
    }
  };

  const allScanned = task.packingListNos.length > 0 && 
                     task.scannedPackingLists.length === task.packingListNos.length;

  const handleSubmitAll = () => {
    if (!allScanned) {
      sound.playError();
      setErrorMessage('请先完成所有箱单的 签收-绑定-合流 流程');
      return;
    }
    sound.playSubmit();
    onSubmitReceipt(task.id);
  };

  const percentProgress = task.packingListNos.length > 0
    ? Math.round((task.scannedPackingLists.length / task.packingListNos.length) * 100)
    : 0;

  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden bg-slate-50 cursor-pointer"
      onClick={handleContainerClick}
    >
      {/* HEADER */}
      <div className="bg-blue-600 px-4 py-3 shrink-0 shadow-md flex items-center justify-between text-white z-10">
        <button
          onClick={onBackToDetail}
          className="flex items-center gap-1 text-blue-100 hover:text-white px-2 py-1 rounded hover:bg-blue-700/50 transition-all text-xs font-bold leading-none"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
          <span>返回详情</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold tracking-tight font-sans">PDA 签收作业</span>
          <span className="text-[10px] text-blue-100 font-bold tracking-wider font-mono">任务: {task.id}</span>
        </div>
        <button
          onClick={handleClearProgress}
          disabled={task.scannedPackingLists.length === 0 && !activePackingList}
          className={`text-[10px] py-1.5 px-2.5 rounded-md font-bold transition-all ${
            task.scannedPackingLists.length > 0 || activePackingList
              ? 'bg-red-500/20 border border-red-400/30 text-white hover:bg-red-600/30 font-black cursor-pointer'
              : 'text-blue-100/40 border border-blue-500/20 cursor-not-allowed'
          }`}
        >
          重置进度
        </button>
      </div>

      {/* BODY SCROLL PANEL */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">

        {/* STEPPER VISUAL TIMELINE GUIDE */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm select-none">
          <div className="grid grid-cols-3 gap-1 relative">
            {/* Step 1 indicator */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono transition-all ${
                currentStep === 1 && !allScanned
                  ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                  : task.scannedPackingLists.length > 0 || currentStep > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {task.scannedPackingLists.length > 0 || currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span className={`text-[9.5px] font-bold mt-1 ${
                currentStep === 1 && !allScanned ? 'text-blue-600' : 'text-slate-400 font-medium'
              }`}>
                1. 扫箱单
              </span>
            </div>

            {/* Step 2 indicator */}
            <div className="flex flex-col items-center text-center relative">
              <div className="absolute top-2.5 left-0 right-0 h-[1px] bg-slate-100 -z-10 w-full" />
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono transition-all ${
                currentStep === 2
                  ? 'bg-amber-500 text-white ring-2 ring-amber-100'
                  : currentStep > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {currentStep > 2 ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <span className={`text-[9.5px] font-bold mt-1 ${
                currentStep === 2 ? 'text-amber-600' : 'text-slate-400 font-medium'
              }`}>
                2. 绑容器
              </span>
            </div>

            {/* Step 3 indicator */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono transition-all ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                3
              </div>
              <span className={`text-[9.5px] font-bold mt-1 ${
                currentStep === 3 ? 'text-indigo-600' : 'text-slate-400 font-medium'
              }`}>
                3. 扫合流
              </span>
            </div>
          </div>
        </div>

        {/* SCANNER INPUT BOX */}
        <div className={`rounded-lg border p-3 space-y-2.5 shadow-sm relative overflow-hidden transition-all duration-300 ${
          currentStep === 1
            ? 'bg-slate-900 border-slate-800'
            : currentStep === 2
              ? 'bg-amber-950 border-amber-800 ring-1 ring-amber-700/30'
              : 'bg-indigo-950 border-indigo-800 ring-1 ring-indigo-700/30'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white">
              <QrCode className={`w-3.5 h-3.5 ${
                currentStep === 1 ? 'text-blue-400' : currentStep === 2 ? 'text-amber-400' : 'text-indigo-400'
              }`} />
              <h3 className="text-[11px] font-bold">
                {currentStep === 1 && '① 扫箱单'}
                {currentStep === 2 && '② 绑容器'}
                {currentStep === 3 && '③ 扫合流'}
              </h3>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">自动聚焦</span>
          </div>

          {/* Prompt banner for steps */}
          <div className={`p-2 rounded text-[11px] leading-snug ${
            currentStep === 1
              ? 'bg-slate-800/80 text-slate-300'
              : currentStep === 2
                ? 'bg-amber-900/30 text-amber-200'
                : 'bg-indigo-900/30 text-indigo-200'
          }`}>
            {currentStep === 1 && (
              <span>请扫描箱子外贴的<strong>装箱单条码</strong>进行签收。</span>
            )}
            {currentStep === 2 && (
              <span>箱单 <strong className="text-white font-mono">{activePackingList}</strong> 已签收，<strong>请扫容器码</strong>。</span>
            )}
            {currentStep === 3 && (
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span>去向：<strong className="text-white bg-indigo-600 px-1 py-0.5 rounded text-[10px]">{designatedZone}</strong></span>
                <span className="text-indigo-300">请扫合流定位条码</span>
              </div>
            )}
          </div>

          <form onSubmit={handleScanSubmit} className="space-y-1.5">
            <div className="relative">
              <input
                id="pda-scan-input"
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                placeholder={
                  currentStep === 1
                    ? '请扫描/输入箱单号'
                    : currentStep === 2
                      ? '请扫描/输入容器号'
                      : '请扫描/输入合流定位号'
                }
                className={`w-full bg-black/40 border text-white placeholder-slate-500 rounded-lg py-2 pl-3 pr-10 text-[11px] font-bold font-mono tracking-wider focus:outline-none transition-all text-center uppercase ${
                  currentStep === 1
                    ? 'border-slate-800 focus:ring-1 focus:ring-blue-500'
                    : currentStep === 2
                      ? 'border-amber-800 focus:ring-1 focus:ring-amber-500'
                      : 'border-indigo-800 focus:ring-1 focus:ring-indigo-500'
                }`}
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1.5 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 border border-white/10 p-1 rounded active:scale-90 transition-all cursor-pointer"
              >
                <Search className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex justify-between items-center text-[8.5px] text-slate-500 px-0.5">
              <span>* 支持扫码枪直扫</span>
              <span>回车 ↵</span>
            </div>
          </form>

          {/* SIMULATION ACTIONS ACCORDING TO CURRENT STEP */}
          {currentStep > 1 && (
            <div className="pt-2 border-t border-dashed border-slate-800/60 flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 font-bold">快捷模拟：</span>
              
              {currentStep === 2 && (
                <div className="flex flex-wrap gap-1">
                  {['CONT-01', 'CONT-02', 'CONT-03'].map(cont => (
                    <button
                      key={cont}
                      onClick={() => processBarCode(cont)}
                      className="text-[9px] bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800/40 text-amber-200 px-1.5 py-0.5 rounded transition-all active:scale-95 cursor-pointer flex items-center gap-0.5"
                    >
                      <Play className="w-1.5 h-1.5 fill-current text-amber-400" />
                      容器 {cont}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => processBarCode(designatedZone)}
                    className="text-[9px] bg-indigo-900/50 hover:bg-indigo-900/70 border border-indigo-800/40 text-indigo-100 px-2 py-0.5 rounded font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 shadow"
                  >
                    <Play className="w-1.5 h-1.5 fill-current text-indigo-400" />
                    扫：{designatedZone}
                  </button>
                </div>
              )}

              <button
                onClick={handleCancelCurrentBox}
                className="text-[9px] text-slate-400 hover:text-white underline text-left mt-0.5 self-start"
              >
                ← 取消当前箱
              </button>
            </div>
          )}

          {/* ALERTS / NOTICES */}
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded text-[10px] text-red-400 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0 text-red-500 mt-0.5" />
              <span className="font-bold leading-normal">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-400 flex items-start gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500 mt-0.5" />
              <span className="font-bold leading-normal">{successMessage}</span>
            </div>
          )}
        </div>

        {/* CONTAINER/PACKING LISTS CHIPS & WORKFLOW STATUS */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2.5 shadow-sm flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center pb-0.5">
            <span className="text-xs font-bold text-slate-800">作业明细</span>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded font-mono">
              进度 {task.scannedPackingLists.length}/{task.packingListNos.length} 箱 ({percentProgress}%)
            </span>
          </div>

          {/* PROGRESS BAR INLINE */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${percentProgress}%` }}
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto pr-1 pt-1">
            {task.packingListNos.map((no, idx) => {
              const isCompleted = task.scannedPackingLists.includes(no);
              const isActive = activePackingList === no;
              const boundCont = task.containerBindings?.[no];
              const boundZone = task.mergeZoneBindings?.[no];

              return (
                <div
                  key={no}
                  onClick={() => !isCompleted && handleSimulateScanPackingList(no)}
                  className={`flex flex-col p-2 rounded border transition-all duration-150 cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-150'
                      : isActive
                        ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-100'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : isActive 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold font-mono tracking-wider truncate text-slate-700">
                        {no}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded flex items-center gap-0.5 font-bold">
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          已合流
                        </span>
                      ) : isActive ? (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded flex items-center gap-0.5 font-bold animate-pulse">
                          进行中 ({currentStep}/3)
                        </span>
                      ) : (
                        <button
                          title="点击模拟枪扫"
                          className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded hover:bg-blue-600 hover:text-white transition-all flex items-center gap-0.5 shrink-0"
                        >
                          <Play className="w-1.5 h-1.5 fill-current text-blue-550" />
                          扫此码
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bound metadata display for completed ones */}
                  {isCompleted && (boundCont || boundZone) && (
                    <div className="mt-1 pt-1 border-t border-emerald-100/30 flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>容器: <strong className="text-slate-700 font-bold">{boundCont}</strong></span>
                      <span>合流区: <strong className="text-indigo-600 font-bold">{boundZone}</strong></span>
                    </div>
                  )}

                  {/* Stepper info for currently active list */}
                  {isActive && (
                    <div className="mt-1 pt-1 border-t border-amber-200 flex items-center gap-1 text-[9px] text-amber-800">
                      <span>👉</span>
                      {currentStep === 2 && <span>待扫容器条码</span>}
                      {currentStep === 3 && <span>容器已绑 {scannedContainer}，待扫合流定位</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FOOTER ACTION PANEL (SUBMISSION) */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0 shadow-lg">
        <button
          onClick={handleSubmitAll}
          disabled={!allScanned}
          className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow-md ${
            allScanned
              ? 'bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer active:scale-[0.98]'
              : 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {allScanned ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>提交签收结果 ({task.packingListNos.length} 箱)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              <span>待完成合流作业 ({task.scannedPackingLists.length} / {task.packingListNos.length} 箱)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
