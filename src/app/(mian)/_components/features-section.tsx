'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, BarChart, Users, Lock, Cpu } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: '安全可靠',
    description: '采用最新的安全技术，保护您的数据安全',
  },
  {
    icon: Zap,
    title: '高效快速',
    description: '优化的性能，让您的工作事半功倍',
  },
  {
    icon: BarChart,
    title: '数据分析',
    description: '强大的数据分析功能，助您做出明智决策',
  },
  {
    icon: Users,
    title: '多用户支持',
    description: '支持多用户同时操作，提高团队协作效率',
  },
  {
    icon: Lock,
    title: '权限管理',
    description: '精细的权限控制，确保数据访问安全',
  },
  {
    icon: Cpu,
    title: '智能处理',
    description: '智能算法支持，自动化处理复杂任务',
  },
];

export function FeaturesSection() {
  return (
    <motion.section
      className="py-20 bg-slate-100 dark:bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-4xl font-bold text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          为什么选择我们
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-border  p-6 rounded-lg shadow-lg"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <feature.icon className="w-12 h-12 mb-4 " />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
