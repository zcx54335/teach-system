import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import Home from "../../pages/Home";
import Schedule from "../../pages/Schedule";
import Profile from "../../pages/Profile";
import { supabase } from '../../lib/supabaseClient';

export interface PageProps {
  localProgress?: MotionValue<number>;
  students?: any[];
  setStudents?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchStudents?: () => Promise<void>;
  isLoading?: boolean;
}

const RollerNavigation: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*, class_records(*)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('全局获取学生列表失败:', error);
    } else {
      setStudents(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);
  
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isAnimating = useRef(false);

  const totalCards = 3;
  // Fallback to 800 if window is not defined
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const goToIndex = (index: number) => {
    isAnimating.current = true;
    setActiveIndex(index);
    // 使用带有阻尼（Damping）和质量（Mass）的弹簧物理效果
    animate(y, -index * windowHeight, {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 0.8,
      restDelta: 0.001,
      onComplete: () => {
        isAnimating.current = false;
      }
    });
  };

  useEffect(() => {
    const handleResize = () => {
      y.set(-activeIndex * window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, y]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      
      // 允许特定元素在其内部滚动，不触发翻页
      const isScrollable = target.closest('.overflow-y-auto');
      if (isScrollable) {
        const scrollEl = isScrollable as HTMLElement;
        const atTop = scrollEl.scrollTop <= 0;
        const atBottom = Math.abs(scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) < 2;

        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
          return; 
        }
      }

      // 如果不是内部滚动，才触发整页翻页
      e.preventDefault();
      if (isAnimating.current) return;

      if (e.deltaY > 50 && activeIndex < totalCards - 1) {
        goToIndex(activeIndex + 1);
      } else if (e.deltaY < -50 && activeIndex > 0) {
        goToIndex(activeIndex - 1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isAnimating.current) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating.current || touchStartY.current === null || touchStartX.current === null) return;
      
      const target = e.target as HTMLElement;
      
      // 允许特定元素在其内部滑动，不触发翻页
      const isScrollable = target.closest('.overflow-y-auto');
      
      const currentY = e.touches[0].clientY;
      const diffY = currentY - touchStartY.current;
      const diffX = e.touches[0].clientX - touchStartX.current;

      // 忽略水平滑动（保护 ImageSlider 组件的交互）
      if (Math.abs(diffX) > Math.abs(diffY)) {
        return;
      }

      if (isScrollable) {
        const scrollEl = isScrollable as HTMLElement;
        const atTop = scrollEl.scrollTop <= 0;
        const atBottom = Math.abs(scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) < 2;

        if ((diffY > 0 && !atTop) || (diffY < 0 && !atBottom)) {
          return; 
        }
      }

      e.preventDefault(); 
      
      // 手势实时跟随
      let newY = -activeIndex * window.innerHeight + diffY;
      // 边缘阻尼
      if (newY > 0) {
        newY = newY * 0.3;
      } else if (newY < -(totalCards - 1) * window.innerHeight) {
        const excess = newY + (totalCards - 1) * window.innerHeight;
        newY = -(totalCards - 1) * window.innerHeight + excess * 0.3;
      }
      y.set(newY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current || touchStartY.current === null) return;
      
      const target = e.target as HTMLElement;
      const isScrollable = target.closest('.overflow-y-auto');

      const diffY = e.changedTouches[0].clientY - touchStartY.current;

      if (isScrollable) {
        const scrollEl = isScrollable as HTMLElement;
        const atTop = scrollEl.scrollTop <= 0;
        const atBottom = Math.abs(scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) < 2;

        if ((diffY > 0 && !atTop) || (diffY < 0 && !atBottom)) {
          touchStartY.current = null;
          touchStartX.current = null;
          return; 
        }
      }

      let nextIndex = activeIndex;

      // 速度与距离判断
      if (diffY < -60 && activeIndex < totalCards - 1) {
        nextIndex = activeIndex + 1;
      } else if (diffY > 60 && activeIndex > 0) {
        nextIndex = activeIndex - 1;
      }

      goToIndex(nextIndex);
      touchStartY.current = null;
      touchStartX.current = null;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [activeIndex, windowHeight]);

  const renderCard = (index: number, Component: React.FC<PageProps>) => {
    const localProgress = useTransform(y, (latestY) => {
      return (latestY + index * windowHeight) / windowHeight;
    });

    // 高级 3D 变换映射
    const translateY = useTransform(localProgress, [-1, 0, 1], ['-25%', '0%', '100%']);
    const scale = useTransform(localProgress, [-1, 0, 1], [0.85, 1, 1]);
    const rotateX = useTransform(localProgress, [-1, 0, 1], [10, 0, 0]); // 向后翻转
    const opacity = useTransform(localProgress, [-1, -0.2, 0, 1], [0, 0.8, 1, 1]);
    const zIndex = useTransform(localProgress, [-1, 0, 1], [10, 20, 30]);

    return (
      <motion.div 
        key={index}
        className="absolute inset-0 w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden bg-black"
        style={{
          y: translateY,
          scale,
          rotateX,
          opacity,
          zIndex,
          transformOrigin: 'bottom center', // 锚点在底部，向上推时顶部向后倒
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="w-full h-full overflow-y-auto overflow-x-hidden relative">
           <Component 
             localProgress={localProgress} 
             students={students}
             setStudents={setStudents}
             fetchStudents={fetchStudents}
             isLoading={isLoading}
           />
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-[#050505] overflow-hidden touch-none"
      style={{ perspective: '1500px' }} // 强烈透视景深
    >
      {/* 侧边导航指示器 */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-3 pointer-events-none">
        {[0, 1, 2].map(i => (
          <div 
            key={i} 
            className={`w-1.5 rounded-full transition-all duration-500 ${
              i === activeIndex ? 'bg-white h-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/20 h-1.5'
            }`}
          />
        ))}
      </div>

      {/* 渲染三张卡片 */}
      {renderCard(0, Home)}
      {renderCard(1, Schedule)}
      {renderCard(2, Profile)}
    </div>
  );
};

export default RollerNavigation;