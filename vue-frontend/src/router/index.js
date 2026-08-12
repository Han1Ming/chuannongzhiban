import { createRouter, createWebHistory } from 'vue-router'
import { getToken, decodeJwt } from '@/utils/auth'
import MainLayout from '@/components/layout/MainLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const routes = [
  { path: '/', component: MainLayout, children: [
    { path: '', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
    { path: 'chat', name: 'Chat', component: () => import('@/views/chat/ChatView.vue'), meta: { title: '智能问答', auth: true } },
    { path: 'news', name: 'News', component: () => import('@/views/news/NewsList.vue'), meta: { title: '农业新闻' } },
    { path: 'news/:id', name: 'NewsDetail', component: () => import('@/views/news/NewsDetail.vue'), meta: { title: '新闻详情' } },
    { path: 'knowledge', name: 'Knowledge', component: () => import('@/views/knowledge/KnowledgeView.vue'), meta: { title: '农技知识库', auth: true } },
    { path: 'knowledge-graph', name: 'KnowledgeGraph', component: () => import('@/views/knowledge-graph/KnowledgeGraph.vue'), meta: { title: '知识图谱' } },
    { path: 'farm/calculate', name: 'FarmCalc', component: () => import('@/views/farm/FarmCalc.vue'), meta: { title: '收益计算', auth: true } },
    { path: 'farm/match', name: 'FarmMatch', component: () => import('@/views/farm/FarmMatch.vue'), meta: { title: '智能匹配', auth: true } },
    { path: 'profile', name: 'Profile', component: () => import('@/views/user/Profile.vue'), meta: { title: '个人中心', auth: true } }
  ]},
  { path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue'), meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue'), meta: { title: '注册' } },
  { path: '/admin', component: AdminLayout, meta: { auth: true, roles: ['ADMIN'] }, children: [
    { path: '', name: 'AdminDash', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '仪表盘' } },
    { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue'), meta: { title: '用户管理' } },
    { path: 'sub-admins', name: 'AdminSubAdmins', component: () => import('@/views/admin/SubAdmins.vue'), meta: { title: '子管理员管理' } },
    { path: 'news', name: 'AdminNews', component: () => import('@/views/admin/NewsManage.vue'), meta: { title: '新闻管理' } },
    { path: 'knowledge', name: 'AdminKnowledge', component: () => import('@/views/admin/KnowledgeManage.vue'), meta: { title: '知识库管理' } },
    { path: 'announcements', name: 'AdminAnn', component: () => import('@/views/admin/Announcements.vue'), meta: { title: '公告管理' } }
  ]},
  { path: '/gov', name: 'GovScreen', component: () => import('@/views/gov/GovScreen.vue'), meta: { title: '政府大屏', auth: true, roles: ['ADMIN','GOV'] } }
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach((to, _, next) => {
  document.title = to.meta.title ? `${to.meta.title} · 川农智伴` : '川农智伴'
  if (to.meta.auth || to.meta.roles) {
    const token = getToken()
    if (!token) return next({ name: 'Login', query: { redirect: to.fullPath } })
    if (to.meta.roles?.length) {
      const role = decodeJwt(token)?.role
      if (!to.meta.roles.includes(role)) return next({ name: 'Home' })
    }
  }
  next()
})

export default router
