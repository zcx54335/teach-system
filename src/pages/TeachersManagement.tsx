import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Avatar, Button, Card, Empty, Form, Input, Modal, Select, Skeleton, Space, Table, Transfer, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TransferItem } from 'antd/es/transfer';

type Teacher = {
  id: string;
  full_name: string;
  phone: string;
  subject?: string;
};

type Student = {
  id: string;
  name: string;
  teacher_id?: string | null;
};



export default function TeachersManagement() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<{ label: string; value: string }[]>([]);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignTeacherId, setAssignTeacherId] = useState<string | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

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
      const [teacherRes, studentRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('system_settings').select('subjects_list').single(),
      ]);

      setTeachers((teacherRes.data as Teacher[]) || []);
      setStudents((studentRes.data as Student[]) || []);

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
    students.forEach((s) => {
      if (s.teacher_id) map[s.teacher_id] = (map[s.teacher_id] || 0) + 1;
    });
    return map;
  }, [students]);

  const columns: ColumnsType<Teacher> = [
    {
      title: '头像与姓名',
      key: 'profile',
      render: (_: unknown, record: Teacher) => (
        <Space>
          <Avatar style={{ background: '#1677ff' }}>{record.full_name?.charAt(0) || 'T'}</Avatar>
          <div className="flex flex-col leading-4">
            <Typography.Text strong>{record.full_name}</Typography.Text>
            {record.subject ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.subject}
              </Typography.Text>
            ) : null}
          </div>
        </Space>
      ),
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 160 },
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
      full_name: t.full_name, 
      phone: t.phone, 
      subject: t.subject ? t.subject.split(',').map((s) => s.trim()).filter(Boolean) : [] 
    });
    setIsTeacherModalOpen(true);
  };

  const saveTeacher = async (values: { full_name: string; phone: string; subject?: string[] }) => {
    setIsSubmitting(true);
    try {
      const subjectStr = values.subject && values.subject.length > 0 ? values.subject.join(', ') : null;
      if (editingTeacher) {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: values.full_name, phone: values.phone, subject: subjectStr })
          .eq('id', editingTeacher.id);
        if (error) throw error;
        message.success('教师信息已更新');
      } else {
        const { error } = await supabase.from('profiles').insert({
          full_name: values.full_name,
          phone: values.phone,
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
        const assignedStudents = students.filter((s) => s.teacher_id === t.id);
        if (assignedStudents.length > 0) {
          const studentIds = assignedStudents.map((s) => s.id);
          const { error: releaseError } = await supabase.from('students').update({ teacher_id: null }).in('id', studentIds);
          if (releaseError) {
            message.error('释放名下学员失败');
            return;
          }
        }

        const { error } = await supabase.from('profiles').delete().eq('id', t.id);
        if (error) {
          message.error('删除失败');
          return;
        }
        message.success('已删除');
        fetchData();
      },
    });
  };

  const openAssign = (teacherId: string) => {
    setAssignTeacherId(teacherId);
    setIsAssignOpen(true);
    const assigned = students.filter((s) => s.teacher_id === teacherId).map((s) => s.id);
    setTargetKeys(assigned);
  };

  const transferData: TransferItem[] = useMemo(
    () => students.map((s) => ({ key: s.id, title: s.name, description: s.name })),
    [students],
  );

  const saveAssign = async () => {
    if (!assignTeacherId) return;

    const currentAssigned = new Set(students.filter((s) => s.teacher_id === assignTeacherId).map((s) => s.id));
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
        const { error } = await supabase.from('students').update({ teacher_id: assignTeacherId }).in('id', toAdd);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase.from('students').update({ teacher_id: null }).in('id', toRemove);
        if (error) throw error;
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
        <Button type="primary" onClick={openCreate}>
          新增教师
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <Skeleton active />
        ) : teachers.length === 0 ? (
          <Empty
            description="暂无师资数据，点击新增第一位教师"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={openCreate}>
              新增教师
            </Button>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={teachers}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无师资数据，点击新增第一位教师"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={openCreate}>
                    新增教师
                  </Button>
                </Empty>
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
          <Form.Item name="full_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="例如：张老师" />
          </Form.Item>
          <Form.Item 
            name="phone" 
            label="手机号" 
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
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
        title="分配学员"
        open={isAssignOpen}
        onCancel={() => setIsAssignOpen(false)}
        onOk={saveAssign}
        confirmLoading={isSubmitting}
        width={720}
      >
        <Transfer
          dataSource={transferData}
          targetKeys={targetKeys}
          onChange={(keys) => setTargetKeys(keys as string[])}
          render={(item) => item.title}
          listStyle={{ width: 310, height: 420 }}
          titles={['全部学员', '已分配']}
          showSearch
        />
      </Modal>
    </div>
  );
}
