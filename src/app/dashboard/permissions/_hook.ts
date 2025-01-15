'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { IPermissions } from './_types';
import { ID_PERMISSION_LIST } from '@/lib/constant';
import { getlist, getParent, get, put } from './_api';
import { toast } from 'sonner';

export const usePutPermission = (id: number, onSuccess: () => void) => {
  return useMutation({
    mutationFn: (data: IPermissions.postRequest) => put(id, data),
    onSuccess: (data) => {
      if (data === 'ok') {
        onSuccess();
      }
    },
    onError: (err) => {
      toast.error('操作失败，请稍后再试！' + err.message);
    },
  });
};

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const useParentList = (type: number) => {
  return useQuery({
    queryKey: [type],
    queryFn: () => getParent(type),
  });
};
export const useDetail = (id: number) => {
  return useQuery({
    queryKey: [id],
    queryFn: () => get(id),
  });
};

export const usePermissionTable = () => {
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [ID_PERMISSION_LIST],
    queryFn: () => getlist(),
  });

  // Enhanced search function with type safety
  const searchNode = useCallback(
    (node: IPermissions.TreeNode, term: string): boolean => {
      const searchFields = [
        node.name,
        node.path,
        node.perms,
        node.remark,
        node.type.label,
        node.status.label,
      ];

      const matchesSearch = searchFields
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term.toLowerCase()));

      if (matchesSearch) return true;

      if (node.children) {
        return node.children.some((child) => searchNode(child, term));
      }

      return false;
    },
    []
  );

  // Enhanced tree building with depth tracking
  const buildTree = useCallback(
    (
      nodes: IPermissions.TreeNode[],
      parentId: number = 0,
      depth: number = 0
    ): IPermissions.TreeNode[] => {
      return nodes
        .filter((node) => node.parentID === parentId)
        .map((node) => ({
          ...node,
          depth,
          children: buildTree(nodes, node.id, depth + 1),
        }))
        .sort((a, b) => a.sort - b.sort);
    },
    []
  );

  const list = useMemo(() => {
    if (!data) return [];

    let filteredData = [...data];

    // Apply status filter
    if (status) {
      filteredData = filteredData.filter(
        (node) => node.status.id === Number(status)
      );
    }

    // Build tree structure
    const tree = buildTree(filteredData);

    // Apply search filter if needed
    if (searchQuery) {
      return tree.filter((node) => searchNode(node, searchQuery));
    }

    return tree;
  }, [data, status, buildTree, searchQuery, searchNode]);

  return {
    list,
    isLoading,
    isError,
    error,
    status,
    setStatus,
    searchQuery,
    setSearchQuery,
    expanded,
    setExpanded,
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
  };
};
