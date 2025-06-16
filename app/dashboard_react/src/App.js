import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PageTransitionWrapper from './components/PageTransitionWrapper';
import Converter from './layouts/Converter/Converter';
import YMConnect from './layouts/YMConnect/YMConnect';
import DashboardHome from './layouts/DashboardHome';
import React, { useEffect, useState } from 'react';
import Login from './layouts/Login';
import './App.css';



// ProtectedRoute component
function ProtectedRoute({ user, allowed, children, redirectTo }) {
  if (!user) return <Navigate to="/" replace />;
  if (!allowed.includes(user.type)) return <Navigate to={redirectTo} replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null); // { username, type }

  // Persist login in sessionStorage (optional)
  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);
  useEffect(() => {
    if (user) sessionStorage.setItem('user', JSON.stringify(user));
    else sessionStorage.removeItem('user');
  }, [user]);

  // Login handler
  const handleLogin = (userObj) => {
    setUser(userObj);
  };

  // Logout handler
  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user
            ? (user.type === 'admin' ? <Navigate to="/home" replace /> : <Navigate to="/ymconnect" replace />)
            : <Login onLogin={handleLogin} />
        } />
        <Route path="/home" element={
          <ProtectedRoute user={user} allowed={['admin']} redirectTo="/ymconnect">
            <DashboardHome user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } />
        <Route path="/converter" element={
          <ProtectedRoute user={user} allowed={['admin']} redirectTo="/ymconnect">
            <PageTransitionWrapper><Converter user={user} onLogout={handleLogout} /></PageTransitionWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ymconnect" element={
          <ProtectedRoute user={user} allowed={['admin', 'user']} redirectTo={user?.type === 'admin' ? '/home' : '/ymconnect'}>
            <PageTransitionWrapper><YMConnect user={user} onLogout={handleLogout} /></PageTransitionWrapper>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
