import { useState, useEffect } from 'react' 
import { View, Text, Image, Textarea, Button } from '@tarojs/components' 
import Taro, { getCurrentInstance } from '@tarojs/taro' 
import './index.css' 

export default function HomeworkReview() { 
  const { router } = getCurrentInstance() 
  const taskId = router?.params?.id 
  
  const [taskData, setTaskData] = useState<any>(null) 
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | null>(null) 
  const [teacherComment, setTeacherComment] = useState('') 
  const [loading, setLoading] = useState(true) 
  const [submitting, setSubmitting] = useState(false) 

  const headers = { 
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
    'Content-Type': 'application/json' 
  } 

  useEffect(() => { 
    if (taskId) fetchTaskDetail() 
  }, [taskId]) 

  const fetchTaskDetail = async () => { 
    try { 
      const res = await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks?id=eq.${taskId}&select=*,students(name)`, 
        method: 'GET', header: headers 
      }) 
      if (res.data && res.data.length > 0) { 
        const data = res.data[0] 
        setTaskData(data) 
        setGrade(data.grade || null) 
        setTeacherComment(data.teacher_comment || '') 
      } 
    } catch (e) { 
      Taro.showToast({ title: '加载失败', icon: 'error' }) 
    } finally { 
      setLoading(false) 
    } 
  } 

  const previewImage = (url: string) => { 
    Taro.previewImage({ urls: [url], current: url }) 
  } 

  const handleSubmit = async () => { 
    if (!grade) return Taro.showToast({ title: '请先给出评分', icon: 'none' }) 
    if (!teacherComment.trim()) return Taro.showToast({ title: '请填写辅导评语', icon: 'none' }) 

    setSubmitting(true) 
    Taro.showLoading({ title: '正在发送给家长...' }) 
    
    try { 
      await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks?id=eq.${taskId}`, 
        method: 'PATCH', 
        header: headers, 
        data: { 
          status: 'reviewed', 
          grade: grade, 
          teacher_comment: teacherComment 
        } 
      }) 
      
      Taro.hideLoading() 
      Taro.showToast({ title: '批改完成！', icon: 'success' }) 
      setTimeout(() => Taro.navigateBack(), 1500) 
    } catch (e) { 
      Taro.hideLoading() 
      Taro.showToast({ title: '提交失败', icon: 'error' }) 
      setSubmitting(false) 
    } 
  } 

  if (loading) return <View style={{ padding: '40px', textAlign: 'center', color: '#8B95A1' }}>抽取作业本中...</View> 
  if (!taskData) return <View style={{ padding: '40px', textAlign: 'center', color: '#8B95A1' }}>找不到该作业</View> 

  const isReviewed = taskData.status === 'reviewed' 

  return ( 
    <View className='review-container'> 
      <View className='header-section'> 
        <Text className='page-title'>批改作业</Text> 
        <Text className='sub-title'>{taskData.students?.name} | {taskData.title}</Text> 
      </View> 

      {/* 学生作答区 */} 
      <View className='card'> 
        <Text className='section-title'>学生提交的照片 (点击放大)</Text> 
        {taskData.student_images && taskData.student_images.length > 0 ? ( 
          taskData.student_images.map((img: string, idx: number) => ( 
            <Image key={idx} src={img} className='hw-image' mode='aspectFill' onClick={() => previewImage(img)} /> 
          )) 
        ) : ( 
          <Text style={{ color: '#A0AAB7', fontSize: '14px' }}>学生本次未上传照片</Text> 
        )} 
      </View> 

      {/* 教师评判区 */} 
      <View className='card'> 
        <Text className='section-title'>给予综合评分</Text> 
        <View className='grade-group'> 
          <View className={`grade-btn ${grade === 'A' ? 'active-A' : ''}`} onClick={() => !isReviewed && setGrade('A')}> 
            <Text className='g-icon' style={{ color: grade === 'A' ? '#00E599' : '#111418' }}>A</Text> 
            <Text className='g-label' style={{ color: grade === 'A' ? '#00E599' : '#8B95A1' }}>优秀</Text> 
          </View> 
          <View className={`grade-btn ${grade === 'B' ? 'active-B' : ''}`} onClick={() => !isReviewed && setGrade('B')}> 
            <Text className='g-icon' style={{ color: grade === 'B' ? '#FFAB00' : '#111418' }}>B</Text> 
            <Text className='g-label' style={{ color: grade === 'B' ? '#FFAB00' : '#8B95A1' }}>良好</Text> 
          </View> 
          <View className={`grade-btn ${grade === 'C' ? 'active-C' : ''}`} onClick={() => !isReviewed && setGrade('C')}> 
            <Text className='g-icon' style={{ color: grade === 'C' ? '#FF4D4F' : '#111418' }}>C</Text> 
            <Text className='g-label' style={{ color: grade === 'C' ? '#FF4D4F' : '#8B95A1' }}>需努力</Text> 
          </View> 
        </View> 

        <Text className='section-title'>指导评语</Text> 
        <Textarea 
          className='feedback-textarea' 
          placeholder='指出孩子的闪光点和需要改进的地方...' 
          value={teacherComment} 
          onInput={(e) => setTeacherComment(e.detail.value)} 
          disabled={isReviewed} 
        /> 
      </View> 

      {/* 悬浮提交按钮 */} 
      {!isReviewed && ( 
        <Button className='submit-btn' onClick={handleSubmit} disabled={submitting}> 
          完成批改并通知家长 
        </Button> 
      )} 
    </View> 
  ) 
}