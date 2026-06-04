import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';
import OfflineBanner from './OfflineBanner';

export default function Layout() {
  return (
    <>
      <OfflineBanner />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}