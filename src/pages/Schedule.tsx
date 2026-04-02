import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Hexagon, Fingerprint, CalendarDays, X, AlertCircle, Share2, Download, ChevronLeft, ChevronRight, Sparkles, BookOpen, Camera } from "lucide-react";
import html2canvas from "html2canvas";
import { PageProps } from "../components/Layout/RollerNavigation";
import { supabase } from '../lib/supabaseClient';
import OpenAI from 'openai';

// 初始化 OpenAI 客户端 (注意：在真实生产环境中，API Key 绝不能暴露在前端，必须通过后端中转，这里仅作演示)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy_key_for_build',
  dangerouslyAllowBrowser: true // 允许在前端直接调用
});

// 定义核心数据结构 Schema
export interface StudentRecord {
  id: string;
  name: string; // mapped from studentName
  grade: string;
  total_classes: number;
  remaining_classes: number;
  last_deducted_at: string | null;
  phone?: string;
  time?: string; // 模拟上课时间，用于展示
  calc_score?: number;
  logic_score?: number;
  spatial_score?: number;
  app_score?: number;
  data_score?: number;
  physics_score?: number;
  chemistry_score?: number;
  class_records?: any[];
}

// API：更新剩余课时并记录
const deductClass = async (
  id: string, 
  currentRemaining: number, 
  topic: string = '云端同步默认课题', 
  comment: string = '表现良好，继续保持！',
  homeworkTask: string = '',
  homeworkRefImage: string = '',
  scores: { calc_score: number, logic_score: number, spatial_score: number, app_score: number, data_score: number, physics_score: number, chemistry_score: number }
): Promise<{ success: boolean, error: any }> => {
  // 1. 更新剩余课时和雷达图维度分数
  const { error: updateError } = await supabase
    .from('students')
    .update({ 
      remaining_classes: currentRemaining - 1,
      last_deducted_at: new Date().toISOString(),
      ...scores
    })
    .eq('id', id);
    
  if (updateError) {
    console.error('消课更新失败:', updateError);
    return { success: false, error: updateError };
  }

  // 2. 插入一条课时记录
  const { error: insertError } = await supabase
    .from('class_records')
    .insert({
      student_id: id,
      date: new Date().toISOString().split('T')[0], // 提取 YYYY-MM-DD
      topic: topic,
      comment: comment,
      homework_task: homeworkTask,
      homework_ref_image: homeworkRefImage,
      status: 'pending'
    });

  if (insertError) {
    console.error('课时记录插入失败:', insertError);
    // 即使记录插入失败，扣课本身已成功，但为严谨可抛出错误
    return { success: false, error: insertError };
  }

  return { success: true, error: null };
};

