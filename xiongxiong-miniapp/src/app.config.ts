export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/parent/home/index',
    'pages/parent/record/index',
    'pages/parent/profile/index',
    'pages/teacher/schedule/index',
    'pages/teacher/lesson_form/index',
    'pages/teacher/lesson_detail/index',
    'pages/teacher/homework_review/index',
    'pages/teacher/students/index',
    'pages/teacher/homework/index',
    'pages/teacher/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '熊熊思维',
    navigationBarTextStyle: 'black'
  },
  // 👇 下面这部分就是让底部 4 个导航按钮“重见天日”的魔法！
  tabBar: {
    color: '#8B95A1',
    selectedColor: '#00E599',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/teacher/schedule/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/teacher/students/index',
        text: '学员库'
      },
      {
        pagePath: 'pages/teacher/homework/index',
        text: '批改作业'
      },
      {
        pagePath: 'pages/teacher/profile/index',
        text: '我的'
      }
    ]
  }
})