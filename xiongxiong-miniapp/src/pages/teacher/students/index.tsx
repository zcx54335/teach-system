import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import './index.scss' 

export default function StudentsList() {
  const userId = Taro.getStorageSync('userId')
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
  }

  useDidShow(() => {
    if (userId) fetchStudents()
  })

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // 修正后的查询：显式指定关联关系
      const res = await Taro.request({
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?teacher_id=eq.${userId}&status=eq.active&select=students(id,name,remaining_lessons)`,
        method: 'GET',
        header: headers
      })
      
      if (res.data) {
        setStudents(res.data.map((item: any) => ({
          id: item.students?.id,
          name: item.students?.name || '未知',
          avatar: (item.students?.name || '未').charAt(0),
          remaining: item.students?.remaining_lessons ?? 0
        })))
      }
    } catch (e) {
      Taro.showToast({ title: '数据拉取失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='page-container'>
      <View className='header'>
        <Text className='page-title'>学员库</Text>
        <Text className='total-count'>共 {students.length} 名</Text>
      </View>

      {loading ? <Text className='loading-hint'>同步数据中...</Text> : 
        students.map(stu => (
          <View key={stu.id} className='student-card'>
            <View className='left-info'>
              <View className='avatar-box'>{stu.avatar}</View>
              <View className='name-age'>
                <Text className='s-name'>{stu.name}</Text>
                <Text className='s-label'>专属学员</Text>
              </View>
            </View>
            <View className='right-info'>
              <Text className='r-label'>剩余</Text>
              <Text className='r-num'>{stu.remaining}</Text>
              <Text className='r-unit'>节</Text>
            </View>
          </View>
        ))
      }
    </View>
  )
}