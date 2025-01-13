'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatISOTime } from '@/lib/format-ios-time';
import Loading from '@/components/loading';
import Show from '@/components/show';

interface EnhancedHeaderProps {
  isLoading: boolean;
  data: any;
}

export function EnhancedHeader({ isLoading, data }: EnhancedHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="  py-20"
    >
      <div className="container mx-auto text-center">
        <motion.h1
          className="text-6xl font-bold mb-6 drop-shadow-lg"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          高性能 高效率的管理系统
        </motion.h1>
        <motion.h2
          className="text-6xl font-semibold mb-8 drop-shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          使用Nextjs和Golang开发
        </motion.h2>
        <Show when={!isLoading} fallback={<Loading />}>
          <motion.p
            className=" mb-8 text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            基于GIN的权限管理系统 截止{formatISOTime(data?.now ?? '')}
            <br />
            最新版本：{data?.version}
            <br />
            后台环境 {data?.environment}
          </motion.p>
        </Show>
        <motion.div
          className="flex gap-4 items-center justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button size="lg" className="">
            现在开始 <ArrowRight className="ml-2" />
          </Button>
          <Button size="lg" variant="outline" className="">
            了解更多
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
