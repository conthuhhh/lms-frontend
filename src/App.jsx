import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import SubjectsManagement from './pages/admin/SubjectsManagement';
import AdminCourseManagement from './pages/admin/AdminCourseManagement';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourseDetail from './pages/instructor/InstructorCourseDetail';
import CreateCourse from './pages/instructor/CreateCourse';
import StudentDashboard from './pages/student/StudentDashboard';
import CourseAssignments from './pages/student/CourseAssignments';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}><UsersManagement /></ProtectedRoute>
              } />
              <Route path="/admin/subjects" element={
                <ProtectedRoute allowedRoles={['admin']}><SubjectsManagement /></ProtectedRoute>
              } />
              <Route path="/admin/courses" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminCourseManagement /></ProtectedRoute>
              } />

              {/* Instructor */}
              <Route path="/instructor" element={
                <ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute>
              } />
              <Route path="/instructor/create" element={
                <ProtectedRoute allowedRoles={['instructor']}><CreateCourse /></ProtectedRoute>
              } />
              <Route path="/instructor/course/:id" element={
                <ProtectedRoute allowedRoles={['instructor']}><InstructorCourseDetail /></ProtectedRoute>
              } />

              {/* Student */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
              } />
              <Route path="/student/course/:id/assignments" element={
                <ProtectedRoute allowedRoles={['student']}><CourseAssignments /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
