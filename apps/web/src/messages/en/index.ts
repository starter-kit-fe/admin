import CookieBanner from './CookieBanner.json';
import Cookies from './Cookies.json';
import ErrorMessages from './Error.json';
import Footer from './Footer.json';
import Header from './Header.json';
import HealthStatus from './HealthStatus.json';
import Hero from './Hero.json';
import Home from './Home.json';
import LanguageSwitcher from './LanguageSwitcher.json';
import Login from './Login.json';
import NotFound from './NotFound.json';
import Privacy from './Privacy.json';
import Terms from './Terms.json';

const messages = {
  CookieBanner,
  Cookies,
  Error: ErrorMessages,
  Footer,
  Header,
  HealthStatus,
  Hero,
  Home,
  LanguageSwitcher,
  Login,
  NotFound,
  Privacy,
  Terms,
} as const;

export default messages;