const Schedule: React.FC<PageProps> = ({ localProgress, students = [], setStudents, fetchStudents, isLoading: globalIsLoading }) => {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isDeducting, setIsDeducting] = useState(false);
  
  // Toast 状态管理
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // 二次确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    studentId: string; 
    studentName: string; 
    grade: string;
    remainingClasses: number;
    topic: string;
    comment: string;
    homeworkTask: string;
    homeworkRefImage: string;
    scores: {
      calc_score: number;
      logic_score: number;
      spatial_score: number;
      app_score: number;
      data_score: number;
      physics_score: number;
      chemistry_score: number;
    };
  } | null>(null);

  const DIMENSIONS = [
    { key: 'calc_score', label: '计算力' },
    { key: 'logic_score', label: '逻辑推理' },
    { key: 'spatial_score', label: '空间想象' },
    { key: 'app_score', label: '应用意识' },
    { key: 'data_score', label: '数据分析' },
    { key: 'physics_score', label: '物理逻辑' },
    { key: 'chemistry_score', label: '化学逻辑' }
  ] as const;

  // AI 生成状态
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const AI_TAGS = ['逻辑严密', '动手能力强', '计算零失误', '课堂专注', '举一反三', '需要加强练习'];

  // 作业图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const homeworkFileInputRef = useRef<HTMLInputElement>(null);

  // 处理老师端作业参考图上传
  const handleHomeworkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirmModal) return;

    setIsUploadingImage(true);
    showToast("正在上传参考图片...", "success");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `teacher_refs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('homework-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homework-photos')
        .getPublicUrl(filePath);

      setConfirmModal(prev => prev ? { ...prev, homeworkRefImage: data.publicUrl } : null);
      showToast("✅ 图片上传成功", "success");
    } catch (error) {
      console.error("图片上传失败:", error);
      showToast("图片上传失败，请重试", "error");
    } finally {
      setIsUploadingImage(false);
      if (homeworkFileInputRef.current) homeworkFileInputRef.current.value = '';
    }
  };

  // 触发二次确认
  const promptDeduct = (student: StudentRecord) => {
    if (student.remaining_classes <= 0) {
      showToast("课时已耗尽，请提醒家长续费", "error");
      return;
    }
    setConfirmModal({ 
      isOpen: true, 
      studentId: student.id, 
      studentName: student.name, 
      grade: student.grade,
      remainingClasses: student.remaining_classes,
      topic: '',
      comment: '',
      homeworkTask: '',
      homeworkRefImage: '',
      scores: {
        calc_score: student.calc_score || 3,
        logic_score: student.logic_score || 3,
        spatial_score: student.spatial_score || 3,
        app_score: student.app_score || 3,
        data_score: student.data_score || 3,
        physics_score: student.physics_score || 3,
        chemistry_score: student.chemistry_score || 3,
      }
    });
    setSelectedTags([]);
  };

  // 模拟 AI 生成逻辑 (后续替换为真实 API)
  const generateAIComment = async () => {
    if (!confirmModal) return;
    setIsGeneratingAI(true);

    try {
      const tagsStr = selectedTags.length > 0 ? `该学生在本次课中表现出了以下特点：【${selectedTags.join('、')}】。` : '该学生表现良好。';
      const prompt = `你是一位专业且温情的杨老师，专注理科逻辑与STEM思维提分。今天你给 ${confirmModal.grade} 的 ${confirmModal.studentName} 同学上了一节课。
