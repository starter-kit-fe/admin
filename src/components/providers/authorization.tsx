'use client';
import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/app/auth/_api';
import { ID_USERINFO } from '@/lib/constant';
import { useAuthStore } from '@/app/auth/_store';
import { useEffect } from 'react';
export const AuthorizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data } = useQuery({
    queryKey: [ID_USERINFO],
    queryFn: getUserInfo,
  });
  const { setUser } = useAuthStore();
  useEffect(() => {
    if (data) setUser(data);
  }, [data]);
  return <>{children}</>;
};
