import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminPage from "./pages/AdminPage";
import OrganizadorPage from "./pages/OrganizadorPage";
import ValidadorPage from "./pages/ValidadorPage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["administrador"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizador"
            element={
              <ProtectedRoute allowedRoles={["organizador"]}>
                <OrganizadorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/validador"
            element={
              <ProtectedRoute allowedRoles={["validador"]}>
                <ValidadorPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
