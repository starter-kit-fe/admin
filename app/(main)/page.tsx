'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useInView } from 'react-intersection-observer';
import { getVersion, type versionResponse } from './api';
import { ArrowRight, Download, Shield, Zap, Layers, Globe, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [version, setVersion] = useState<versionResponse | null>(null);
  const [activeTab, setActiveTab] = useState('feature1');
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.95]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const foregroundY = useTransform(scrollYProgress, [0, 1], ['0%', '5%']);
  
  // 使用ref和inView来控制各部分的动画
  const [featureRef, featureInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  
  const [statRef, statInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  
  const [testimonialRef, testimonialInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const data = await getVersion();
        setVersion(data);
      } catch (error) {
        console.error('Failed to fetch version:', error);
      }
    };
    
    fetchVersion();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* 背景图像 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/id/1/1920/1080"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* 前景内容 */}
        <motion.div 
          className="container relative z-10"
          style={{ opacity, scale }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                重新想象可能性
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-xl text-white/80 mb-8">
                突破传统界限，创造非凡体验。专为未来设计的高性能平台。
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link href="/auth">
                <Button size="lg" className="rounded-full px-8">
                  现在开始 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="rounded-full px-8 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                  了解更多
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* 滚动提示 */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center items-start p-1">
            <motion.div 
              className="w-1 h-2 bg-white rounded-full"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      </section>

      {/* 版本信息展示 - 毛玻璃效果 */}
      <section className="py-16 relative overflow-hidden">
        <div className="container">
          <motion.div 
            className="max-w-4xl mx-auto p-8 rounded-2xl relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 z-0" />
            <div className="absolute inset-0 backdrop-blur-xl backdrop-saturate-150 z-0" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <motion.div 
                className="flex-1"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold mb-4">技术驱动未来</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  使用最新的技术栈构建，为您的项目提供坚实的基础。
                </p>
                
                {version && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-medium">当前版本:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">v{version.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">环境:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{version.environment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="font-medium">服务器时间:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{new Date(version.now).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {!version && (
                  <div className="h-24 flex items-center justify-start">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2">加载中...</span>
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                className="flex-1 flex justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-30 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-black/80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {version && (
                      <div className="text-center">
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                          {version.version}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">最新稳定版本</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 特性展示 */}
      <section 
        ref={featureRef} 
        className="py-24 bg-muted/50"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featureInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">革命性的特性</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              专为提升效率和生产力而设计，我们的平台拥有一系列强大的功能。
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Zap className="h-8 w-8" />, 
                title: "极致性能", 
                description: "优化的架构确保所有操作都能快速响应，提供流畅的用户体验。",
                delay: 0.2
              },
              { 
                icon: <Shield className="h-8 w-8" />, 
                title: "安全可靠", 
                description: "采用最先进的安全措施，确保您的数据始终受到保护。",
                delay: 0.4
              },
              { 
                icon: <Layers className="h-8 w-8" />, 
                title: "模块化设计", 
                description: "灵活的组件系统，让您可以根据需要自定义和扩展功能。",
                delay: 0.6
              },
              { 
                icon: <Globe className="h-8 w-8" />, 
                title: "全球化支持", 
                description: "内置多语言支持，让您的应用轻松面向全球市场。",
                delay: 0.8
              },
              { 
                icon: <Download className="h-8 w-8" />, 
                title: "离线功能", 
                description: "即使在无网络环境下，核心功能也能正常运行。",
                delay: 1.0
              },
              { 
                icon: <ArrowRight className="h-8 w-8" />, 
                title: "持续更新", 
                description: "定期推出新功能和改进，确保您始终使用最新的技术。",
                delay: 1.2
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featureInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: feature.delay }}
                className="bg-background rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="bg-primary/10 p-3 rounded-xl inline-block text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 统计数据展示 */}
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
          <div className="absolute inset-0 bg-black/70" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">令人惊讶的数据</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              我们的成就以数字说话，见证我们平台的影响力和可信度。
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "99.9%", label: "正常运行时间" },
              { value: "10M+", label: "全球用户" },
              { value: "50+", label: "企业客户" },
              { value: "24/7", label: "技术支持" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={statInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center backdrop-blur-md bg-white/10 rounded-2xl p-8"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section 
        ref={testimonialRef}
        className="py-24 bg-muted/30"
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">用户的声音</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              听听我们的用户如何评价我们的产品和服务。
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "张明",
                role: "产品经理",
                company: "科技有限公司",
                avatar: "https://picsum.photos/id/1012/100/100",
                content: "这个平台彻底改变了我们的工作方式，提高了团队协作效率，节省了大量时间。"
              },
              {
                name: "李华",
                role: "技术总监",
                company: "创新科技",
                avatar: "https://picsum.photos/id/1025/100/100",
                content: "作为开发者，我非常欣赏这个平台的架构设计和代码质量。API接口设计合理，文档清晰。"
              },
              {
                name: "王芳",
                role: "市场总监",
                company: "全球传媒",
                avatar: "https://picsum.photos/id/1027/100/100",
                content: "自从使用这个平台后，我们的市场营销效率提高了30%，客户转化率显著提升。"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={testimonialInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-background rounded-2xl p-6 shadow hover:shadow-md transition-all"
              >
                <div className="mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}，{testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary-foreground/20 z-0" />
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              准备好开始您的旅程了吗？
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-muted-foreground mb-8"
            >
              加入成千上万的用户，探索我们平台的无限可能性。
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/auth">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg">
                  立即开始
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <p className="mt-4 text-sm text-muted-foreground">
                无需信用卡，14天免费试用期
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}