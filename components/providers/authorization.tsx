'use client';
import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/app/auth/api';
import { ID_USERINFO } from '@/lib/constant';
import { useStore } from '@/app/auth/store';
import { useEffect } from 'react';
import { getToken } from '@/lib/cookie'
export const AuthorizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setUser, user } = useStore();
  const { data } = useQuery({
    queryKey: [ID_USERINFO],
    enabled: Boolean(getToken()),
    queryFn: getUserInfo,
  });
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser, user]);
  return <>{children}</>;
};
