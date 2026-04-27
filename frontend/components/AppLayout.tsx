import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearAdminSession, useAdminSession } from '../hooks/useAdminSession';

const navBtnBase =
  'px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-black transition-all';

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    navBtnBase,
    isActive ? 'bg-black text-white shadow-hard-sm' : 'bg-white hover:bg-gray-50',
  ].join(' ');

interface AppLayoutProps {
  subtitle: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  subtitle,
  headerRight,
  children,
}) => {
  const navigate = useNavigate();
  const sessionUser = useAdminSession();

  const handleLogout = () => {
    clearAdminSession();
    navigate('/');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-brand-yellow border-2 border-black rounded-2xl p-6 shadow-hard">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-1 min-w-0">
            <div>
              <Link
                to="/"
                className="block text-3xl font-black tracking-tight text-brand-dark mb-1 hover:opacity-90 transition-opacity"
              >
                Spotrz
              </Link>
              <p className="text-sm font-medium opacity-80">{subtitle}</p>
            </div>
            <nav
              className="flex flex-wrap items-center gap-2"
              aria-label="Main"
            >
              <NavLink to="/" end className={navClass}>
                Matches
              </NavLink>
              {sessionUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${navBtnBase} bg-white hover:bg-gray-50`}
                >
                  Logout
                </button>
              ) : (
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
              )}
              {sessionUser && (
                <NavLink to="/admin" className={navClass}>
                  Admin
                </NavLink>
              )}
            </nav>
          </div>
          {headerRight != null && (
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              {headerRight}
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  );
};
