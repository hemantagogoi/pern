import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadMe } from './features/auth/authSlice.js';
import DashboardLayout from './components/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './features/landing/LandingPage.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import RegisterPage from './features/auth/RegisterPage.jsx';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage.jsx';
import AdminOverview from './features/admin/AdminOverview.jsx';
import CatalogPage from './features/admin/CatalogPage.jsx';
import QuestionsPage from './features/admin/QuestionsPage.jsx';
import UsersPage from './features/admin/UsersPage.jsx';
import FacultyOverview from './features/faculty/FacultyOverview.jsx';
import FacultySubjects from './features/faculty/FacultySubjects.jsx';
import GeneratePaper from './features/faculty/GeneratePaper.jsx';
import FacultyQuestionBank from './features/faculty/FacultyQuestionBank.jsx';

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    if (localStorage.getItem('token')) dispatch(loadMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout type="admin" />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/catalog" element={<CatalogPage />} />
            <Route path="/admin/questions" element={<QuestionsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['faculty']} />}>
          <Route element={<DashboardLayout type="faculty" />}>
            <Route path="/faculty" element={<FacultyOverview />} />
            <Route path="/faculty/subjects" element={<FacultySubjects />} />
            <Route path="/faculty/questions" element={<FacultyQuestionBank />} />
            <Route path="/faculty/generate" element={<GeneratePaper />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
