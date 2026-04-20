import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css' // 依然使用我们刚才写好的高定版UI

export default function Login() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!account || !password) {
      Taro.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '验证身份中...' })

    try {
      // 【第一步：查询纯净的 users 表】
      const userRes = await Taro.request({
        url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/users?phone=eq.${account}&select=*`,
        method: 'GET',
        header: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs', 
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
        }
      })

      const users = userRes.data || []
      if (users.length === 0) {
        Taro.hideLoading()
        Taro.showToast({ title: '账号不存在', icon: 'error' })
        return
      }

      const user = users[0]

      if (user.password !== password) {
        Taro.hideLoading()
        Taro.showToast({ title: '密码错误', icon: 'error' })
        return
      }

      // 密码正确，存入基础用户信息
      Taro.setStorageSync('userId', user.id) // 这是登录人的ID（家长或老师）
      Taro.setStorageSync('userName', user.name)
      Taro.setStorageSync('userRole', user.role)

      // 【第二步：根据角色分流与级联查询】
      if (user.role === 'teacher') {
        // 老师直接进后台 (⚠️ 核心修复：Tab页必须用 switchTab 跳转)
        Taro.hideLoading()
        Taro.switchTab({ url: '/pages/teacher/schedule/index' })
        
      } else if (user.role === 'parent') {
        // 家长：必须去 students 表查出他的孩子！
        const studentRes = await Taro.request({
          url: `https://xnvqqddrnaynucvatvoq.supabase.co/rest/v1/students?parent_id=eq.${user.id}&select=*`,
          method: 'GET',
          header: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs'
          }
        })

        const students = studentRes.data || []
        if (students.length > 0) {
          // 存入孩子的专属信息
          Taro.setStorageSync('studentId', students[0].id)
          Taro.setStorageSync('studentName', students[0].name)
        } else {
          Taro.setStorageSync('studentId', null)
          Taro.setStorageSync('studentName', '未绑定学生')
        }

        // 家长没有配 TabBar，所以用 reLaunch 彻底清空路由栈即可
        Taro.hideLoading()
        Taro.reLaunch({ url: '/pages/parent/home/index' })
        
      } else {
        Taro.hideLoading()
        Taro.showToast({ title: '未知角色，无法跳转', icon: 'none' })
      }

    } catch (err) {
      Taro.hideLoading()
      Taro.showToast({ title: '网络异常', icon: 'error' })
      console.error('登录异常:', err)
    }
  }

  return (
    <View className='login-container'>
      <View className='brand-section'>
        {/* ⚠️ 修复：统一品牌名为熊熊思维 */}
        <Text className='brand-title'>熊熊思维</Text>
        <Text className='brand-subtitle'>启发每个孩子的无限可能</Text>
      </View>

      <View className='form-section'>
        <View className='input-group'>
          <Input 
            className='minimal-input'
            type='text'
            placeholder='请输入账号'
            placeholderClass='input-placeholder'
            value={account}
            onInput={(e) => setAccount(e.detail.value)}
          />
        </View>
        <View className='input-group'>
          <Input 
            className='minimal-input'
            type='text'
            password
            placeholder='请输入密码'
            placeholderClass='input-placeholder'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        <View className='action-section'>
          <Button className='login-btn' onClick={handleLogin}>
            进入熊熊
          </Button>
        </View>
      </View>
    </View>
  )
}