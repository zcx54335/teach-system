import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss' 

export default function Profile() {
  const [userName, setUserName] = useState('老师')
  const [lessonCount, setLessonCount] = useState(0)
  const [studentCount, setStudentCount] = useState(0)

  const userId = Taro.getStorageSync('userId')
  
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
  }

  useDidShow(() => {
    const storedName = Taro.getStorageSync('userName')
    if (storedName) setUserName(storedName)
    
    if (userId) fetchStats()
  })

  const fetchStats = async () => {
    try {
      const stuRes = await Taro.request({
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?teacher_id=eq.${userId}&status=eq.active&select=id`,
        method: 'GET', header: headers
      })
      if (stuRes.data) setStudentCount(stuRes.data.length)

      const d = new Date()
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
      const lessonRes = await Taro.request({
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?teacher_id=eq.${userId}&status=eq.completed&lesson_date=gte.${firstDay}&select=id`,
        method: 'GET', header: headers
      })
      if (lessonRes.data) setLessonCount(lessonRes.data.length)
    } catch (e) { console.error(e) }
  }

  const handleLogout = () => {
    Taro.clearStorageSync()
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  return (
    <View className='page-container'>
      <View className='header-section'>
        <Text className='page-title'>我的</Text>
      </View>

      <View className='role-card'>
        <View className='avatar'>
          <Text style={{ fontSize: '40px', color: '#fff', fontWeight: 'bold' }}>{userName.substring(0, 1)}</Text>
        </View>
        <View className='role-info'>
          <Text className='role-name'>{userName}</Text>
          <Text className='role-tag'>资深思维导师</Text>
        </View>
      </View>

      <View className='asset-card'>
        <View className='asset-info'>
          <Text className='card-title'>本月已消课</Text>
          <View className='card-value-container'>
            <Text className='card-value'>{lessonCount}</Text>
            <Text className='card-unit'>节</Text>
          </View>
        </View>
        <View className='asset-info' style={{ alignItems: 'flex-end' }}>
          <Text className='card-title'>服务学员数</Text>
          <View className='card-value-container'>
            <Text className='card-value'>{studentCount}</Text>
            <Text className='card-unit'>人</Text>
          </View>
        </View>
      </View>

      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>退出登录</Button>
      </View>
    </View>
  )
}