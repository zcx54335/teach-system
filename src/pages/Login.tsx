import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Alert, Button, Card, Checkbox, Divider, Form, Input, Space, Switch, theme, Typography, message } from 'antd';
import { MoonOutlined, RightOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '../components/Theme/ThemeProvider';
import { useAuth } from '../components/Auth/AuthProvider';
import { normalizeRole, ROLES } from '../constants/rbac';

const encoder = new TextEncoder();

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i += 1) str += String.fromCharCode(bytes[i]);
  return btoa(str);
};

const fromBase64 = (b64: string) => {
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
};

const deriveKey = async (identifier: string) => {
  const salt = 'xiaoyu-remember-v1';
  const raw = encoder.encode(`${salt}:${identifier}`);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const encryptCredentials = async (identifier: string, payload: { identifier: string; password: string }) => {
  const key = await deriveKey(identifier);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return `${toBase64(iv.buffer)}.${toBase64(cipher)}`;
};

const decryptCredentials = async (identifier: string, token: string) => {
  const [ivB64, cipherB64] = token.split('.');
  if (!ivB64 || !cipherB64) throw new Error('bad token');
  const key = await deriveKey(identifier);
  const iv = new Uint8Array(fromBase64(ivB64));
  const cipher = fromBase64(cipherB64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  const text = new TextDecoder().decode(new Uint8Array(plain));
  return JSON.parse(text) as { identifier: string; password: string };
};

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'parent' ? 'parent' : 'admin';
  const redirectUrl = searchParams.get('redirect') || '';

  const [form] = Form.useForm();
  const { token } = theme.useToken();
  const { theme: appTheme, setTheme } = useTheme();
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // 初始化记住账号
  useEffect(() => {
    const bootstrap = async () => {
      const legacyIdentifier = localStorage.getItem('rememberedIdentifier') || '';
      const token = localStorage.getItem('rememberedCredentials') || '';
      if (token) {
        try {
          const seed = legacyIdentifier || '';
          if (seed) {
            const creds = await decryptCredentials(seed, token);
            form.setFieldsValue({ identifier: creds.identifier, password: creds.password, remember: true });
            return;
          }
        } catch {}
      }
      if (legacyIdentifier) {
        form.setFieldsValue({ identifier: legacyIdentifier, remember: true });
      }
    };
    bootstrap();
  }, []);

  // 检查是否已经登录
  useEffect(() => {
    const checkSession = async () => {
      const sessionStr = localStorage.getItem('xiaoyu_user');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const role = session.role === 'admin' ? 'sysadmin' : session.role;
          if (role === 'parent') {
            navigate('/dashboard/report');
          } else if (role === 'sysadmin' || role === 'teacher') {
            navigate('/dashboard/dashboard');
          }
        } catch (e) {
          // Ignore parse error
        }
      }
    };
    checkSession();
  }, [navigate, redirectUrl]);

  const pageTitle = useMemo(() => (initialType === 'parent' ? '家长登录' : '欢迎回来 👋'), [initialType]);
  const pageSubTitle = useMemo(() => (initialType === 'parent' ? '家长中心' : '小鱼思维校办系统'), [initialType]);

  const isDark = appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

  const applyProgress = (nextProgress: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clamped = Math.max(0, Math.min(100, nextProgress));
    progressRef.current = clamped;

    const fill = fillRef.current;
    const thumb = thumbRef.current;
    if (!fill || !thumb) return;

    const thumbSize = 32;
    const maxX = Math.max(0, rect.width - thumbSize);
    const x = (maxX * clamped) / 100;

    fill.style.transform = `scaleX(${clamped / 100})`;
    thumb.style.transform = `translate3d(${x}px, -50%, 0)`;
  };

  const scheduleApply = (nextProgress: number) => {
    progressRef.current = nextProgress;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyProgress(progressRef.current);
    });
  };

  useEffect(() => {
    applyProgress(0);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleLogin = async (values: { identifier: string; password: string; remember?: boolean }) => {
    if (!captchaVerified) {
      message.warning('请先完成滑动验证');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: profile, error } = await supabase
        .from('system_users')
        .select('*')
        .or(`phone.eq.${values.identifier},account.eq.${values.identifier}`)
        .maybeSingle();

      console.error("Supabase 查询结果:", { data: profile, error });

      if (error || !profile) {
        setError('该账号或手机号未注册，请联系管理员开通');
      } else if (profile.password === values.password) {
        // 处理记住账号
        if (values.remember) {
          localStorage.setItem('rememberedIdentifier', values.identifier);
          try {
            const token = await encryptCredentials(values.identifier, { identifier: values.identifier, password: values.password });
            localStorage.setItem('rememberedCredentials', token);
          } catch {
            localStorage.removeItem('rememberedCredentials');
          }
        } else {
          localStorage.removeItem('rememberedIdentifier');
          localStorage.removeItem('rememberedCredentials');
        }

        const role = normalizeRole(profile.role);
        if (!role) {
          setError('账号角色异常，请联系管理员');
          return;
        }

        const sessionData = {
          id: profile.id as string,
          phone: (profile.phone as string) || '',
          account: (profile.account as string) || '',
          role,
          full_name:
            (profile.full_name as string | null) ||
            (role === ROLES.SUPER_ADMIN ? '熊熊' : role === ROLES.TEACHER ? '教师' : '家长'),
        };
        setUser(sessionData);
        message.success('登录成功，欢迎回来');

        if (role === 'parent') {
          navigate('/dashboard/report');
        } else if (role === ROLES.TEACHER) {
          navigate('/dashboard/deduction');
        } else {
          navigate('/dashboard/dashboard');
        }
      } else {
        setError('密码不正确');
      }
    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6" style={{ background: token.colorBgLayout }}>
      <div className="fixed top-5 right-6 z-50">
        <Switch
          checked={isDark}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            {pageTitle}
          </Typography.Title>
          <Typography.Text type="secondary">{pageSubTitle}</Typography.Text>
        </div>

        <Card
          style={{
            background: token.colorBgContainer,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : token.colorBorderSecondary,
          }}
        >
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            requiredMark={false}
          >
            <Form.Item
              label="账号 / 手机号"
              name="identifier"
              rules={[{ required: true, message: '请输入账号或手机号' }]}
            >
              <Input size="large" placeholder="请输入账号或手机号" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password size="large" placeholder="请输入密码" />
            </Form.Item>

            <Form.Item label="滑动验证">
              <div
                ref={trackRef}
                className="relative w-full overflow-hidden select-none"
                style={{
                  height: 40,
                  borderRadius: 6,
                  border: `1px solid ${token.colorBorder}`,
                  background: token.colorFillAlter,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => {
                  if (captchaVerified) return;
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  draggingRef.current = true;
                  if (thumbRef.current) {
                    thumbRef.current.style.borderColor = token.colorInfo;
                  }
                }}
                onPointerUp={() => {
                  if (!draggingRef.current) return;
                  draggingRef.current = false;
                  if (progressRef.current >= 96) {
                    applyProgress(100);
                    setCaptchaVerified(true);
                    if (thumbRef.current) {
                      thumbRef.current.style.borderColor = '#52c41a';
                    }
                    return;
                  }
                  scheduleApply(0);
                  if (thumbRef.current) {
                    thumbRef.current.style.borderColor = token.colorBorder;
                  }
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current || captchaVerified) return;
                  const rect = trackRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const thumbSize = 32;
                  const usable = Math.max(1, rect.width - thumbSize);
                  const relative = e.clientX - rect.left - thumbSize / 2;
                  const next = (relative / usable) * 100;
                  scheduleApply(next);
                }}
              >
                <div
                  ref={fillRef}
                  className="absolute inset-y-0 left-0 transition-[width] duration-150"
                  style={{
                    width: '100%',
                    transformOrigin: 'left',
                    transform: 'scaleX(0)',
                    willChange: 'transform',
                    background: 'linear-gradient(90deg, #13c2c2 0%, #52c41a 100%)',
                    boxShadow: 'inset 0 0 8px rgba(82, 196, 26, 0.4)',
                    opacity: isDark ? 0.9 : 0.75,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Typography.Text type="secondary">{captchaVerified ? '验证通过' : '请按住滑块拖动'}</Typography.Text>
                </div>
                <div
                  ref={thumbRef}
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-[left] duration-75"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: token.colorBgContainer,
                    border: `1px solid ${captchaVerified ? '#52c41a' : token.colorBorder}`,
                    boxShadow: token.boxShadowSecondary,
                    left: 0,
                    transform: 'translate3d(0, -50%, 0)',
                    willChange: 'transform',
                  }}
                >
                  <RightOutlined style={{ color: captchaVerified ? '#52c41a' : token.colorInfo }} />
                </div>
              </div>
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between">
                <Checkbox style={{ color: token.colorText }}>记住账号</Checkbox>
                <Button type="link" onClick={() => message.info('请联系管理员重置密码')}>
                  忘记密码？
                </Button>
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                登录
              </Button>
            </Form.Item>

            <Divider style={{ margin: '16px 0' }}>其他方式</Divider>

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button type="link" onClick={() => message.info('手机号登录已启用')}>
                手机号登录
              </Button>
              <Button type="link" onClick={() => message.info('扫码登录开发中')}>
                扫码登录
              </Button>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Button onClick={() => navigate('/')} size="large" block>
              返回首页
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
