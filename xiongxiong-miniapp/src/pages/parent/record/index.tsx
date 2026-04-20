import { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

import './index.css'
import ParentTabBar from '../../../components/ParentTabBar'

export default function TaskRecord() {
  const [groupedTasks, setGroupedTasks] = useState<Record<string, any[]>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 教务聚合页状态
  const [currentTab, setCurrentTab] = useState<'students' | 'homeworks'>('students')
  const [students, setStudents] = useState<any[]>([])
  const [homeworks, setHomeworks] = useState<any[]>([])

  const userRole = Taro.getStorageSync('userRole')
  const studentId = Taro.getStorageSync('studentId')
  const userId = Taro.getStorageSync('userId')

  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
  }

  Taro.useDidShow(() => {
    if (userRole === 'parent') {
      fetchParentTasks()
    } else if (userRole === 'teacher') {
      fetchTeacherData()
    }
  })

  const fetchParentTasks = async () => {
    if (!studentId) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }

    setLoading(true)
    try {
      const res = await Taro.request({
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks?student_id=eq.${studentId}&select=*&order=created_at.desc`,
        method: 'GET',
        header: headers
      })

      const data = Array.isArray(res.data) ? res.data : []
      
      const grouped = data.reduce((acc: any, curr: any) => {
        const dateStr = curr.created_at ? curr.created_at.substring(0, 10) : '未知日期'
        const month = curr.created_at ? curr.created_at.substring(0, 7) : '未知月份'
        
        curr.displayDate = dateStr
        if (!acc[month]) acc[month] = []
        acc[month].push(curr)
        return acc
      }, {})

      setGroupedTasks(grouped)
    } catch (error) {
      console.error('获取作业记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherData = async () => {
    setLoading(true)
    try {
      // 并发请求学员列表和待批改作业
      const [studentsRes, homeworksRes] = await Promise.all([
        Taro.request({
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/teacher_student_link?teacher_id=eq.${userId}&status=eq.active&select=students(id,name)`,
          method: 'GET',
          header: headers
        }),
        Taro.request({
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks?teacher_id=eq.${userId}&status=eq.submitted&select=id,title,created_at,status,students(name)&order=created_at.desc`,
          method: 'GET',
          header: headers
        })
      ])

      if (studentsRes.data) {
        const formattedStudents = studentsRes.data.map((item: any) => { 
          const student = item.students || {} 
          return { 
            id: student.id, 
            name: student.name || '未知学员'
          } 
        })
        setStudents(formattedStudents)
      }

      if (homeworksRes.data) {
        setHomeworks(homeworksRes.data)
      }

    } catch (error) {
      console.error('获取教务数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const handlePreviewImage = (url: string, urls: string[]) => {
    Taro.previewImage({
      current: url,
      urls: urls
    })
  }

  const handleUploadImage = async (taskId: string) => {
    try {
      const res = await Taro.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
      })
      Taro.showToast({ title: '选中图片：' + res.tempFiles.length + '张', icon: 'none' })
    } catch (err) {
      console.error('选择图片失败', err)
    }
  }

  const getStatusTag = (status: string) => {
    switch(status) {
      case 'pending': return <Text className='status-tag tag-pending'>待完成</Text>;
      case 'submitted': return <Text className='status-tag tag-submitted'>待批改</Text>;
      case 'reviewed': return <Text className='status-tag tag-reviewed'>已批改</Text>;
      default: return null;
    }
  }

  if (userRole === 'teacher') {
    return (
      <View className='record-container'>
        <Text className='welcome'>教务大厅</Text>
        
        <View className='library-container'> 
          {/* 顶部丝滑切换器 */} 
          <View className='tab-switch-container'> 
            <View className={`tab-switch-item ${currentTab === 'students' ? 'active' : ''}`} onClick={() => setCurrentTab('students')}> 
              学员库 
            </View> 
            <View className={`tab-switch-item ${currentTab === 'homeworks' ? 'active' : ''}`} onClick={() => setCurrentTab('homeworks')}> 
              待批改 
            </View> 
          </View> 
  
          {/* 内容区：根据 currentTab 动态渲染 */} 
          {currentTab === 'students' ? ( 
            <View className='student-list'> 
              {loading ? ( 
                <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1' }}>数据同步中...</View> 
              ) : students.length === 0 ? ( 
                <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1' }}>暂无绑定的学员</View> 
              ) : ( 
                students.map(student => ( 
                  <View key={student.id} className='student-card'> 
                    <View className='card-left'> 
                      <View className='avatar-container'> 
                        <Text className='avatar-text'>{student.name.substring(0, 1)}</Text> 
                      </View> 
                      <View className='info-container'> 
                        <Text className='student-name'>{student.name}</Text> 
                        <Text className='student-desc'>专属VIP学员</Text> 
                      </View> 
                    </View> 
                    <View className='card-right'> 
                      <Text className='remain-label'>课时</Text> 
                      <Text className='remain-value'>--</Text> 
                      <Text className='remain-unit'>节</Text> 
                    </View> 
                  </View> 
                )) 
              )} 
            </View> 
          ) : ( 
            <View> 
              {loading ? (
                <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1' }}>数据同步中...</View>
              ) : homeworks.length === 0 ? ( 
                <View style={{ textAlign: 'center', padding: '40px', color: '#8B95A1' }}>太棒了，所有作业都已批改完毕！</View> 
              ) : ( 
                homeworks.map((hw: any) => ( 
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
          )} 
        </View> 


      </View>
    )
  }

  // Parent Render
  return (
    <View className='record-container'>
      <Text className='welcome'>学习任务</Text>

      {loading ? (
        <View className='empty-state'><Text>任务加载中...</Text></View>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <View className='empty-state'><Text>暂无作业任务，好好休息吧！</Text></View>
      ) : (
        <View className='task-list'>
          {Object.keys(groupedTasks).map(month => (
            <View key={month} className='month-group'>
              <Text className='month-title'>{month.replace('-', '年')}月</Text>
              
              {groupedTasks[month].map(task => (
                <View key={task.id} className='task-card'>
                  <View
                    className='task-header'
                    onClick={() => toggleExpand(task.id)}
                  >
                    <View className='header-left'>
                      <Text className='task-date'>{task.displayDate}</Text>
                      <Text className='task-title'>{task.title || '课后作业'}</Text>
                    </View>
                    
                    <View className='header-right'>
                      {getStatusTag(task.status)}
                      <View className={`arrow ${expandedId === task.id ? 'open' : ''}`}>▼</View>
                    </View>
                  </View>
                  
                  {expandedId === task.id && (
                    <View className='task-body'>
                      {task.status === 'pending' && (
                        <View className='pending-box'>
                          请督促孩子尽快完成并提交作业哦！
                        </View>
                      )}
                      {task.status === 'reviewed' && (
                        <View className='info-row'>
                          <Text className='label'>老师批改反馈：</Text>
                          <View className='review-box'>{task.teacher_review || '老师已阅，继续保持！'}</View>
                        </View>
                      )}
                      {task.status === 'submitted' && (
                        <View className='info-row'>
                          <Text className='label'>作业状态：</Text>
                          <Text className='content'>已提交，等待老师批改中...</Text>
                        </View>
                      )}

                      {/* 区块A：【课堂要点回顾】 */}
                      {task.reference_images && task.reference_images.length > 0 && (
                        <View className='media-section'>
                          <Text className='section-title'>课堂要点回顾</Text>
                          <View className='image-grid'>
                            {task.reference_images.map((imgUrl: string, idx: number) => (
                              <Image 
                                key={idx} 
                                className='grid-image' 
                                src={imgUrl} 
                                mode='aspectFill'
                                onClick={() => handlePreviewImage(imgUrl, task.reference_images)}
                              />
                            ))}
                          </View>
                        </View>
                      )}

                      {/* 区块B：【孩子作业照片】 */}
                      <View className='media-section'>
                        <Text className='section-title'>孩子作业照片</Text>
                        <View className='image-grid'>
                          {task.images && task.images.map((imgUrl: string, idx: number) => (
                            <Image 
                              key={idx} 
                              className='grid-image' 
                              src={imgUrl} 
                              mode='aspectFill'
                              onClick={() => handlePreviewImage(imgUrl, task.images)}
                            />
                          ))}
                          
                          {/* 如果状态是 pending 或 submitted，追加上传按钮 */}
                          {(task.status === 'pending' || task.status === 'submitted') && (
                            <View 
                              className='upload-btn' 
                              onClick={() => handleUploadImage(task.id)}
                            >
                              <Text className='upload-icon'>+</Text>
                              <Text className='upload-text'>上传作业</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <ParentTabBar current="record" />
    </View>
  )
}