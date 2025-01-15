import Copy from '@/components/copy';

export default function Page({ value }: { value: string }) {
  return (
    <div className="flex gap-2 items-center">
      <Copy className="h-[30px] w-[30px]" text={value} />
      <div className=" text-ellipsis overflow-hidden max-w-[150px] text-nowrap">
        {value}
      </div>
    </div>
  );
}
