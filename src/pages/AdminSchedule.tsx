import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, BookOpen, 
  Sparkles, CheckSquare, Square, Plus, Clock, ArrowLeft, CheckCircle, ChevronDown
} from 'lucide-react';
import { Button, Empty, Skeleton, Modal, Form, DatePicker, TimePicker, Select } from 'antd';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '../components/Auth/AuthProvider';
import { ROLES } from '../constants/rbac';

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
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [teacherLinks, setTeacherLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Add Schedule Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchedDate, setNewSchedDate] = useState(toDateString(new Date()));
  const [newSchedStart, setNewSchedStart] = useState('10:00');
  const [newSchedEnd, setNewSchedEnd] = useState('12:00');
  const [newSchedSubject, setNewSchedSubject] = useState('');
  const [newSchedStudents, setNewSchedStudents] = useState<string[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    let studentQuery = supabase.from('students').select('*').order('created_at', { ascending: false });
    let lessonQuery = supabase.from('lessons').select('*').order('lesson_date', { ascending: true });
    let settingsQuery = supabase.from('system_settings').select('*').eq('id', 1).single();
    let teacherQuery = supabase.from('users').select('*').eq('role', 'teacher');

    if (user?.role === ROLES.TEACHER) {
      // Need to fetch links for teacher's students
      const { data: links } = await supabase.from('teacher_student_link').select('student_id').eq('teacher_id', user.id).eq('status', 'active');
      const studentIds = links ? links.map(l => l.student_id) : [];
      if (studentIds.length > 0) {
        studentQuery = studentQuery.in('id', studentIds);
      } else {
        studentQuery = studentQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
      }
      lessonQuery = lessonQuery.eq('teacher_id', user.id);
    }

    const [studentRes, lessonRes, settingsRes, teacherRes, linksRes] = await Promise.all([
      studentQuery, 
      lessonQuery, 
      settingsQuery, 
      teacherQuery,
      supabase.from('teacher_student_link').select('*').eq('status', 'active')
    ]);

    if (studentRes.data) setStudents(studentRes.data);
    if (settingsRes.data) setSystemSettings(settingsRes.data);
    if (teacherRes.data) setTeachers(teacherRes.data);
    if (linksRes.data) setTeacherLinks(linksRes.data);
    
    if (lessonRes.data) {
      setAllLessons(lessonRes.data);
      const rawLessons = lessonRes.data;
      const scheduleMap = new Map<string, any>();
      rawLessons.forEach((lesson: any) => {
        const key = `${lesson.lesson_date}_${lesson.start_time}_${lesson.end_time}_${lesson.subject}_${lesson.teacher_id}`;
        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, {
            id: key,
            date: lesson.lesson_date,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            subject: lesson.subject,
            teacher_id: lesson.teacher_id,
            status: lesson.status === 'scheduled' ? 'pending' : lesson.status,
            student_ids: [lesson.student_id],
            raw_lessons: [lesson]
          });
        } else {
          const sched = scheduleMap.get(key);
          sched.student_ids.push(lesson.student_id);
          sched.raw_lessons.push(lesson);
          if (lesson.status === 'completed') {
            sched.status = 'completed';
          }
        }
      });
      // sort by start_time
      const groupedSchedules = Array.from(scheduleMap.values()).sort((a, b) => {
        if (a.start_time < b.start_time) return -1;
        if (a.start_time > b.start_time) return 1;
        return 0;
      });
      setSchedules(groupedSchedules);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ADD SCHEDULE MODAL LOGIC ---
  const studentStats = useMemo(() => {
    return students.map(student => {
      const scheduledLessons = allLessons.filter(l => 
        l.student_id === student.id && 
        (l.status === 'scheduled' || l.status === 'pending_approval')
      );
      const pendingCount = scheduledLessons.length;
      const toSchedule = (student.remaining_lessons || 0) - pendingCount;
      return {
        ...student,
        toSchedule: toSchedule > 0 ? toSchedule : 0,
        pendingCount
      };
    });
  }, [students, allLessons]);

  const handleOpenAddModal = () => {
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(selectedDateStr, 'YYYY-MM-DD'),
      start_time: dayjs('10:00', 'HH:mm'),
      end_time: dayjs('12:00', 'HH:mm'),
      student_ids: [],
    });
    setIsAddModalOpen(true);
  };

  const handleStartChange = (time: dayjs.Dayjs | null) => {
    if (time && systemSettings?.default_duration) {
      const newEndTime = time.add(systemSettings.default_duration, 'minute');
      form.setFieldsValue({ end_time: newEndTime });
    }
  };

  const handleStudentChange = (selectedStudentIds: string[]) => {
    if (selectedStudentIds.length === 0) {
      form.setFieldsValue({ subject: undefined, teacher_id: undefined });
      return;
    }

    const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));
    
    let commonSubjects = selectedStudents[0].subjects || [];
    for (let i = 1; i < selectedStudents.length; i++) {
      const subs = selectedStudents[i].subjects || [];
      commonSubjects = commonSubjects.filter((s: string) => subs.includes(s));
    }

    const firstStudentLinks = teacherLinks.filter(l => l.student_id === selectedStudents[0].id);
    let commonTeacher = firstStudentLinks.length === 1 ? firstStudentLinks[0].teacher_id : undefined;

    for (let i = 1; i < selectedStudents.length; i++) {
      const studentLinks = teacherLinks.filter(l => l.student_id === selectedStudents[i].id);
      if (!studentLinks.some(l => l.teacher_id === commonTeacher)) {
        commonTeacher = undefined;
        break;
      }
    }

    form.setFieldsValue({
      subject: commonSubjects.length === 1 ? commonSubjects[0] : undefined,
      teacher_id: commonTeacher || undefined
    });
  };

  // Compute available subjects for the dropdown based on selected students
  const studentIds = Form.useWatch('student_ids', form) || [];
  const availableSubjects = useMemo(() => {
    if (!studentIds || studentIds.length === 0) {
      return systemSettings?.subjects_list || [];
    }
    const selectedStudents = students.filter(s => studentIds.includes(s.id));
    let commonSubjects = selectedStudents[0].subjects || [];
    for (let i = 1; i < selectedStudents.length; i++) {
      const subs = selectedStudents[i].subjects || [];
      commonSubjects = commonSubjects.filter((s: string) => subs.includes(s));
    }
    return commonSubjects;
  }, [studentIds, students, systemSettings]);

  const handleSubjectChange = (subject: string) => {
    // If a subject is selected, automatically select a teacher who teaches this subject
    if (!subject) {
      form.setFieldsValue({ teacher_id: undefined });
      return;
    }
    
    // Find teachers who teach this subject (assuming subject string is comma separated in their profile)
    const matchingTeachers = teachers.filter(t => t.subject && t.subject.includes(subject));
    
    // If we only have 1 matching teacher, auto select them
    if (matchingTeachers.length === 1) {
      form.setFieldsValue({ teacher_id: matchingTeachers[0].id });
    } else {
      // If multiple or zero, clear the selection so user has to pick
      form.setFieldsValue({ teacher_id: undefined });
    }
  };

  // Compute available teachers for the dropdown based on selected subject
  const currentSubject = Form.useWatch('subject', form);
  const availableTeachers = useMemo(() => {
    if (!currentSubject) {
      return teachers;
    }
    return teachers.filter(t => t.subject && t.subject.includes(currentSubject));
  }, [currentSubject, teachers]);

  const handleSaveSchedule = async (values: any) => {
    const { date, start_time, end_time, student_ids, subject, teacher_id } = values;

    if (!subject || !student_ids || student_ids.length === 0 || !teacher_id) {
      toast.error('请选择学员、科目和上课老师');
      return;
    }

    setIsSavingSchedule(true);
    try {
      const isTeacher = user?.role === ROLES.TEACHER;
      const status = isTeacher ? 'pending_approval' : 'scheduled';

      const insertData = student_ids.map((student_id: string) => ({
        lesson_date: date.format('YYYY-MM-DD'),
        start_time: start_time.format('HH:mm'),
        end_time: end_time.format('HH:mm'),
        subject: subject,
        student_id: student_id,
        status: status,
        teacher_id: teacher_id,
      }));

      const { error } = await supabase.from('lessons').insert(insertData);
      if (error) throw error;
      
      if (isTeacher) {
        toast.success('排课申请已提交，等待管理员审批！');
        // Notify admin
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins && admins.length > 0) {
          const adminNotifications = admins.map(admin => ({
            user_id: admin.id,
            title: '新排课审批提醒',
            content: `老师发起了一条 ${date.format('YYYY-MM-DD')} ${start_time.format('HH:mm')} 的【${subject}】排课申请，请及时审批。`,
            type: 'system'
          }));
          await supabase.from('notifications').insert(adminNotifications);
        }
      } else {
        toast.success('排课成功！');
        // Notify teacher if admin scheduled it
        const studentNames = students.filter(s => student_ids.includes(s.id)).map(s => s.name).join('、');
        await supabase.from('notifications').insert({
          user_id: teacher_id,
          title: `管理员为您安排了新课程：${date.format('YYYY-MM-DD')} ${start_time.format('HH:mm')}`,
          content: `尊敬的老师，管理员为您安排了新的排课计划：\n\n上课日期：${date.format('YYYY-MM-DD')}\n上课时间：${start_time.format('HH:mm')} - ${end_time.format('HH:mm')}\n科目：【${subject}】\n学员：${studentNames}\n\n请您留意上课时间，提前做好教学准备。`,
          type: 'system'
        });
      }
      setIsAddModalOpen(false);
      fetchData(); // Refetch to show on calendar
    } catch (err: any) {
      toast.error('保存失败: ' + err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // --- VIEW RENDERERS ---
  const days = getCalendarDays(currentMonth);
  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
  
  // Real schedules for the selected date
  const selectedDateStr = toDateString(selectedDate);
  const isMatchSelectedStudents = (s: any) => selectedStudentIds.length === 0 || selectedStudentIds.some(id => {
    // some s.student_ids might be a string containing a single UUID, or an array of UUIDs
    const idsArray = Array.isArray(s.student_ids) ? s.student_ids : [s.student_ids];
    return idsArray.includes(id);
  });
  const todaysSchedules = schedules.filter(s => s.date === selectedDateStr && isMatchSelectedStudents(s));

  const getStudentNames = (ids: string[]) => {
    return ids.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <header className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-slate-800 dark:text-white flex items-center">
            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 mr-3 text-gold-600 dark:text-gold-400" />
            课程排期规划
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-mono tracking-widest mt-2">FUTURE SCHEDULE MANAGEMENT</p>
        </div>
      </header>

      {/* Top: Student List */}
      <div className="w-full flex flex-col bg-white dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-2xl shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-widest flex items-center mr-4">
              <Users className="w-5 h-5 mr-2 text-gold-600 dark:text-gold-400" />
              选择学员排课 (可多选)
            </h3>
          </div>
          <div className="flex gap-2 items-center">
            {selectedStudentIds.length > 0 && (
              <Button size="small" onClick={() => setSelectedStudentIds([])} className="text-xs">
                重置选择
              </Button>
            )}
            <span className="text-xs font-mono bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 px-3 py-1 rounded-full">
              已选 {selectedStudentIds.length} / 共 {studentStats.length} 人
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 pb-2">
          {studentStats.map(student => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <div 
                key={student.id} 
                onClick={() => toggleStudent(student.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer min-w-[140px] select-none
                  ${isSelected 
                    ? 'bg-gold-50 dark:bg-gold-900/20 border-gold-400 dark:border-gold-500 shadow-sm' 
                    : 'bg-slate-50 dark:bg-black/20 border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5'
                  }
                `}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`font-bold truncate text-sm ${isSelected ? 'text-gold-700 dark:text-gold-300' : 'text-slate-700 dark:text-white'}`}>
                    {student.name}
                  </span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-gold-500 shrink-0" />}
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-gray-400 whitespace-nowrap ml-3">
                  待排: <strong className={`text-sm ml-1 ${student.toSchedule > 0 ? (isSelected ? 'text-gold-600 dark:text-gold-400' : 'text-slate-700 dark:text-gray-300') : 'text-gray-400 dark:text-gray-600'}`}>{student.toSchedule}</strong>
                </span>
              </div>
            );
          })}
          {studentStats.length === 0 && <Empty description="暂无学员" image={Empty.PRESENTED_IMAGE_SIMPLE} className="mx-auto" />}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 min-h-0 flex-1">
        {/* Left: Calendar Board */}
        <div className="w-full lg:w-1/2 xl:w-96 flex flex-col bg-white dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-2xl shrink-0 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-widest">教学日历</h3>
            <Button 
              type="primary"
              onClick={handleOpenAddModal}
              className="flex items-center font-bold px-5 shadow-md dark:shadow-gold-500/20"
            >
              新增排课
            </Button>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-black/30 rounded-full px-3 py-1 border border-slate-100 dark:border-white/5">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:text-gold-600 dark:hover:text-gold-400 text-slate-500 dark:text-gray-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm font-mono text-slate-800 dark:text-white font-bold w-20 text-center">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:text-gold-600 dark:hover:text-gold-400 text-slate-500 dark:text-gray-400 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 dark:text-gray-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {isLoading ? (
              Array.from({ length: 35 }).map((_, i) => (
                <div key={`sk-${i}`} className="aspect-square">
                  <Skeleton.Button active block style={{ height: '100%', borderRadius: 12 }} />
                </div>
              ))
            ) : (
              days.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="aspect-square"></div>;
                
                const dStr = toDateString(d);
                const isSelected = dStr === selectedDateStr;
                const hasClass = schedules.some(s => s.date === dStr && isMatchSelectedStudents(s));

                return (
                  <div 
                    key={d.toISOString()}
                    onClick={() => {
                      setSelectedDate(d);
                    }}
                    className={`
                      aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer relative transition-all duration-300
                      ${isSelected ? 'bg-gold-100 dark:bg-transparent border border-gold-300 dark:border-gold-500/50 shadow-[0_0_15px_rgba(212,175,55,0.1)] dark:shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    <span className={`text-sm md:text-base font-medium 
                      ${isSelected || hasClass ? 'font-bold' : ''}
                      ${hasClass && !isSelected ? 'text-[#52c41a] dark:text-green-400' : ''}
                      ${!hasClass && !isSelected ? 'text-slate-600 dark:text-gray-300' : ''}
                      ${isSelected && hasClass ? 'text-[#52c41a] dark:text-green-400' : ''}
                      ${isSelected && !hasClass ? 'text-gold-700 dark:text-gold-300' : ''}
                    `}>{d.getDate()}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Daily Schedule View */}
        <div className="w-full flex flex-col bg-white dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-100 dark:border-white/10 rounded-3xl p-5 shadow-sm dark:shadow-2xl flex-1 h-full min-w-0">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none mr-2 whitespace-nowrap">{selectedDate.getMonth() + 1}月{selectedDate.getDate()}日</span>
              <span className="text-lg font-bold text-slate-300 dark:text-gray-500 mx-2 hidden sm:inline shrink-0">|</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white tracking-widest hidden sm:inline whitespace-nowrap truncate">计划课表</span>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <Skeleton active />
            ) : todaysSchedules.length === 0 ? (
              <div className="h-full flex items-center justify-center min-h-[300px]">
                <Empty description="该日期暂无排课安排" />
              </div>
            ) : (
              todaysSchedules.map(sched => (
                <div 
                  key={sched.id}
                  className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                    sched.status === 'completed' 
                      ? 'bg-black/40 border-green-500/20 opacity-70' 
                      : 'bg-white dark:bg-gold-900/10 border-gold-500/30 shadow-sm dark:shadow-none'
                  }`}
                >
                  {sched.status === 'completed' && (
                    <div className="absolute bottom-4 right-5 text-green-500/50 flex items-center text-xs font-mono font-bold tracking-widest bg-green-500/10 px-2 py-1 rounded-md">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> 已完成
                    </div>
                  )}
                  {sched.status === 'pending' && (
                    <div className="absolute bottom-4 left-6 text-gold-600 dark:text-gold-400 flex items-center text-xs font-mono font-bold tracking-widest bg-gold-500/10 border border-gold-500/20 px-3 py-1.5 rounded-full shadow-sm">
                      <Clock className="w-3.5 h-3.5 mr-1" /> 待上课
                    </div>
                  )}
                  
                  {sched.status === 'pending_approval' && (
                    <div className="absolute bottom-4 left-6 text-orange-500/80 flex items-center text-xs font-mono font-bold tracking-widest bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full shadow-sm">
                      <Clock className="w-3.5 h-3.5 mr-1" /> 待审批
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:items-start relative pb-10">
                    <div className="flex-1 mt-2">
                      <h4 className={`text-lg font-bold tracking-widest mb-2 ${sched.status === 'completed' ? 'text-slate-500 dark:text-gray-400' : 'text-slate-800 dark:text-white'}`}>
                        {sched.subject}
                      </h4>
                      <div className="text-sm text-slate-500 dark:text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="leading-relaxed font-bold text-slate-700 dark:text-slate-300">
                          {getStudentNames(sched.student_ids || []) || '未分配学生'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 bg-gold-50 dark:bg-gold-900/10 px-4 py-3 rounded-2xl border border-gold-100 dark:border-gold-500/20 flex items-center justify-center w-full gap-3 shadow-sm mt-2">
                      <Clock className={`w-5 h-5 ${sched.status === 'completed' ? 'text-gray-500' : 'text-gold-500 dark:text-gold-400'}`} />
                      <div className="flex items-baseline gap-2">
                        <span className="text-gold-800 dark:text-gold-300 font-mono font-bold text-base">{sched.start_time}</span>
                        <span className="text-gold-500/50 font-mono text-sm">-</span>
                        <span className="text-gold-800/80 dark:text-gold-300/80 font-mono text-sm">{sched.end_time}</span>
                      </div>
                    </div>
                    {user?.role === ROLES.SUPER_ADMIN && sched.status === 'pending_approval' && (
                      <div className="mt-4 sm:mt-0 flex gap-2">
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={async () => {
                            const ids = sched.raw_lessons.map((l: any) => l.id);
                            await supabase.from('lessons').update({ status: 'scheduled' }).in('id', ids);
                            toast.success('审批通过！');
                            fetchData();
                          }}
                        >
                          通过
                        </Button>
                        <Button 
                          danger 
                          size="small"
                          onClick={async () => {
                            const ids = sched.raw_lessons.map((l: any) => l.id);
                            await supabase.from('lessons').delete().in('id', ids);
                            toast.success('已拒绝排课！');
                            fetchData();
                          }}
                        >
                          拒绝
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        title="新增排课"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSavingSchedule}
        width={600}
        okText="确认排课"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSaveSchedule} 
          requiredMark={false}
        >
          <Form.Item name="date" label="上课日期" rules={[{ required: true, message: '请选择上课日期' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="start_time" label="开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" onChange={handleStartChange} />
            </Form.Item>
            <Form.Item name="end_time" label="结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </div>

          <Form.Item name="student_ids" label="参与学员" rules={[{ required: true, message: '请选择参与学员' }]}>
            <Select
              mode="multiple"
              placeholder="请选择学员"
              options={students.map(s => ({ label: s.name, value: s.id }))}
              onChange={handleStudentChange}
              maxTagCount="responsive"
            />
          </Form.Item>

          <Form.Item name="subject" label="排课科目" rules={[{ required: true, message: '请选择科目' }]}>
            <Select
              placeholder="请选择科目"
              options={availableSubjects.map((sub: string) => ({ label: sub, value: sub }))}
              onChange={handleSubjectChange}
            />
          </Form.Item>

          <Form.Item name="teacher_id" label="上课老师" rules={[{ required: true, message: '请选择老师' }]}>
            <Select
              placeholder="请选择老师"
              options={availableTeachers.map(t => ({ label: t.name || t.phone, value: t.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminSchedule;
