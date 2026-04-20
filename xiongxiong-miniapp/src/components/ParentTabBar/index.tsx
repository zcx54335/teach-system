import { View, Text } from '@tarojs/components' 
import Taro from '@tarojs/taro' 
import './index.css' 

export default function ParentTabBar({ current }: { current: 'home' | 'record' | 'profile' }) { 
  const tabs = [ 
    { key: 'home', text: '首页', path: '/pages/parent/home/index' }, 
    { key: 'record', text: '作业本', path: '/pages/parent/record/index' }, 
    { key: 'profile', text: '我的', path: '/pages/parent/profile/index' } 
  ] 

  const switchTab = (path: string) => { 
    Taro.reLaunch({ url: path }) // 家长端页面均使用 reLaunch 进行平铺跳转 
  } 

  return ( 
    <View className='parent-tab-bar'> 
      {tabs.map(tab => ( 
        <View key={tab.key} className={`tab-item ${current === tab.key ? 'active' : ''}`} onClick={() => switchTab(tab.path)}> 
          <View className='tab-indicator'></View> 
          <Text>{tab.text}</Text> 
        </View> 
      ))} 
    </View> 
  ) 
}