import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Avatar, Button, Card, Empty, Form, Input, Modal, Select, Skeleton, Space, Table, Transfer, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TransferItem } from 'antd/es/transfer';
import { Plus, Edit2, Trash2, Search, Settings, Users } from 'lucide-react';

type Teacher = {
  id: string;
  name: string;
  phone?: string;
  username?: string;
  password?: string;
  subject?: string;
};

type Student = {
  id: string;
  name: string;
  subjects?: string[];
};

type TeacherStudentLink = {
  id: string;
  teacher_id: string;
  student_id: string;
  status: string;
};

export default function TeachersManagement() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [links, setLinks] = useState<TeacherStudentLink[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<{ label: string; value: string }[]>([]);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignTeacherId, setAssignTeacherId] = useState<string | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchSubject, setSearchSubject] = useState<string | undefined>(undefined);

  const [appliedSearchName, setAppliedSearchName] = useState('');
  const [appliedSearchPhone, setAppliedSearchPhone] = useState('');
  const [appliedSearchSubject, setAppliedSearchSubject] = useState<string | undefined>(undefined);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchName = !appliedSearchName || (t.name && t.name.toLowerCase().includes(appliedSearchName.toLowerCase()));
      const matchPhone = !appliedSearchPhone || 
        (t.phone && t.phone.toLowerCase().includes(appliedSearchPhone.toLowerCase())) ||
        (t.username && t.username.toLowerCase().includes(appliedSearchPhone.toLowerCase()));
      const matchSubject = !appliedSearchSubject || (t.subject && t.subject.includes(appliedSearchSubject));
      return matchName && matchPhone && matchSubject;
    });
  }, [teachers, appliedSearchName, appliedSearchPhone, appliedSearchSubject]);

  useEffect(() => {
    const sessionStr = localStorage.getItem('xiaoyu_user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [teacherRes, studentRes, settingsRes, linksRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('system_settings').select('subjects_list').single(),
        supabase.from('teacher_student_link').select('*').eq('status', 'active'),
      ]);

      setTeachers((teacherRes.data as Teacher[]) || []);
      setStudents((studentRes.data as Student[]) || []);
      setLinks((linksRes.data as TeacherStudentLink[]) || []);

      if (settingsRes.data && Array.isArray(settingsRes.data.subjects_list)) {
        const options = settingsRes.data.subjects_list.map((sub: string) => ({
          label: sub,
          value: sub,
        }));
        setSubjectOptions(options);
      } else {
        setSubjectOptions([]);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      message.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const studentCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    links.forEach((l) => {
      if (l.teacher_id) map[l.teacher_id] = (map[l.teacher_id] || 0) + 1;
    });
    return map;
  }, [links]);

  const columns: ColumnsType<Teacher> = [
    {
      title: '姓名',
      key: 'profile',
      render: (_: unknown, record: Teacher) => (
        <Typography.Text strong>{record.name}</Typography.Text>
      ),
    },
    {
      title: '主授科目',
      key: 'subject',
      render: (_: unknown, record: Teacher) => (
        record.subject && record.subject.trim() !== '' ? (
          <Typography.Text type="secondary">
            {record.subject}
          </Typography.Text>
        ) : <Typography.Text type="secondary" style={{ opacity: 0.5 }}>暂无</Typography.Text>
      ),
    },
    { 
      title: '登录账号(手机号/用户名)', 
      dataIndex: 'phone', 
      key: 'phone', 
      width: 220,
      render: (_: any, record: Teacher) => (
        <span>
          {record.phone || '-'} 
          {record.username ? ` / ${record.username}` : ''}
        </span>
      )
    },
    {
      title: '名下学员数量',
      key: 'studentsCount',
      width: 140,
      render: (_: unknown, record: Teacher) => studentCountMap[record.id] || 0,
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_: unknown, record: Teacher) => (
        <Space size={4} wrap>
          <Button type="link" onClick={() => openAssign(record.id)}>
            分配
          </Button>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => confirmDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const openCreate = () => {
    setEditingTeacher(null);
    form.resetFields();
    form.setFieldsValue({ subject: [] });
    setIsTeacherModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingTeacher(t);
    form.setFieldsValue({ 
      name: t.name, 
      phone: t.phone, 
      username: t.username,
      password: t.password || '',
      subject: t.subject ? t.subject.split(',').map((s) => s.trim()).filter(Boolean) : [] 
    });
    setIsTeacherModalOpen(true);
  };

  const saveTeacher = async (values: { name: string; phone: string; username: string; password?: string; subject?: string[] }) => {
    setIsSubmitting(true);
    try {
      const subjectStr = values.subject && values.subject.length > 0 ? values.subject.join(', ') : null;
      if (editingTeacher) {
        const updateData: any = { 
          name: values.name, 
          phone: values.phone || null, 
          username: values.username || null,
          subject: subjectStr 
        };
        if (values.password) {
          updateData.password = values.password;
        }
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingTeacher.id);
        if (error) throw error;
        message.success('教师信息已更新');
      } else {
        if (!values.password) {
          throw new Error('请输入初始密码');
        }
        const { error } = await supabase.from('users').insert({
          name: values.name,
          phone: values.phone || null,
          username: values.username || null,
          password: values.password,
          subject: subjectStr,
          role: 'teacher',
        });
        if (error) throw error;
        message.success('教师已创建');
      }

      setIsTeacherModalOpen(false);
      fetchData();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (t: Teacher) => {
    Modal.confirm({
      title: '确认删除教师？',
      content: '删除后将解除其名下学员的归属关系',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const assignedStudentsLinks = links.filter((l) => l.teacher_id === t.id);
        if (assignedStudentsLinks.length > 0) {
          const linkIds = assignedStudentsLinks.map((l) => l.id);
          const { error: releaseError } = await supabase.from('teacher_student_link').update({ status: 'inactive' }).in('id', linkIds);
          if (releaseError) {
            message.error('释放名下学员失败');
            return;
          }
        }

        const { error } = await supabase.from('users').delete().eq('id', t.id);
        if (error) {
          message.error('删除失败');
          return;
        }
        message.success('已删除');
        fetchData();
      },
    });
  };

  const [assignSubject, setAssignSubject] = useState<string | undefined>(undefined);

  const openAssign = (teacherId: string) => {
    setAssignTeacherId(teacherId);
    setAssignSubject(undefined);
    setIsAssignOpen(true);
    const assigned = links.filter((l) => l.teacher_id === teacherId).map((l) => l.student_id);
    setTargetKeys(assigned);
  };

  const currentTeacher = useMemo(() => teachers.find(t => t.id === assignTeacherId), [teachers, assignTeacherId]);
  const teacherSubjects = useMemo(() => currentTeacher?.subject ? currentTeacher.subject.split(',').map(s => s.trim()) : [], [currentTeacher]);

  const transferData: TransferItem[] = useMemo(() => {
    if (!assignTeacherId) return [];
    
    return students
      .filter(s => {
        // If the student is already assigned to THIS teacher, always show them (so they can be unassigned)
        const isAssignedToCurrentTeacher = links.some(l => l.teacher_id === assignTeacherId && l.student_id === s.id);
        if (isAssignedToCurrentTeacher) return true;
        
        // If the student is already assigned to ANOTHER teacher for this subject, DO NOT show them
        // Assuming a student can only have one teacher per subject
        const isAssignedToOtherTeacher = links.some(l => l.student_id === s.id && l.teacher_id !== assignTeacherId && l.status === 'active');
        // Actually, the teacher_student_link table does not explicitly tie a link to a subject,
        // it just ties a student to a teacher. If the business logic is "one student can only have one teacher per subject",
        // we need to check if the student is already assigned to another teacher who teaches the `assignSubject`.
        // For a stricter global rule: if a student is already assigned to any teacher for `assignSubject`, hide them.
        
        // Let's find all active links for this student to other teachers
        const otherTeacherLinks = links.filter(l => l.student_id === s.id && l.teacher_id !== assignTeacherId && l.status === 'active');
        let assignedToOtherForThisSubject = false;
        
        if (assignSubject && otherTeacherLinks.length > 0) {
          for (const link of otherTeacherLinks) {
            const otherTeacher = teachers.find(t => t.id === link.teacher_id);
            if (otherTeacher && otherTeacher.subject) {
              const otherTeacherSubjects = otherTeacher.subject.split(',').map(sub => sub.trim());
              if (otherTeacherSubjects.includes(assignSubject)) {
                assignedToOtherForThisSubject = true;
                break;
              }
            }
          }
        }

        if (assignedToOtherForThisSubject) return false;

        // Otherwise, only show students who have enrolled in the selected subject
        // If no subject is selected yet, don't show any unassigned students to force selection first
        if (!assignSubject) return false;

        const studentSubjects = s.subjects || [];
        return studentSubjects.includes(assignSubject);
      })
      .map((s) => ({ 
        key: s.id, 
        title: s.name, 
        description: s.name 
      }));
  }, [students, assignTeacherId, links, assignSubject, teachers]);

  const saveAssign = async () => {
    if (!assignTeacherId) return;

    const currentAssigned = new Set(links.filter((l) => l.teacher_id === assignTeacherId).map((l) => l.student_id));
    const nextAssigned = new Set(targetKeys);
    const toAdd: string[] = [];
    const toRemove: string[] = [];

    targetKeys.forEach((id) => {
      if (!currentAssigned.has(id)) toAdd.push(id);
    });
    currentAssigned.forEach((id) => {
      if (!nextAssigned.has(id)) toRemove.push(id);
    });

    setIsSubmitting(true);
    try {
      if (toAdd.length) {
        const insertData = toAdd.map(studentId => ({
          teacher_id: assignTeacherId,
          student_id: studentId,
          status: 'active'
        }));
        const { error } = await supabase.from('teacher_student_link').insert(insertData);
        if (error) throw error;

        // Create notification for the teacher
        const addedStudentNames = students.filter(s => toAdd.includes(s.id)).map(s => s.name).join('、');
        await supabase.from('notifications').insert({
          user_id: assignTeacherId,
          title: '学员分配通知',
          content: `系统管理员已为您分配了新的学员：${addedStudentNames}，请注意查看。`,
          type: 'system'
        });
      }
      if (toRemove.length) {
        const linksToRemove = links.filter(l => l.teacher_id === assignTeacherId && toRemove.includes(l.student_id)).map(l => l.id);
        if (linksToRemove.length > 0) {
          const { error } = await supabase.from('teacher_student_link').update({ status: 'inactive' }).in('id', linksToRemove);
          if (error) throw error;
        }
      }
      message.success('分配已保存');
      setIsAssignOpen(false);
      fetchData();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            师资管理
          </Typography.Title>
          <Typography.Text type="secondary">教师档案与名下学员归属管理</Typography.Text>
        </div>
        <Space size="middle">
          <Space>
            <Input
              placeholder="搜索姓名"
              allowClear
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onPressEnter={() => {
                setAppliedSearchName(searchName);
                setAppliedSearchPhone(searchPhone);
                setAppliedSearchSubject(searchSubject);
              }}
              style={{ width: 140 }}
            />
            <Input
              placeholder="搜索手机号"
              allowClear
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              onPressEnter={() => {
                setAppliedSearchName(searchName);
                setAppliedSearchPhone(searchPhone);
                setAppliedSearchSubject(searchSubject);
              }}
              style={{ width: 160 }}
            />
            <Select
              placeholder="筛选科目"
              allowClear
              value={searchSubject}
              onChange={value => setSearchSubject(value)}
              options={subjectOptions}
              style={{ width: 140 }}
            />
            <Button type="default" onClick={() => {
              setAppliedSearchName(searchName);
              setAppliedSearchPhone(searchPhone);
              setAppliedSearchSubject(searchSubject);
            }}>
              搜索
            </Button>
          </Space>
          <Button type="primary" onClick={openCreate}>
            新增教师
          </Button>
        </Space>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton active />
        ) : filteredTeachers.length === 0 ? (
          <Empty
            description={(searchName || searchPhone || searchSubject) ? "未找到匹配的教师" : "暂无师资数据，点击新增第一位教师"}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!(searchName || searchPhone || searchSubject) && (
              <Button type="primary" onClick={openCreate}>
                新增教师
              </Button>
            )}
          </Empty>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredTeachers}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无匹配数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title={editingTeacher ? '编辑教师' : '新增教师'}
        open={isTeacherModalOpen}
        onCancel={() => setIsTeacherModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical" onFinish={saveTeacher} requiredMark={false}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="例如：张老师" />
          </Form.Item>
          <Form.Item 
            name="phone" 
            label="手机号 (用于登录)" 
            dependencies={['username']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value && !getFieldValue('username')) {
                    return Promise.reject(new Error('手机号和用户名至少填写一项'));
                  }
                  if (value && !/^1[3-9]\d{9}$/.test(value)) {
                    return Promise.reject(new Error('请输入正确的 11 位手机号'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="手机号或用户名二选一" />
          </Form.Item>
          <Form.Item 
            name="username" 
            label="用户名 (用于登录)" 
            dependencies={['phone']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value && !getFieldValue('phone')) {
                    return Promise.reject(new Error('手机号和用户名至少填写一项'));
                  }
                  if (value && !/^[a-zA-Z0-9_]{4,20}$/.test(value)) {
                    return Promise.reject(new Error('用户名只能包含字母、数字或下划线，且长度为4-20位'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="手机号或用户名二选一" />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="初始密码" 
            rules={[{ required: !editingTeacher, message: '请输入初始密码' }]}
          >
            <Input.Password placeholder={editingTeacher ? "留空则不修改密码" : "请输入初始登录密码"} />
          </Form.Item>
          <Form.Item name="subject" label="主授科目">
            <Select
              mode="multiple"
              placeholder="请选择主授科目"
              options={subjectOptions}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              notFoundContent="暂无科目，请先前往科目配置中添加"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">分配学员</span>
            {assignTeacherId && (
              <Select
                placeholder="请先选择要分配的科目"
                value={assignSubject}
                onChange={setAssignSubject}
                style={{ width: 200 }}
                options={teacherSubjects.map(sub => ({ label: sub, value: sub }))}
                notFoundContent="该老师暂未设置主授科目"
              />
            )}
          </div>
        }
        open={isAssignOpen}
        onOk={saveAssign}
        onCancel={() => setIsAssignOpen(false)}
        confirmLoading={isSubmitting}
        okText="保存分配"
        cancelText="取消"
        width={720}
      >
        {!assignSubject ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-gray-400">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>请在上方先选择需要分配的具体科目</p>
            <p className="text-xs mt-2 opacity-60">选择科目后，系统将自动过滤出报读该科目的学员</p>
          </div>
        ) : (
          <Transfer
            dataSource={transferData}
            targetKeys={targetKeys}
            onChange={(keys) => setTargetKeys(keys as string[])}
            render={(item) => item.title}
            listStyle={{ width: 310, height: 420 }}
            titles={[`报读【${assignSubject}】的学员`, '已分配']}
            showSearch
          />
        )}
      </Modal>
    </div>
  );
}
