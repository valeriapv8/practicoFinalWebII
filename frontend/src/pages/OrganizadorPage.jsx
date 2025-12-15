import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventService } from "../services/eventService";
import { inscripcionService } from "../services/inscripcionService";
import MapPicker from "../components/MapPicker";
//eslint-disable-next-line no-unused-vars
import api from "../services/api";

const OrganizadorPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInscripcionesModal, setShowInscripcionesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [inscripciones, setInscripciones] = useState([]);
  const [loadingInscripciones, setLoadingInscripciones] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteInscripcionModal, setShowDeleteInscripcionModal] =
    useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    latitude: "",
    longitude: "",
    poster: "",
    maxCapacity: 100,
    price: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getMyEvents();
      if (response.success) {
        setEvents(response.data);
        setError("");
      }
    } catch (error) {
      setError("Error al cargar eventos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openCreateModal = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      latitude: "",
      longitude: "",
      poster: "",
      maxCapacity: 100,
      price: 0,
    });
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    const eventDate = new Date(event.date);
    setFormData({
      title: event.title,
      description: event.description,
      date: eventDate.toISOString().split("T")[0],
      time: eventDate.toTimeString().split(" ")[0].substring(0, 5),
      location: event.location,
      latitude: event.latitude || "",
      longitude: event.longitude || "",
      poster: event.poster || "",
      maxCapacity: event.maxCapacity,
      price: event.price,
    });
    setError("");
    setSuccess("");
    setShowEditModal(true);
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setError("");
    setShowDeleteModal(true);
  };

  const openInscripcionesModal = async (event) => {
    setSelectedEvent(event);
    setFilterPaymentStatus("all");
    setShowInscripcionesModal(true);
    await fetchInscripciones(event.id);
  };

  const fetchInscripciones = async (eventId) => {
    try {
      setLoadingInscripciones(true);
      const response = await inscripcionService.getEventInscripciones(eventId);
      if (response.success) {
        setInscripciones(response.data || []);
      }
    } catch (error) {
      console.error("Error al cargar inscripciones:", error);
      setError("Error al cargar inscripciones");
    } finally {
      setLoadingInscripciones(false);
    }
  };

  const handleVerComprobante = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setShowComprobanteModal(true);
  };

  const handleValidatePayment = async (inscripcionId, action) => {
    try {
      const response = await inscripcionService.validatePayment(
        inscripcionId,
        action
      );
      if (response.success) {
        setSuccess(
          `Pago ${action === "accept" ? "aceptado" : "rechazado"} exitosamente`
        );
        setShowComprobanteModal(false);
        setSelectedInscripcion(null);
        await fetchInscripciones(selectedEvent.id);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al validar pago");
    }
  };

  const getFilteredInscripciones = () => {
    if (filterPaymentStatus === "all") {
      return inscripciones;
    }
    return inscripciones.filter((i) => i.paymentStatus === filterPaymentStatus);
  };

  const handleDeleteInscripcion = async () => {
    try {
      const response = await inscripcionService.deleteInscripcion(
        selectedInscripcion.id
      );
      if (response.success) {
        setSuccess("Inscripción eliminada exitosamente");
        setShowDeleteInscripcionModal(false);
        setSelectedInscripcion(null);
        await fetchInscripciones(selectedEvent.id);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Error al eliminar inscripción"
      );
    }
  };

  const openDeleteInscripcionModal = (inscripcion) => {
    setSelectedInscripcion(inscripcion);
    setShowDeleteInscripcionModal(true);
  };

  const handleDownloadList = () => {
    if (!selectedEvent || inscripciones.length === 0) return;

    const headers = [
      "Participante",
      "Email",
      "Fecha Inscripción",
      "Estado Pago",
      "Código Entrada",
    ];
    const rows = inscripciones.map((i) => [
      i.user?.name || "",
      i.user?.email || "",
      new Date(i.createdAt).toLocaleDateString("es-ES"),
      i.paymentStatus === "pagado"
        ? "Aceptado"
        : i.paymentStatus === "pendiente"
        ? "Pendiente"
        : "Rechazado",
      i.paymentStatus === "pagado" ? i.codigo : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `inscritos_${selectedEvent.title.replace(/\s/g, "_")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openStatsModal = async (event) => {
    setSelectedEvent(event);
    setShowStatsModal(true);
    await fetchInscripciones(event.id);
  };

  const getEventStats = () => {
    if (!selectedEvent || !inscripciones) return null;

    const inscritosTotal = inscripciones.length;
    const aceptados = inscripciones.filter(
      (i) => i.paymentStatus === "pagado"
    ).length;
    const pendientes = inscripciones.filter(
      (i) => i.paymentStatus === "pendiente"
    ).length;
    const rechazados = inscripciones.filter(
      (i) => i.paymentStatus === "rechazado"
    ).length;
    const asistentesConfirmados = inscripciones.filter(
      (i) => i.paymentStatus === "pagado" && i.estado === "usado"
    ).length;
    const cuposLibres = selectedEvent.maxCapacity - aceptados;

    return {
      inscritosTotal,
      aceptados,
      pendientes,
      rechazados,
      asistentesConfirmados,
      cuposLibres,
      capacidadTotal: selectedEvent.maxCapacity,
      porcentajeOcupacion: (
        (aceptados / selectedEvent.maxCapacity) *
        100
      ).toFixed(1),
    };
  };

  const handleLocationChange = useCallback((lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        location: formData.location,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        poster: formData.poster || null,
        maxCapacity: parseInt(formData.maxCapacity),
        price: parseFloat(formData.price),
      };

      const response = await eventService.createEvent(eventData);
      if (response.success) {
        setSuccess("Evento creado exitosamente");
        setShowCreateModal(false);
        fetchEvents();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al crear evento");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        location: formData.location,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        poster: formData.poster || null,
        maxCapacity: parseInt(formData.maxCapacity),
        price: parseFloat(formData.price),
      };

      const response = await eventService.updateEvent(
        selectedEvent.id,
        eventData
      );
      if (response.success) {
        setSuccess("Evento actualizado exitosamente");
        setShowEditModal(false);
        fetchEvents();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al actualizar evento");
    }
  };

  const handleDelete = async () => {
    try {
      setError("");
      const response = await eventService.deleteEvent(selectedEvent.id);
      if (response.success) {
        setSuccess("Evento eliminado exitosamente");
        setShowDeleteModal(false);
        fetchEvents();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al eliminar evento");
    }
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

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success">
        <div className="container-fluid">
          <span className="navbar-brand">Panel de Organizador</span>
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
            <h2>Mis Eventos</h2>
            <p className="text-muted mb-0">Bienvenido, {user?.name}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Crear Evento
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
          <div className="row">
            {events.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-info">
                  No tienes eventos creados. ¡Crea tu primer evento!
                </div>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    {event.poster && (
                      <img
                        src={event.poster}
                        className="card-img-top"
                        alt={event.title}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{event.title}</h5>
                      <p className="card-text text-muted small">
                        {formatDate(event.date)}
                      </p>
                      <p className="card-text">
                        {event.description.substring(0, 100)}...
                      </p>
                      <div className="mb-2">
                        <span className="badge bg-primary me-1">
                          Capacidad: {event.inscripcionesCount || 0}/
                          {event.maxCapacity}
                        </span>
                        <span className="badge bg-success">${event.price}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-info w-100 mb-2"
                        onClick={() => openInscripcionesModal(event)}
                      >
                        <i className="bi bi-people"></i> Ver Inscritos
                      </button>
                      <button
                        className="btn btn-sm btn-secondary w-100 mb-2"
                        onClick={() => openStatsModal(event)}
                      >
                        <i className="bi bi-bar-chart"></i> Estadísticas
                      </button>
                      <div className="btn-group w-100" role="group">
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => openEditModal(event)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openDeleteModal(event)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div
        className={`modal fade ${showCreateModal ? "show" : ""}`}
        style={{ display: showCreateModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear Evento</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              ></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Título del Evento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Hora</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Ubicación</label>
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Nombre del lugar (ej: Teatro Municipal)"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                    />
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={handleLocationChange}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      URL del Afiche (Opcional)
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.poster}
                      onChange={(e) =>
                        setFormData({ ...formData, poster: e.target.value })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Capacidad Máxima</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value,
                        })
                      }
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      min="0"
                      required
                    />
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
                  Crear Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showCreateModal && <div className="modal-backdrop fade show"></div>}

      <div
        className={`modal fade ${showEditModal ? "show" : ""}`}
        style={{ display: showEditModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar Evento</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Título del Evento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                    ></textarea>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Hora</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      Ubicación y Coordenadas
                    </label>
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Nombre del lugar (ej: Teatro Municipal)"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                    />
                    <MapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={handleLocationChange}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      URL del Afiche (Opcional)
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      value={formData.poster}
                      onChange={(e) =>
                        setFormData({ ...formData, poster: e.target.value })
                      }
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Capacidad Máxima</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value,
                        })
                      }
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      min="0"
                      required
                    />
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

      <div
        className={`modal fade ${showDeleteModal ? "show" : ""}`}
        style={{ display: showDeleteModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Eliminar Evento</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <p>
                ¿Estás seguro de que deseas eliminar el evento{" "}
                <strong>{selectedEvent?.title}</strong>?
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

      <div
        className={`modal fade ${showInscripcionesModal ? "show" : ""}`}
        style={{ display: showInscripcionesModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title">
                Inscritos - {selectedEvent?.title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowInscripcionesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      filterPaymentStatus === "all"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setFilterPaymentStatus("all")}
                  >
                    Todos ({inscripciones.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filterPaymentStatus === "pendiente"
                        ? "btn-warning"
                        : "btn-outline-warning"
                    }`}
                    onClick={() => setFilterPaymentStatus("pendiente")}
                  >
                    Pendientes (
                    {
                      inscripciones.filter(
                        (i) => i.paymentStatus === "pendiente"
                      ).length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filterPaymentStatus === "pagado"
                        ? "btn-success"
                        : "btn-outline-success"
                    }`}
                    onClick={() => setFilterPaymentStatus("pagado")}
                  >
                    Aceptados (
                    {
                      inscripciones.filter((i) => i.paymentStatus === "pagado")
                        .length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filterPaymentStatus === "rechazado"
                        ? "btn-danger"
                        : "btn-outline-danger"
                    }`}
                    onClick={() => setFilterPaymentStatus("rechazado")}
                  >
                    Rechazados (
                    {
                      inscripciones.filter(
                        (i) => i.paymentStatus === "rechazado"
                      ).length
                    }
                    )
                  </button>
                </div>
              </div>

              {loadingInscripciones ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : getFilteredInscripciones().length === 0 ? (
                <div className="alert alert-info">
                  No hay inscripciones{" "}
                  {filterPaymentStatus !== "all"
                    ? `con estado "${filterPaymentStatus}"`
                    : ""}{" "}
                  para este evento.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Participante</th>
                        <th>Email</th>
                        <th>Fecha Inscripción</th>
                        <th>Estado Pago</th>
                        <th>Comprobante</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredInscripciones().map((inscripcion) => (
                        <tr key={inscripcion.id}>
                          <td>{inscripcion.user?.name}</td>
                          <td>{inscripcion.user?.email}</td>
                          <td>
                            {new Date(inscripcion.createdAt).toLocaleDateString(
                              "es-ES"
                            )}
                          </td>
                          <td>
                            {inscripcion.paymentStatus === "pendiente" && (
                              <span className="badge bg-warning">
                                Pendiente
                              </span>
                            )}
                            {inscripcion.paymentStatus === "pagado" && (
                              <span className="badge bg-success">Aceptado</span>
                            )}
                            {inscripcion.paymentStatus === "rechazado" && (
                              <span className="badge bg-danger">Rechazado</span>
                            )}
                          </td>
                          <td>
                            {inscripcion.paymentProof ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                  handleVerComprobante(inscripcion)
                                }
                              >
                                Ver Comprobante
                              </button>
                            ) : (
                              <span className="text-muted">
                                Sin comprobante
                              </span>
                            )}
                          </td>
                          <td>
                            {inscripcion.paymentStatus === "pendiente" &&
                              inscripcion.paymentProof && (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                      handleValidatePayment(
                                        inscripcion.id,
                                        "accept"
                                      )
                                    }
                                    title="Aceptar"
                                  >
                                    <i className="bi bi-check-circle"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() =>
                                      handleValidatePayment(
                                        inscripcion.id,
                                        "reject"
                                      )
                                    }
                                    title="Rechazar"
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      openDeleteInscripcionModal(inscripcion)
                                    }
                                    title="Eliminar"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              )}
                            {inscripcion.paymentStatus === "pagado" && (
                              <div className="btn-group" role="group">
                                <span className="text-success me-2">
                                  ✓ Validado
                                </span>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    openDeleteInscripcionModal(inscripcion)
                                  }
                                  title="Eliminar"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                            {inscripcion.paymentStatus === "rechazado" && (
                              <div className="btn-group" role="group">
                                <span className="text-danger me-2">
                                  ✗ Rechazado
                                </span>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    openDeleteInscripcionModal(inscripcion)
                                  }
                                  title="Eliminar"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleDownloadList}
                disabled={inscripciones.length === 0}
              >
                <i className="bi bi-download"></i> Descargar Lista
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInscripcionesModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showInscripcionesModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      <div
        className={`modal fade ${showComprobanteModal ? "show" : ""}`}
        style={{ display: showComprobanteModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Comprobante de Pago</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowComprobanteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedInscripcion && (
                <>
                  <div className="mb-3">
                    <p>
                      <strong>Participante:</strong>{" "}
                      {selectedInscripcion.user?.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedInscripcion.user?.email}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {selectedInscripcion.paymentStatus === "pendiente" && (
                        <span className="badge bg-warning">Pendiente</span>
                      )}
                      {selectedInscripcion.paymentStatus === "pagado" && (
                        <span className="badge bg-success">Aceptado</span>
                      )}
                      {selectedInscripcion.paymentStatus === "rechazado" && (
                        <span className="badge bg-danger">Rechazado</span>
                      )}
                    </p>
                  </div>
                  <div className="text-center mb-3">
                    <img
                      src={selectedInscripcion.paymentProof}
                      alt="Comprobante"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "500px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  {selectedInscripcion.paymentStatus === "pendiente" && (
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-success"
                        onClick={() =>
                          handleValidatePayment(
                            selectedInscripcion.id,
                            "accept"
                          )
                        }
                      >
                        <i className="bi bi-check-circle"></i> Aceptar Pago
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          handleValidatePayment(
                            selectedInscripcion.id,
                            "reject"
                          )
                        }
                      >
                        <i className="bi bi-x-circle"></i> Rechazar Pago
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowComprobanteModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showComprobanteModal && <div className="modal-backdrop fade show"></div>}

      <div
        className={`modal fade ${showDeleteInscripcionModal ? "show" : ""}`}
        style={{ display: showDeleteInscripcionModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Eliminar Inscripción</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteInscripcionModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <p>
                ¿Estás seguro de que deseas eliminar la inscripción de{" "}
                <strong>{selectedInscripcion?.user?.name}</strong>?
              </p>
              <p className="text-danger">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteInscripcionModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteInscripcion}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteInscripcionModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      <div
        className={`modal fade ${showStatsModal ? "show" : ""}`}
        style={{ display: showStatsModal ? "block" : "none" }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-bar-chart"></i> Estadísticas -{" "}
                {selectedEvent?.title}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowStatsModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {loadingInscripciones ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const stats = getEventStats();
                    return stats ? (
                      <>
                        <div className="row mb-4">
                          <div className="col-md-6 mb-3">
                            <div className="card bg-light">
                              <div className="card-body text-center">
                                <h6 className="text-muted mb-2">
                                  Inscritos Totales
                                </h6>
                                <h2 className="mb-0">{stats.inscritosTotal}</h2>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="card bg-success text-white">
                              <div className="card-body text-center">
                                <h6 className="mb-2">Aceptados</h6>
                                <h2 className="mb-0">{stats.aceptados}</h2>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="card bg-info text-white">
                              <div className="card-body text-center">
                                <h6 className="mb-2">Asistentes Confirmados</h6>
                                <h2 className="mb-0">
                                  {stats.asistentesConfirmados}
                                </h2>
                                <small>
                                  (Entradas validadas por el validador)
                                </small>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="card bg-secondary text-white">
                              <div className="card-body text-center">
                                <h6 className="mb-2">Cupos Libres</h6>
                                <h2 className="mb-0">{stats.cuposLibres}</h2>
                                <small>de {stats.capacidadTotal} totales</small>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row mb-4">
                          <div className="col-12">
                            <div className="card">
                              <div className="card-body">
                                <h6 className="card-title">
                                  Ocupación del Evento
                                </h6>
                                <div
                                  className="progress"
                                  style={{ height: "30px" }}
                                >
                                  <div
                                    className="progress-bar bg-success"
                                    role="progressbar"
                                    style={{
                                      width: `${stats.porcentajeOcupacion}%`,
                                    }}
                                    aria-valuenow={stats.porcentajeOcupacion}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {stats.porcentajeOcupacion}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4">
                            <div className="card border-warning">
                              <div className="card-body text-center">
                                <h6 className="text-muted">Pendientes</h6>
                                <h4 className="text-warning">
                                  {stats.pendientes}
                                </h4>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-success">
                              <div className="card-body text-center">
                                <h6 className="text-muted">Aceptados</h6>
                                <h4 className="text-success">
                                  {stats.aceptados}
                                </h4>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card border-danger">
                              <div className="card-body text-center">
                                <h6 className="text-muted">Rechazados</h6>
                                <h4 className="text-danger">
                                  {stats.rechazados}
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h6 className="mb-3">Información del Evento</h6>
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <td>
                                  <strong>Evento:</strong>
                                </td>
                                <td>{selectedEvent.title}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Fecha:</strong>
                                </td>
                                <td>{formatDate(selectedEvent.date)}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Ubicación:</strong>
                                </td>
                                <td>{selectedEvent.location}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Precio:</strong>
                                </td>
                                <td>${selectedEvent.price}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="alert alert-info">
                        No hay datos disponibles
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowStatsModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      {showStatsModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default OrganizadorPage;
