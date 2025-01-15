import React from 'react';
import dynamic from 'next/dynamic';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface IconCardProps extends LucideProps {
  iconName: keyof typeof dynamicIconImports;
}

function camelToKebabCase(str: string): string {
  return str
    .split(/(?=[A-Z0-9])/) // 在大写字母和数字前分割
    .map((part) => part.toLowerCase())
    .join('-');
}
export const IconCard: React.FC<IconCardProps> = ({ iconName, ...props }) => {
  const LucideIcon = React.useMemo(() => {
    const kebabIconName = camelToKebabCase(iconName);
    return dynamic<LucideProps>(
      dynamicIconImports[kebabIconName as keyof typeof dynamicIconImports]
    );
  }, [iconName]);
  return <LucideIcon {...props} />;
};
