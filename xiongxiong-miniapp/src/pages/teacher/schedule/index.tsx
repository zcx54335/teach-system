import { useState } from 'react' 
import { View, Text } from '@tarojs/components' 
import Taro from '@tarojs/taro' 

import './index.css' 

export default function TeacherSchedule() { 
  const [teacherName, setTeacherName] = useState('老师') 

  // 真实数据状态 
  const [completedCount, setCompletedCount] = useState(0) 
  const [studentCount, setStudentCount] = useState(0) 
  const [recentLessons, setRecentLessons] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true) 

  const userId = Taro.getStorageSync('userId') 

  // 每次页面展示时自动刷新数据（保持数据绝对最新） 
  Taro.useDidShow(() => { 
    initGreeting() 
    if (userId) { 
      fetchDashboardData() 
    } 
  }) 

  const initGreeting = () => { 
    const storedName = Taro.getStorageSync('userName') 
    if (storedName) setTeacherName(storedName) 
  } 

  const fetchDashboardData = async () => { 
    setLoading(true) 
    const headers = { 
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',  // ⚠️ 替换为了真实的KEY 
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs' 
    } 

    try { 
      const d = new Date() 
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] 

      // 并发请求 3 个接口
      const [studentRes, lessonRes, recentRes] = await Promise.all([
        // 1. 获取您的活跃学生总数 
        Taro.request({ 
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?teacher_id=eq.${userId}&status=eq.active&select=id`, 
          method: 'GET', 
          header: headers 
        }),
        // 2. 获取【本月】已完成的课消数量 
        Taro.request({ 
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?teacher_id=eq.${userId}&status=eq.completed&lesson_date=gte.${firstDay}&select=id`, 
          method: 'GET', 
          header: headers 
        }),
        // 3. 获取最近5条上课记录 (极其高级的连表查询，直接拉取 students 表里的 name) 
        Taro.request({ 
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?teacher_id=eq.${userId}&status=eq.completed&order=lesson_date.desc&limit=5&select=id,lesson_date,subject,students(name)`, 
          method: 'GET', 
          header: headers 
        })
      ])

      if (studentRes.data) setStudentCount(studentRes.data.length) 
      if (lessonRes.data) setCompletedCount(lessonRes.data.length) 
      
      if (recentRes.data && Array.isArray(recentRes.data)) { 
        const formattedLessons = recentRes.data.map((item: any) => ({ 
          id: item.id, 
          student_name: item.students?.name || '未知学生', 
          topic: item.subject || '未填写课题', 
          // 格式化日期：将 2026-04-16 截取为 04-16 
          date: item.lesson_date ? item.lesson_date.substring(5) : '未知' 
        })) 
        setRecentLessons(formattedLessons) 
      } 

    } catch (error) { 
      console.error('获取工作台数据失败', error) 
      Taro.showToast({ title: '数据同步失败', icon: 'error' }) 
    } finally { 
      setLoading(false) 
    } 
  } 

  const handleAddLesson = () => { 
    Taro.navigateTo({ url: '/pages/teacher/lesson_form/index' }) 
  } 

  return ( 
    <View className='teacher-container'> 
      <View className='header-section'> 
        <Text className='greeting'>{teacherName}</Text> 
        <Text className='sub-greeting'>今天也要启发孩子们的无限可能</Text> 
      </View> 

      <View className='stats-card'> 
        <View className='stat-item'> 
          <Text className='stat-value'>{loading ? '-' : completedCount}</Text> 
          <Text className='stat-label'>本月已消课</Text> 
        </View> 
        <View className='stat-divider'></View> 
        <View className='stat-item'> 
          <Text className='stat-value'>{loading ? '-' : studentCount}</Text> 
          <Text className='stat-label'>活跃学生数</Text> 
        </View> 
      </View> 

      {/* 核心操作横幅 */} 
      <View className='action-banner' onClick={() => Taro.navigateTo({ url: '/pages/teacher/lesson_form/index' })}> 
        <View className='ab-content'> 
          <Text className='ab-title'>一键消课</Text> 
          <Text className='ab-sub'>核销排课 / 发板书 / 布置作业</Text> 
        </View> 
      </View>

      <View className='list-section'> 
        <Text className='section-title'>最近记录</Text> 
        {loading ? ( 
          <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1', fontSize: '14px' }}>数据加载中...</View> 
        ) : recentLessons.length === 0 ? ( 
          <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1', fontSize: '14px' }}>暂无上课记录，快去添加一节吧</View> 
        ) : ( 
          recentLessons.map(lesson => ( 
            <View 
              key={lesson.id} 
              className='lesson-card'
              onClick={() => Taro.navigateTo({ url: '/pages/teacher/lesson_detail/index?id=' + lesson.id })}
            > 
              <View className='lesson-info'> 
                <Text className='student-name'>{lesson.student_name}</Text> 
                <Text className='lesson-topic'>课题：{lesson.topic}</Text> 
              </View> 
              <Text className='lesson-date'>{lesson.date}</Text> 
            </View> 
          )) 
        )} 
      </View> 
      

    </View> 
  ) 
}