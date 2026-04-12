import React from 'react';
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';

type CourseProduct = {
  id: string;
  name: string;
  subject: string;
  status: 'active' | 'inactive';
  price: number;
};

const data: CourseProduct[] = [];

export default function EducationProducts() {
  const columns: ColumnsType<CourseProduct> = [
    { title: '课程产品', dataIndex: 'name', key: 'name' },
    { title: '科目', dataIndex: 'subject', key: 'subject', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: CourseProduct['status']) => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '启用' : '停用'}</Tag>,
    },
    { title: '定价', dataIndex: 'price', key: 'price', width: 140, render: (v: number) => `¥${v}` },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: () => (
        <Space>
          <Button type="link">编辑</Button>
          <Button type="link" danger>
            停用
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            课程产品管理
          </Typography.Title>
          <Typography.Text type="secondary">管理课程产品、定价与上下架状态</Typography.Text>
        </div>
        <Button type="primary" icon={<Plus className="w-4 h-4" />}>
          新增产品
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无课程产品，点击新增创建第一条产品"
              >
                <Button type="primary">新增产品</Button>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
}
