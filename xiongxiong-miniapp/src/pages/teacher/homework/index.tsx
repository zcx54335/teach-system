import { useState } from 'react' 
import { View, Text } from '@tarojs/components' 
import Taro, { useDidShow } from '@tarojs/taro' 

import './index.css' 

export default function HomeworkList() { 
  const userId = Taro.getStorageSync('userId') 
  const role = Taro.getStorageSync('userRole') 
  const [homeworks, setHomeworks] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true) 

  const headers = { 
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs' 
  } 

  useDidShow(() => { 
    if (role === 'teacher' && userId) { 
      fetchPendingHomeworks() 
    } else { 
      setLoading(false) 
    } 
  }) 

  const fetchPendingHomeworks = async () => { 
    setLoading(true) 
    try { 
      const res = await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks?teacher_id=eq.${userId}&status=eq.submitted&select=*,students(name)&order=created_at.desc`, 
        method: 'GET', header: headers 
      }) 
      if (res.data) setHomeworks(res.data) 
    } catch (e) { 
      Taro.showToast({ title: '获取作业失败', icon: 'error' }) 
    } finally { 
      setLoading(false) 
    } 
  } 

  if (role !== 'teacher') return null 

  return ( 
    <View className='hw-container'> 
      <Text className='page-title'>待批改作业</Text> 
      
      {loading ? ( 
        <Text className='loading-text'>作业本搬运中...</Text> 
      ) : homeworks.length === 0 ? ( 
        <Text className='loading-text'>太棒了，所有作业都已批改完毕！🎉</Text> 
      ) : ( 
        homeworks.map(hw => ( 
          <View key={hw.id} className='hw-card'> 
            <View className='hw-info'> 
              <Text className='hw-title'>{hw.title}</Text> 
              <Text className='hw-student'>提交人：{hw.students?.name || '未知'}</Text> 
            </View> 
            <View className='review-btn' onClick={() => Taro.navigateTo({ url: `/pages/teacher/homework_review/index?id=${hw.id}` })}> 
              去批改 
            </View> 
          </View> 
        )) 
      )} 
      

    </View> 
  ) 
}