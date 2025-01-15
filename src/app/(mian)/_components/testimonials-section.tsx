'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const testimonials = [
  {
    name: '张三',
    role: '技术总监',
    content: '这个系统极大地提高了我们的工作效率，非常推荐！',
  },
  {
    name: '李四',
    role: '项目经理',
    content: '界面直观，功能强大，是我们团队的得力助手。',
  },
  {
    name: '王五',
    role: '数据分析师',
    content: '数据处理速度快，分析功能全面，帮助我们做出了许多关键决策。',
  },
];

export function TestimonialsSection() {
  return (
    <motion.section
      className="py-20 bg-white dark:bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-4xl font-bold text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          客户评价
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-gray-100 dark:bg-border p-6 rounded-lg shadow"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Image
                src={`/placeholder.svg?height=100&width=100&text=${testimonial.name}`}
                alt={testimonial.name}
                width={100}
                height={100}
                className="rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-center mb-2">
                {testimonial.name}
              </h3>
              <p className=" text-center mb-4">{testimonial.role}</p>
              <p className="text-center italic">{testimonial.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
