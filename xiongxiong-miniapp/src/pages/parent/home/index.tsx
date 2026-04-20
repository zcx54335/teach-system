import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import ParentTabBar from '../../../components/ParentTabBar'


export default function ParentHome() {
  const [groupedLessons, setGroupedLessons] = useState<Record<string, any[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const studentName = Taro.getStorageSync('studentName') || '学生'
  const studentId = Taro.getStorageSync('studentId')

  useEffect(() => {
    const fetchLessons = async () => {
        if (!studentId) {
      Taro.reLaunch({ url: '/pages/login/index' });
      return;
    }
      setLoading(true)
      try {
        // 强制使用手动 request 绕过 URL 报错
        const res = await Taro.request({
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?student_id=eq.${studentId}&status=eq.completed&select=*&order=lesson_date.desc`,
          method: 'GET',
          header: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
          }
        })

        const data = res.data || []
        
        // 按月份分组逻辑
        const grouped = data.reduce((acc: any, curr: any) => {
          // 假设 lesson_date 格式为 YYYY-MM-DD
          const month = curr.lesson_date ? curr.lesson_date.substring(0, 7) : '未知月份'
          if (!acc[month]) acc[month] = []
          acc[month].push(curr)
          return acc
        }, {})

        setGroupedLessons(grouped)
      } catch (error) {
        console.error('获取课消记录失败', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [studentId])

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <View className='home-container'>
      <Text className='welcome'>{studentName}</Text>

      {loading ? (
        <View className='empty-state'><Text>数据同步中...</Text></View>
      ) : Object.keys(groupedLessons).length === 0 ? (
        <View className='empty-state'><Text>暂无上课记录</Text></View>
      ) : (
        <View className='lesson-list'>
          {Object.keys(groupedLessons).map(month => (
            <View key={month} className='month-group'>
              <Text className='month-title'>{month.replace('-', '年')}月</Text>
              
              {groupedLessons[month].map(lesson => (
                <View key={lesson.id} className='lesson-card'>
                  <View
                    className='lesson-header'
                    onClick={() => toggleExpand(lesson.id)}
                  >
                    <Text className='lesson-date'>{lesson.lesson_date}</Text>
                    <View className={`arrow ${expandedId === lesson.id ? 'open' : ''}`}>
                      ▼
                    </View>
                  </View>
                  
                  {/* 折叠展开区域 */}
                  {expandedId === lesson.id && (
                    <View className='lesson-body'>
                      <View className='info-row'>
                        <Text className='label'>课题：</Text>
                        <Text className='content'>{lesson.subject || '未填写'}</Text>
                      </View>
                      <View className='info-row feedback-row'>
                        <Text className='label'>评语：</Text>
                        <Text className='content'>{lesson.teacher_feedback || '老师暂未填写评语'}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
      
      <ParentTabBar current="home" />
    </View>
  )
}
