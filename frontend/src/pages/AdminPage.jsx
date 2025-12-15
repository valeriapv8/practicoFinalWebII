import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "participante",
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data);
        setError("");
      }
    } catch (error) {
      setError("Error al cargar usuarios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleName = (role) => {
    const roles = {
      participante: "Participante",
      organizador: "Organizador",
      administrador: "Administrador",
      validador: "Validador",
    };
    return roles[role] || role;
  };

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "participante",
      isActive: true,
    });
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      isActive: userToEdit.isActive,
    });
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setError("");
    setShowDeleteModal(true);
  };

  const openPasswordModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setNewPassword("");
    setError("");
    setSuccess("");
    setShowPasswordModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await api.post("/users", formData);
      if (response.data.success) {
        setSuccess("Usuario creado exitosamente");
        setShowCreateModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al crear usuario");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const response = await api.put(`/users/${selectedUser.id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      });
      if (response.data.success) {
        setSuccess("Usuario actualizado exitosamente");
        setShowEditModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al actualizar usuario");
    }
  };

  const handleDelete = async () => {
    try {
      setError("");
      const response = await api.delete(`/users/${selectedUser.id}`);
      if (response.data.success) {
        setSuccess("Usuario eliminado exitosamente");
        setShowDeleteModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al eliminar usuario");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      setError("");
      const response = await api.put(`/users/${selectedUser.id}/password`, {
        newPassword,
      });
      if (response.data.success) {
        setSuccess("Contraseña actualizada exitosamente");
        setShowPasswordModal(false);
        setNewPassword("");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-danger">
        <div className="container-fluid">
          <span className="navbar-brand">Panel de Administración</span>
          <div className="navbar-nav ms-auto">
            <button
              className="btn btn-outline-light me-2"
              onClick={() => navigate("/")}
            >
              Inicio
            </button>
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Gestión de Usuarios</h2>
            <p className="text-muted mb-0">Bienvenido, {user?.name}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Crear Usuario
          </button>
        </div>

        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {success && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess("")}
            ></button>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge bg-info">
                          {getRoleName(u.role)}
                        </span>
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="badge bg-success">Activo</span>
                        ) : (
                          <span className="badge bg-danger">Inactivo</span>
                        )}
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => openEditModal(u)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => openPasswordModal(u)}
                            title="Cambiar Contraseña"
                          >
                            <i className="bi bi-key"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => openDeleteModal(u)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      <div
        className={`modal fade ${showCreateModal ? "show" : ""}`}
        style={{ display: showCreateModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear Usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              ></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="participante">Participante</option>
                    <option value="organizador">Organizador</option>
                    <option value="administrador">Administrador</option>
                    <option value="validador">Validador</option>
                  </select>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <label className="form-check-label">Usuario Activo</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showCreateModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal Editar Usuario */}
      <div
        className={`modal fade ${showEditModal ? "show" : ""}`}
        style={{ display: showEditModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar Usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="participante">Participante</option>
                    <option value="organizador">Organizador</option>
                    <option value="administrador">Administrador</option>
                    <option value="validador">Validador</option>
                  </select>
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <label className="form-check-label">Usuario Activo</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showEditModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal Eliminar Usuario */}
      <div
        className={`modal fade ${showDeleteModal ? "show" : ""}`}
        style={{ display: showDeleteModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Eliminar Usuario</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <p>
                ¿Estás seguro de que deseas eliminar al usuario{" "}
                <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
              </p>
              <p className="text-danger">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal Cambiar Contraseña */}
      <div
        className={`modal fade ${showPasswordModal ? "show" : ""}`}
        style={{ display: showPasswordModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Cambiar Contraseña</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowPasswordModal(false)}
              ></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <p>
                  Usuario: <strong>{selectedUser?.name}</strong> (
                  {selectedUser?.email})
                </p>
                <div className="mb-3">
                  <label className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showPasswordModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default AdminPage;
