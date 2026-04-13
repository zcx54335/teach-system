import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import dayjs from 'dayjs';

export type NotificationRecord = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationView = NotificationRecord & { timeLabel: string };

const toTimeLabel = (createdAt: string) => {
  const d = dayjs(createdAt);
  if (!d.isValid()) return '';
  const diffMin = Math.max(0, dayjs().diff(d, 'minute'));
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = dayjs().diff(d, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  return d.format('MM-DD HH:mm');
};

export default function useNotifications(userId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);

  const notifications: NotificationView[] = useMemo(
    () => items.map((n) => ({ ...n, timeLabel: toTimeLabel(n.created_at) })),
    [items],
  );

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setItems((data as NotificationRecord[]) || []);
        setIsLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as NotificationRecord;
          setItems((prev) => [next, ...prev]);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = payload.new as NotificationRecord;
          setItems((prev) => prev.map((n) => (n.id === next.id ? next : n)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const prevRow = payload.old as { id?: string };
          if (!prevRow?.id) return;
          setItems((prev) => prev.filter((n) => n.id !== prevRow.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const clearAll = async () => {
    if (!userId) return;
    setItems([]);
    await supabase.from('notifications').delete().eq('user_id', userId);
  };

  return { notifications, unreadCount, isLoading, markAsRead, clearAll };
}

