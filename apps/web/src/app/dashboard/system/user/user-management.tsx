'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

type DepartmentNode = {
  id: number;
  name: string;
  children?: DepartmentNode[];
};

type UserRecord = {
  id: number;
  username: string;
  nickname: string;
  departmentId?: number;
  phone?: string;
  status: 'active' | 'disabled';
  createdAt: string;
};

type FilterState = {
  username: string;
  nickname: string;
  phone: string;
  status: 'all' | 'active' | 'disabled';
  createdFrom: string;
  createdTo: string;
};

const DEPARTMENTS: DepartmentNode[] = [
  {
    id: 1,
    name: '若依科技',
    children: [
      {
        id: 11,
        name: '深圳总公司',
        children: [
          { id: 111, name: '研发部门' },
          { id: 112, name: '市场部门' },
          { id: 113, name: '测试部门' },
          { id: 114, name: '财务部门' },
          { id: 115, name: '运维部门' },
        ],
      },
      {
        id: 12,
        name: '长沙分公司',
        children: [
          { id: 121, name: '市场部门' },
          { id: 122, name: '财务部门' },
        ],
      },
    ],
  },
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 1,
    username: 'admin',
    nickname: '若依',
    departmentId: 111,
    phone: '15888888888',
    status: 'active',
    createdAt: '2025-05-26T10:07:46+08:00',
  },
  {
    id: 2,
    username: 'ry',
    nickname: '若依',
    departmentId: 113,
    phone: '15666666666',
    status: 'active',
    createdAt: '2025-05-26T10:07:47+08:00',
  },
  {
    id: 3,
    username: 'test-user',
    nickname: '测试账号',
    departmentId: 112,
    phone: '13900000000',
    status: 'disabled',
    createdAt: '2025-05-20T09:33:00+08:00',
  },
  {
    id: 4,
    username: 'ops-user',
    nickname: '运维人员',
    departmentId: 115,
    phone: '13611112222',
    status: 'active',
    createdAt: '2025-05-18T16:15:00+08:00',
  },
];

type DepartmentIndex = {
  nameMap: Map<number, string>;
  descendantMap: Map<number, Set<number>>;
  allIds: number[];
};

function buildDepartmentIndex(tree: DepartmentNode[]): DepartmentIndex {
  const nameMap = new Map<number, string>();
  const descendantMap = new Map<number, Set<number>>();
  const allIds: number[] = [];

  const traverse = (node: DepartmentNode): number[] => {
    nameMap.set(node.id, node.name);
    allIds.push(node.id);
    const childIds = node.children?.flatMap((child) => traverse(child)) ?? [];
    const ids = new Set<number>([node.id, ...childIds]);
    descendantMap.set(node.id, ids);
    return [node.id, ...childIds];
  };

  tree.forEach((node) => traverse(node));

  return { nameMap, descendantMap, allIds };
}

function filterDepartmentTree(
  nodes: DepartmentNode[],
  term: string,
): DepartmentNode[] {
  if (!term.trim()) {
    return nodes;
  }

  const lowerTerm = term.toLowerCase();

  const filterRecursive = (node: DepartmentNode): DepartmentNode | null => {
    const matches = node.name.toLowerCase().includes(lowerTerm);
    const filteredChildren =
      node.children
        ?.map((child) => filterRecursive(child))
        .filter((child): child is DepartmentNode => Boolean(child)) ?? [];

    if (matches) {
      return {
        ...node,
        children: node.children,
      };
    }

    if (filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  return nodes
    .map((node) => filterRecursive(node))
    .filter((node): node is DepartmentNode => Boolean(node));
}

function highlightMatch(label: string, query: string) {
  if (!query.trim()) {
    return label;
  }
  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerLabel.indexOf(lowerQuery);
  if (matchIndex === -1) {
    return label;
  }
  const before = label.slice(0, matchIndex);
  const match = label.slice(matchIndex, matchIndex + query.length);
  const after = label.slice(matchIndex + query.length);
  return (
    <>
      {before}
      <span className="text-primary font-semibold">{match}</span>
      {after}
    </>
  );
}

type DepartmentTreeProps = {
  nodes: DepartmentNode[];
  expanded: Set<number>;
  onToggle: (deptId: number) => void;
  onSelect: (deptId: number | null) => void;
  selectedId: number | null;
  level?: number;
  search: string;
};

function DepartmentTree({
  nodes,
  expanded,
  onToggle,
  onSelect,
  selectedId,
  level = 0,
  search,
}: DepartmentTreeProps) {
  return (
    <ul className={cn('space-y-0.5', level > 0 && 'pl-3')}>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const isExpanded = expanded.has(node.id);
        const isSelected = selectedId === node.id;

        return (
          <Fragment key={node.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(node.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(node.id);
                }
              }}
              className={cn(
                'flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-muted/60',
              )}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(node.id);
                  }}
                  className="mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10"
                  aria-label={isExpanded ? '折叠部门' : '展开部门'}
                >
                  <ChevronRight
                    className={cn(
                      'size-4 transition-transform',
                      isExpanded && 'rotate-90',
                    )}
                  />
                </button>
              ) : (
                <span className="mr-1 block w-6" />
              )}
              <span className="truncate">
                {highlightMatch(node.name, search)}
              </span>
            </div>
            {hasChildren && isExpanded ? (
              <DepartmentTree
                nodes={node.children ?? []}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedId={selectedId}
                level={level + 1}
                search={search}
              />
            ) : null}
          </Fragment>
        );
      })}
    </ul>
  );
}

