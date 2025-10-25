import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './AuthContext';
import NeuralNetworkBg from './components/NeuralNetworkBg';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import RegistrationForm4 from './components/RegistrationForm4';
import TeamRegistrationSelector from './components/TeamRegistrationSelector';
import AdminDashboard from './components/AdminDashboard';
import TeamDetail from './components/TeamDetail';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NeuralNetworkBg />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/register"
            element={
              <ProtectedRoute adminOnly={false}>
                <TeamRegistrationSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register4"
            element={
              <ProtectedRoute adminOnly={false}>
                <RegistrationForm4 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/team/:teamName"
            element={
              <ProtectedRoute adminOnly={true}>
                <TeamDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
