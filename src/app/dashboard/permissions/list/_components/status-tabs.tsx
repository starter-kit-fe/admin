import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatusTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export const StatusTabs = ({ value, onChange }: StatusTabsProps) => {
  const statuses = [
    { value: '', label: '全部' },
    { value: '1', label: '正常' },
    { value: '2', label: '禁用' },
  ];

  return (
    <Tabs value={value} onValueChange={onChange} className="w-[400px]">
      <TabsList>
        {statuses.map((status) => (
          <TabsTrigger key={status.value} value={status.value}>
            {status.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
