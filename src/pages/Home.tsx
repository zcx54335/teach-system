import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Phone, GripVertical, ChevronDown } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { PageProps } from "../components/Layout/RollerNavigation";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
            alt="STEM 实践：精美结构桥梁" 
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
              杨老师
            </h1>
            <h2 className="text-3xl font-bold tracking-tight text-white/90">
              理科逻辑 · STEM 实践
            </h2>
          </div>

          <div className="w-12 h-0.5 bg-white/30"></div>

          <p className="text-xs font-light text-gray-400 tracking-[0.2em] leading-relaxed">
            面向小学全学段的深度思维重塑
          </p>
          
          {/* 极简向下引导 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce-soft opacity-50">
            <ChevronDown className="w-6 h-6 text-white" strokeWidth={1} />
          </div>
        </motion.div>
      </section>

      {/* 沉浸式项目列表区 */}
      <section className="relative z-20 px-6 space-y-24 bg-black pt-12">
        
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
          
          <div className="w-full relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <ImageSlider />
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
          
          <div className="w-full aspect-video overflow-hidden rounded-xl bg-gray-900">
            <img 
              src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
              alt="高承重筷子桥" 
              className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>

      </section>

      {/* 悬浮吸底按钮 */}
      <div 
        className="fixed left-6 right-6 z-40 flex justify-center pointer-events-none"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 text-white font-medium text-sm tracking-widest py-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-white/10 active:scale-95 transition-all duration-300 pointer-events-auto flex items-center justify-center space-x-3"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="tracking-widest">预约咨询</span>
        </button>
      </div>

      {/* 预约咨询弹窗 (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          {/* 深色半透明遮罩 */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* 高级毛玻璃弹窗主体 */}
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
            {/* 精致的关闭按钮 */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/20 text-white/70 hover:text-white hover:bg-black/40 rounded-full transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 flex flex-col items-center">
              {/* 优雅的标题 */}
              <h3 className="text-xl font-medium text-white tracking-widest mb-8">
                联系杨老师
              </h3>
              
              {/* 美化后的实体名片风二维码区域 */}
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center">
                <div className="w-40 h-40 bg-gray-50 rounded-xl overflow-hidden mb-3">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PlaceholderQR" 
                    alt="微信群二维码" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-gray-500 text-xs font-medium tracking-wider">
                  扫码添加微信咨询
                </p>
              </div>
              
              {/* 视觉分割线 */}
              <div className="w-full flex items-center justify-center space-x-4 mb-6 opacity-50">
                <div className="h-px bg-white flex-1"></div>
                <span className="text-xs text-white tracking-widest">或</span>
                <div className="h-px bg-white flex-1"></div>
              </div>
              
              {/* 横向排版的一键拨打按钮 */}
              <a 
                href="tel:13281250502" 
                className="w-full group relative overflow-hidden flex items-center justify-center space-x-3 bg-primary text-white py-4 px-6 rounded-2xl hover:bg-blue-800 active:scale-95 transition-all duration-300 shadow-lg shadow-primary/30"
              >
                {/* 按钮内部的发光效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                <Phone className="w-5 h-5 relative z-10" />
                <span className="font-semibold text-lg tracking-wider relative z-10">
                  132 8125 0502
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;