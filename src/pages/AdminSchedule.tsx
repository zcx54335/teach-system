import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, BookOpen, 
  Sparkles, CheckSquare, Square, Plus, Clock, ArrowLeft, CheckCircle
} from 'lucide-react';

// Helper to format date consistently to YYYY-MM-DD
const toDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get calendar days
const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  let firstDayOfWeek = firstDay.getDay(); 
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};

const AdminSchedule: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add Schedule Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchedDate, setNewSchedDate] = useState(toDateString(new Date()));
  const [newSchedStart, setNewSchedStart] = useState('10:00');
  const [newSchedEnd, setNewSchedEnd] = useState('12:00');
  const [newSchedSubject, setNewSchedSubject] = useState('');
  const [newSchedStudents, setNewSchedStudents] = useState<string[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const sessionStr = localStorage.getItem('xiaoyu_user');
    let currentUser = null;
    if (sessionStr) {
      try { currentUser = JSON.parse(sessionStr); } catch (e) {}
    }

    let studentQuery = supabase.from('students').select('*').order('created_at', { ascending: false });
    let scheduleQuery = supabase.from('schedules').select('*').order('start_time', { ascending: true });

    if (currentUser) {
      const role = currentUser.role === 'admin' ? 'sysadmin' : currentUser.role;
      if (role === 'teacher') {
        studentQuery = studentQuery.eq('teacher_id', currentUser.id);
      }
    }

    const [studentRes, scheduleRes] = await Promise.all([studentQuery, scheduleQuery]);

    if (studentRes.data) setStudents(studentRes.data);
    if (scheduleRes.data) setSchedules(scheduleRes.data);
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ADD SCHEDULE MODAL LOGIC ---
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    students.forEach(s => {
      if (Array.isArray(s.subjects)) s.subjects.forEach(sub => subs.add(sub));
    });
    return Array.from(subs);
  }, [students]);

  useEffect(() => {
    if (!newSchedSubject) {
      setNewSchedStudents([]);
      return;
    }
    const matching = students.filter(s => s.subjects?.includes(newSchedSubject));
    setNewSchedStudents(matching.map(s => s.id));
  }, [newSchedSubject, students]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedSubject || newSchedStudents.length === 0) {
      alert('请选择科目并至少勾选一名学员'); return;
    }
    setIsSavingSchedule(true);
    try {
      const { error } = await supabase.from('schedules').insert({
        date: newSchedDate,
        start_time: newSchedStart,
        end_time: newSchedEnd,
        subject: newSchedSubject,
        student_ids: newSchedStudents,
        status: 'pending'
      });
      if (error) throw error;
      
      alert('✅ 排课成功！');
      setIsAddModalOpen(false);
      setNewSchedSubject('');
      fetchData(); // Refetch to show on calendar
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // --- VIEW RENDERERS ---
  const days = getCalendarDays(currentMonth);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  
  // Real schedules for the selected date
  const selectedDateStr = toDateString(selectedDate);
  const todaysSchedules = schedules.filter(s => s.date === selectedDateStr);

  const getStudentNames = (ids: string[]) => {
    return ids.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  return (
    <div className="w-full h-full flex flex-col relative max-w-7xl mx-auto p-4 md:p-6 overflow-hidden">
      <header className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-white flex items-center">
            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 mr-3 text-cyan-400" />
            课程排期规划
          </h2>
          <p className="text-xs md:text-sm text-gray-400 font-mono tracking-widest mt-2">FUTURE SCHEDULE MANAGEMENT</p>
        </div>
        <button 
          onClick={() => {
            setNewSchedDate(selectedDateStr);
            setIsAddModalOpen(true);
          }}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 px-5 rounded-xl flex items-center transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Plus className="w-5 h-5 mr-1" /> 新增排课
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left: Calendar Board */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white tracking-widest">教学日历</h3>
            <div className="flex items-center gap-4 bg-black/30 rounded-full px-3 py-1 border border-white/5">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:text-cyan-400 text-gray-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm font-mono text-white font-bold w-20 text-center">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:text-cyan-400 text-gray-400 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} className="aspect-square"></div>;
              
              const dStr = toDateString(d);
              const isSelected = dStr === selectedDateStr;
              const hasClass = schedules.some(s => s.date === dStr);

              return (
                <div 
                  key={d.toISOString()}
                  onClick={() => {
                    setSelectedDate(d);
                  }}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer relative transition-all duration-300
                    ${isSelected ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'hover:bg-white/5 text-gray-300 border border-transparent'}
                  `}
                >
                  <span className={`text-sm md:text-base font-medium ${isSelected ? 'font-bold' : ''}`}>{d.getDate()}</span>
                  {hasClass && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-cyan-400 shadow-[0_0_5px_#22d3ee]' : 'bg-cyan-500/50'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Daily Schedule View */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl overflow-y-auto">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-xl font-bold text-white tracking-widest flex items-center">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 <span className="mx-2 text-gray-500">|</span> 计划课表
              </h3>
              <p className="text-xs text-gray-400 mt-1">查看该日期的排课安排</p>
            </div>
            {isLoading && <div className="text-cyan-400 animate-pulse text-sm font-mono">SYNCING...</div>}
          </div>

          <div className="flex-1 space-y-4">
            {todaysSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-black/20">
                <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>该日期暂无排课安排</p>
                <button 
                  onClick={() => { setNewSchedDate(selectedDateStr); setIsAddModalOpen(true); }}
                  className="mt-4 text-cyan-400 text-sm hover:underline"
                >
                  + 立即排课
                </button>
              </div>
            ) : (
              todaysSchedules.map(sched => (
                <div 
                  key={sched.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    sched.status === 'completed' 
                      ? 'bg-black/40 border-green-500/20 opacity-70' 
                      : 'bg-cyan-900/10 border-cyan-500/30'
                  }`}
                >
                  {sched.status === 'completed' && (
                    <div className="absolute top-4 right-4 text-green-500/50 flex items-center text-xs font-mono font-bold tracking-widest">
                      <CheckCircle className="w-4 h-4 mr-1" /> 已完成
                    </div>
                  )}
                  {sched.status === 'pending' && (
                    <div className="absolute top-4 right-4 text-yellow-500/80 flex items-center text-xs font-mono font-bold tracking-widest">
                      <Clock className="w-4 h-4 mr-1" /> 待上课
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-shrink-0 bg-black/40 px-4 py-3 rounded-xl border border-white/5 flex flex-col items-center justify-center w-28">
                      <Clock className={`w-5 h-5 mb-1 ${sched.status === 'completed' ? 'text-gray-500' : 'text-cyan-400'}`} />
                      <span className="text-white font-mono font-bold text-sm">{sched.start_time}</span>
                      <span className="text-gray-500 font-mono text-xs">{sched.end_time}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-lg font-bold tracking-widest mb-1 ${sched.status === 'completed' ? 'text-gray-400' : 'text-white'}`}>
                        {sched.subject}
                      </h4>
                      <div className="text-sm text-gray-400 flex items-start gap-2 mt-2">
                        <Users className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">
                          {getStudentNames(sched.student_ids || []) || '未分配学生'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADD SCHEDULE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold tracking-widest text-white">新增排课</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <form id="add-schedule-form" onSubmit={handleSaveSchedule} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">上课日期</label>
                  <input 
                    type="date" required value={newSchedDate} onChange={(e) => setNewSchedDate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-cyan-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">开始时间</label>
                    <input 
                      type="time" required value={newSchedStart} onChange={(e) => setNewSchedStart(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">结束时间</label>
                    <input 
                      type="time" required value={newSchedEnd} onChange={(e) => setNewSchedEnd(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">排课科目</label>
                  <select 
                    required value={newSchedSubject} onChange={(e) => setNewSchedSubject(e.target.value)}
                    className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50"
                  >
                    <option value="" disabled>请选择科目</option>
                    {availableSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                {newSchedSubject && (
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <label className="block text-xs font-mono font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">参与学员 (已报该科目)</label>
                    {students.filter(s => s.subjects?.includes(newSchedSubject)).length === 0 ? (
                      <div className="text-xs text-gray-500">暂无该科目学员</div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {students.filter(s => s.subjects?.includes(newSchedSubject)).map(stu => {
                          const isChecked = newSchedStudents.includes(stu.id);
                          return (
                            <label key={stu.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setNewSchedStudents(prev => [...prev, stu.id]);
                                  else setNewSchedStudents(prev => prev.filter(id => id !== stu.id));
                                }}
                                className="w-4 h-4 accent-cyan-500 rounded bg-black/50 border-white/10"
                              />
                              <span className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-gray-400'}`}>{stu.name}</span>
                              <span className="text-xs text-gray-500 ml-auto font-mono">{stu.grade || ''}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-5 border-t border-white/5 bg-black/20 shrink-0">
              <button 
                form="add-schedule-form"
                type="submit"
                disabled={isSavingSchedule || !newSchedSubject || newSchedStudents.length === 0}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3.5 rounded-xl tracking-widest transition-all disabled:opacity-50"
              >
                {isSavingSchedule ? '保存中...' : '确认排课'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
