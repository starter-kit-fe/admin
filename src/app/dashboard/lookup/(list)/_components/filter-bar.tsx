import { useStore } from '../_store';
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
const formSchema = z.object({
  status: z.string(),
  name: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Page() {
  const { currentGroup, params, groupParams, setParams, setGroupParams } =
    useStore();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: '',
      name: null,
    },
  });

  return (
    <Form {...form}>
      <div className="flex items-center justify-between">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex">
              <FormControl>
                <Tabs
                  defaultValue={field.value || ''}
                  onValueChange={(val) => {
                    field.onChange(val);
                    setGroupParams({ status: val });
                    setParams({
                      status: val,
                    });
                  }}
                  className="mr-2"
                >
                  <TabsList>
                    <TabsTrigger value="">全部</TabsTrigger>
                    <TabsTrigger value="1">正常</TabsTrigger>
                    <TabsTrigger value="2">禁用</TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
            </FormItem>
          )}
        />
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
                <div className="relative  md:max-w-72">
                  <Input
                    placeholder="请输入分组名或字段名称进行搜索"
                    className=" md:max-w-72"
                    {...field}
                    value={field.value || ''}
                  />
                  <Show when={Boolean(field.value)}>
                    <div className="absolute right-1 top-0 h-full flex justify-center items-center">
                      <Button
                        onClick={() => field.onChange('')}
                        className=" h-[20px] w-[20px] rounded-full "
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
