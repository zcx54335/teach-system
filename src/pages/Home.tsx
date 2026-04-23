import React, { useState, useRef, useEffect } from "react";
import { GripVertical, ChevronDown } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { PageProps } from "../components/Layout/RollerNavigation";
import { supabase } from '../lib/supabaseClient';

// 滑动对比组件 (ImageSlider)
const ImageSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    // 阻止外层的默认滚动行为
    e.stopPropagation();
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full aspect-video overflow-hidden rounded-xl cursor-ew-resize group"
      ref={containerRef}
      onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
      onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* 底部图片 (通常是处理后/彩色图) */}
      <img 
        src="https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* 顶部图片 (通常是处理前/线稿图)，使用 clip-path 控制显示范围 */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src="https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80&sat=-100" 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none filter grayscale contrast-125"
        />
      </div>

      {/* 滑块分割线和把手 */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95">
          <GripVertical className="w-5 h-5 text-gray-800" />
        </div>
      </div>
      
      {/* 提示标签 */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 text-white text-xs font-medium rounded-full tracking-widest pointer-events-none">
        DESIGN
      </div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 text-white text-xs font-medium rounded-full tracking-widest pointer-events-none">
        FINAL
      </div>
    </div>
  );
};

const Home: React.FC<PageProps> = ({ localProgress }) => {
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchStudentCount = async () => {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
      setStudentCount(count || 0);
    };
    fetchStudentCount();
  }, []);

  // Provide a fallback progress value if not wrapped in RollerNavigation
  const defaultProgress = useMotionValue(0);
  const progress = localProgress || defaultProgress;

  // Parallax transforms based on RollerNavigation's localProgress
  const bgY = useTransform(progress, [-1, 0, 1], ['-20%', '0%', '20%']);
  const textY = useTransform(progress, [-1, 0, 1], ['-30%', '0%', '30%']);
  const textOpacity = useTransform(progress, [-0.5, 0, 0.5], [0, 1, 0]);

  return (
    <div className="min-h-full bg-black relative font-sans selection:bg-white/20 text-white pb-32">
      {/* 杂志级 Hero 区域 */}
      <section className="relative h-[90vh] w-full overflow-hidden flex flex-col justify-end">
        {/* 背景图：带有视差位移 */}
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <img 
            src="https://images.unsplash.com/photo-1541888087642-127e7f60037a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
          
            className="w-full h-full object-cover"
          />
          {/* 极其细腻的深色渐变遮罩 (Smooth Scrim) - 仅在下半部分 */}
          <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </motion.div>
        
        {/* 内容下沉区：高对比度排版 */}
        <motion.div 
          className="relative z-10 px-8 pb-16 space-y-6 w-full"
          style={{ y: textY, opacity: textOpacity }}
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight text-white leading-none">
              小鱼 · 杨老师控制台
            </h1>
            <h2 className="text-3xl font-bold tracking-tight text-white/90">
              数据中心 · 课时管理
            </h2>
          </div>

          <div className="w-12 h-0.5 bg-white/30"></div>

          <p className="text-sm font-medium text-gold-400 tracking-[0.2em] leading-relaxed">
            欢迎回来，杨老师。当前共有 <span className="text-white text-lg font-bold mx-1">{studentCount}</span> 名学生。
          </p>
          
          {/* 极简向下引导 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce-soft opacity-50">
            <ChevronDown className="w-6 h-6 text-white" strokeWidth={1} />
          </div>
        </motion.div>
      </section>

      {/* 沉浸式项目列表区 - 控制台概览 */}
      <section className="relative z-20 px-6 space-y-24 bg-black pt-12 pb-32">
        
        {/* 案例 1：工程制图到实物建模 (带滑动对比图) */}
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase">
              Project 01 — Visualization
            </p>
            <h3 className="text-2xl font-bold tracking-wide text-white">
              工程制图到实物建模
            </h3>
            
            {/* 极客风『参数面板』(Tech Specs) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
              <span className="text-[10px] font-mono text-gray-400 border border-white/10 px-2 py-1 rounded bg-white/5">
                <span className="text-gray-600 mr-1">DIMENSION</span> 2D TO 3D
              </span>
              <span className="text-[10px] font-mono text-gray-400 border border-white/10 px-2 py-1 rounded bg-white/5">
                <span className="text-gray-600 mr-1">SKILL</span> SPATIAL LOGIC
              </span>
              <span className="text-[10px] font-mono text-gray-400 border border-white/10 px-2 py-1 rounded bg-white/5">
                <span className="text-gray-600 mr-1">TOOL</span> BLUEPRINT
              </span>
            </div>
          </div>
          
          <div className="w-full relative shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-xl overflow-hidden group">
            {/* 微光边缘 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>
            <div className="relative">
              <ImageSlider />
            </div>
          </div>
        </div>

        {/* 案例 2：高承重筷子桥 */}
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase">
              Project 02 — Physics
            </p>
            <h3 className="text-2xl font-bold tracking-wide text-white">
              高承重桁架桥梁
            </h3>
            
            {/* 极客风『参数面板』(Tech Specs) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
              <span className="text-[10px] font-mono text-gray-400 border border-white/10 px-2 py-1 rounded bg-white/5">
                <span className="text-gray-600 mr-1">STRUCTURE</span> TRUSS
              </span>
              <span className="text-[10px] font-mono text-white border border-white/20 px-2 py-1 rounded bg-white/10">
                <span className="text-gray-400 mr-1">LOAD</span> 50KG+
              </span>
              <span className="text-[10px] font-mono text-gray-400 border border-white/10 px-2 py-1 rounded bg-white/5">
                <span className="text-gray-600 mr-1">CORE</span> MECHANICS
              </span>
            </div>
          </div>
          
          <div className="w-full relative shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-xl overflow-hidden group">
            {/* 微光边缘 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>
            <div className="relative aspect-video rounded-xl bg-gray-900 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                alt="高承重桁架桥梁" 
                className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>

      </section>


    </div>
  );
};

export default Home;