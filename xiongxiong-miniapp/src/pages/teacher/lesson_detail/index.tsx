import { useState, useEffect } from 'react' 
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components' 
import Taro, { getCurrentInstance } from '@tarojs/taro' 
import './index.css' 

export default function LessonDetail() { 
  const { router } = getCurrentInstance() 
  const lessonId = router?.params?.id 
  
  const [lessonData, setLessonData] = useState<any>(null) 
  const [isEditing, setIsEditing] = useState(false) 
  
  // 独立的可编辑状态 
  const [editSubject, setEditSubject] = useState('') 
  const [editFeedback, setEditFeedback] = useState('') 
  const [editHomework, setEditHomework] = useState('') 
  const [editImages, setEditImages] = useState<string[]>([]) 

  // ⚠️ Trae：此处必须用真实 KEY，不要留空 
  const headers = { 
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
    'Content-Type': 'application/json' 
  } 

  useEffect(() => { 
    if (lessonId) fetchLessonDetail() 
  }, [lessonId]) 

  const fetchLessonDetail = async () => { 
    try { 
      const res = await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?id=eq.${lessonId}&select=*,students(name)`, 
        method: 'GET', header: headers 
      }) 
      if (res.data && res.data.length > 0) { 
        const data = res.data[0] 
        setLessonData(data) 
        setEditSubject(data.subject || '') 
        setEditFeedback(data.teacher_feedback || '') 
        setEditHomework(data.homework_title || '') 
        setEditImages(data.board_images || []) 
      } 
    } catch (e) { 
      Taro.showToast({ title: '网络异常', icon: 'none' }) 
    } 
  } 

  const handleChooseImage = async () => { 
    try { 
      const res = await Taro.chooseMedia({ count: 3, mediaType: ['image'] }) 
      const paths = res.tempFiles.map(f => f.tempFilePath) 
      setEditImages([...editImages, ...paths]) 
    } catch (e) { } 
  } 

  const handleSave = async () => { 
    Taro.showLoading({ title: '保存中...' }) 
    try { 
      await Taro.request({ 
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/lessons?id=eq.${lessonId}`, 
        method: 'PATCH', 
        header: headers, 
        data: { 
          subject: editSubject, 
          teacher_feedback: editFeedback, 
          homework_title: editHomework, 
          board_images: editImages 
        } 
      }) 
      
      setLessonData({ ...lessonData, subject: editSubject, teacher_feedback: editFeedback, homework_title: editHomework, board_images: editImages }) 
      setIsEditing(false) 
      Taro.hideLoading() 
      Taro.showToast({ title: '已同步至最新', icon: 'success' }) 
    } catch (e) { 
      Taro.hideLoading() 
      Taro.showToast({ title: '保存失败', icon: 'error' }) 
    } 
  } 

  if (!lessonData) return <View style={{ padding: '40px', textAlign: 'center' }}>加载中...</View> 

  return ( 
    <View className='detail-container'> 
      <View className='status-header'> 
        <Text className='page-title'>档案袋</Text> 
        <View className='status-badge'>已消课</View> 
      </View> 

      {/* 基础信息卡片 */} 
      <View className='section-card'> 
        <View className='section-header'> 
          <Text className='section-title'>基础信息</Text> 
          <Text className='edit-toggle' onClick={() => setIsEditing(!isEditing)}> 
            {isEditing ? '取消修改' : '全面修改'} 
          </Text> 
        </View> 
        <View className='info-row'> 
          <Text className='info-label'>上课学员 & 日期</Text> 
          <Text className='info-value'>{lessonData.students?.name} | {lessonData.lesson_date}</Text> 
        </View> 
        <View className='info-row'> 
          <Text className='info-label'>实际讲授课题</Text> 
          {isEditing ? ( 
            <Input className='edit-input' value={editSubject} onInput={(e) => setEditSubject(e.detail.value)} /> 
          ) : ( 
            <Text className='info-value'>{lessonData.subject || '未填写'}</Text> 
          )} 
        </View> 
      </View> 

      {/* 教学产出卡片 */} 
      <View className='section-card'> 
        <View className='section-header'> 
          <Text className='section-title'>教学产出</Text> 
        </View> 
        
        <View className='info-row'> 
          <Text className='info-label'>课堂板书/笔记</Text> 
          {isEditing ? ( 
            <View className='img-grid'> 
              {editImages.map((img, i) => <View key={i} className='img-box'><Image src={img} className='img-item' /></View>)} 
              <View className='img-box' onClick={handleChooseImage}><Text className='img-add'>+</Text></View> 
            </View> 
          ) : ( 
            <View className='img-grid'> 
              {editImages.length > 0 ? editImages.map((img, i) => <View key={i} className='img-box'><Image src={img} className='img-item' /></View>) : <Text className='info-value' style={{ fontSize: '14px', color: '#8B95A1' }}>暂无图片</Text>} 
            </View> 
          )} 
        </View> 

        <View className='info-row' style={{ marginTop: '24px' }}> 
          <Text className='info-label'>课后作业</Text> 
          {isEditing ? ( 
            <Input className='edit-input' value={editHomework} onInput={(e) => setEditHomework(e.detail.value)} placeholder="如：完成练习册第一章" /> 
          ) : ( 
            <Text className='info-value'>{lessonData.homework_title || '无作业'}</Text> 
          )} 
        </View> 
      </View> 

      {/* 评语卡片 */} 
      <View className='section-card'> 
        <View className='section-header'> 
          <Text className='section-title'>专属评语</Text> 
        </View> 
        {isEditing ? ( 
          <Textarea className='edit-textarea' value={editFeedback} onInput={(e) => setEditFeedback(e.detail.value)} maxlength={500} /> 
        ) : ( 
          <Text className='info-value' style={{ lineHeight: 1.6 }}>{lessonData.teacher_feedback || '暂无评语'}</Text> 
        )} 
      </View> 

      {isEditing && ( 
        <Button className='save-btn' onClick={handleSave}>保存全部修改</Button> 
      )} 
    </View> 
  ) 
}