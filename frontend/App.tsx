import React from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { StatusIndicator } from "./components/StatusIndicator";
import { useMatchData } from "./hooks/useMatchData";
import { AdminCommentaryPage } from "./pages/AdminCommentaryPage";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

const HomeRoute: React.FC = () => {
  const matchData = useMatchData();
  return (
    <AppLayout
      subtitle="Real-time match data demoaaaa"
      headerRight={
        <>
          <StatusIndicator status={matchData.status} />
          {matchData.wsError && (
            <span className="text-xs font-mono bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded">
              WS: {matchData.wsError}
            </span>
          )}
        </>
      }
    >
      <HomePage matchData={matchData} />
    </AppLayout>
  );
};

const AdminRoute: React.FC = () => (
  <AppLayout
    subtitle="Create matches and post commentary"
    headerRight={
      <span className="text-xs font-bold uppercase tracking-wide bg-white border-2 border-black rounded-full px-3 py-1.5 shadow-hard-sm">
        Admin
      </span>
    }
  >
    <AdminPage />
  </AppLayout>
);

const AdminCommentaryRoute: React.FC = () => (
  <AppLayout
    subtitle="Post commentary for a match"
    headerRight={
      <span className="text-xs font-bold uppercase tracking-wide bg-white border-2 border-black rounded-full px-3 py-1.5 shadow-hard-sm">
        Commentary
      </span>
    }
  >
    <AdminCommentaryPage />
  </AppLayout>
);

const LoginRoute: React.FC = () => (
  <AppLayout
    subtitle="Sign in to your account"
    headerRight={
      <span className="text-xs font-bold uppercase tracking-wide bg-white border-2 border-black rounded-full px-3 py-1.5 shadow-hard-sm">
        Login
      </span>
    }
  >
    <LoginPage />
  </AppLayout>
);

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<HomeRoute />} />
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/admin" element={<AdminRoute />} />
    <Route path="/admin/:matchId" element={<AdminCommentaryRoute />} />
  </Routes>
);

export default App;
