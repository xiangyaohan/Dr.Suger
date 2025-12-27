import ChatPage from './pages/ChatPage';
import RecordsPage from './pages/RecordsPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '智能对话',
    path: '/',
    element: <ChatPage />
  },
  {
    name: '数据记录',
    path: '/records',
    element: <RecordsPage />
  },
  {
    name: '数据分析',
    path: '/analysis',
    element: <AnalysisPage />
  },
  {
    name: '历史记录',
    path: '/history',
    element: <HistoryPage />
  },
  {
    name: '个人档案',
    path: '/profile',
    element: <ProfilePage />
  },
  {
    name: 'Agent监控',
    path: '/admin',
    element: <AdminPage />,
    visible: false
  },
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />,
    visible: false
  },
  {
    name: '404',
    path: '/404',
    element: <NotFound />,
    visible: false
  }
];

export default routes;
