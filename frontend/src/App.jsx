import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Viewer from "./pages/Viewer";
import "./App.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="navbar">
      <Link to="/" className="brand">
        3D Object Viewer
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="hint">{user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/viewer"
          element={
            <ProtectedRoute>
              <Viewer />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/viewer" replace />} />
      </Routes>
    </>
  );
}
