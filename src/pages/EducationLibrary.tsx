import React from 'react';
import { Button, Card, Empty, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Upload } from 'lucide-react';

type LibraryItem = {
  id: string;
  title: string;
  type: '题库' | '资料';
  subject: string;
  updatedAt: string;
};

const data: LibraryItem[] = [];

export default function EducationLibrary() {
  const columns: ColumnsType<LibraryItem> = [
    { title: '名称', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120, render: (v) => <Tag color={v === '题库' ? 'cyan' : 'blue'}>{v}</Tag> },
    { title: '科目', dataIndex: 'subject', key: 'subject', width: 120 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 140 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: () => (
        <Space>
          <Button type="link">查看</Button>
          <Button type="link">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            题库与资料库
          </Typography.Title>
          <Typography.Text type="secondary">集中管理题库、资料与版本更新</Typography.Text>
        </div>
        <Button type="primary" icon={<Upload className="w-4 h-4" />}>
          上传资料
        </Button>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <Input.Search placeholder="搜索题库/资料..." allowClear style={{ maxWidth: 360 }} />
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无题库/资料，点击上传添加第一份内容"
              >
                <Button type="primary">上传资料</Button>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
}
