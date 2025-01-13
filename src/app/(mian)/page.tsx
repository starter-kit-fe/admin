'use client';

import { getVersion } from '@/app/(mian)/_api';
import { useQuery } from '@tanstack/react-query';
import { EnhancedHeader } from './_components/enhanced-header';
import { FeaturesSection } from './_components/features-section';
import { TestimonialsSection } from './_components/testimonials-section';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Page() {
  const { isLoading, data } = useQuery({
    queryKey: ['version'],
    queryFn: getVersion,
  });

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="md:hidden">{/* Mobile content here */}</div>
      <div className="hidden md:block">
        <motion.div style={{ scale }}>
          <EnhancedHeader isLoading={isLoading} data={data} />
          <FeaturesSection />
          <TestimonialsSection />

          <motion.section
            className="py-20  "
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12">技术栈</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {['Next.js', 'Golang', 'React Query', 'Framer Motion'].map(
                  (tech, index) => (
                    <motion.div
                      key={tech}
                      className="bg-white dark:bg-border p-6 rounded-lg text-center"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <h3 className="text-xl font-semibold mb-2">{tech}</h3>
                      <p className="text-sm">
                        {tech}{' '}
                        为我们的系统提供了强大的支持，确保了系统的高性能和可靠性。
                      </p>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </motion.div>
  );
}
