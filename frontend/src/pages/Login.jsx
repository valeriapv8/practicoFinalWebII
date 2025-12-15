import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Obtener el usuario del localStorage para verificar su rol
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      // Redirigir según el rol del usuario
      switch (userData.role) {
        case "participante":
          navigate("/profile");
          break;
        case "administrador":
          navigate("/admin");
          break;
        case "organizador":
          navigate("/organizador");
          break;
        case "validador":
          navigate("/validador");
          break;
        default:
          navigate("/");
      }
    } else {
      setError(result.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="container">
      <div
        className="row justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="col-md-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </form>

              <div className="text-center">
                <p className="mb-0">
                  ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                </p>
                <Link to="/" className="text-decoration-none">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
