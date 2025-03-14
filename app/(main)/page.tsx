'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getVersion } from './api';
import {
  ArrowRight, Download, Shield, Zap, Layers, Globe, Check,
  Code, Star, Heart, MessageCircle, Play
} from 'lucide-react';
import { ID_APP_VERSION } from '@/lib/constant';

// 自定义Hook用于视差滚动效果
function useParallax(value: any, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

export default function HomePage() {
  const { data: version, isLoading } = useQuery({
    queryKey: [ID_APP_VERSION],
    queryFn: getVersion,
  });

  // 引用和视图判断
  const heroRef = useRef(null);
  const featureRef = useRef(null);
  const statRef = useRef(null);
  const testimonialRef = useRef(null);
  const demoVideoRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  // 使用useInView判断各部分是否在视图中
  const heroInView = useInView(heroRef, { once: false, amount: 0.3 });
  const featureInView = useInView(featureRef, { once: true, amount: 0.2 });
  const statInView = useInView(statRef, { once: true, amount: 0.2 });
  const testimonialInView = useInView(testimonialRef, { once: true, amount: 0.2 });
  const demoVideoInView = useInView(demoVideoRef, { once: true, amount: 0.3 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.2 });
  const faqInView = useInView(faqRef, { once: true, amount: 0.2 });

  // 滚动效果
  const { scrollY, scrollYProgress } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // 图片视差滚动效果
  const y1 = useParallax(scrollYProgress, 100);
  const y2 = useParallax(scrollYProgress, -100);

  // 常见问题切换
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Hero Section - 增强版 */}
      <section ref={heroRef} className="relative min-h-[95vh] flex items-center overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0 z-0">
          <div className="relative h-full w-full">
            <Image
              src="https://picsum.photos/id/1/1920/1080"
              alt="Hero background"
              fill
              className="object-cover"
              priority
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"
              animate={{
                background: [
                  'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                  'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
                  'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.5))',
                ]
              }}
              transition={{ repeat: Infinity, duration: 8 }}
            />

            {/* 漂浮图形装饰 */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute w-32 h-32 rounded-full bg-primary/20 blur-xl"
                initial={{ x: '10%', y: '10%' }}
                animate={{ x: '15%', y: '15%' }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 10 }}
              />
              <motion.div
                className="absolute w-40 h-40 rounded-full bg-blue-500/20 blur-xl"
                initial={{ x: '80%', y: '30%' }}
                animate={{ x: '75%', y: '35%' }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 12 }}
              />
              <motion.div
                className="absolute w-24 h-24 rounded-full bg-purple-500/20 blur-xl"
                initial={{ x: '30%', y: '70%' }}
                animate={{ x: '35%', y: '75%' }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 8 }}
              />
            </div>
          </div>
        </div>

        {/* 前景内容 */}
        <div className="container relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            style={{ opacity: heroInView ? 1 : 0.5, scale: heroInView ? 1 : 0.95 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block mb-4"
            >
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary backdrop-blur-sm border border-primary/20 text-sm font-medium">
                2025年全新升级 🚀
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              重新定义<br className="md:hidden" />
              <span className="text-primary">数字体验</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              突破传统界限，创造非凡体验。我们的平台结合了前沿科技与直观设计，为您的业务提供前所未有的可能性。专为未来设计，为现在赋能。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/auth">
                <Button size="lg" className="rounded-full px-8 h-14 text-base">
                  免费开始使用 <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="#demo-video">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 flex items-center">
                  <Play className="mr-2 size-4" />
                  观看演示
                </Button>
              </Link>
            </motion.div>

            {/* 信任标志 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-12"
            >
              <p className="text-sm text-white/60 mb-4">受到全球领先企业的信任</p>
              <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
                {['Microsoft', 'Google', 'Amazon', 'IBM', 'Adobe'].map((company) => (
                  <div key={company} className="text-white font-semibold text-lg">{company}</div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 滚动提示 - 增强效果 */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{
            y: [0, 10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="flex flex-col items-center">
            <div className="text-white/80 text-sm mb-2">向下滚动探索更多</div>
            <div className="w-6 h-10 rounded-full border-2 border-white/60 flex justify-center items-start p-1">
              <motion.div
                className="w-1 h-2 bg-white rounded-full"
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 版本信息展示 - 3D效果增强 */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-gray-900/20 to-background"></div>

        <motion.div
          style={{ y: y1 }}
          className="absolute -right-24 -top-24 w-96 h-96 blur-3xl rounded-full bg-primary/10 -z-10"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute -left-24 -bottom-24 w-96 h-96 blur-3xl rounded-full bg-blue-500/10 -z-10"
        />

        <div className="container">
          <motion.div
            className="max-w-5xl mx-auto p-10 rounded-3xl relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 z-0" />
            <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-150 z-0 border border-white/10 rounded-3xl shadow-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <motion.div
                className="flex-1"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                  技术驱动未来
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  采用尖端技术栈构建，我们的平台提供无与伦比的性能和可靠性。从前端到后端，每个组件都经过优化，以确保卓越的用户体验。
                </p>

                {version && !isLoading && (
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-medium min-w-24">当前版本:</span>
                      <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-lg shadow-inner">v{version.version}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-blue-500" />
                      <span className="font-medium min-w-24">环境:</span>
                      <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-lg shadow-inner">{version.environment}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-amber-500" />
                      <span className="font-medium min-w-24">服务器时间:</span>
                      <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-lg shadow-inner">{new Date(version.now).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-purple-500" />
                      <span className="font-medium min-w-24">技术栈:</span>
                      <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-lg shadow-inner">Next.js 15 / React / TypeScript</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-rose-500" />
                      <span className="font-medium min-w-24">API状态:</span>
                      <span className="font-mono bg-muted/50 px-3 py-1.5 rounded-lg shadow-inner flex items-center">
                        <span className="size-2 bg-green-500 rounded-full mr-2"></span>
                        所有系统正常运行
                      </span>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="h-24 flex items-center justify-start">
                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3">加载系统信息中...</span>
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <Link href="/docs/changelog">
                    <Button variant="outline" className="rounded-lg">
                      查看更新日志
                    </Button>
                  </Link>
                  <Link href="/docs/api">
                    <Button variant="ghost" className="rounded-lg">
                      API文档
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                className="flex-1 flex justify-center relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="relative size-72 md:size-80">
                  {/* 3D版本指示器 */}
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-30"
                      animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.4, 0.3]
                      }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />
                  </div>

                  <motion.div
                    className="absolute inset-4 rounded-full bg-black/90 backdrop-blur-md border border-white/10 shadow-2xl"
                    animate={{
                      boxShadow: [
                        "0 0 20px 5px rgba(119, 0, 255, 0.2)",
                        "0 0 30px 8px rgba(119, 0, 255, 0.4)",
                        "0 0 20px 5px rgba(119, 0, 255, 0.2)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    {version && (
                      <motion.div
                        className="text-center"
                        animate={{ rotateY: [0, 5, 0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                      >
                        <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
                          {version.version}
                        </div>
                        <div className="mt-2 text-sm text-white/70">最新稳定版本</div>

                        {/* 功能标签 */}
                        <div className="absolute -right-12 top-0 rotate-12">
                          <span className="bg-primary/80 text-white text-xs px-2 py-1 rounded-md shadow-lg">
                            全新功能!
                          </span>
                        </div>

                        <div className="mt-6">
                          {["稳定", "安全", "高性能"].map((tag, i) => (
                            <span
                              key={tag}
                              className="inline-block mr-2 px-3 py-1 text-xs rounded-full bg-white/10 text-white/80"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 演示视频部分 - 新增模块 */}
      <section
        id="demo-video"
        ref={demoVideoRef}
        className="py-24 relative overflow-hidden bg-muted/30"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={demoVideoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">亲眼见证强大功能</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              通过我们的演示视频，了解平台如何为您的企业创造价值和效率。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={demoVideoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl relative"
          >
            {/* 视频占位符 - 在实际实现中替换为真实视频 */}
            <div className="aspect-video w-full bg-black/20">
              <div className="relative h-full w-full flex items-center justify-center">
                <Image
                  src="https://picsum.photos/id/1076/1200/675"
                  alt="视频预览"
                  fill
                  className="object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* 播放按钮 */}
                <motion.button
                  className="absolute z-10 size-20 bg-primary/90 rounded-full flex items-center justify-center text-white shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(219, 39, 119, 0.7)",
                      "0 0 0 20px rgba(219, 39, 119, 0)",
                      "0 0 0 0 rgba(219, 39, 119, 0)"
                    ]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Play className="size-8" fill="white" />
                </motion.button>

                <div className="absolute bottom-6 left-6 text-white text-left">
                  <h3 className="text-2xl font-bold mb-2">平台功能概览</h3>
                  <p className="text-white/80">3分钟了解如何利用我们的平台提升业务效率</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 特性展示 - 增强交互 */}
      <section
        ref={featureRef}
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-gray-900/10 to-background"></div>

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featureInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 mb-4 rounded-full text-sm font-medium bg-primary/20 text-primary">
              核心优势
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">革命性的功能体验</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              专为提升效率和生产力而设计，我们的平台拥有一系列强大的功能，帮助您轻松应对各种业务挑战。
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="size-8" />,
                title: "极致性能",
                description: "优化的架构确保所有操作都能快速响应，即使在高负载情况下也能保持流畅的用户体验。我们的系统采用最新的缓存技术，响应时间提升50%。",
                delay: 0.2,
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <Shield className="size-8" />,
                title: "安全可靠",
                description: "采用最先进的安全措施，包括端到端加密、多因素认证和实时威胁检测，确保您的数据在传输和存储中始终受到保护。符合GDPR等全球隐私标准。",
                delay: 0.4,
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Layers className="size-8" />,
                title: "模块化设计",
                description: "灵活的组件系统，让您可以根据业务需求自定义和扩展功能。像乐高一样拼搭您需要的功能模块，不必为不需要的功能付费。支持第三方插件集成。",
                delay: 0.6,
                color: "from-purple-500 to-indigo-500"
              },
              {
                icon: <Globe className="size-8" />,
                title: "全球化支持",
                description: "内置多语言支持和本地化功能，目前支持超过40种语言，让您的应用轻松面向全球市场。自动适应不同地区的法规和文化差异，简化国际化流程。",
                delay: 0.8,
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <Download className="size-8" />,
                title: "离线功能",
                description: "即使在网络连接不稳定或完全断开的情况下，核心功能依然能够正常运行。数据会在重新连接后自动同步，无需担心工作中断。特别适合外勤人员使用。",
                delay: 1.0,
                color: "from-red-500 to-rose-500"
              },
              {
                icon: <Code className="size-8" />,
                title: "开发者友好",
                description: "提供全面的API文档和SDK，支持多种编程语言，让开发团队能够轻松集成和扩展平台功能。丰富的webhook支持，可与现有系统无缝协作。",
                delay: 1.2,
                color: "from-amber-500 to-yellow-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featureInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                className="bg-background/90 backdrop-blur-sm rounded-2xl p-8 border border-muted shadow-lg hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className={`bg-gradient-to-br ${feature.color} p-4 rounded-xl inline-block text-white mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>

                <div className="mt-6 pt-4 border-t border-muted">
                  <Link href={`/features/${feature.title.toLowerCase().replace(/\s+/g, '-')}`} className="text-primary font-medium inline-flex items-center">
                    了解详情 <ArrowRight className="ml-1 size-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 新增：全面功能列表 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featureInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-8 border border-muted">
              <h3 className="text-2xl font-bold mb-6 text-center">更多强大功能</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "实时协作与编辑",
                  "自动化工作流程",
                  "详细的数据分析",
                  "客户关系管理",
                  "智能任务分配",
                  "定制报表生成",
                  "多渠道通知系统",
                  "高级用户权限管理",
                  "智能搜索功能",
                  "自动备份和恢复"
                ].map((item, i) => (
                  <div key={i} className="flex items-center">
                    <Check className="text-primary size-5 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link href="/features">
                  <Button variant="outline" size="lg">
                    查看所有功能
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 统计数据展示 - 增强交互与视觉效果 */}
      <section
        ref={statRef}
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/id/1068/1920/1080"
            alt="Statistics background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 backdrop-blur-sm" />
        </div>

        {/* 装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-30"
              style={{
                left: `${30 * i}%`,
                top: `${20 * i}%`
              }}
              animate={{
                y: [0, 50, 0],
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{
                repeat: Infinity,
                duration: 10 + i * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 mb-4 rounded-full text-sm font-medium bg-white/10 text-white backdrop-blur-sm">
              实时数据
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">令人信服的成果</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              数据不会说谎。这些数字展示了我们平台的影响力和可信度，以及我们为客户创造的真实价值。
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: "99.9%", label: "服务可靠性", description: "我们承诺的SLA，确保您的业务永不中断" },
              { value: "10M+", label: "全球用户", description: "来自150多个国家的用户正在使用我们的服务" },
              { value: "500+", label: "企业客户", description: "包括全球500强在内的企业选择信任我们" },
              { value: "24/7", label: "专业支持", description: "全天候专家团队，平均响应时间少于15分钟" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={statInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="text-center backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 h-full transition-all duration-300 hover:bg-white/10 group-hover:shadow-xl group-hover:shadow-primary/5">
                  <motion.div
                    className="text-4xl md:text-6xl font-bold text-white mb-2"
                    animate={statInView && { opacity: [0, 1], scale: [0.5, 1] }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xl text-white/90 font-medium mb-2">{stat.label}</div>
                  <div className="text-sm text-white/60">{stat.description}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 额外数据面板 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h4 className="text-white text-lg font-medium mb-2">客户满意度</h4>
                  <div className="text-4xl font-bold text-primary mb-2">96%</div>
                  <div className="text-white/70 text-sm">根据超过50,000个客户反馈</div>
                </div>
                <div className="text-center">
                  <h4 className="text-white text-lg font-medium mb-2">平均效率提升</h4>
                  <div className="text-4xl font-bold text-primary mb-2">78%</div>
                  <div className="text-white/70 text-sm">客户工作流程优化后</div>
                </div>
                <div className="text-center">
                  <h4 className="text-white text-lg font-medium mb-2">客户保持率</h4>
                  <div className="text-4xl font-bold text-primary mb-2">93%</div>
                  <div className="text-white/70 text-sm">年度续订率</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 定价方案 - 全新模块 */}
      <section
        ref={pricingRef}
        className="py-24 bg-muted/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 mb-4 rounded-full text-sm font-medium bg-primary/20 text-primary">
              灵活定价
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">为您的需求量身定制</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              无论是个人用户，初创企业还是大型组织，我们都提供适合不同规模和预算的方案。
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "入门版",
                price: "免费",
                description: "适合个人用户和小型团队开始探索",
                features: [
                  "每月最多5个项目",
                  "基础分析功能",
                  "2GB 云存储",
                  "邮件支持",
                  "社区访问权限"
                ],
                popular: false
              },
              {
                name: "专业版",
                price: "￥99",
                period: "/月",
                description: "适合成长中的团队和企业",
                features: [
                  "无限项目",
                  "高级分析与报告",
                  "50GB 云存储",
                  "优先技术支持",
                  "API 访问",
                  "团队协作功能",
                  "定制工作流"
                ],
                popular: true
              },
              {
                name: "企业版",
                price: "定制",
                description: "为大型组织提供全面解决方案",
                features: [
                  "全功能访问",
                  "专属服务器部署",
                  "无限存储",
                  "24/7 专属支持",
                  "企业级安全",
                  "定制开发",
                  "专业培训与咨询"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
                className="relative"
              >
                <div className={`h-full rounded-2xl p-8 border ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-muted'} bg-background flex flex-col`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 w-full flex justify-center">
                      <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                        最受欢迎
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                  </div>

                  <div className="flex-grow">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="text-primary size-5 mr-3 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href={plan.popular ? "/auth/register" : "/pricing"}>
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full "
                      size="lg"
                    >
                      {plan.popular ? "立即开始" : "了解更多"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground">
              需要更多信息？<Link href="/contact" className="text-primary font-medium">联系我们</Link>获取定制方案
            </p>
          </motion.div>
        </div>
      </section>

      {/* 用户评价 - 增强设计 */}
      <section
        ref={testimonialRef}
        className="py-24 relative overflow-hidden"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 mb-4 rounded-full text-sm font-medium bg-primary/20 text-primary">
              客户反馈
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">用户的声音</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              听听我们的客户如何评价我们的产品和服务，以及它如何改变了他们的工作方式。
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "张明",
                role: "产品经理",
                company: "创新科技有限公司",
                avatar: "https://picsum.photos/id/1012/100/100",
                content: "这个平台彻底改变了我们的工作方式，提高了团队协作效率，节省了大量时间。特别是其直观的界面和强大的自动化功能，让我们的产品开发周期缩短了30%。",
                rating: 5
              },
              {
                name: "李华",
                role: "技术总监",
                company: "未来创新科技",
                avatar: "https://picsum.photos/id/1025/100/100",
                content: "作为开发者，我非常欣赏这个平台的架构设计和代码质量。API接口设计合理，文档清晰完整。集成过程异常顺利，客户支持团队的响应速度和专业知识也让我印象深刻。",
                rating: 5
              },
              {
                name: "王芳",
                role: "市场营销总监",
                company: "环球数字传媒",
                avatar: "https://picsum.photos/id/1027/100/100",
                content: "自从使用这个平台后，我们的市场营销效率提高了30%，客户转化率显著提升。数据分析功能特别强大，帮助我们精准定位目标受众，优化营销策略，ROI提升了近50%。",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={testimonialInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
                className="bg-background rounded-2xl p-8 shadow-lg border border-muted/50 relative"
                whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
              >
                {/* 装饰引号 */}
                <div className="absolute -top-4 -left-4 text-6xl text-primary/10 font-serif">
                  "
                </div>

                <div className="mb-4">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="inline-block size-5 fill-yellow-500 text-yellow-500 mr-0.5" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-8 relative z-10">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center">
                  <div className="size-14 rounded-full overflow-hidden mr-4 border-2 border-primary/20">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}，{testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 客户Logo展示 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20"
          >
            <h3 className="text-center text-lg text-muted-foreground mb-10">受到全球领先企业的信任</h3>
            <div className="flex flex-wrap justify-center gap-12 items-center">
              {["Microsoft", "Google", "Amazon", "IBM", "Adobe", "Oracle"].map((company) => (
                <div key={company} className="text-2xl font-bold text-muted-foreground/50">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ部分 - 新增模块 */}
      <section
        ref={faqRef}
        className="py-24 bg-muted/30"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <span className="inline-block px-3 py-1 mb-4 rounded-full text-sm font-medium bg-primary/20 text-primary">
              常见问题
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">您可能想了解的问题</h2>
            <p className="text-xl text-muted-foreground">
              我们整理了用户最常问的问题，希望能帮助您更好地了解我们的服务。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={faqInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="space-y-6">
              {[
                {
                  question: "如何开始使用这个平台？",
                  answer: "开始使用非常简单。只需注册一个免费账户，您就可以立即访问所有入门级功能。我们提供详细的新用户指南和视频教程，帮助您快速上手。对于专业版和企业版用户，我们还提供一对一的入门培训和全程技术支持。"
                },
                {
                  question: "是否提供API接口？",
                  answer: "是的，我们提供全面的RESTful API，支持与您现有的系统集成。专业版和企业版用户可以访问完整的API文档和开发者支持。我们的API设计符合行业标准，支持多种编程语言，并提供示例代码和SDK，简化集成过程。"
                },
                {
                  question: "有哪些支付方式？",
                  answer: "我们支持多种支付方式，包括信用卡、PayPal、微信支付和支付宝。企业客户还可以选择通过银行转账或开具发票的方式支付。所有支付渠道均采用加密技术保护您的支付信息安全。"
                },
                {
                  question: "如何获取技术支持？",
                  answer: "我们提供多种支持渠道。免费用户可以访问我们的帮助中心和社区论坛；专业版用户享受优先电子邮件支持，响应时间在24小时内；企业版用户则拥有专属客户经理和24/7全天候技术支持，可通过电话、邮件或在线聊天获取帮助。"
                },
                {
                  question: "数据安全如何保障？",
                  answer: "我们将数据安全视为最高优先级。所有数据均采用银行级别的加密技术，服务器位于符合ISO 27001、SOC 2等国际安全标准的数据中心。我们定期进行安全审计和渗透测试，并支持数据的定期自动备份。您始终拥有数据的完全控制权和所有权。"
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className={`bg-background border ${activeFaq === index ? 'border-primary/50' : 'border-muted'} rounded-xl overflow-hidden`}
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center"
                  >
                    <h3 className="text-lg font-medium">{faq.question}</h3>
                    <div className={`transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}>
                      <ArrowRight className="size-5 transform rotate-90" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 text-muted-foreground">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">
              还有其他问题？我们很乐意为您解答
            </p>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                联系我们
                <MessageCircle className="ml-2 size-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA区域 - 增强设计 */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-purple-700/40 z-0" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-30 z-0" />

        {/* 装饰元素 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-primary/20 blur-3xl opacity-30 z-0" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <span className="px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm text-sm font-medium">
                立即行动
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl md:text-6xl font-bold mb-6 text-white"
            >
              准备好开始您的<span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">数字化转型</span>了吗？
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-white/90 mb-10"
            >
              加入成千上万的用户，探索我们平台的无限可能性。从今天开始，重新定义您的工作方式。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth">
                  <Button size="lg" className="rounded-full px-8 py-7 text-lg bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                    立即开始
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="rounded-full px-8 py-7 text-lg border-white/30  hover:bg-white/10 w-full sm:w-auto">
                    联系销售团队
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-white/70">
                无需信用卡，14天免费试用期，随时可取消
              </p>
            </motion.div>

            {/* 社交证明 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-16 flex flex-wrap justify-center items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="size-9 rounded-full border-2 border-white overflow-hidden">
                    <Image
                      src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
                      alt={`User ${i}`}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-white flex items-center gap-1">
                <Heart className="size-5 fill-red-500 text-red-500" />
                <span>
                  <strong>2,500+</strong> 满意用户正在使用
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 底部广告横幅 */}
      <div className="bg-background border-t border-border">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-md">新功能</span>
              <span>我们刚刚推出了全新的AI助手功能</span>
            </div>
            <Link href="/features/ai-assistant">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                了解更多 <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}