import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

import './index.css'
import ParentTabBar from '../../../components/ParentTabBar'

export default function Profile() {
  const [completedCount, setCompletedCount] = useState<number | string>('--')
  const [studentCount, setStudentCount] = useState<number | string>('--')
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const userId = Taro.getStorageSync('userId')
  const userRole = Taro.getStorageSync('userRole') || 'parent'
  const userName = Taro.getStorageSync('userName') || '用户'
  const studentName = Taro.getStorageSync('studentName') || '未绑定'
  const studentId = Taro.getStorageSync('studentId')

  Taro.useDidShow(() => {
    if (userId) {
      fetchProfileData()
    }
  })

  const fetchProfileData = async () => {
    setLoading(true)
    const headers = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
    }

    try {
      if (userRole === 'teacher') {
        const d = new Date()
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]

        const [studentRes, lessonRes] = await Promise.all([
          Taro.request({
            url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?teacher_id=eq.${userId}&status=eq.active&select=id`,
            method: 'GET',
            header: headers
          }),
          Taro.request({
            url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?teacher_id=eq.${userId}&status=eq.completed&lesson_date=gte.${firstDay}&select=id`,
            method: 'GET',
            header: headers
          })
        ])

        if (studentRes.data) setStudentCount(studentRes.data.length)
        if (lessonRes.data) setCompletedCount(lessonRes.data.length)

      } else {
        // Parent Logic
        if (!studentId) {
          setCompletedCount(0)
          setLoading(false)
          return
        }

        const [lessonRes, teacherRes] = await Promise.all([
          Taro.request({
            url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?student_id=eq.${studentId}&status=eq.completed&select=id`,
            method: 'GET',
            header: headers
          }),
          Taro.request({
            url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?student_id=eq.${studentId}&status=eq.active&select=id,users!teacher_student_link_teacher_id_fkey(name,phone)`,
            method: 'GET',
            header: headers
          })
        ])

        if (lessonRes.data) setCompletedCount(lessonRes.data.length)
        if (teacherRes.data && Array.isArray(teacherRes.data)) {
          const formattedTeachers = teacherRes.data.map((item: any) => ({
            id: item.id,
            name: item.users?.name || '专属教师',
            phone: item.users?.phone || '13281250502'
          }))
          setTeachers(formattedTeachers.length > 0 ? formattedTeachers : [{ id: 'default', name: '专属教师', phone: '13281250502' }])
        } else {
          setTeachers([{ id: 'default', name: '专属教师', phone: '13281250502' }])
        }
      }
    } catch (error) {
      console.error('获取个人中心数据失败', error)
      Taro.showToast({ title: '数据同步失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCallTeacher = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: phone || '13281250502'
    })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('userInfo')
          Taro.removeStorageSync('userId')
          Taro.removeStorageSync('userName')
          Taro.removeStorageSync('userRole')
          Taro.removeStorageSync('studentId')
          Taro.removeStorageSync('studentName')
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      }
    })
  }

  return (
    <View className='page-container'>
      <View className='header-section'>
        <Text className='page-title'>我的</Text>
      </View>

      <View className='role-card'>
        <View className='avatar'>
          {userRole === 'teacher' ? (
            <Text style={{ fontSize: '40px', color: '#fff', fontWeight: 'bold' }}>{userName.substring(0, 1)}</Text>
          ) : (
            <Text style={{ fontSize: '40px', color: '#fff', fontWeight: 'bold' }}>{studentName.substring(0, 1)}</Text>
          )}
        </View>
        <View className='role-info'>
          <Text className='role-name'>{userRole === 'teacher' ? userName : `${studentName} 家长`}</Text>
          <Text className='role-tag'>{userRole === 'teacher' ? '金牌教师' : 'VIP 会员'}</Text>
        </View>
      </View>

      <View className='asset-card'>
        <View className='asset-info'>
          <Text className='card-title'>{userRole === 'teacher' ? '本月已消课' : '累计已上课时'}</Text>
          <View className='card-value-container'>
            <Text className='card-value'>{loading ? '-' : completedCount}</Text>
            <Text className='card-unit'>节</Text>
          </View>
        </View>
        {userRole === 'teacher' && (
          <View className='asset-info' style={{ alignItems: 'flex-end' }}>
            <Text className='card-title'>带教学生</Text>
            <View className='card-value-container'>
              <Text className='card-value'>{loading ? '-' : studentCount}</Text>
              <Text className='card-unit'>人</Text>
            </View>
          </View>
        )}
      </View>

      {userRole === 'parent' && (
        <View className='list-section'>
          {teachers.map(teacher => (
            <View key={teacher.id} className='list-item' onClick={() => handleCallTeacher(teacher.phone)}>
              <View className='item-left'>
                <Text className='item-text'>联系 {teacher.name}</Text>
              </View>
              <View className='item-right'>
                <Text className='item-value'>{teacher.phone}</Text>
                <Text className='item-arrow'>&gt;</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className='logout-section'>
        <Button className='logout-btn' onClick={handleLogout}>退出登录</Button>
      </View>

      {userRole === 'parent' && <ParentTabBar current="profile" />}
    </View>
  )
}