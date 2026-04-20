import { useState, useEffect } from 'react' 
import { View, Text, Input, Textarea, Button, Picker, Image } from '@tarojs/components' 
import Taro from '@tarojs/taro' 
import './index.css' 

export default function LessonForm() { 
  const userId = Taro.getStorageSync('userId') 
  
  const [scheduledLessons, setScheduledLessons] = useState<any[]>([]) 
  const [lessonIndex, setLessonIndex] = useState<number>(-1) 
  
  const [topic, setTopic] = useState('') 
  const [feedback, setFeedback] = useState('') 
  const [homeworkTitle, setHomeworkTitle] = useState('') 
  const [images, setImages] = useState<string[]>([]) 

  useEffect(() => { 
    fetchScheduledLessons() 
  }, []) 

  const headers = { 
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', // ⚠️ 这里务必提醒用户换成真实的 KEY 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs' 
  } 

  const fetchScheduledLessons = async () => { 
    try { 
      // 核心：只拉取状态为 scheduled（已排课待消）的记录 
      const res = await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?teacher_id=eq.${userId}&status=eq.scheduled&select=id,lesson_date,students(id,name)`, 
        method: 'GET', header: headers 
      }) 
      if (res.data) { 
        // 拼装一个专门用于展示的字段，例如："04-17 | 杨振栋" 
        const formattedData = res.data.map((item: any) => ({ 
          ...item, 
          display_label: `${item.lesson_date.substring(5)} | ${item.students.name}` 
        })) 
        setScheduledLessons(formattedData) 
      } 
    } catch (e) { console.error(e) } 
  } 

  const handleChooseImage = async () => { 
    try { 
      const res = await Taro.chooseMedia({ 
        count: 3, mediaType: ['image'], sourceType: ['album', 'camera'] 
      }) 
      const paths = res.tempFiles.map(f => f.tempFilePath) 
      setImages([...images, ...paths]) 
    } catch (e) { } 
  } 

  const handleSubmit = async () => { 
    if (lessonIndex === -1) return Taro.showToast({ title: '请选择要核销的排课', icon: 'none' }) 
    if (!topic) return Taro.showToast({ title: '请填写实际讲授课题', icon: 'none' }) 

    Taro.showLoading({ title: '核销并推送中...' }) 
    const selectedLesson = scheduledLessons[lessonIndex] 

    try { 
      // 1. 将这节预排课的状态改为 completed 
      await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?id=eq.${selectedLesson.id}`, 
        method: 'PATCH', 
        header: { ...headers, 'Content-Type': 'application/json' }, 
        data: { status: 'completed', subject: topic, teacher_feedback: feedback } 
      }) 

      // 2. 如果留了作业，直接推送给家长 
      if (homeworkTitle) { 
        await Taro.request({ 
          url: 'https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/homework_tasks', 
          method: 'POST', 
          header: { ...headers, 'Content-Type': 'application/json' }, 
          data: { 
            teacher_id: userId, 
            student_id: selectedLesson.students.id, 
            title: homeworkTitle, 
            status: 'pending' 
          } 
        }) 
      } 

      Taro.hideLoading() 
      Taro.showToast({ title: '一键消课成功', icon: 'success' }) 
      setTimeout(() => Taro.navigateBack(), 1500) 

    } catch (e) { 
      Taro.hideLoading() 
      Taro.showToast({ title: '提交失败', icon: 'error' }) 
    } 
  } 

  return ( 
    <View className='form-container'> 
      <Text className='header-title'>教务工作台</Text> 

      <View className='form-group'> 
        <Text className='form-label'>1. 选择待消排课</Text> 
        {/* 这里只能选课，不能选人和日期 */} 
        <Picker mode='selector' range={scheduledLessons} rangeKey='display_label' onChange={(e) => setLessonIndex(Number(e.detail.value))}> 
          <View className='high-end-picker'> 
            <Text style={{ color: lessonIndex === -1 ? '#A0AAB7' : '#1A1D26' }}> 
              {lessonIndex === -1 ? '请选择后台已排好的课程' : scheduledLessons[lessonIndex].display_label} 
            </Text> 
            <Text style={{ color: '#A0AAB7' }}>▼</Text> 
          </View> 
        </Picker> 
      </View> 

      <View className='form-group'> 
        <Text className='form-label'>2. 本节课题 (实际讲授)</Text> 
        <Input className='high-end-input' placeholder='例：复杂追及问题精讲' value={topic} onInput={(e) => setTopic(e.detail.value)} /> 
      </View> 

      <View className='form-group'> 
        <View className='form-label'><Text>3. 课堂板书/重点</Text><Text className='label-hint'>支持传图，家长可见</Text></View> 
        {/* 这是一个带有虚线边框的大加号，绝对不会找不到 */} 
        <View className='image-uploader'> 
          {images.map((img, idx) => <View key={idx} className='img-box'><Image src={img} className='uploaded-img' /></View>)} 
          {images.length < 3 && <View className='img-box' onClick={handleChooseImage}><Text style={{fontSize: '32px'}}>+</Text></View>} 
        </View> 
      </View> 

      <View className='form-group'> 
        <Text className='form-label'>4. 专属评语</Text> 
        <Textarea className='high-end-textarea' placeholder='点评一下孩子今天的表现...' value={feedback} onInput={(e) => setFeedback(e.detail.value)} /> 
      </View> 

      <View className='form-group'> 
        <View className='form-label'><Text>5. 课后作业 (选填)</Text><Text className='label-hint'>将自动推送至家长端</Text></View> 
        <Input className='high-end-input' placeholder='例：完成练习册P12-15' value={homeworkTitle} onInput={(e) => setHomeworkTitle(e.detail.value)} /> 
      </View> 

      <Button className='submit-btn' onClick={handleSubmit}>确认消课并推送</Button> 
    </View> 
  ) 
}