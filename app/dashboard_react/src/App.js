import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './layouts/Login';
import DashboardHome from './layouts/DashboardHome';
import StatsRobot from './layouts/StatsRobot';
import Converter from './layouts/Converter';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />}></Route>
          <Route path="/home" element={<DashboardHome />}></Route>
          <Route path="/stats" element={<StatsRobot />}></Route>
          <Route path="/converter" element={<Converter />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
