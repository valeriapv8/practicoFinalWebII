import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventService } from "../services/eventService";
import { inscripcionService } from "../services/inscripcionService";
import api from "../services/api";
import QRCode from "qrcode";

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para modal de inscripción
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [inscripcionLoading, setInscripcionLoading] = useState(false);

  // Estados para modal de entrada
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [entradaData, setEntradaData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching events...");
      const response = await eventService.getPublicEvents();
      console.log("Response from API:", response);
      console.log(
        "Response data type:",
        Array.isArray(response.data) ? "Array" : typeof response.data
      );
      console.log("Response data length:", response.data?.length);
      console.log("Response data:", response.data);

      if (response && response.success) {
        const eventsArray = Array.isArray(response.data)
          ? response.data
          : [response.data];
        console.log("Events array to set:", eventsArray);
        console.log("Number of events:", eventsArray.length);
        setEvents(eventsArray);
      } else {
        setError(response?.message || "Error al cargar eventos");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar eventos. Verifica que el servidor esté corriendo en http://localhost:3000"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInscripcionClick = (event) => {
    if (!isAuthenticated) {
      alert(
        "Debes iniciar sesión para inscribirte a un evento. ¿Deseas ir al login?"
      );
      const goToLogin = window.confirm("¿Deseas ir al login?");
      if (goToLogin) {
        navigate("/login");
      }
      return;
    }

    setSelectedEvent(event);
    setPaymentProof(null);
    setPaymentProofPreview(null);
    setShowInscripcionModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInscripcion = async (e) => {
    e.preventDefault();

    if (!selectedEvent) return;

    try {
      setInscripcionLoading(true);

      // Si el evento tiene precio, requiere comprobante
      if (selectedEvent.price > 0 && !paymentProof) {
        alert("Debes subir un comprobante de pago para eventos con precio");
        setInscripcionLoading(false);
        return;
      }

      // Crear inscripción
      const inscripcionResponse = await inscripcionService.createInscripcion(
        selectedEvent.id
      );

      if (!inscripcionResponse.success) {
        throw new Error(
          inscripcionResponse.message || "Error al crear inscripción"
        );
      }

      const inscripcion = inscripcionResponse.data;

      // Si hay comprobante, intentar subirlo (pero no fallar si hay error)
      if (paymentProof && selectedEvent.price > 0) {
        try {
          // Comprimir imagen antes de convertir a base64
          const compressedImage = await compressImage(paymentProof);

          // Convertir imagen comprimida a base64 para enviar
          const base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedImage);
          });

          await api.put(`/inscripciones/${inscripcion.id}/payment-proof`, {
            paymentProof: base64Image,
          });
        } catch (uploadError) {
          console.warn(
            "Error al subir comprobante, pero la inscripción se creó:",
            uploadError
          );
          // No lanzar error, la inscripción ya se creó
        }
      }

      // Cerrar modal de inscripción
      setShowInscripcionModal(false);
      setSelectedEvent(null);
      setPaymentProof(null);
      setPaymentProofPreview(null);

      // Si el evento tiene precio y se subió comprobante, solo mostrar confirmación
      if (selectedEvent.price > 0 && paymentProof) {
        alert(
          "¡Inscripción realizada exitosamente!\n\n" +
            "Tu comprobante de pago ha sido enviado y está pendiente de validación.\n" +
            "Recibirás la confirmación del organizador pronto.\n\n" +
            "Puedes ver el estado de tu entrada en tu perfil."
        );
      } else {
        // Si el evento es gratuito, mostrar el modal de entrada
        const fullInscripcion = await inscripcionService.getInscripcionById(
          inscripcion.id
        );

        // Generar QR code
        try {
          const url = await QRCode.toDataURL(fullInscripcion.data.token, {
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

        // Preparar datos para el modal de entrada
        setEntradaData({
          inscripcion: fullInscripcion.data,
          event: selectedEvent,
          user: user,
        });

        // Abrir modal de entrada
        setShowEntradaModal(true);
      }

      fetchEvents();
    } catch (error) {
      console.error("Error en inscripción:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Error al inscribirse al evento"
      );
    } finally {
      setInscripcionLoading(false);
    }
  };

  // Función para comprimir imagen (más agresiva)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob || file);
            },
            "image/jpeg",
            0.5 // Calidad 50% para reducir más el tamaño
          );
        };
      };
    });
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const closeInscripcionModal = () => {
    setShowInscripcionModal(false);
    setSelectedEvent(null);
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  const closeEntradaModal = () => {
    setShowEntradaModal(false);
    setEntradaData(null);
    setQrCodeUrl(null);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !entradaData) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `entrada-${entradaData.inscripcion.codigo}-${
      entradaData.event?.title || "evento"
    }.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Sistema de Eventos
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {isAuthenticated ? (
                <>
                  {user?.role === "participante" && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/profile">
                        Mi Perfil
                      </Link>
                    </li>
                  )}
                  {user?.role === "administrador" && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">
                        Panel de Admin
                      </Link>
                    </li>
                  )}
                  {user?.role === "organizador" && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/organizador">
                        Panel de Organizador
                      </Link>
                    </li>
                  )}
                  {user?.role === "validador" && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/validador">
                        Panel de Validador
                      </Link>
                    </li>
                  )}
                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link text-light p-0"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">
                      Registrarse
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Iniciar Sesión
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="row">
          <div className="col-12 text-center mb-5">
            <h1 className="display-4">Eventos Disponibles</h1>
            <p className="lead">Descubre y participa en los mejores eventos</p>
          </div>
        </div>

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
        ) : events.length === 0 ? (
          <div className="alert alert-info">
            No hay eventos disponibles en este momento.
          </div>
        ) : (
          <div className="row">
            {events.map((event) => (
              <div key={event.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  {event.poster && (
                    <img
                      src={event.poster}
                      className="card-img-top"
                      alt={event.title}
                      style={{ height: "250px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text text-muted small mb-2">
                      <i className="bi bi-calendar"></i>{" "}
                      {formatDate(event.date)}
                    </p>
                    <p className="card-text text-muted small mb-2">
                      <i className="bi bi-geo-alt"></i> {event.location}
                    </p>
                    <p className="card-text flex-grow-1">
                      {event.description.length > 150
                        ? `${event.description.substring(0, 150)}...`
                        : event.description}
                    </p>
                    <div className="mt-auto">
                      <div className="mb-2">
                        <span className="badge bg-primary me-1">
                          Capacidad: {event.maxCapacity}
                        </span>
                        <span className="badge bg-success">${event.price}</span>
                      </div>
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => handleInscripcionClick(event)}
                      >
                        Inscribirse
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Inscripción */}
      <div
        className={`modal fade ${showInscripcionModal ? "show" : ""}`}
        style={{ display: showInscripcionModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Inscribirse al Evento</h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeInscripcionModal}
              ></button>
            </div>

            <form onSubmit={handleInscripcion}>
              <div className="modal-body">
                {selectedEvent && (
                  <>
                    <h5>{selectedEvent.title}</h5>
                    <p className="text-muted">
                      <i className="bi bi-calendar"></i>{" "}
                      {formatDate(selectedEvent.date)}
                    </p>
                    <p className="text-muted">
                      <i className="bi bi-geo-alt"></i> {selectedEvent.location}
                    </p>
                    <p>{selectedEvent.description}</p>
                    <div className="mb-3">
                      <span className="badge bg-primary me-2">
                        Capacidad: {selectedEvent.maxCapacity}
                      </span>
                      <span className="badge bg-success">
                        Precio: ${selectedEvent.price}
                      </span>
                    </div>

                    {selectedEvent.price > 0 && (
                      <>
                        <div className="mb-4">
                          <h6 className="border-bottom pb-2">
                            Información de Pago
                          </h6>
                          <p className="text-muted mb-3">
                            Escanea el siguiente QR para realizar el pago:
                          </p>
                          <div className="text-center mb-3">
                            <img
                              src="/qr.jpeg"
                              alt="QR de Pago"
                              style={{
                                maxWidth: "300px",
                                border: "2px solid #ddd",
                                borderRadius: "8px",
                                padding: "10px",
                                backgroundColor: "#f8f9fa",
                              }}
                            />
                          </div>
                          <div className="alert alert-info">
                            <small>
                              <strong>Instrucciones:</strong>
                              <br />
                              1. Escanea el QR con tu app bancaria
                              <br />
                              2. Realiza el pago de ${selectedEvent.price}
                              <br />
                              3. Sube el comprobante de pago a continuación
                            </small>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Comprobante de Pago (Imagen)
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                          />
                          {paymentProofPreview && (
                            <div className="mt-2">
                              <img
                                src={paymentProofPreview}
                                alt="Preview"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "200px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                }}
                              />
                            </div>
                          )}
                          <small className="text-muted">
                            Sube una imagen de tu comprobante de pago
                          </small>
                        </div>
                      </>
                    )}

                    {selectedEvent.price === 0 && (
                      <div className="alert alert-info">
                        Este evento es gratuito. No necesitas comprobante de
                        pago.
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeInscripcionModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={inscripcionLoading}
                >
                  {inscripcionLoading
                    ? "Procesando..."
                    : "Confirmar Inscripción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showInscripcionModal && <div className="modal-backdrop fade show"></div>}

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

            {entradaData && (
              <div className="modal-body">
                <div className="alert alert-success text-center">
                  <h4>¡Inscripción Exitosa!</h4>
                </div>

                <div className="row">
                  {/* Información del Usuario */}
                  <div className="col-md-6 mb-4">
                    <h6 className="border-bottom pb-2">Datos del Comprador</h6>
                    <p className="mb-1">
                      <strong>Nombre:</strong> {entradaData.user?.name}
                    </p>
                    <p className="mb-1">
                      <strong>Email:</strong> {entradaData.user?.email}
                    </p>
                  </div>

                  {/* Información del Evento */}
                  <div className="col-md-6 mb-4">
                    <h6 className="border-bottom pb-2">Datos del Evento</h6>
                    <p className="mb-1">
                      <strong>Evento:</strong> {entradaData.event?.title}
                    </p>
                    <p className="mb-1">
                      <strong>Fecha:</strong>{" "}
                      {entradaData.event && formatDate(entradaData.event.date)}
                    </p>
                    <p className="mb-1">
                      <strong>Ubicación:</strong> {entradaData.event?.location}
                    </p>
                    <p className="mb-1">
                      <strong>Precio:</strong> ${entradaData.event?.price}
                    </p>
                  </div>
                </div>

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
                        {entradaData.inscripcion.codigo}
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
                      Token: {entradaData.inscripcion.token.substring(0, 16)}...
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

                <div className="alert alert-warning">
                  <small>
                    <strong>Importante:</strong> Guarda este código y el QR.
                    Necesitarás presentarlos el día del evento para ingresar.
                    {entradaData.inscripcion.paymentStatus === "pendiente" &&
                      " Tu comprobante de pago está pendiente de validación por el organizador."}
                    {entradaData.inscripcion.estado === "disponible" &&
                      entradaData.inscripcion.paymentStatus === "pagado" &&
                      " Esta entrada está lista para usar el día del evento."}
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

export default Home;