${tagsStr}
请根据以上信息，生成一段不少于 150 字的课后反馈评语。要求：
1. 第一句话必须是具体的课题名称，格式为：课题：[你编一个符合${confirmModal.grade}理科逻辑或STEM的课题]。
2. 随后另起一段，开始写具体的课后评语。语气要专业、温和、鼓励，指出他的亮点并给出一点下节课的期许。`;
      
      let generatedTopic = `【STEM进阶】${confirmModal.grade}理科逻辑训练`;
      let generatedComment = `杨老师课后反馈：\n今天${confirmModal.studentName}同学在课堂上表现非常出色。特别是表现出了【${selectedTags.join('、')}】的特点在推导核心逻辑时，展现了极强的空间想象力和问题拆解能力。虽然遇到了一些具有挑战性的复杂结构，但能够保持耐心，独立寻找破局点。建议课后继续保持这种探索精神，我们下节课将进一步深化这个知识点。加油！`;

      // 尝试调用真实的 OpenAI API
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // 如果有 GPT-4 也可以换成 gpt-4
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        
        const text = response.choices[0].message.content || '';
        
        // 简单解析返回文本，提取课题和评语
        const match = text.match(/课题：(.*?)\n([\s\S]*)/);
        if (match) {
          generatedTopic = match[1].trim();
          generatedComment = match[2].trim();
        } else {
          generatedComment = text.trim();
        }
      } else {
        // 如果没有配置 API Key，则使用模拟延迟演示
        await new Promise(resolve => setTimeout(resolve, 1500));
        showToast("未配置 OpenAI API Key，使用模拟数据", "error");
      }

      setConfirmModal(prev => prev ? { ...prev, topic: generatedTopic, comment: generatedComment } : null);
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        showToast("✨ AI 评语生成成功", "success");
      }
    } catch (error) {
      console.error("AI 生成失败:", error);
      showToast("AI 生成失败，请重试", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 异步消课核心逻辑
  const handleConfirmDeduct = async () => {
    if (!confirmModal) return;
    
    const { studentId, studentName, remainingClasses, topic, comment, homeworkTask, homeworkRefImage, scores } = confirmModal;
    
    if (!topic.trim()) {
      showToast("请填写课题名称", "error");
      return;
    }

    setConfirmModal(null); // 立即关闭弹窗

    setIsDeducting(true);
    const { success, error } = await deductClass(
      studentId, 
      remainingClasses,
      topic,
      comment || '表现良好，继续保持！',
      homeworkTask,
      homeworkRefImage,
      scores
    );
    setIsDeducting(false);

    if (!success || error) {
      showToast("云端同步失败，请检查网络", "error");
      return;
    }

    let newRemaining = remainingClasses - 1;

    // 乐观更新 UI，同时更新给父组件
    const newStudents = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          remaining_classes: newRemaining,
          last_deducted_at: new Date().toISOString(),
          ...scores
        };
      }
      return s;
    });

    if (setStudents) {
      setStudents(newStudents);
    }
    showToast(`✅ 成功扣除 1 课时。当前剩余：${newRemaining} 节`, "success");
  };

  // 生成海报逻辑
  const generatePoster = async (student: StudentRecord) => {
    // 增加容错：检查 studentId
    if (!student || !student.id) {
      showToast("学生信息缺失，无法生成专属海报", "error");
      return;
    }

    // 1. 先打开弹窗，将 student 数据放入，此时渲染隐藏的 DOM
    setPosterModal({ isOpen: true, imageUrl: null, student });
    setIsGenerating(true);
    
    // 2. 给 React 一点时间渲染隐藏的 DOM
    setTimeout(async () => {
      if (posterRef.current) {
        try {
          const canvas = await html2canvas(posterRef.current, {
            scale: 2, // 高清
            useCORS: true,
            backgroundColor: '#020617', // slate-950
          });
          const imgUrl = canvas.toDataURL("image/png");
          setPosterModal({ isOpen: true, imageUrl: imgUrl, student });
        } catch (error) {
          console.error("生成海报失败:", error);
          showToast("海报生成失败", "error");
          setPosterModal({ isOpen: false, imageUrl: null, student: null });
        } finally {
          setIsGenerating(false);
        }
      }
    }, 100); // 100ms 延迟确保 DOM 已经挂载
  };

  // 生成日历网格 (真实当月)
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarData = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    return {
      year,
      month,
      firstDayOffset: Array.from({ length: firstDayOfMonth }, (_, i) => i),
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1)
    };
  }, [currentDate]);

  // 为了演示日历交互，我们把所有学生都放在当前选中的日期，或者默认的第一天
  const getStudentsForDate = (day: number) => {
    if (students.length === 0) return [];
    
    // 把所有学生都放到 12 号展示
    if (day === 12) return students;
    if (day === 15) return students.slice(0, 1);
    if (day === 18) return students.slice(1, 2);
    
    return [];
  };

  // 默认选中12号以便立刻看到数据
  useEffect(() => {
    if (students.length > 0 && !selectedDate) {
      setSelectedDate(12);
    }
  }, [students]);

  // 显示 Toast 的辅助函数
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // 海报生成状态
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterModal, setPosterModal] = useState<{ isOpen: boolean; imageUrl: string | null; student: StudentRecord | null }>({
    isOpen: false,
    imageUrl: null,
    student: null
  });
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="min-h-full bg-stem-dark relative font-sans selection:bg-stem-green/30 text-white overflow-hidden flex flex-col">
      {/* 极弱的蓝图网格背景 */}
      <div className="absolute inset-0 bg-blueprint bg-blueprint pointer-events-none opacity-50"></div>
      
      {/* 科技感装饰元素 */}
      <div className="absolute top-10 right-10 opacity-20 pointer-events-none animate-pulse">
        <Hexagon className="w-64 h-64 text-stem-green" strokeWidth={0.5} />
      </div>

      {(globalIsLoading || isDeducting) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-stem-green/30 border-t-stem-green rounded-full animate-spin"></div>
            <span className="text-stem-green font-mono text-sm tracking-widest animate-pulse">SYNCING DATA...</span>
          </div>
        </div>
      )}

      {/* 顶部标题区 */}
      <header className="relative z-10 px-6 pt-16 pb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-widest flex items-center space-x-3">
            <CalendarDays className="w-8 h-8 text-stem-green opacity-80" />
            <span>课程日程</span>
          </h1>
          <p className="text-[10px] text-stem-green/60 tracking-[0.3em] uppercase mt-2 font-mono">
            排课与消课管理系统
          </p>
        </div>
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
          <Fingerprint className="w-6 h-6 text-white/40" />
        </div>
      </header>

      {/* 核心内容区：可滚动 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-32">
        
        {/* 全屏毛玻璃日历流 */}
        <div className="bg-stem-panel backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl mb-8">
          {/* 日历头部：月份与切换 */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button 
              onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month - 1, 1))}
              className="p-1 text-white/40 hover:text-stem-green transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold tracking-widest text-white">
              {calendarData.year}年 {calendarData.month + 1}月
            </h3>
            <button 
              onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month + 1, 1))}
              className="p-1 text-white/40 hover:text-stem-green transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-[12px] text-white/50 font-medium tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {calendarData.firstDayOffset.map(i => (
              <div key={`offset-${i}`} className="h-10"></div>
            ))}
            
            {calendarData.days.map(day => {
              const dayStudents = getStudentsForDate(day);
              const hasClasses = dayStudents.length > 0;
              const isSelected = selectedDate === day;

              return (
                <div 
                  key={day} 
                  onClick={() => hasClasses && setSelectedDate(isSelected ? null : day)}
                  className={`
                    relative flex flex-col items-center justify-center h-12 rounded-xl cursor-pointer transition-all duration-300
                    ${hasClasses ? 'hover:bg-white/5' : 'opacity-30 cursor-default'}
                    ${isSelected ? 'bg-stem-green/10 border border-stem-green/30' : 'border border-transparent'}
                  `}
                >
                  <span className={`text-sm font-mono ${isSelected ? 'text-stem-green' : 'text-white/80'}`}>
                    {day}
                  </span>
                  
                  {/* 可视化发光标记 */}
                  {hasClasses && (
                    <div className="absolute bottom-2 flex space-x-1">
                      {dayStudents.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${isSelected ? 'bg-stem-green shadow-[0_0_8px_#00ff9d]' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 选中的日期课程详情面板 */}
        {selectedDate && getStudentsForDate(selectedDate).length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-sm font-mono text-stem-green flex items-center">
                <span className="w-2 h-2 bg-stem-green rounded-full mr-2 shadow-[0_0_10px_#00ff9d]"></span>
                日期: {selectedDate.toString().padStart(2, '0')}
              </h2>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {getStudentsForDate(selectedDate).map((student) => (
              <div 
                key={student.id} 
                className="group relative bg-stem-panel backdrop-blur-md border border-white/5 rounded-2xl p-5 overflow-hidden"
              >
                {/* 装饰线条 */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b opacity-50 ${student.remaining_classes > 0 ? 'from-stem-green to-transparent' : 'from-red-500 to-transparent'}`}></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold tracking-wide">{student.name}</h3>
                      <span className="text-[10px] font-mono border border-white/20 px-2 py-0.5 rounded text-white/60 bg-white/5">
                        {student.grade}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs font-mono text-white/40">
                        时间: <span className="text-white/80">{student.time || "14:00 - 15:30"}</span>
                      </div>
                      <div className="text-xs font-mono text-white/40">
                        剩余课时: <span className={`font-bold text-sm ${student.remaining_classes > 0 ? 'text-stem-green' : 'text-red-500'}`}>{student.remaining_classes}</span> / {student.total_classes}
                      </div>
                    </div>
                    
                    {/* 显示最后消课时间 */}
                    {student.last_deducted_at && (
                      <div className="text-[9px] font-mono text-white/30 pt-1">
                        最后消课: {new Date(student.last_deducted_at).toLocaleDateString()} {new Date(student.last_deducted_at).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {/* 科技感操作按钮组 */}
                  <div className="flex flex-col space-y-2 items-end">
                    <button 
                      onClick={() => promptDeduct(student)}
                      className={`
                        relative overflow-hidden px-6 py-3 rounded-xl font-mono text-xs tracking-widest transition-all duration-300
                        backdrop-blur-md border w-28 text-center
                        ${student.remaining_classes > 0 
                          ? "bg-white/5 border-stem-green/30 text-stem-green hover:bg-stem-green/10 hover:shadow-[0_0_20px_rgba(0,255,157,0.2)] active:scale-90" 
                          : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 active:scale-95"
                        }
                      `}
                    >
                      {student.remaining_classes > 0 ? "消课" : "提醒续费"}
                    </button>

                    {/* 海报生成按钮 */}
                    <button
                      onClick={() => generatePoster(student)}
                      title="生成家长专属分享海报"
                      className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 active:scale-90"
                    >
                      <Share2 className="w-4 h-4 text-white/50 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 强化版二次确认与 AI 评语生成弹窗 */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-stem-panel border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            
            {/* 警告/标题头部 */}
            <div className="flex items-center space-x-3 mb-6 shrink-0">
              <div className="w-10 h-10 rounded-full bg-stem-green/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-stem-green" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-widest text-lg">操作确认</h3>
                <p className="text-xs text-gray-400 font-mono">DEDUCTION SYSTEM</p>
              </div>
            </div>

            <div className="overflow-y-auto pr-2 pb-2 space-y-6">
              {/* 学生基础信息 */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="text-sm text-gray-300 tracking-wide mb-2">
                  确认扣除 <span className="text-white font-bold text-lg">{confirmModal.studentName}</span> 1 课时吗？
                </p>
                <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                  <span>年级: {confirmModal.grade}</span>
                  <span>扣除后剩余: <strong className="text-stem-green">{confirmModal.remainingClasses - 1}</strong></span>
                </div>
              </div>

              {/* 课题输入框 */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 tracking-widest uppercase">课题名称 <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={confirmModal.topic}
                  onChange={(e) => setConfirmModal({...confirmModal, topic: e.target.value})}
                  placeholder="例如：逻辑思维与图形推导"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* 能力评估雷达图打分 */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <label className="text-xs font-mono text-cyan-400 tracking-widest uppercase flex items-center">
                  <Hexagon className="w-4 h-4 mr-2" /> 课后能力评估 (1-5分)
                </label>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-white/5 border border-white/10 rounded-xl p-4">
                  {DIMENSIONS.map(({ key, label }) => (
                    <div key={key} className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 font-medium">{label}</span>
                        <span className="text-cyan-400 font-bold">{confirmModal.scores[key]}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={confirmModal.scores[key]}
                        onChange={(e) => setConfirmModal({
                          ...confirmModal, 
                          scores: { ...confirmModal.scores, [key]: parseInt(e.target.value) }
                        })}
                        className="w-full accent-cyan-500 bg-gray-700 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 智能评语区域 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-gray-400 tracking-widest uppercase flex items-center">
                    课后评语
                    {isGeneratingAI && <span className="ml-2 text-[10px] text-cyan-400 animate-pulse">AI 生成中...</span>}
                  </label>
                  <button 
                    onClick={generateAIComment}
                    disabled={isGeneratingAI}
                    className="flex items-center space-x-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI 智能填充</span>
                  </button>
                </div>

                {/* 快捷标签 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {AI_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        )
                      }}
                      className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-colors ${
                        selectedTags.includes(tag) 
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <textarea 
                  value={confirmModal.comment}
                  onChange={(e) => setConfirmModal({...confirmModal, comment: e.target.value})}
                  placeholder="点击上方 ✨ AI 按钮自动生成，或手动输入评语..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none"
                />
              </div>

              {/* 布置本课作业 */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <label className="text-xs font-mono text-stem-orange tracking-widest uppercase flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" /> 布置本课作业
                </label>
                
                <textarea 
                  value={confirmModal.homeworkTask}
                  onChange={(e) => setConfirmModal({...confirmModal, homeworkTask: e.target.value})}
                  placeholder="输入作业要求，例如：完成课后练习第3页..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-stem-orange focus:ring-1 focus:ring-stem-orange/50 transition-all resize-none"
                />

                <div className="flex items-center space-x-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={homeworkFileInputRef}
                    onChange={handleHomeworkImageUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => homeworkFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex items-center justify-center space-x-2 bg-white/5 border border-white/10 hover:border-stem-orange/50 text-gray-400 hover:text-stem-orange px-4 py-2 rounded-xl text-xs font-mono tracking-widest transition-all w-full disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isUploadingImage ? '上传中...' : '上传参考题目图片'}</span>
                  </button>
                </div>
                
                {confirmModal.homeworkRefImage && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stem-orange/50">
                    <img src={confirmModal.homeworkRefImage} alt="参考图片" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setConfirmModal({...confirmModal, homeworkRefImage: ''})}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="flex space-x-4 mt-6 shrink-0 pt-4 border-t border-white/10">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl font-mono text-xs tracking-widest text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDeduct}
                className="flex-1 py-3 rounded-xl font-mono text-xs tracking-widest text-stem-green bg-stem-green/10 border border-stem-green/30 hover:bg-stem-green/20 transition-colors"
              >
                确认扣除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的海报 DOM (仅用于 html2canvas 渲染) */}
      {posterModal.student && !posterModal.imageUrl && (
        <div className="absolute top-0 left-[-9999px]">
          <div 
            ref={posterRef}
            className="w-[375px] h-[667px] flex flex-col relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)', // 深蓝色到黑色的优雅渐变
            }}
          >
            {/* 海报背景纹理 */}
            <div className="absolute inset-0 bg-blueprint bg-blueprint opacity-20 pointer-events-none"></div>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-stem-green/10 rounded-full blur-[100px]"></div>

            {/* 顶部 Hero 区 */}
            <div className="relative z-10 px-8 pt-16 pb-8">
              <h1 className="text-5xl font-black text-white tracking-widest mb-2">
                {posterModal.student.name}
              </h1>
              <div className="h-px w-8 bg-cyan-400"></div>
            </div>

            {/* 中部核心数据区 */}
            <div className="relative z-10 flex-1 px-8 flex flex-col justify-center">
              <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.1)] relative overflow-hidden flex items-center justify-between">
                {/* 装饰发光边角 */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400 rounded-tl-3xl opacity-50"></div>
                
                {/* 左侧：巨大的剩余课时及明确的中文标签 */}
                <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                  <div className="text-8xl font-light tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] leading-none h-[96px] flex items-center">
                    {posterModal.student.remaining_classes}
                  </div>
                  <p className="text-sm font-bold text-cyan-400 tracking-[0.2em] uppercase">
                    剩余课时
                  </p>
                </div>

                {/* 右侧：次要数据 */}
                <div className="flex flex-col justify-center space-y-4 border-l border-white/10 pl-6 h-full">
                  <p className="text-xs font-mono text-gray-400">
                    累计已上: <span className="text-white font-bold text-sm ml-1">{posterModal.student.total_classes - posterModal.student.remaining_classes}</span>
                  </p>
                  <p className="text-xs font-mono text-gray-400">
                    最近上课: <span className="text-white font-bold text-sm ml-1">{posterModal.student.last_deducted_at ? new Date(posterModal.student.last_deducted_at).toLocaleDateString() : '-'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 底部引导区 */}
            <div className="relative z-10 px-8 pb-12 flex justify-between items-end">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                    <span className="text-cyan-400 font-serif font-bold italic">师</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-widest">杨老师</p>
                    <p className="text-[10px] font-mono text-gray-400 tracking-widest mt-1">132 8125 0502</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 tracking-widest">
                  扫码查看详细成长轨迹与作业
                </p>
              </div>
              <div className="w-20 h-20 bg-white p-1.5 rounded-xl flex items-center justify-center relative">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://xiongxiong.top/#/parent?id=${posterModal.student.id}`)}&format=png`}
                  alt="专属学情看板" 
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // 如果外部 QR Code 挂了，显示一个后备文字防止白屏或报错
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-[10px] text-gray-500 font-mono">QR CODE</span>';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 海报展示弹窗 */}
      {posterModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => !isGenerating && setPosterModal({ isOpen: false, imageUrl: null, student: null })}
          ></div>
          
          <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
            {isGenerating ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">GENERATING POSTER...</p>
              </div>
            ) : (
              posterModal.imageUrl && (
                <div className="animate-in fade-in zoom-in-95 duration-300 w-full flex flex-col items-center">
                  <button 
                    onClick={() => setPosterModal({ isOpen: false, imageUrl: null, student: null })}
                    className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* 展示生成的图片 */}
                  <img 
                    src={posterModal.imageUrl} 
                    alt="学情海报" 
                    className="w-full rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10"
                  />
                  
                  <div className="mt-8 flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2 text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-full border border-cyan-500/20">
                      <Download className="w-4 h-4" />
                      <span className="text-xs font-mono tracking-widest">长按图片保存，发送给家长</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] flex justify-center pointer-events-none animate-in slide-in-from-top-8 fade-in duration-300">
          <div className={`
            backdrop-blur-xl border px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 font-mono text-xs tracking-widest
            ${toast.type === 'success' ? 'bg-black/80 border-stem-green/30 text-stem-green shadow-[0_0_30px_rgba(0,255,157,0.1)]' : 'bg-black/90 border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}
          `}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;