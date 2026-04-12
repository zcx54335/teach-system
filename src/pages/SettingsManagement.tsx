import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Card, Form, Input, InputNumber, Skeleton, Typography, message } from 'antd';

type Settings = {
  studio_name: string;
  report_footer: string;
  default_duration: number;
};

export default function SettingsManagement() {
  const [settings, setSettings] = useState<Settings>({
    studio_name: '小鱼思维',
    report_footer: 'POWERED BY 小鱼思维',
    default_duration: 120,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings({
          studio_name: data.studio_name || '小鱼思维',
          report_footer: data.report_footer || 'POWERED BY 小鱼思维',
          default_duration: data.default_duration || 120,
        });
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          id: 1,
          studio_name: settings.studio_name,
          report_footer: settings.report_footer,
          default_duration: settings.default_duration,
        },
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
          基础设置
        </Typography.Title>
        <Typography.Text type="secondary">机构品牌与基础参数</Typography.Text>
      </div>

      <Card title="机构信息与基础参数">
        {isLoading ? (
          <Skeleton active />
        ) : (
          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="机构名称">
              <Input value={settings.studio_name} onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })} />
            </Form.Item>
            <Form.Item label="机构 Logo（占位）">
              <Input disabled placeholder="即将支持上传 Logo" />
            </Form.Item>
            <Form.Item label="报告页脚">
              <Input value={settings.report_footer} onChange={(e) => setSettings({ ...settings, report_footer: e.target.value })} />
            </Form.Item>
            <Form.Item label="默认课时长度（分钟）">
              <InputNumber
                value={settings.default_duration}
                min={30}
                max={300}
                style={{ width: 240 }}
                onChange={(v) => setSettings({ ...settings, default_duration: Number(v || 0) })}
              />
            </Form.Item>
          </Form>
        )}
      </Card>

      <div>
        <Button type="primary" onClick={save} loading={isSaving}>
          保存设置
        </Button>
      </div>
    </div>
  );
}
