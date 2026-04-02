import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Phone, Quote, CalendarCheck, BookOpen, Camera, CheckCircle2, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, XCircle, ArrowDown, Hexagon } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';

// 定义 ClassRecord 接口
interface ClassRecord {
  id: string;
  student_id?: string;
  date?: string; // YYYY-MM-DD
  dateStr?: string;
  dateDisplay?: string;
  time?: string;
  topic: string;
  comment?: string;
  feedback?: string;
  homework_content?: string;
  homework?: string;
  homework_task?: string;
  homework_ref_image?: string;
  status?: string; // 'pending' | 'submitted' | 'reviewed'
  images?: string[]; // 为了兼容原有逻辑
  homework_images?: string[]; // 新增 Supabase 作业图片数组
  isLatest?: boolean;
}

// 独立定义 StudentRecord 避免依赖问题
interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  total_classes: number;
  remaining_classes: number;
  last_deducted_at: string | null;
  phone?: string;
  time?: string;
  calc_score?: number;
  logic_score?: number;
  spatial_score?: number;
  app_score?: number;
  data_score?: number;
}

// 扩展 StudentRecord 以包含 class_records
interface StudentWithRecords extends StudentRecord {
  class_records?: ClassRecord[];
}

const ParentDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentWithRecords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('section-hero');
  const [isJumping, setIsJumping] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 滑动阻尼与微动效状态
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [vibrated, setVibrated] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setVibrated(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartY.current) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY; // 正值表示向上拉（页面向下滚动）
    
    const container = e.currentTarget;
    // 判断是否在最后一页
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
    
    if (diff > 0 && !isAtBottom) {
      setPullDistance(diff);
      if (diff > 50 && !vibrated) {
        setVibrated(true);
        if (navigator.vibrate) navigator.vibrate(50); // 触发震动反馈
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    setPullDistance(0);
    setVibrated(false);
    touchStartY.current = null;
  };

  // 显示 Toast 的辅助函数
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // 日历真实状态管理：默认显示当前月
  const [currentDate, setCurrentDate] = useState(new Date()); 

  useEffect(() => {
    // 强制弹窗诊断
    const paramId = new URLSearchParams(window.location.search).get('id');
    alert('捕获到ID: ' + paramId);

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        // 解析 URL 中的 id 参数
        const studentId = searchParams.get("id");
        
        console.log('正在获取学生ID:', studentId);
        
        if (studentId) {
          // 使用 Supabase 获取学生及历史课程记录
          const { data, error } = await supabase
            .from('students')
            .select('*, class_records(*)')
            .eq('id', studentId)
            .single();
            
          if (data && !error) {
            // 对关联查询回来的 class_records 做按日期倒序排序
            if (data.class_records) {
              data.class_records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              if (data.class_records.length > 0) {
                data.class_records[0].isLatest = true;
              }
            }
            setStudent(data);
            setFetchError(null);
            
            // 如果学生有最后上课时间，将日历定位到那个月
            if (data.last_deducted_at) {
              setCurrentDate(new Date(data.last_deducted_at));
            }
          } else {
            console.error("获取学生数据失败:", error);
            setFetchError(error.message || "未知错误");
            alert('数据库报错内容: ' + JSON.stringify(error));
            showToast("云端同步失败，请检查网络");
          }
        } else {
          setFetchError("URL 中未提供有效的学生 ID");
        }
      } catch (err: any) {
        console.error("捕获到异常:", err);
        setFetchError(err.message || "未知异常");
        alert('数据库报错内容: ' + JSON.stringify(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [searchParams]);

  // 监听各个 Section，实现侧边导航高亮与底部自动跳转
  useEffect(() => {
    if (!student) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 只把 activeSection 设置为这四个实际的卡片
          if (['section-hero', 'section-radar', 'section-timeline', 'section-contact'].includes(entry.target.id)) {
            setActiveSection(entry.target.id);
          }
        }
      });
    }, { threshold: 0.5 }); // 元素有一半进入视野时触发

    // 观察所有的 Section
    const sectionIds = ['section-hero', 'section-radar', 'section-timeline', 'section-contact'];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [student]);

  // 计算当前月份的日历数据
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 获取当月第一天是星期几 (0: 日, 1: 一, ..., 6: 六)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // 获取当月总天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 生成前面的空白偏移数组
    const offsets = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    // 生成真实的天数数组
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { year, month, offsets, days };
  }, [currentDate]);

  // 翻页逻辑：上个月
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // 翻页逻辑：下个月
  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // 获取当前展示的记录
  const displayRecords: any[] = student?.class_records || [];

  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 触发文件选择
  const triggerUpload = (recordId: string) => {
    setUploadingRecordId(recordId);
    fileInputRef.current?.click();
  };

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingRecordId || !student) return;

    setIsLoading(true);
    showToast("正在上传作业图片，请稍候...");

    try {
      const record = student.class_records?.find(r => r.id === uploadingRecordId);
      const existingImages = record?.homework_images || [];
      const newImageUrls: string[] = [];

      // 1. 上传所有文件到 Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${student.id}/${uploadingRecordId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('homework-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 获取 Public URL
        const { data: publicUrlData } = supabase.storage
          .from('homework-photos')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrlData.publicUrl);
      }

      const updatedImages = [...existingImages, ...newImageUrls];

      // 2. 更新数据库中的 homework_images 数组和状态
      const { error: dbError } = await supabase
        .from('class_records')
        .update({ 
          homework_images: updatedImages,
          status: 'submitted' 
        })
        .eq('id', uploadingRecordId);

      if (dbError) throw dbError;

      // 3. 更新本地状态
      setStudent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          class_records: prev.class_records?.map(r => 
            r.id === uploadingRecordId 
              ? { ...r, homework_images: updatedImages, status: 'submitted' }
              : r
          )
        };
      });

      showToast("✅ 作业上传成功！");
    } catch (error) {
      console.error("上传失败:", error);
      showToast("上传失败，请检查网络或存储桶配置");
    } finally {
      setIsLoading(false);
      setUploadingRecordId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 点击日历日期，平滑滚动到对应的时间轴卡片
  const scrollToClass = (year: number, month: number, day: number) => {
    // 构造标准的 YYYY-MM-DD 字符串，用于比对
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    // 在数据中查找是否有这一天的课
    const record = displayRecords.find(r => r.date === targetDateStr || r.dateStr === targetDateStr);
    
    if (record) {
      const targetElement = document.getElementById(record.id);
      if (targetElement) {
        // 丝滑滚动到对应元素
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // 闪烁高亮提示
        targetElement.classList.add('animate-pulse-glow');
        setTimeout(() => targetElement.classList.remove('animate-pulse-glow'), 1500);
      } else {
        console.warn('未找到对应的课程卡片元素 ID:', record.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center space-y-4 relative">
        {/* 顶部强制状态条 (Loading状态) */}
        <div className="fixed top-0 left-0 right-0 z-[100] text-center text-[10px] font-mono py-1 tracking-widest bg-cyan-500/20 text-cyan-400 backdrop-blur-md border-b border-cyan-500/30">
          STATUS: LOADING | ID: {searchParams.get("id") || 'NULL'}
        </div>
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">Aalon 导师正在加载报告...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative">
        {/* 顶部强制状态条 (Error状态) */}
        <div className="fixed top-0 left-0 right-0 z-[100] text-center text-[10px] font-mono py-1 tracking-widest bg-red-600 text-white backdrop-blur-md border-b border-red-500/50">
          STATUS: ERROR | ID: {searchParams.get("id") || 'NULL'}
        </div>
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-widest mb-2">未找到学生信息</h2>
        <p className="text-sm text-gray-400 font-light tracking-wider mb-6">请扫描正确的专属二维码，或联系 Aalon 老师获取最新链接。</p>
        
        {/* 报错详情展示区域 */}
        {fetchError && (
          <div className="w-full max-w-sm bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-left">
            <p className="text-xs font-mono text-red-400/80 mb-1">System Error Log:</p>
            <p className="text-xs font-mono text-red-400 break-words">{fetchError}</p>
          </div>
        )}
      </div>
    );
  }

  // 计算雷达图数据
  const radarData = useMemo(() => {
    if (!student) return [];
    return [
      { subject: '计算力', A: student?.calc_score ?? 3, fullMark: 5 },
      { subject: '逻辑推理', A: student?.logic_score ?? 3, fullMark: 5 },
      { subject: '空间想象', A: student?.spatial_score ?? 3, fullMark: 5 },
      { subject: '应用意识', A: student?.app_score ?? 3, fullMark: 5 },
      { subject: '数据分析', A: student?.data_score ?? 3, fullMark: 5 },
    ];
  }, [student]);

  // 自定义雷达图刻度样式
  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    return (
      <text
        {...rest}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        fill="#9ca3af" // text-gray-400
        fontSize="10px"
        fontFamily="monospace"
        textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
      >
        {payload.value}
      </text>
    );
  };

  return (
    // 强制全局极深色背景，启用 CSS Scroll Snap 和 overscroll-contain
    // 增加 scroll-pt-20 (80px) 确保顶部不被遮挡
    // 为滑动容器增加平滑滚动
    <div 
      className="h-[100dvh] overflow-y-auto snap-y snap-mandatory overscroll-contain bg-slate-950 font-sans selection:bg-cyan-500/30 text-white scroll-smooth scroll-pt-20 relative transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部强制状态条 (Success状态) */}
      <div className="fixed top-0 left-0 right-0 z-[100] text-center text-[10px] font-mono py-1 tracking-widest bg-cyan-500/20 text-cyan-400 backdrop-blur-md border-b border-cyan-500/30">
        STATUS: SUCCESS | ID: {searchParams.get("id") || 'NULL'}
      </div>
      
      {/* 侧边小圆点导航 */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-4">
        {[
          { id: 'section-hero', title: '今日战报' },
          { id: 'section-radar', title: '能力评估' },
          { id: 'section-timeline', title: '历史轨迹' },
          { id: 'section-contact', title: '专属导师' }
        ].map((item) => (
          <button
            key={item.id}
            title={item.title}
            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`group relative flex items-center justify-end transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeSection === item.id ? 'w-24' : 'w-2.5'
            }`}
          >
            {/* 文字提示 (激活时显示) */}
            <span className={`absolute right-6 text-[10px] font-mono whitespace-nowrap transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeSection === item.id ? 'opacity-100 text-cyan-400 translate-x-0' : 'opacity-0 text-gray-500 translate-x-4 pointer-events-none'
            }`}>
              {item.title}
            </span>
            {/* 圆点 / 长条 */}
            <div className={`h-2.5 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeSection === item.id 
                ? 'w-1.5 h-6 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' 
                : 'w-2.5 bg-white/20 hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>

      {/* 阻尼翻页提示微动效 */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center space-x-2 bg-black/80 backdrop-blur-xl border border-cyan-500/30 px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(34,211,238,0.2)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          pullDistance > 50 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
        }`}
      >
        <ArrowDown className="w-4 h-4 text-cyan-400 animate-bounce" />
        <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">松开以跳转下一页</span>
      </div>

      {/* 极弱的背景纹理，叠加在深色背景上 */}
      <div className="fixed inset-0 bg-blueprint bg-blueprint pointer-events-none opacity-10"></div>

      {/* 隐藏的文件上传输入框 */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] flex justify-center pointer-events-none animate-in slide-in-from-top-8 fade-in duration-300">
          <div className="backdrop-blur-xl border px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 font-mono text-xs tracking-widest bg-black/90 border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <XCircle className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* 顶部学情看板 (Hero Section) */}
      <header id="section-hero" className="snap-start min-h-[100dvh] relative pt-16 pb-12 px-6 flex flex-col items-center justify-center border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent will-change-transform">
        {/* 科技感 Cyan 光晕背景 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {/* 纯白高对比核心标题 */}
          <h1 className="text-4xl font-black tracking-widest text-white mb-3">
            {student.name}
          </h1>
          <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="text-xs font-medium tracking-widest text-gray-300">
              {student.grade}
            </span>
          </div>

          <div className="mt-8 mb-4 text-center">
            <p className="text-[10px] text-gray-400 tracking-[0.4em] uppercase mb-2">
              REMAINING CLASSES
            </p>
            {/* 巨大且高亮的剩余课时数字，使用 Cyan 强调色和发光阴影 */}
            <div className="text-8xl font-light tracking-tighter text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              {student.remaining_classes}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-300 font-light tracking-wider bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-md shadow-lg mb-8">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>累计已上：<strong className="text-white font-medium">{student.total_classes - student.remaining_classes}</strong> 课时</span>
          </div>

          {/* 新增：学情日历总览 (Calendar Overview) */}
          <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* 日历头部 */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={handlePrevMonth}
                className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold tracking-widest text-white">
                {calendarData.year}年 {calendarData.month + 1}月
              </h3>
              <button 
                onClick={handleNextMonth}
                className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* 星期表头 */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div key={day} className="text-[10px] text-gray-500 font-medium tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {calendarData.offsets.map(i => (
                <div key={`offset-${i}`} className="h-8"></div>
              ))}
              
              {calendarData.days.map(day => {
                // 构造 YYYY-MM-DD 用于匹配
                const formattedMonth = String(calendarData.month + 1).padStart(2, '0');
                const formattedDay = String(day).padStart(2, '0');
                const currentStr = `${calendarData.year}-${formattedMonth}-${formattedDay}`;
                
                const isClassDay = displayRecords.some(r => r.date === currentStr || r.dateStr === currentStr);
                
                return (
                  <div 
                    key={day} 
                    onClick={() => isClassDay && scrollToClass(calendarData.year, calendarData.month, day)}
                    className={`
                      relative flex flex-col items-center justify-center h-8 rounded-lg transition-all duration-300
                      ${isClassDay ? 'cursor-pointer hover:bg-white/10 active:scale-90' : 'opacity-40 cursor-default'}
                    `}
                  >
                    <span className={`text-xs font-mono ${isClassDay ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {day}
                    </span>
                    
                    {/* 上课标记：科技蓝圆点 */}
                    {isClassDay && (
                      <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* 新增：数学能力评估 (Radar Chart) */}
      <section id="section-radar" className="snap-start min-h-[100dvh] relative px-6 flex flex-col items-center justify-center will-change-transform">
        <div className="mb-10 flex items-center space-x-3">
          <div className="w-8 h-px bg-cyan-500/50"></div>
          <h2 className="text-sm font-medium tracking-[0.2em] text-gray-300 uppercase">
            综合能力评估
          </h2>
          <div className="w-8 h-px bg-cyan-500/50"></div>
        </div>

        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-stem-orange/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(255,107,0,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-stem-orange/10 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={renderPolarAngleAxis} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Ability"
                  dataKey="A"
                  stroke="#ff6b00" /* stem-orange */
                  strokeWidth={2}
                  fill="#ff6b00"
                  fillOpacity={0.3}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex justify-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-stem-orange"></div>
              <span className="text-[10px] font-mono text-gray-400">当前能力值</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-600 border border-gray-500"></div>
              <span className="text-[10px] font-mono text-gray-400">满分基准(5)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 中部成长时间轴 (Timeline) */}
      <section id="section-timeline" className="snap-start min-h-[100dvh] relative px-6 py-12 z-10 max-w-lg mx-auto will-change-transform">
        <div className="mb-10 flex items-center space-x-3">
          <div className="w-8 h-px bg-cyan-500/50"></div>
          <h2 className="text-sm font-medium tracking-[0.2em] text-gray-300 uppercase">
            成长记录轨迹
          </h2>
        </div>

        <div className="relative pl-6 space-y-10">
          {/* 左侧垂直发光线 */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-white/10 to-transparent"></div>

          {displayRecords.map((record) => (
            <div key={record.id} id={record.id} className="snap-center scroll-mt-24 relative group will-change-transform">
              {/* 时间轴节点 (Dot) - 发光效果 */}
              <div className={`absolute -left-[29px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-950 
                ${record.isLatest ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' : 'bg-gray-600'}
                transition-all duration-300 group-hover:scale-125
              `}></div>

              {/* 记录卡片内容 - 深色毛玻璃质感 */}
              <div className={`bg-white/5 backdrop-blur-md border ${record.isLatest ? 'border-stem-orange shadow-[0_0_30px_rgba(255,107,0,0.15)]' : 'border-white/10'} rounded-2xl p-5 hover:bg-white/10 transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarCheck className={`w-4 h-4 ${record.isLatest ? 'text-stem-orange' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-200 tracking-wider">{record.dateDisplay || record.date}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 tracking-widest">{record.time || "14:00 - 15:30"}</span>
                </div>
                
                {/* 纯白核心课题名称 */}
                <h3 className="text-lg font-bold text-white mb-4 tracking-wide">
                  {record.topic}
                </h3>

                {/* 导师评语块 - 极度透明的高对比度背景 */}
                <div className="relative bg-black/40 rounded-xl p-4 border border-white/5 mb-5">
                  <Quote className="absolute top-3 left-3 w-4 h-4 text-white/20" />
                  <p className="text-xs text-gray-300 leading-relaxed font-light pl-6 italic">
                    {record.feedback || record.comment}
                  </p>
                </div>

                {/* 课后实践任务区域 */}
                <div className="pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-[11px] font-medium tracking-widest flex items-center ${record.isLatest ? 'text-stem-orange' : 'text-gray-400'}`}>
                      <FileText className="w-3 h-3 mr-1.5" />
                      {record.isLatest ? '🔥 今日作业' : '课后实践任务'}
                    </h4>
                    
                    {/* 状态标签 */}
                    {record.status === 'submitted' && (
                      <span className="text-[9px] font-mono text-stem-green bg-stem-green/10 border border-stem-green/20 px-2 py-0.5 rounded flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> 已完成
                      </span>
                    )}
                    {record.status === 'reviewed' && (
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> 老师已阅
                      </span>
                    )}
                  </div>
                  
                  {/* 作业内容排版 */}
                  <p className="text-xs text-white leading-relaxed font-light mb-4 whitespace-pre-line">
                    {record.homework_task || record.homework || record.homework_content || '暂无文字作业'}
                  </p>

                  {/* 老师上传的参考图片 */}
                  {record.homework_ref_image && (
                    <div className="mb-4">
                      <img src={record.homework_ref_image} alt="作业参考" className="w-full max-h-48 object-cover rounded-lg border border-white/10 shadow-md" />
                    </div>
                  )}

                  {/* 状态渲染：待上传 (Pending) */}
                  {record.status === 'pending' && (
                    <div className="flex flex-col space-y-3">
                      {record.isLatest && (
                        <button 
                          onClick={() => triggerUpload(record.id)}
                          className="w-full bg-stem-orange/20 hover:bg-stem-orange/30 border border-stem-orange/50 text-stem-orange font-bold text-xs tracking-widest py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                        >
                          <Camera className="w-4 h-4 mr-2" /> 去提交作业
                        </button>
                      )}
                      
                      {!record.isLatest && (
                        <div 
                          onClick={() => triggerUpload(record.id)}
                          className="group relative w-full h-16 rounded-xl border border-dashed border-gray-600 bg-white/5 flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-cyan-500 hover:bg-white/10 active:scale-95"
                        >
                          <Camera className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 mr-2 transition-colors" />
                          <span className="text-[10px] text-gray-500 group-hover:text-cyan-300 tracking-widest transition-colors">
                            补交作业照片
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* 状态渲染：已提交/已阅 (Submitted/Reviewed) - 九宫格多图布局 */}
                {(record.status === 'submitted' || record.status === 'reviewed') && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {/* 真实作业图片 */}
                    {record.homework_images?.map((imgUrl, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg group cursor-pointer">
                        <img src={imgUrl} alt={`作业照片 ${idx + 1}`} className="w-full h-full object-cover filter brightness-90 group-hover:brightness-110 transition-all duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md rounded p-1">
                          <ImageIcon className="w-3 h-3 text-white/80" />
                        </div>
                      </div>
                    ))}
                    
                    {/* 如果没有真实图片，展示旧版占位图以防空白 */}
                    {(!record.homework_images || record.homework_images.length === 0) && record.images?.map((img, idx) => (
                      <div key={`mock-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 shadow-lg group cursor-pointer">
                        <img src={img} alt={`作业照片 ${idx + 1}`} className="w-full h-full object-cover filter brightness-90 group-hover:brightness-110 transition-all duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md rounded p-1">
                          <ImageIcon className="w-3 h-3 text-white/80" />
                        </div>
                      </div>
                    ))}

                    {/* 始终保留的『+』号继续添加按钮 (老师已阅后隐藏) */}
                    {record.status !== 'reviewed' && (
                      <div 
                        onClick={() => triggerUpload(record.id)}
                        className="relative aspect-square rounded-xl border-2 border-dashed border-gray-700 bg-white/5 flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-cyan-500 hover:bg-white/10 group"
                      >
                        <Plus className="w-6 h-6 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 底部专属联系卡片 (Contact Card) */}
      <section id="section-contact" className="snap-center min-h-[100dvh] relative px-6 z-10 flex flex-col justify-center max-w-lg mx-auto will-change-transform">
        {/* 深色毛玻璃名片容器 */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="mb-6 flex flex-col items-center">
            <h3 className="text-xs font-medium text-gray-400 tracking-[0.3em] uppercase mb-1">
              EXCLUSIVE MENTOR
            </h3>
            <p className="text-xl font-bold tracking-widest text-white">
              专属导师：Aalon
            </p>
          </div>

          <div className="flex items-center justify-between space-x-6 bg-black/40 rounded-2xl p-4 border border-white/5">
            {/* 左侧：精简版二维码 */}
            <div className="flex flex-col items-center space-y-2 shrink-0">
              <div className="w-20 h-20 bg-white p-1.5 rounded-xl shadow-inner">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PlaceholderQR" 
                  alt="微信咨询" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[9px] text-gray-400 tracking-widest">
                扫码咨询续费
              </span>
            </div>

            {/* 右侧：一键拨打大按钮 */}
            <div className="flex-1 flex flex-col justify-center">
              <a 
                href="tel:13281250502"
                className="group relative overflow-hidden w-full bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 border border-cyan-500/30 rounded-xl py-4 flex flex-col items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
              >
                {/* 扫光动效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                <Phone className="w-5 h-5 text-cyan-400 mb-2 relative z-10" />
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 relative z-10">
                  132 8125 0502
                </span>
                <span className="text-[10px] text-gray-300 mt-1 tracking-widest relative z-10">
                  一键拨打
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 底部缓冲加载 (Pull to Next) */}
      <div id="section-buffer" className="snap-end h-40 w-full flex flex-col items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
        <ArrowDown className={`w-6 h-6 text-gray-500 mb-2 transition-all duration-300 ${isJumping ? 'animate-bounce text-cyan-400' : ''}`} />
        <span className={`text-xs font-mono tracking-widest transition-colors duration-300 ${isJumping ? 'text-cyan-400' : 'text-gray-500'}`}>
          {isJumping ? 'JUMPING TO SYSTEM...' : '↓ 继续下拉切换下一页'}
        </span>
      </div>

    </div>
  );
};

export default ParentDashboard;