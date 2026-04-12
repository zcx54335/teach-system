import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Card, Empty, Input, Skeleton, Space, Tag, Typography, message } from 'antd';

type Settings = {
  subjects_list: string[];
  default_duration: number;
};

export default function EducationDictionary() {
  const [settings, setSettings] = useState<Settings>({ subjects_list: [], default_duration: 120 });
  const [newSubject, setNewSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings({
          subjects_list: data.subjects_list || [],
          default_duration: data.default_duration || 120,
        });
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const addSubject = () => {
    const v = newSubject.trim();
    if (!v) return;
    if (settings.subjects_list.includes(v)) {
      setNewSubject('');
      return;
    }
    setSettings({ ...settings, subjects_list: [...settings.subjects_list, v] });
    setNewSubject('');
  };

  const removeSubject = (s: string) => {
    setSettings({ ...settings, subjects_list: settings.subjects_list.filter((x) => x !== s) });
  };

  const save = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { id: 1, subjects_list: settings.subjects_list, default_duration: settings.default_duration },
        { onConflict: 'id' },
      );
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
          教务字典库
        </Typography.Title>
        <Typography.Text type="secondary">科目、年级、教室等基础字典配置</Typography.Text>
      </div>

      <Card title="科目配置" extra={<Button type="primary" onClick={save} loading={isSaving}>保存</Button>}>
        {isLoading ? (
          <Skeleton active />
        ) : settings.subjects_list.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无科目配置，添加第一个科目开始使用">
            <Space>
              <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="输入科目名" style={{ width: 240 }} />
              <Button onClick={addSubject}>添加</Button>
            </Space>
          </Empty>
        ) : (
          <>
            <Space wrap>
              {settings.subjects_list.map((s) => (
                <Tag key={s} closable onClose={() => removeSubject(s)}>
                  {s}
                </Tag>
              ))}
            </Space>
            <div className="mt-4 flex gap-2">
              <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="输入科目名" style={{ maxWidth: 280 }} />
              <Button onClick={addSubject}>添加</Button>
            </div>
          </>
        )}
      </Card>

      <Card title="其他字典（占位）">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="年级、教室等配置即将上线" />
      </Card>
    </div>
  );
}

