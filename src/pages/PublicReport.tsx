import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, CheckCircle, Clock, Sparkles, Image as ImageIcon, MessageSquare, Check } from 'lucide-react';

const PublicReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        if (!id) throw new Error('无效的报告链接');

        // Fetch Schedule & its rich report data
        const [schedRes, settingsRes] = await Promise.all([
          supabase.from('schedules').select('*').eq('id', id).single(),
          supabase.from('system_settings').select('report_footer').eq('id', 1).single()
        ]);

        if (settingsRes.data) setSystemSettings(settingsRes.data);

        const { data: schedData, error: schedError } = schedRes;

        if (schedError || !schedData) throw new Error('找不到该课程记录');
        setSchedule(schedData);

        // Fetch Student Names for attendance
        // Fallback to schedule.student_ids if report_data doesn't have it (e.g. older records or specific save logic)
        const studentIdsToFetch = schedData.report_data?.attendedStudentIds || schedData.student_ids;
        
        if (studentIdsToFetch && studentIdsToFetch.length > 0) {
          const { data: stuData, error: stuError } = await supabase
            .from('students')
            .select('id, name')
            .in('id', studentIdsToFetch);
          
          if (stuError) {
             console.error("Error fetching students:", stuError);
          }
          if (stuData) {
            setStudents(stuData);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium tracking-widest animate-pulse">正在获取专属学情报告...</p>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <X className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">报告获取失败</h2>
        <p className="text-gray-500">{error || '未知错误'}</p>
      </div>
    );
  }

  const report = schedule.report_data || {};
  const topicImages = report.topicImages || [];
  const homeworkImages = report.homeworkImages || [];
  
  const studentNames = students.map(s => s.name).join('、') || '学员';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-10">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-6 pt-14 pb-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center bg-white/10 border border-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-gold-50 text-xs font-bold tracking-[0.2em] mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-gold-300" />
            熊熊 · VIP 专属服务
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide mb-4 drop-shadow-md">
            {studentNames} <span className="font-medium text-gold-100">的专属学情报告</span>
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-gold-100/80 text-sm font-medium tracking-wide">
            <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">{schedule.subject}</span>
            <span>•</span>
            <span>{schedule.date}</span>
            <span>•</span>
            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {schedule.start_time} - {schedule.end_time}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-20 space-y-5">

        {/* Topic Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100/50">
          <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-5 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            本节课重点与表现
          </h3>
          
          {report.topic ? (
            <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100/30 mb-5">
              <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                {report.topic}
              </p>
            </div>
          ) : (
            <div className="flex items-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-5">
              <CheckCircle className="w-4 h-4 mr-2 text-slate-300" />
              杨老师已在课堂内完成详细指导与重点闭环
            </div>
          )}

          {topicImages.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 mb-3 flex items-center tracking-widest">
                <ImageIcon className="w-3.5 h-3.5 mr-1" /> 板书与现场记录
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topicImages.map((url: string, idx: number) => (
                  <img 
                    key={idx} 
                    src={url} 
                    alt={`课堂重点 ${idx + 1}`} 
                    className="w-full h-36 object-cover rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Homework Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100/50">
          <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-5 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-purple-500" />
            课后巩固与作业
          </h3>
          
          {report.homework ? (
            <div className="bg-purple-50/30 rounded-2xl p-5 border border-purple-100/30 mb-5">
              <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                {report.homework}
              </p>
            </div>
          ) : (
            <div className="flex items-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-5">
              <CheckCircle className="w-4 h-4 mr-2 text-slate-300" />
              今日暂无书面作业，请指导孩子完成常规复习
            </div>
          )}

          {homeworkImages.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 mb-3 flex items-center tracking-widest">
                <ImageIcon className="w-3.5 h-3.5 mr-1" /> 习题/讲义参考
              </div>
              <div className="grid grid-cols-2 gap-3">
                {homeworkImages.map((url: string, idx: number) => (
                  <img 
                    key={idx} 
                    src={url} 
                    alt={`课后作业 ${idx + 1}`} 
                    className="w-full h-36 object-cover rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teacher Comments Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100/50">
          <h3 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-5 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
            杨老师专属评语
          </h3>
          
          {report.teacherComment ? (
            <div className="bg-green-50/30 rounded-2xl p-5 border border-green-100/30">
              <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                {report.teacherComment}
              </p>
            </div>
          ) : (
            <div className="flex items-center text-sm text-slate-400 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              <CheckCircle className="w-4 h-4 mr-2 text-slate-300" />
              表现优异，继续保持
            </div>
          )}
        </div>

      </div>

      <div className="text-center mt-8">
        <p className="text-xs font-medium text-slate-400 tracking-widest">
          {systemSettings?.report_footer || 'POWERED BY XIAOYU EDUCATION'}
        </p>
      </div>

    </div>
  );
};

// Simple X icon for error state
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default PublicReport;
