import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Database, Settings, Plus, UserPlus, CreditCard, Search, ArrowRight,
  UserCheck, Banknote, ShieldCheck, Edit, Trash2, AlertTriangle, Save, X, BookOpen
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { EmptyState } from '../components/UI/EmptyState';
import { Skeleton } from '../components/UI/Skeleton';

type Tab = 'teachers' | 'settings';

const SystemManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('teachers');
  const [isLoading, setIsLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // ----------------------------------------
  // Teachers Management State
  // ----------------------------------------
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherMode, setIsEditTeacherMode] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  
  const [isAssignStudentOpen, setIsAssignStudentOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  const [isDeleteTeacherOpen, setIsDeleteTeacherOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any | null>(null);

  // ----------------------------------------
  // Settings Management State
  // ----------------------------------------
  const [settings, setSettings] = useState({
    studio_name: '熊熊',
    report_footer: 'POWERED BY 熊熊',
    subjects_list: ['数学', '物理', '化学', '英语', '语文'],
    default_duration: 120
  });
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Auth & Fetch
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setIsLoading(true);
      const sessionStr = localStorage.getItem('xiaoyu_user');
      let currentUser = null;
      if (sessionStr) {
        try { currentUser = JSON.parse(sessionStr); } catch (e) {}
      }

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sysadmin')) {
        toast.error('权限不足：仅限管理员访问系统设置');
        navigate('/dashboard');
        return;
      }

      await fetchData();
      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    const nextTab: Tab = tab === 'settings' ? 'settings' : 'teachers';
    setActiveTab(nextTab);
  }, [location.search]);

  const setTab = (tab: Tab) => {
    setActiveTab(tab);
    const search = tab === 'teachers' ? '' : `?tab=${tab}`;
    navigate({ pathname: '/dashboard/system', search }, { replace: true });
  };

  const fetchData = async () => {
    const [stuRes, teacherRes, settingsRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
      supabase.from('system_settings').select('*').eq('id', 1).single()
    ]);

    if (stuRes.data) setStudents(stuRes.data);
    if (teacherRes.data) setTeachers(teacherRes.data);
    if (settingsRes.data) {
      setSettings({
        studio_name: settingsRes.data.studio_name || '熊熊',
        report_footer: settingsRes.data.report_footer || 'POWERED BY 熊熊',
        subjects_list: settingsRes.data.subjects_list || ['数学', '物理', '化学', '英语', '语文'],
        default_duration: settingsRes.data.default_duration || 120
      });
    }
  };

  // --- Teacher Actions ---
  const handleAddTeacherClick = () => {
    setIsEditTeacherMode(false);
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherSubject('');
    setIsAddTeacherOpen(true);
  };

  const handleEditTeacherClick = (teacher: any) => {
    setIsEditTeacherMode(true);
    setEditingTeacherId(teacher.id);
    setNewTeacherName(teacher.full_name || '');
    setNewTeacherPhone(teacher.phone || '');
    setNewTeacherSubject(teacher.subject || '');
    setIsAddTeacherOpen(true);
  };

  const handleDeleteTeacherClick = (teacher: any) => {
    setTeacherToDelete(teacher);
    setIsDeleteTeacherOpen(true);
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      // 1. Unbind students
      const { error: stuError } = await supabase.from('students')
        .update({ teacher_id: null })
        .eq('teacher_id', teacherToDelete.id);
      if (stuError) throw stuError;

      // 2. Delete teacher
      const { error } = await supabase.from('profiles')
        .delete()
        .eq('id', teacherToDelete.id);
      if (error) throw error;

      toast.success('✅ 教师已删除，关联学员已释放');
      setIsDeleteTeacherOpen(false);
      setTeacherToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('删除失败: ' + err.message);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherPhone || !newTeacherSubject) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      if (isEditTeacherMode && editingTeacherId) {
        const { error } = await supabase.from('profiles').update({
          phone: newTeacherPhone,
          full_name: newTeacherName,
          subject: newTeacherSubject
        }).eq('id', editingTeacherId);

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用');
          throw error;
        }
        toast.success('教师信息修改成功！');
      } else {
        const { error } = await supabase.from('profiles').insert({
          phone: newTeacherPhone,
          password: newTeacherPhone.slice(-6),
          role: 'teacher',
          full_name: newTeacherName,
          subject: newTeacherSubject
        });

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用');
          throw error;
        }
        toast.success('教师账号创建成功！');
      }
      
      setIsAddTeacherOpen(false);
      setNewTeacherName('');
      setNewTeacherPhone('');
      setNewTeacherSubject('');
      fetchData();
    } catch (err: any) {
      toast.error(`${isEditTeacherMode ? '修改' : '创建'}教师失败：` + err.message);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedTeacherId) return;
    try {
      const { error } = await supabase.from('students')
        .update({ teacher_id: selectedTeacherId })
        .eq('id', studentId);
      
      if (error) throw error;
      fetchData(); // Refresh list to reflect changes
      toast.success('分配成功');
    } catch (err: any) {
      toast.error('分配失败：' + err.message);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from('students')
        .update({ teacher_id: null })
        .eq('id', studentId);
      
      if (error) throw error;
      fetchData();
      toast.success('移除成功');
    } catch (err: any) {
      toast.error('移除失败：' + err.message);
    }
  };

  const handleAddSubject = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubjectInput.trim() !== '') {
      e.preventDefault();
      const sub = newSubjectInput.trim();
      if (!settings.subjects_list.includes(sub)) {
        setSettings({ ...settings, subjects_list: [...settings.subjects_list, sub] });
      }
      setNewSubjectInput('');
    }
  };

  const handleRemoveSubject = (subToRemove: string) => {
    setSettings({
      ...settings,
      subjects_list: settings.subjects_list.filter(s => s !== subToRemove)
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          studio_name: settings.studio_name,
          report_footer: settings.report_footer,
          subjects_list: settings.subjects_list,
          default_duration: settings.default_duration
        })
        .eq('id', 1);

      if (error) throw error;
      toast.success('全局设置保存成功');
      fetchData(); // Sync across app
    } catch (err: any) {
      toast.error('设置保存失败：' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gold-400 font-mono animate-pulse">SYSTEM INITIALIZING...</div>;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header */}
      <header className="mb-8 shrink-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-slate-800 dark:text-white flex items-center">
          <Database className="w-6 h-6 md:w-8 md:h-8 mr-3 text-gold-600 dark:text-gold-400" />
          系统管理
        </h2>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-white/10 shrink-0 overflow-x-auto flex-nowrap no-scrollbar">
        <button 
          onClick={() => setTab('teachers')}
          className={`flex items-center px-6 py-3 font-bold tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'teachers' ? 'border-gold-400 text-gold-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4 mr-2" /> 师资管理
        </button>
        <button 
          onClick={() => setTab('settings')}
          className={`flex items-center px-6 py-3 font-bold tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'settings' ? 'border-purple-400 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Settings className="w-4 h-4 mr-2" /> 基础设置
        </button>
      </div>

      {/* Content Area */}
      <div className="min-w-0">
        
        {/* ==================== TEACHERS TAB ==================== */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
      
              <button 
                onClick={handleAddTeacherClick}
                className="bg-gold-100 dark:bg-gold-500/10 hover:bg-gold-200 dark:hover:bg-gold-500/20 border border-gold-300 dark:border-gold-500/30 text-gold-700 dark:text-gold-400 font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-5 h-5 mr-2" /> 新增教师
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : teachers.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="暂无师资数据"
                description="目前系统内还没有添加任何教师，请点击上方『新增教师』按钮来创建第一位老师档案。"
                className="my-8"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {teachers.map(teacher => {
                  const assignedStudents = students.filter(s => s.teacher_id === teacher.id);
                  return (
                    <div key={teacher.id} className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all relative group shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-100 dark:from-gold-500/20 to-blue-200 dark:to-blue-600/20 border border-gold-300 dark:border-gold-500/30 flex items-center justify-center">
                          <span className="text-xl font-bold text-gold-700 dark:text-gold-300">{teacher.full_name?.charAt(0) || 'T'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest">{teacher.full_name}</h4>
                            {teacher.subject && (
                              <span className="bg-gold-100 dark:bg-gold-500/20 text-gold-700 dark:text-gold-300 border border-gold-300 dark:border-gold-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                {teacher.subject}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-mono text-slate-500 dark:text-gray-400 mt-0.5">{teacher.phone}</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-black/30 rounded-2xl p-4 mb-5">
                        <div className="text-xs font-mono text-slate-500 dark:text-gray-500 uppercase mb-2 flex items-center justify-between">
                          <span>名下学员 ({assignedStudents.length})</span>
                        </div>
                        {assignedStudents.length === 0 ? (
                          <div className="text-sm text-slate-400 dark:text-gray-500 italic py-2">暂无分配学员</div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedStudents.map(s => (
                              <span key={s.id} className="bg-gold-50 dark:bg-gold-900/30 border border-gold-200 dark:border-gold-500/20 text-gold-700 dark:text-gold-300 text-xs px-2.5 py-1 rounded-lg">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => {
                            setSelectedTeacherId(teacher.id);
                            setIsAssignStudentOpen(true);
                          }}
                          className="flex-1 bg-slate-50 dark:bg-white/5 hover:bg-gold-50 dark:hover:bg-gold-500/20 border border-slate-100 dark:border-white/5 hover:border-gold-300 dark:hover:border-gold-500/50 text-slate-600 dark:text-gray-300 hover:text-gold-700 dark:hover:text-gold-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm shadow-sm dark:shadow-none"
                        >
                          <UserCheck className="w-4 h-4 mr-2" /> 分配
                        </button>
                        <button 
                          onClick={() => handleEditTeacherClick(teacher)}
                          className="flex-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 hover:border-slate-400 dark:hover:border-gray-500 text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm shadow-sm dark:shadow-none"
                        >
                          <Edit className="w-4 h-4 mr-2" /> 编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteTeacherClick(teacher)}
                          className="flex-1 bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-100 dark:border-white/5 hover:border-red-300 dark:hover:border-red-500/50 text-red-500 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm shadow-sm dark:shadow-none"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> 删除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl pb-10">
            
            {/* Block 1: Brand Settings */}
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-widest flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-purple-400" />
                品牌设置 (Brand Settings)
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">机构名称 (Studio Name)</label>
                  <input 
                    type="text" 
                    value={settings.studio_name}
                    onChange={(e) => setSettings({...settings, studio_name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-purple-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">专属报告寄语 (Report Footer)</label>
                  <input 
                    type="text" 
                    value={settings.report_footer}
                    onChange={(e) => setSettings({...settings, report_footer: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-purple-500 transition-colors" 
                  />
                  <p className="text-xs text-gray-500 mt-2">此内容将展示在家长端扫码报告的底部，彰显品牌温度。</p>
                </div>
              </div>
            </div>

            {/* Block 2: Course Dictionary */}
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-widest flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-gold-400" />
                教务字典库 (Course Dictionary)
              </h3>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">授课科目库 (Subjects List)</label>
                <div className="bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 min-h-[60px] flex flex-wrap gap-2 items-center focus-within:border-gold-500 transition-colors">
                  {settings.subjects_list.map((sub) => (
                    <span key={sub} className="bg-gold-500/20 text-gold-300 border border-gold-500/30 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                      {sub}
                      <button onClick={() => handleRemoveSubject(sub)} className="text-gold-500 hover:text-gold-300">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={handleAddSubject}
                    placeholder="输入科目并按回车添加..."
                    className="bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm flex-1 min-w-[150px] placeholder:text-gray-600"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">修改后，系统内所有『新增排课』、『新增学员』的科目下拉框将自动同步。</p>
              </div>
            </div>

            {/* Block 3: Scheduling Rules */}
            <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-widest flex items-center">
                <Settings className="w-5 h-5 mr-2 text-amber-400" />
                排课规则 (Scheduling Rules)
              </h3>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">默认单节课时长 (分钟)</label>
                <input 
                  type="number" 
                  min="1"
                  value={settings.default_duration}
                  onChange={(e) => setSettings({...settings, default_duration: parseInt(e.target.value) || 120})}
                  className="w-full md:w-1/2 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-amber-500 transition-colors" 
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 text-right">
              <button 
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-gradient-to-r from-purple-600 to-gold-600 hover:from-purple-500 hover:to-gold-500 text-white font-bold py-4 px-8 rounded-xl tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all disabled:opacity-50 flex items-center justify-center ml-auto"
              >
                {isSavingSettings ? (
                  <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> 保存中...</span>
                ) : (
                  <span className="flex items-center"><Save className="w-5 h-5 mr-2" /> 💾 保存全局设置</span>
                )}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest mb-6">{isEditTeacherMode ? '修改教师信息' : '新增在职教师'}</h3>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">教师姓名</label>
                <input required type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-gold-500" placeholder="例如：杨老师" />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">手机号码 (作为登录账号)</label>
                <input required type="text" value={newTeacherPhone} onChange={e => setNewTeacherPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-gold-500" placeholder="输入11位手机号" />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">授课科目</label>
                <select required value={newTeacherSubject} onChange={e => setNewTeacherSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:border-gold-500">
                  <option value="" disabled>请选择授课科目</option>
                  {settings.subjects_list.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5 mt-4">
                初始登录密码将自动设置为手机号后 6 位。
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddTeacherOpen(false)} className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">取消</button>
                <button type="submit" className="flex-1 bg-gold-500 hover:bg-gold-400 text-black py-3 rounded-xl font-bold tracking-widest transition-colors">{isEditTeacherMode ? '保存修改' : '确认创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal (Transfer list approach) */}
      {isAssignStudentOpen && selectedTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col h-[80vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest">分配学员</h3>
                <p className="text-sm text-gold-400 mt-1">正在为 {teachers.find(t => t.id === selectedTeacherId)?.full_name} 分配学员</p>
              </div>
              <button onClick={() => setIsAssignStudentOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left: All Unassigned or other students */}
              <div className="flex-1 border-r border-white/5 flex flex-col bg-slate-50 dark:bg-black/20">
                <div className="p-4 border-b border-white/5 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" placeholder="搜索全校学员..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                      className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:border-gold-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {students
                    .filter(s => {
                      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                      const isNotAssigned = s.teacher_id !== selectedTeacherId;
                      const matchesSearch = s.name.includes(assignSearch);
                      // Smart filter: check if student has the teacher's subject in their subject list or course balances
                      const hasSubject = selectedTeacher?.subject 
                        ? (s.subjects?.includes(selectedTeacher.subject) || (s.course_balances && s.course_balances[selectedTeacher.subject] > 0))
                        : true;
                      
                      return isNotAssigned && matchesSearch && hasSubject;
                    })
                    .map(stu => (
                      <div key={stu.id} className="flex items-center justify-between bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-xl hover:border-gold-500/30 transition-colors">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{stu.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{stu.grade || '未知年级'}</span>
                        </div>
                        <button onClick={() => handleAssignStudent(stu.id)} className="bg-gold-500/10 text-gold-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gold-500/20">
                          分配 +
                        </button>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Right: Assigned Students */}
              <div className="flex-1 flex flex-col bg-gold-950/10">
                <div className="p-4 border-b border-gold-500/20 shrink-0">
                  <h4 className="text-sm font-bold tracking-widest text-gold-400">已分配到名下</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {students.filter(s => s.teacher_id === selectedTeacherId).length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">暂未分配</div>
                  ) : (
                    students.filter(s => s.teacher_id === selectedTeacherId).map(stu => (
                      <div key={stu.id} className="flex items-center justify-between bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-500/30 p-3 rounded-xl">
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{stu.name}</span>
                        <button onClick={() => handleRemoveStudent(stu.id)} className="text-red-400 px-3 py-1 rounded-lg text-xs hover:bg-red-500/10 transition-colors">
                          移除 -
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-black/40 shrink-0 text-right">
              <button onClick={() => setIsAssignStudentOpen(false)} className="bg-gold-500 text-black px-8 py-2.5 rounded-xl font-bold tracking-widest">完成</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirm Modal */}
      {isDeleteTeacherOpen && teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(239,68,68,0.2)] p-6 relative">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2 tracking-widest">确认删除教师？</h3>
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              即将删除教师 <span className="text-white font-bold">{teacherToDelete.full_name}</span>。<br/>
              名下关联的所有学员将被自动释放，该操作不可逆！
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsDeleteTeacherOpen(false)} 
                className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDeleteTeacher} 
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 py-3 rounded-xl font-bold tracking-widest transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemManagement;
