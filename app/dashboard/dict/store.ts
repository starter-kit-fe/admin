import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {lookupGroupRequest,lookupRequest} from './api'


// Store 状态类型
interface State {
  // 当前选中的分组值
  selectedGroup: string | null;
  
  // 分组列表请求参数
  groupParams: lookupGroupRequest;
  
  // 字典项列表请求参数
  lookupParams: lookupRequest;
  
  // 可见列配置
  visibleColumns: {
    id: boolean;
    label: boolean;
    value: boolean;
    sort: boolean;
    status: boolean;
    isDefault: boolean;
    remark: boolean;
    createdAt: boolean;
    updatedAt: boolean;
    actions: boolean;
  };
  
  // 操作方法
  setSelectedGroup: (group: string | null) => void;
  setGroupParams: (params: Partial<lookupGroupRequest>) => void;
  resetGroupParams: () => void;
  setLookupParams: (params: Partial<lookupRequest>) => void;
  resetLookupParams: () => void;
  setVisibleColumn: (column: string, visible: boolean) => void;
  toggleVisibleColumn: (column: string) => void;
  resetVisibleColumns: () => void;
}

// 默认参数
const DEFAULT_GROUP_PARAMS: lookupGroupRequest = {
  page: '1',
  size: '20',
  status: '',
};

const DEFAULT_LOOKUP_PARAMS: lookupRequest = {
  status: '',
};

const DEFAULT_VISIBLE_COLUMNS = {
  id: false,
  label: true,
  value: true,
  sort: false,
  status: true,
  isDefault: true,
  remark: false,
  createdAt: false,
  updatedAt: false,
  actions: true,
};

// 创建并导出 store
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      // 初始状态
      selectedGroup: null,
      groupParams: { ...DEFAULT_GROUP_PARAMS },
      lookupParams: { ...DEFAULT_LOOKUP_PARAMS },
      visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },

      // 设置选中的分组
      setSelectedGroup: (group) => set({ selectedGroup: group }),
      
      // 更新分组参数
      setGroupParams: (params) => set({
        groupParams: { ...get().groupParams, ...params },
      }),
      
      // 重置分组参数
      resetGroupParams: () => set({
        groupParams: { ...DEFAULT_GROUP_PARAMS },
      }),
      
      // 更新字典详情参数
      setLookupParams: (params) => set({
        lookupParams: { ...get().lookupParams, ...params },
      }),
      
      // 重置字典详情参数
      resetLookupParams: () => set({
        lookupParams: { ...DEFAULT_LOOKUP_PARAMS },
      }),
      
      // 设置列可见性
      setVisibleColumn: (column, visible) => set({
        visibleColumns: {
          ...get().visibleColumns,
          [column]: visible,
        },
      }),
      
      // 切换列可见性
      toggleVisibleColumn: (column) => set({
        visibleColumns: {
          ...get().visibleColumns,
          [column]: !get().visibleColumns[column as keyof typeof DEFAULT_VISIBLE_COLUMNS],
        },
      }),
      
      // 重置列可见性
      resetVisibleColumns: () => set({
        visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
      }),
    }),
    {
      name: 'dict-storage', // sessionStorage 中存储的键名
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
