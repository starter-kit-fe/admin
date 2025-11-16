import Common from './Common.json';
import CacheMonitor from './CacheMonitor.json';
import CookieBanner from './CookieBanner.json';
import Cookies from './Cookies.json';
import DepartmentManagement from './DepartmentManagement.json';
import DictManagement from './DictManagement.json';
import ErrorMessages from './Error.json';
import Footer from './Footer.json';
import Header from './Header.json';
import HealthStatus from './HealthStatus.json';
import Hero from './Hero.json';
import Home from './Home.json';
import JobManagement from './JobManagement.json';
import OnlineUserManagement from './OnlineUserManagement.json';
import LanguageSwitcher from './LanguageSwitcher.json';
import Login from './Login.json';
import LoginLogManagement from './LoginLogManagement.json';
import NavUser from './NavUser.json';
import NotFound from './NotFound.json';
import Privacy from './Privacy.json';
import SelectionBanner from './SelectionBanner.json';
import RoleManagement from './RoleManagement.json';
import MenuManagement from './MenuManagement.json';
import ConfigManagement from './ConfigManagement.json';
import NoticeManagement from './NoticeManagement.json';
import PostManagement from './PostManagement.json';
import OperLogManagement from './OperLogManagement.json';
import ServerMonitor from './ServerMonitor.json';
import Terms from './Terms.json';
import ThemeToggle from './ThemeToggle.json';
import UserManagement from './UserManagement.json';

const messages = {
  Common,
  CacheMonitor,
  CookieBanner,
  Cookies,
  DepartmentManagement,
  DictManagement,
  Error: ErrorMessages,
  Footer,
  Header,
  HealthStatus,
  Hero,
  Home,
  JobManagement,
  OnlineUserManagement,
  LanguageSwitcher,
  Login,
  LoginLogManagement,
  NavUser,
  NotFound,
  Privacy,
  RoleManagement,
  MenuManagement,
  ConfigManagement,
  NoticeManagement,
  PostManagement,
  OperLogManagement,
  ServerMonitor,
  SelectionBanner,
  Terms,
  ThemeToggle,
  UserManagement,
} as const;

export default messages;
