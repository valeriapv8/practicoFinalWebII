import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { inscripcionService } from "../services/inscripcionService";
import QRCode from "qrcode";
const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para modal de entrada
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    fetchInscripciones();
  }, []);

  const fetchInscripciones = async () => {
    try {
      setLoading(true);
      const response = await inscripcionService.getMyInscripciones();
      if (response.success) {
        setInscripciones(response.data || []);
        setError("");
      }
    } catch (error) {
      setError("Error al cargar tus inscripciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pendiente: "bg-warning",
      pagado: "bg-success",
      rechazado: "bg-danger",
    };
    return badges[status] || "bg-secondary";
  };

  const getPaymentStatusText = (status) => {
    const texts = {
      pendiente: "Pendiente",
      pagado: "Pagado",
      rechazado: "Rechazado",
    };
    return texts[status] || status;
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      disponible: "bg-primary",
      usado: "bg-success",
      gastado: "bg-secondary",
    };
    return badges[estado] || "bg-secondary";
  };

  const getEstadoText = (estado) => {
    const texts = {
      disponible: "Disponible",
      usado: "Usado",
      gastado: "Gastado",
    };
    return texts[estado] || estado;
  };

  const handleVerEntrada = async (inscripcion) => {
    setSelectedEntrada(inscripcion);
    setShowEntradaModal(true);

    // Generar QR code si el pago está aceptado
    if (inscripcion.paymentStatus === "pagado" && inscripcion.token) {
      try {
        const url = await QRCode.toDataURL(inscripcion.token, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error("Error generando QR:", error);
        setQrCodeUrl(null);
      }
    } else {
      setQrCodeUrl(null);
    }
  };

  const closeEntradaModal = () => {
    setShowEntradaModal(false);
    setSelectedEntrada(null);
    setQrCodeUrl(null);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !selectedEntrada) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `entrada-${selectedEntrada.codigo}-${
      selectedEntrada.event?.title || "evento"
    }.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Mi Perfil</span>
          <div className="navbar-nav ms-auto">
            <Link className="nav-link" to="/">
              Inicio
            </Link>
            <button
              className="nav-link btn btn-link text-light p-0"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="row">
          {/* Información del Usuario */}
          <div className="col-md-4 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Mis Datos</h5>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <strong>Nombre:</strong> {user?.name}
                </p>
                <p className="mb-2">
                  <strong>Email:</strong> {user?.email}
                </p>
                <p className="mb-0">
                  <strong>Rol:</strong> Participante
                </p>
              </div>
            </div>
          </div>

          {/* Mis Inscripciones */}
          <div className="col-md-8">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Mis Entradas</h5>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : inscripciones.length === 0 ? (
                  <div className="alert alert-info">
                    No tienes entradas aún. <a href="/">Explora eventos</a> e
                    inscríbete.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Evento</th>
                          <th>Fecha</th>
                          <th>Estado Pago</th>
                          <th>Estado Entrada</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inscripciones.map((inscripcion) => (
                          <tr key={inscripcion.id}>
                            <td>
                              <strong>{inscripcion.event?.title}</strong>
                              <br />
                              <small className="text-muted">
                                {inscripcion.event?.location}
                              </small>
                            </td>
                            <td>
                              {inscripcion.event?.date &&
                                formatDate(inscripcion.event.date)}
                            </td>
                            <td>
                              <span
                                className={`badge ${getPaymentStatusBadge(
                                  inscripcion.paymentStatus
                                )}`}
                              >
                                {getPaymentStatusText(
                                  inscripcion.paymentStatus
                                )}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${getEstadoBadge(
                                  inscripcion.estado
                                )}`}
                              >
                                {getEstadoText(inscripcion.estado)}
                              </span>
                              {inscripcion.entryDate && (
                                <>
                                  <br />
                                  <small className="text-muted">
                                    {formatDate(inscripcion.entryDate)}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleVerEntrada(inscripcion)}
                              >
                                <i className="bi bi-ticket"></i> Ver Entrada
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Entrada */}
      <div
        className={`modal fade ${showEntradaModal ? "show" : ""}`}
        style={{ display: showEntradaModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">Tu Entrada</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={closeEntradaModal}
              ></button>
            </div>

            {selectedEntrada && (
              <div className="modal-body">
                {selectedEntrada.paymentStatus === "pagado" ? (
                  <div className="alert alert-success text-center">
                    <h4>¡Entrada Válida!</h4>
                  </div>
                ) : selectedEntrada.paymentStatus === "pendiente" ? (
                  <div className="alert alert-warning text-center">
                    <h4>Pago Pendiente de Validación</h4>
                    <p className="mb-0">
                      Tu comprobante está siendo revisado por el organizador
                    </p>
                  </div>
                ) : (
                  <div className="alert alert-danger text-center">
                    <h4>Pago Rechazado</h4>
                    <p className="mb-0">
                      Tu comprobante de pago fue rechazado. Contacta al
                      organizador.
                    </p>
                  </div>
                )}

                <div className="row">
                  {/* Información del Usuario */}
                  <div className="col-md-6 mb-4">
                    <h6 className="border-bottom pb-2">Datos del Comprador</h6>
                    <p className="mb-1">
                      <strong>Nombre:</strong> {user?.name}
                    </p>
                    <p className="mb-1">
                      <strong>Email:</strong> {user?.email}
                    </p>
                  </div>

                  {/* Información del Evento */}
                  <div className="col-md-6 mb-4">
                    <h6 className="border-bottom pb-2">Datos del Evento</h6>
                    <p className="mb-1">
                      <strong>Evento:</strong> {selectedEntrada.event?.title}
                    </p>
                    <p className="mb-1">
                      <strong>Fecha:</strong>{" "}
                      {selectedEntrada.event?.date &&
                        formatDate(selectedEntrada.event.date)}
                    </p>
                    <p className="mb-1">
                      <strong>Ubicación:</strong>{" "}
                      {selectedEntrada.event?.location}
                    </p>
                    <p className="mb-1">
                      <strong>Precio:</strong> ${selectedEntrada.event?.price}
                    </p>
                  </div>
                </div>

                {selectedEntrada.paymentStatus === "pagado" && (
                  <div className="row">
                    {/* Código de Entrada */}
                    <div className="col-md-6 mb-4">
                      <h6 className="border-bottom pb-2">Código de Entrada</h6>
                      <div className="alert alert-info text-center">
                        <strong
                          style={{
                            fontSize: "2rem",
                            letterSpacing: "3px",
                            fontFamily: "monospace",
                          }}
                        >
                          {selectedEntrada.codigo}
                        </strong>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="col-md-6 mb-4">
                      <h6 className="border-bottom pb-2">Código QR</h6>
                      <div
                        className="border p-4 text-center bg-light"
                        style={{
                          minHeight: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            style={{ maxWidth: "100%", height: "auto" }}
                          />
                        ) : (
                          <div>
                            <div className="mb-2" style={{ fontSize: "3rem" }}>
                              📱
                            </div>
                            <p className="text-muted mb-0">Generando QR...</p>
                          </div>
                        )}
                      </div>
                      <p className="small text-muted text-center mt-2">
                        Token: {selectedEntrada.token.substring(0, 16)}...
                      </p>
                      {qrCodeUrl && (
                        <div className="text-center mt-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleDownloadQR}
                          >
                            <i className="bi bi-download"></i> Descargar QR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEntrada.paymentStatus === "pendiente" && (
                  <div className="alert alert-info text-center my-4">
                    <p className="mb-0">
                      <strong>
                        El código de entrada y QR estarán disponibles una vez
                        que el organizador valide tu comprobante de pago.
                      </strong>
                    </p>
                  </div>
                )}

                {selectedEntrada.paymentStatus === "rechazado" && (
                  <div className="alert alert-danger text-center my-4">
                    <p className="mb-0">
                      <strong>
                        No puedes acceder a la entrada porque tu comprobante de
                        pago fue rechazado. Por favor, contacta al organizador
                        del evento.
                      </strong>
                    </p>
                  </div>
                )}

                <div className="alert alert-warning">
                  <small>
                    <strong>Importante:</strong> Guarda este código y el QR.
                    Necesitarás presentarlos el día del evento para ingresar.
                    {selectedEntrada.paymentStatus === "pendiente" &&
                      " Tu comprobante de pago está pendiente de validación por el organizador."}
                    {selectedEntrada.estado === "usado" ||
                    selectedEntrada.estado === "gastado"
                      ? " Esta entrada ya fue usada y no puede utilizarse nuevamente."
                      : selectedEntrada.estado === "disponible" &&
                        selectedEntrada.paymentStatus === "pagado"
                      ? " Esta entrada está lista para usar el día del evento."
                      : ""}
                  </small>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeEntradaModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showEntradaModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default Profile;