const DEFAULT_FILTERS: FilterState = {
  username: '',
  nickname: '',
  phone: '',
  status: 'all',
  createdFrom: '',
  createdTo: '',
};

export function UserManagement() {
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<number>>(
    () => new Set([1, 11, 12]),
  );
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [formState, setFormState] = useState<FilterState>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHydrating, setIsHydrating] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const departmentIndex = useMemo(() => buildDepartmentIndex(DEPARTMENTS), []);

  const filteredDeptTree = useMemo(() => {
    if (!deptSearch.trim()) {
      return DEPARTMENTS;
    }
    return filterDepartmentTree(DEPARTMENTS, deptSearch);
  }, [deptSearch]);

  useEffect(() => {
    if (deptSearch.trim()) {
      setExpandedDepts(new Set(departmentIndex.allIds));
    }
  }, [deptSearch, departmentIndex]);

  useEffect(() => {
    if (!isHydrating) {
      return;
    }

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let completeTimeout: ReturnType<typeof setTimeout> | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    setLoadingProgress(0);

    progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) {
          return prev;
        }
        const delta = 6 + Math.random() * 10;
        return Math.min(prev + delta, 95);
      });
    }, 140);

    completeTimeout = setTimeout(() => {
      setLoadingProgress(100);
      hideTimeout = setTimeout(() => {
        setIsHydrating(false);
      }, 220);
    }, 900);

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (completeTimeout) {
        clearTimeout(completeTimeout);
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isHydrating]);

  const handleToggleDept = useCallback((deptId: number) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  }, []);

  const handleSelectDept = useCallback((deptId: number | null) => {
    setSelectedDeptId(deptId);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setFilters(formState);
    setCurrentPage(1);
  }, [formState]);

  const handleReset = useCallback(() => {
    setFormState(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSelectedDeptId(null);
    setCurrentPage(1);
    setSelectedUserIds(new Set());
  }, []);

  const departmentName = useCallback(
    (deptId?: number) => {
      if (!deptId) {
        return '未分配部门';
      }
      return departmentIndex.nameMap.get(deptId) ?? '未分配部门';
    },
    [departmentIndex.nameMap],
  );

  const filteredUsers = useMemo(() => {
    let result = users;

    if (selectedDeptId) {
      const allowed = departmentIndex.descendantMap.get(selectedDeptId);
      result = result.filter((user) => {
        if (!user.departmentId) {
          return false;
        }
        return allowed?.has(user.departmentId);
      });
    }

    if (filters.username.trim()) {
      const term = filters.username.trim().toLowerCase();
      result = result.filter((user) =>
        user.username.toLowerCase().includes(term),
      );
    }
    if (filters.nickname.trim()) {
      const term = filters.nickname.trim().toLowerCase();
      result = result.filter((user) =>
        user.nickname.toLowerCase().includes(term),
      );
    }
    if (filters.phone.trim()) {
      const term = filters.phone.trim();
      result = result.filter((user) => user.phone?.includes(term));
    }
    if (filters.status !== 'all') {
      result = result.filter((user) => user.status === filters.status);
    }
    if (filters.createdFrom) {
      const fromTimestamp = new Date(filters.createdFrom).getTime();
      result = result.filter(
        (user) => new Date(user.createdAt).getTime() >= fromTimestamp,
      );
    }
    if (filters.createdTo) {
      const toTimestamp =
        new Date(filters.createdTo).getTime() + 24 * 60 * 60 * 1000;
      result = result.filter(
        (user) => new Date(user.createdAt).getTime() < toTimestamp,
      );
    }

    return result;
  }, [users, selectedDeptId, departmentIndex.descendantMap, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev > totalPages) {
        return totalPages;
      }
      return prev;
    });
  }, [totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

  const handleToggleStatus = useCallback((userId: number, checked: boolean) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: checked ? 'active' : 'disabled' }
          : user,
      ),
    );
  }, []);

  const isAllSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((user) => selectedUserIds.has(user.id));
  const isIndeterminate = selectedUserIds.size > 0 && !isAllSelected;

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const next = new Set(selectedUserIds);
        paginatedUsers.forEach((user) => next.add(user.id));
        setSelectedUserIds(next);
      } else {
        const next = new Set(selectedUserIds);
        paginatedUsers.forEach((user) => next.delete(user.id));
        setSelectedUserIds(next);
      }
    },
    [paginatedUsers, selectedUserIds],
  );

  const handleSelectUser = useCallback((userId: number, checked: boolean) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  if (isHydrating) {
    return (
      <Card className="border-none bg-transparent shadow-none">
        <div className="flex min-h-[620px] flex-col gap-6 rounded-xl border bg-background p-8">
          <Progress value={loadingProgress} className="h-1 bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`filter-skeleton-${index}`}
                className="h-10 rounded-md bg-muted/70 animate-pulse"
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`action-skeleton-${index}`}
                className="h-9 w-24 rounded-md bg-muted/60 animate-pulse"
              />
            ))}
          </div>
          <div className="flex-1 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="h-4 w-24 rounded-full bg-muted/70 animate-pulse" />
            <div className="h-4 w-36 rounded-full bg-muted/70 animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-none bg-transparent shadow-none">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[620px] overflow-hidden rounded-xl border bg-background"
        >
          <ResizablePanel
            defaultSize={28}
            minSize={18}
            className="border-r bg-muted/20"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <Input
                  placeholder="请输入部门名称"
                  value={deptSearch}
                  onChange={(event) => setDeptSearch(event.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeptSearch('')}
                  aria-label="清除搜索"
                >
                  <RefreshCcw className="size-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 py-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectDept(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectDept(null);
                      }
                    }}
                    className={cn(
                      'mb-1 flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm transition-colors',
                      selectedDeptId === null
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted/60',
                    )}
                  >
                    全部部门
                  </div>
                  <DepartmentTree
                    nodes={filteredDeptTree}
                    expanded={expandedDepts}
                    onToggle={handleToggleDept}
                    onSelect={handleSelectDept}
                    selectedId={selectedDeptId}
                    search={deptSearch}
                  />
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={72} minSize={40}>
            <div className="flex h-full flex-col">
              <div className="border-b p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    placeholder="请输入用户账号"
                    value={formState.username}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        username: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="请输入用户名称"
                    value={formState.nickname}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        nickname: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="请输入手机号"
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                  <Select
                    value={formState.status}
                    onValueChange={(value: FilterState['status']) =>
                      setFormState((prev) => ({
                        ...prev,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full justify-between">
                      <SelectValue placeholder="用户状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="disabled">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={formState.createdFrom}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        createdFrom: event.target.value,
                      }))
                    }
                  />
                  <Input
                    type="date"
                    value={formState.createdTo}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        createdTo: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    className="bg-sky-500 text-white hover:bg-sky-600"
                    onClick={handleSearch}
                  >
                    <Search className="size-4" />
                    搜索
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCcw className="size-4" />
                    重置
                  </Button>
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                  <Button>
                    <Plus className="size-4" />
                    新增
                  </Button>
                  <Button variant="outline">
                    <Pencil className="size-4" />
                    修改
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                    删除
                  </Button>
                  <Button variant="outline">
                    <Upload className="size-4" />
                    导入
                  </Button>
                  <Button variant="outline">
                    <Download className="size-4" />
                    导出
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <Button variant="ghost" size="icon-sm">
                      <Search className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden px-4 py-3">
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                isAllSelected
                                  ? true
                                  : isIndeterminate
                                    ? 'indeterminate'
                                    : false
                              }
                              onCheckedChange={(value) =>
                                handleSelectAll(value === true)
                              }
                              aria-label="选择全部用户"
                            />
                          </TableHead>
                          <TableHead>用户编号</TableHead>
                          <TableHead>用户名称</TableHead>
                          <TableHead>用户昵称</TableHead>
                          <TableHead>部门</TableHead>
                          <TableHead>手机号码</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>创建时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.length > 0 ? (
                          paginatedUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedUserIds.has(user.id)}
                                  onCheckedChange={(value) =>
                                    handleSelectUser(user.id, value === true)
                                  }
                                  aria-label={`选择用户 ${user.username}`}
                                />
                              </TableCell>
                              <TableCell>{user.id}</TableCell>
                              <TableCell className="font-medium">
                                {user.username}
                              </TableCell>
                              <TableCell>{user.nickname}</TableCell>
                              <TableCell>
                                {departmentName(user.departmentId)}
                              </TableCell>
                              <TableCell>{user.phone ?? '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.status === 'active'}
                                    onCheckedChange={(value) =>
                                      handleToggleStatus(user.id, value)
                                    }
                                    aria-label="切换状态"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {user.status === 'active' ? '启用' : '禁用'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(
                                  new Date(user.createdAt),
                                  'yyyy-MM-dd HH:mm:ss',
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="link" className="px-0">
                                    修改
                                  </Button>
                                  <Button
                                    variant="link"
                                    className="px-0 text-red-500 hover:text-red-500"
                                  >
                                    删除
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground"
                                      >
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>
                                        重置密码
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        分配角色
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        更多操作
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="h-24 text-center text-sm text-muted-foreground"
                            >
                              暂无符合条件的用户
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
                  <div>共 {filteredUsers.length} 条记录</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span>每页</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-24 justify-between">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size} 条
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        aria-label="上一页"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span>
                        第 {currentPage} / {totalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage >= totalPages}
                        aria-label="下一页"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Card>
    </div>
  );
}
