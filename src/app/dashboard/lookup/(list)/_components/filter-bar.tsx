import { useEffect } from 'react';
import { useStore, initialGroupParams, initialParams } from '../_store';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import Show from '@/components/show';
import { debounce } from 'lodash'; // 需要安装 lodash

const formSchema = z.object({
  status: z.string(),
  name: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FilterBar() {
  const { currentGroup, params, groupParams, setParams, setGroupParams } =
    useStore();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: params?.status || '',
      name: params?.name || null,
    },
  });

  // 添加防抖处理搜索
  const debouncedSearch = debounce((value: string) => {
    setParams({ name: value, page: '1' }); // 重置页码
    setGroupParams({ name: value, page: '1' });
  }, 300);

  // 监听表单值变化
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name') {
        debouncedSearch(value.name || '');
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // 重置筛选条件
  // const handleReset = () => {
  //   form.reset({
  //     status: 'all',
  //     name: null,
  //   });
  //   setParams({
  //     ...initialParams,
  //     page: '1',
  //   });
  //   setGroupParams({
  //     ...initialGroupParams,
  //     page: '1',
  //   });
  // };

  return (
    <Form {...form}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex">
                <FormControl></FormControl>
              </FormItem>
            )}
          />

          {/* <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            重置
          </Button> */}
        </div>

        <Link
          href={`/dashboard/lookup/create?group=${currentGroup?.value}&total=${currentGroup?.total}`}
        >
          <Button size="sm">
            <Plus className="mr-2" />
            新增
          </Button>
        </Link>
      </div>

      <div className="pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative md:max-w-72">
                  <Input
                    placeholder="请输入分组名或字段名称进行搜索"
                    className="md:max-w-72"
                    {...field}
                    value={field.value || ''}
                  />
                  <Show when={Boolean(field.value)}>
                    <div className="absolute right-1 top-0 h-full flex justify-center items-center">
                      <Button
                        onClick={() => {
                          field.onChange('');
                          debouncedSearch('');
                        }}
                        className="h-[20px] w-[20px] rounded-full"
                        variant="ghost"
                        size="icon"
                      >
                        <X />
                      </Button>
                    </div>
                  </Show>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
