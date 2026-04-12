import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Avatar, Button, Card, Form, Input, Modal, Space, Switch, Tabs, Typography, message } from 'antd';
import { useTheme } from '../components/Theme/ThemeProvider';

type Profile = {
  id: string;
  full_name?: string;
  phone?: string;
  bio?: string;
};

export default function PersonalSettings() {
  const [form] = Form.useForm();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPwdOpen, setIsPwdOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const sessionStr = localStorage.getItem('xiaoyu_user');
      if (!sessionStr) {
        setIsLoading(false);
        return;
      }
      try {
        const session = JSON.parse(sessionStr);
        const { data } = await supabase.from('profiles').select('*').eq('id', session.id).single();
        if (data) {
          setProfile(data as Profile);
          form.setFieldsValue({
            full_name: data.full_name || '',
            phone: data.phone || '',
            bio: data.bio || '',
          });
        }
      } catch {}
      setIsLoading(false);
    };
    load();
  }, [form]);

  const saveProfile = async (values: { full_name: string; phone: string; bio?: string }) => {
    if (!profile?.id) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone, bio: values.bio || null })
      .eq('id', profile.id);
    if (error) {
      message.error('保存失败');
      setIsSaving(false);
      return;
    }
    message.success('已保存');
    setIsSaving(false);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          个人设置
        </Typography.Title>
        <Typography.Text type="secondary">个人资料、安全设置与偏好</Typography.Text>
      </div>

      <Card loading={isLoading}>
        <Tabs
          items={[
            {
              key: 'profile',
              label: '基本资料',
              children: (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar size={72}>{(profile?.full_name || 'U').charAt(0)}</Avatar>
                    <div>
                      <Button onClick={() => message.info('头像上传开发中')}>上传头像</Button>
                      <div className="text-xs text-slate-500 mt-2">支持 jpg/png，建议 1:1</div>
                    </div>
                  </div>
                  <Form form={form} layout="vertical" onFinish={saveProfile} requiredMark={false}>
                    <Form.Item name="full_name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item name="phone" label="手机号">
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                    <Form.Item name="bio" label="个人简介">
                      <Input.TextArea rows={4} placeholder="一句话介绍你自己" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={isSaving}>
                      保存修改
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'security',
              label: '安全设置',
              children: (
                <div className="flex flex-col gap-4">
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">登录密码</div>
                        <div className="text-xs text-slate-500">建议定期更新密码以保证账号安全</div>
                      </div>
                      <Button onClick={() => setIsPwdOpen(true)}>修改</Button>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">绑定微信</div>
                        <div className="text-xs text-slate-500">未绑定</div>
                      </div>
                      <Button type="primary" onClick={() => message.info('绑定微信开发中')}>
                        去绑定
                      </Button>
                    </div>
                  </Card>

                  <Modal
                    title="修改登录密码"
                    open={isPwdOpen}
                    onCancel={() => setIsPwdOpen(false)}
                    onOk={() => {
                      setIsPwdOpen(false);
                      message.success('密码修改开发中');
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input.Password placeholder="请输入旧密码" />
                      <Input.Password placeholder="请输入新密码" />
                      <Input.Password placeholder="确认新密码" />
                    </Space>
                  </Modal>
                </div>
              ),
            },
            {
              key: 'preferences',
              label: '偏好设置',
              children: (
                <div className="flex flex-col gap-4">
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">主题外观</div>
                        <div className="text-xs text-slate-500">亮色 / 深色</div>
                      </div>
                      <Switch
                        checked={theme === 'dark'}
                        onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      />
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">通知声音</div>
                        <div className="text-xs text-slate-500">系统提醒音效</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

