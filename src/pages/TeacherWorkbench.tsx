import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, CheckSquare, Square, Clock, ArrowLeft, Laptop, Image as ImageIcon, X, QrCode, Sparkles, BookOpen, MessageSquare, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Button, Calendar, Card, Empty, Input, Modal, Skeleton, Space, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

const toDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type Schedule = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  student_ids?: string[];
  status?: 'pending' | 'completed' | string;
  report_data?: any;
};

const TeacherWorkbench: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);

  // Form State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [homework, setHomework] = useState('');
  const [teacherComment, setTeacherComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media State
  const [topicFiles, setTopicFiles] = useState<File[]>([]);
  const [homeworkFiles, setHomeworkFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [completedScheduleId, setCompletedScheduleId] = useState('');
  
  const topicInputRef = useRef<HTMLInputElement>(null);
  const homeworkInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const sessionStr = localStorage.getItem('xiaoyu_user');
    let currentUser = null;
    if (sessionStr) {
      try { currentUser = JSON.parse(sessionStr); } catch (e) {}
    }

    const dateStr = toDateString(selectedDate);

    let studentQuery = supabase.from('students').select('*');
    // Fetch ALL schedules for the selected date (both pending and completed)
    let scheduleQuery = supabase.from('schedules')
      .select('*')
      .eq('date', dateStr)
      .order('start_time', { ascending: true });

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
    setActiveSchedule(null); // Reset when date changes
  }, [selectedDate]);

  const enterDeductionMode = (sched: any) => {
    setActiveSchedule(sched);
    setSelectedStudentIds(sched.student_ids || []);
    
    // If completed, pre-fill data for editing
    if (sched.status === 'completed' && sched.report_data) {
      setTopic(sched.report_data.topic || '');
      setHomework(sched.report_data.homework || '');
      setTeacherComment(sched.report_data.teacherComment || '');
      // For editing images, we won't load existing urls into File objects (that requires fetching blobs),
      // we would normally just display them and allow appending. For this quick refactor, we just clear files.
      // In a real app, you'd manage existing image URLs vs new File uploads separately.
    } else {
      setTopic('');
      setHomework('');
      setTeacherComment('');
    }
    setTopicFiles([]);
    setHomeworkFiles([]);
  };

  const toggleDeductStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'topic' | 'homework') => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (type === 'topic') {
        setTopicFiles(prev => [...prev, ...filesArray]);
      } else {
        setHomeworkFiles(prev => [...prev, ...filesArray]);
      }
    }
  };

  const removeFile = (index: number, type: 'topic' | 'homework') => {
    if (type === 'topic') {
      setTopicFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setHomeworkFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${activeSchedule.id}/${fileName}`;

        const { error } = await supabase.storage.from('class_media').upload(filePath, file);
        if (!error) {
          const { data } = supabase.storage.from('class_media').getPublicUrl(filePath);
          if (data) urls.push(data.publicUrl);
        }
      } catch (e) {
        console.warn('skip upload image', e);
      }
    }
    return urls;
  };

  const sanitizeMediaUrls = (input: unknown) => {
    if (!Array.isArray(input)) return [];
    const output: string[] = [];
    for (const raw of input) {
      if (typeof raw !== 'string') continue;
      if (raw.startsWith('https://') || raw.startsWith('http://')) {
        output.push(raw);
        continue;
      }
      if (raw.startsWith('wxfile://')) {
        console.warn('skip wxfile temp media url', raw);
        continue;
      }
      console.warn('skip invalid media url', raw);
    }
    return output;
  };

  const handleDeductSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('请至少勾选一名学员'); return;
    }

    setIsSubmitting(true);
    setUploadingFiles(true);

    try {
      // 1. Upload media if any
      const topicImageUrls = await uploadImages(topicFiles);
      const homeworkImageUrls = await uploadImages(homeworkFiles);
      setUploadingFiles(false);

      const reportData = {
        topic,
        topicImages: [...sanitizeMediaUrls(activeSchedule.report_data?.topicImages), ...topicImageUrls],
        homework,
        homeworkImages: [...sanitizeMediaUrls(activeSchedule.report_data?.homeworkImages), ...homeworkImageUrls],
        teacherComment,
        attendedStudentIds: selectedStudentIds
      };

      // 2. Update logic: If already completed, skip balance deduction
      if (activeSchedule.status !== 'completed') {
        const updates = selectedStudentIds.map(async (id) => {
          const student = students.find(s => s.id === id);
          if (!student) return;

          const currentBalances = student.course_balances || {};
          const currentRemaining = currentBalances[activeSchedule.subject] || 0;
          const newBalances = { ...currentBalances, [activeSchedule.subject]: currentRemaining - 1 };

          const newRecord = {
            id: activeSchedule.id, // Link record directly to schedule
            date: activeSchedule.date,
            subject: activeSchedule.subject,
            topic: topic,
            topic_images: reportData.topicImages,
            homework: homework,
            homework_images: reportData.homeworkImages,
            teacher_comment: teacherComment,
            status: 'completed'
          };

          const currentRecords = student.class_records || [];

          const { error: updateError } = await supabase.from('students').update({
            course_balances: newBalances,
            class_records: [newRecord, ...currentRecords],
            last_deducted_at: new Date().toISOString()
          }).eq('id', id);
          
          if (updateError) throw updateError;
          return true;
        });

        await Promise.all(updates);
      } else {
        // If already completed, optionally update the class_records inside the student object to reflect new text
        // (Skipping for brevity, the public report uses the schedule's report_data directly)
      }
      
      // 3. Update schedule status and save rich report data for public access
      const { error: schedError } = await supabase.from('schedules').update({ 
        status: 'completed',
        report_data: reportData
      }).eq('id', activeSchedule.id);
      
      if (schedError) throw schedError;

      // Success! Show Toast & QR Code
      if (activeSchedule.status === 'pending') {
        toast.success('✅ 消课成功，课时已自动扣除！');
      } else {
        toast.success('✅ 报告补充/修改成功！');
      }

      setCompletedScheduleId(activeSchedule.id);
      setShowQRModal(true);
      
    } catch (err: any) {
      toast.error('消课失败：' + err.message);
      // Clean up UI state to allow retry if it failed
      setShowQRModal(false);
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const closeAndReset = () => {
    setShowQRModal(false);
    setActiveSchedule(null);
    setCompletedScheduleId('');
    fetchData(); // Refresh the list
  };

  const getStudentNames = (ids: string[]) => {
    return ids.map(id => students.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  const publicReportUrl = `${window.location.origin}/#/report/${completedScheduleId}`;
  const calendarValue = dayjs(selectedDate);

  const scheduleColumns = [
    {
      title: '时间',
      key: 'time',
      width: 140,
      render: (_: unknown, record: Schedule) => `${record.start_time} - ${record.end_time}`,
    },
    {
      title: '学员',
      key: 'students',
      render: (_: unknown, record: Schedule) => getStudentNames(record.student_ids || []) || '未分配',
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 140,
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      render: (_: unknown, record: Schedule) => {
        const isCompleted = record.status === 'completed';
        return <Tag color={isCompleted ? 'green' : 'gold'}>{isCompleted ? '已消课' : '待上课'}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Schedule) => {
        const isCompleted = record.status === 'completed';
        const reportUrl = `${window.location.origin}/#/report/${record.id}`;
        return (
          <Space>
            <Button type={isCompleted ? 'default' : 'primary'} onClick={() => enterDeductionMode(record)}>
              {isCompleted ? '修改反馈' : '一键消课'}
            </Button>
            {isCompleted && (
              <Button type="link" onClick={() => window.open(reportUrl, '_blank', 'noopener,noreferrer')}>
                查看报告
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-slate-800 dark:text-white flex items-center">
            <Laptop className="w-6 h-6 md:w-8 md:h-8 mr-3 text-cyan-600 dark:text-cyan-400" />
            日历驱动消课台
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 font-mono tracking-widest mt-2">CALENDAR-DRIVEN WORKBENCH</p>
        </div>
      </header>

      <Card title="教学日历" className="shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <Calendar fullscreen={false} value={calendarValue} onSelect={(v: Dayjs) => setSelectedDate(v.toDate())} />
          </div>
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center">
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-wider mb-2">{selectedDate.getDate()}</div>
            <div className="text-slate-500 dark:text-gray-400 font-mono tracking-widest uppercase">
              {selectedDate.getFullYear()} - {String(selectedDate.getMonth() + 1).padStart(2, '0')}
            </div>
            <div className="mt-6 text-sm text-slate-500 leading-relaxed">点击日历日期，即可在下方查看并操作该日期的所有待上课程。</div>
          </div>
        </div>
      </Card>

      <Card title={`${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 待消课表`} className="shadow-sm">
        
        {/* VIEW 1: Schedules for Selected Date */}
        {!activeSchedule && (
          isLoading ? (
            <Skeleton active />
          ) : (schedules as Schedule[]).length === 0 ? (
            <Empty description="该日期暂无排课记录">
              <Button type="primary" onClick={() => navigate('/dashboard/schedule')}>
                去排课
              </Button>
            </Empty>
          ) : (
            <Table
              rowKey="id"
              dataSource={(schedules as Schedule[]) || []}
              columns={scheduleColumns}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty description="该日期暂无排课记录">
                    <Button type="primary" onClick={() => navigate('/dashboard/schedule')}>
                      去排课
                    </Button>
                  </Empty>
                ),
              }}
            />
          )
        )}

        {/* VIEW 2: Rich Media Deduction Form */}
        {activeSchedule && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            
            <div className="bg-slate-50 dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-xl p-4 mb-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveSchedule(null)}
                  className="p-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="text-cyan-400 font-bold text-lg tracking-widest">{activeSchedule.subject}</div>
                  <div className="text-slate-500 dark:text-gray-400 text-sm font-mono mt-1">{activeSchedule.date} | {activeSchedule.start_time} - {activeSchedule.end_time}</div>
                </div>
              </div>
            </div>

            {/* Students Checklist */}
            <div className="mb-6 shrink-0">
              <label className="block text-xs font-mono font-bold text-slate-500 dark:text-gray-400 mb-3 uppercase tracking-[0.2em] flex items-center">
                <Users className="w-4 h-4 mr-2" /> 出勤学员确认 (默认全员)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(activeSchedule.student_ids || []).map((id: string) => {
                  const stu = students.find(s => s.id === id);
                  if (!stu) return null;
                  const isChecked = selectedStudentIds.includes(id);
                  const balance = (stu.course_balances || {})[activeSchedule.subject] || 0;
                  return (
                    <div 
                      key={id}
                      onClick={() => toggleDeductStudent(id)}
                      className={`flex flex-col p-3 rounded-xl cursor-pointer border transition-all duration-300 ${
                        isChecked 
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]' 
                          : 'bg-slate-50 dark:bg-black/20 border-red-500/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" /> : <Square className="w-4 h-4 text-red-500/50 shrink-0" />}
                        <div className={`font-bold truncate text-sm ${isChecked ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-gray-400 line-through'}`}>{stu.name}</div>
                      </div>
                      <div className="text-xs text-gray-500 pl-6">
                        {isChecked ? (
                          <>剩余 <span className={`font-mono ${balance <= 3 ? 'text-red-400' : 'text-cyan-400'}`}>{balance}</span> 课时</>
                        ) : (
                          <span className="text-red-400/80">缺勤</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rich Media Inputs */}
            <div className="space-y-6 flex-1">
              
              {/* Topic Module */}
              <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-white/5 pb-3">
                  <label className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" /> 本节课重点记录 (选填)
                  </label>
                  <button 
                    onClick={() => topicInputRef.current?.click()}
                    className="flex items-center text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" /> 上传板书/照片
                  </button>
                  <input 
                    type="file" multiple accept="image/*" className="hidden" ref={topicInputRef}
                    onChange={(e) => handleFileChange(e, 'topic')}
                  />
                </div>
                
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="请输入课程知识点、重点拆解..."
                  className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none h-24 mb-3"
                />

                {topicFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {topicFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                        <button onClick={() => removeFile(idx, 'topic')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Homework Module */}
              <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-white/5 pb-3">
                  <label className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" /> 课后作业布置 (选填)
                  </label>
                  <button 
                    onClick={() => homeworkInputRef.current?.click()}
                    className="flex items-center text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" /> 上传作业照片
                  </button>
                  <input 
                    type="file" multiple accept="image/*" className="hidden" ref={homeworkInputRef}
                    onChange={(e) => handleFileChange(e, 'homework')}
                  />
                </div>
                
                <textarea 
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  placeholder="请输入作业内容，或直接上传习题照片..."
                  className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none h-20 mb-3"
                />

                {homeworkFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {homeworkFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                        <button onClick={() => removeFile(idx, 'homework')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teacher Comments Module */}
              <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-white/5 pb-3">
                  <label className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-green-400" /> 🧑‍🏫 老师专属评语 (选填)
                  </label>
                </div>
                
                <textarea 
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="例如：子涵今天逻辑非常清晰，继续保持..."
                  className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white text-sm focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all resize-none h-20"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 shrink-0">
              <button 
                onClick={handleDeductSubmit}
                disabled={isSubmitting || uploadingFiles || selectedStudentIds.length === 0}
                className={`w-full text-white font-bold py-4 rounded-xl tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-lg ${
                  activeSchedule.status === 'completed'
                    ? 'bg-slate-700 hover:bg-slate-600 shadow-none'
                    : 'bg-slate-800 hover:bg-slate-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-500 dark:hover:to-purple-500 shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                }`}
              >
                {uploadingFiles ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></span> 上传媒体中...</>
                ) : isSubmitting ? (
                  '处理中...'
                ) : activeSchedule.status === 'completed' ? (
                  <><MessageSquare className="w-6 h-6 mr-2" /> 更新图文报告 (不扣课时)</>
                ) : (
                  <><QrCode className="w-6 h-6 mr-2" /> 确认消课并生成专属图文报告</>
                )}
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={showQRModal}
        centered
        footer={null}
        width={420}
        onCancel={closeAndReset}
        destroyOnClose
      >
        <div className="flex flex-col items-center text-center">
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            消课成功
          </Typography.Title>
          <Typography.Text type="secondary">专属图文报告已生成</Typography.Text>

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <QRCodeSVG 
              value={publicReportUrl} 
              size={200}
              bgColor={"#f8fafc"}
              fgColor={"#0f172a"}
              level={"Q"}
              includeMargin={false}
            />
          </div>

          <Typography.Paragraph style={{ marginTop: 16, marginBottom: 12 }}>
            请将二维码出示给家长扫码，或复制链接发送至微信群
          </Typography.Paragraph>

          <Space.Compact style={{ width: '100%' }}>
            <Input readOnly value={publicReportUrl} />
            <Button
              type="primary"
              onClick={() => {
                navigator.clipboard.writeText(publicReportUrl);
                toast.success('链接已复制！');
              }}
            >
              复制
            </Button>
          </Space.Compact>

          <div className="mt-4 w-full">
            <Button block onClick={closeAndReset}>
              返回工作台
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherWorkbench;
