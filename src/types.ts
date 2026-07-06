export interface PackingTask {
  id: string; // 装箱任务ID
  boxCount: number; // 箱数
  packageCount: number; // 包裹等同的包裹数
  transferOrderId: string; // 调拨单号
  packingListNos: string[]; // 装箱单号 (1个或多个)
  scannedPackingLists: string[]; // 已扫描的装箱单号
  status: 'pending' | 'signed'; // 待签收 | 已签收
  signedTime?: string; // 签收时间 (已签收状态独有)
  notes?: string; // 备注
  containerBindings?: Record<string, string>; // 箱单号 -> 容器ID
  mergeZoneBindings?: Record<string, string>; // 箱单号 -> 合流区ID
}

export interface SearchFilters {
  packingTaskID: string;
  packingListNo: string;
  signedTimeRange: string; // 全部 / 今天 / 最近3天 / 最近7天 / 自定义
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
}
