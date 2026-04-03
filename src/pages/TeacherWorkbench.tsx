import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CalendarCheck, User, Clock, CheckCircle } from 'lucide-react';

const TeacherWorkbench: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .gt('remaining_classes', 0) // Only show students with remaining classes
      .order('updated_at', { ascending: false })
      .limit(10); // Show recently updated/active students
      
    if (!error && data) {
      setStudents(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeductClass = async (studentId: string, currentRemaining: number, studentName: string) => {
    if (currentRemaining <= 0) return;
    
    if (!window.confirm(`确认要为学员 ${studentName} 扣除 1 个课时吗？`)) return;

    try {
      const newRemaining = currentRemaining - 1;
      const { error } = await supabase
        .from('students')
        .update({ 
          remaining_classes: newRemaining,
          last_deducted_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;
      alert(`已扣除 1 课时，${studentName} 剩余 ${newRemaining} 课时。`);
      fetchStudents();
    } catch (err: any) {
      alert('消课失败：' + err.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-widest text-white mb-2 flex items-center">
          <CalendarCheck className="w-8 h-8 mr-3 text-cyan-400" />
          消课工作台
        </h2>
        <p className="text-sm text-gray-400 font-mono tracking-widest">QUICK ACTIONS DASHBOARD</p>
      </header>

      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-black/20">
          <h3 className="text-lg font-bold tracking-widest text-white">近期活跃学员 (快捷消课)</h3>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-full py-20 text-center text-cyan-400/50 font-mono tracking-widest flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                LOADING WORKBENCH...
              </div>
            ) : students.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-500 font-mono tracking-widest">
                暂无可消课学员
              </div>
            ) : (
              students.map(student => (
                <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/10 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-wider">{student.name}</h4>
                        <p className="text-xs text-gray-400 font-mono">{student.grade || '未分配年级'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">剩余课时</p>
                      <p className="text-2xl font-light text-cyan-400">{student.remaining_classes}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex space-x-3">
                    <button 
                      onClick={() => handleDeductClass(student.id, student.remaining_classes, student.name)}
                      className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 py-3 rounded-xl text-sm font-bold tracking-widest transition-all flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> 一键消课
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherWorkbench;