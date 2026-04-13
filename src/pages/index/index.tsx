import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Layout, Row, Switch, theme, Typography } from 'antd';
import { AppstoreOutlined, GithubOutlined, MoonOutlined, ProjectOutlined, RocketOutlined, SunOutlined, ToolOutlined } from '@ant-design/icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

const { Header, Content } = Layout;

const withAlpha = (color: string, alpha: number) => {
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const full = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  if (c.startsWith('rgba(')) return c.replace(/,([0-9.]+)\)\s*$/, `,${alpha})`);
  return c;
};

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { theme: appTheme, setTheme } = useTheme();
  const isDark = appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const gridBg = useMemo(() => {
    const line = withAlpha(token.colorSplit, isDark ? 0.18 : 0.45);
    return {
      backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    };
  }, [token.colorSplit, isDark]);

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <div className="fixed inset-0 pointer-events-none" style={{ ...gridBg, opacity: isDark ? 0.35 : 0.25 }} />

      <Header
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <GithubOutlined style={{ color: token.colorText }} />
          </div>
          <Typography.Text strong style={{ letterSpacing: 0.2 }}>
            Xiongxiong Workspace
          </Typography.Text>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={isDark}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </div>
      </Header>

      <Content style={{ padding: '48px 24px 72px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="flex flex-col gap-2 mb-8">
            <Typography.Title level={1} style={{ marginBottom: 0 }}>
              Hi, 我是熊熊 👋
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
              探索我构建的教育数字化与效率工具矩阵。
            </Typography.Text>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12} lg={8}>
              <Card
                className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                  boxShadow: token.boxShadowTertiary,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: withAlpha(token.colorInfo, 0.12),
                      border: `1px solid ${withAlpha(token.colorInfo, 0.18)}`,
                    }}
                  >
                    <AppstoreOutlined style={{ fontSize: 18, color: token.colorInfo }} />
                  </div>
                  <ProjectOutlined style={{ color: token.colorTextTertiary }} />
                </div>
                <Typography.Title level={4} style={{ marginBottom: 8 }}>
                  小鱼教务管理系统
                </Typography.Title>
                <Typography.Text type="secondary">
                  专为独立教师和微型机构打造的智能排课、消课与家校系统。
                </Typography.Text>
                <div className="mt-6">
                  <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/login')}>
                    进入系统 / 登录
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Card
                className="shadow-sm"
                style={{
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                  opacity: 0.75,
                  boxShadow: token.boxShadowTertiary,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <ToolOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />
                  </div>
                  <Typography.Text type="secondary">开发中</Typography.Text>
                </div>
                <Typography.Title level={4} style={{ marginBottom: 8 }}>
                  AI 智能题库
                </Typography.Title>
                <Typography.Text type="secondary">面向老师的题库组织、生成与讲解工具。</Typography.Text>
                <div className="mt-6">
                  <Button disabled icon={<ToolOutlined />}>
                    即将上线
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Card
                className="shadow-sm"
                style={{
                  background: token.colorBgContainer,
                  borderColor: token.colorBorderSecondary,
                  opacity: 0.75,
                  boxShadow: token.boxShadowTertiary,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <ToolOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />
                  </div>
                  <Typography.Text type="secondary">规划中</Typography.Text>
                </div>
                <Typography.Title level={4} style={{ marginBottom: 8 }}>
                  更多工具
                </Typography.Title>
                <Typography.Text type="secondary">持续构建中：效率、数据与协作。</Typography.Text>
                <div className="mt-6">
                  <Button disabled icon={<ToolOutlined />}>
                    敬请期待
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default IndexPage;
