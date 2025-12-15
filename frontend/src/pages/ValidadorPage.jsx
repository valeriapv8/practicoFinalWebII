import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { inscripcionService } from "../services/inscripcionService";
import { Html5Qrcode } from "html5-qrcode";
import jsQR from "jsqr";

const ValidadorPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanMode, setScanMode] = useState("manual");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleValidate = async () => {
    if (!token.trim()) {
      setError("Por favor ingrese un token válido");
      return;
    }
    await validateWithToken(token.trim());
  };

  // Función auxiliar para validar con un token específico
  const validateWithToken = async (tokenToValidate) => {
    if (!tokenToValidate || !tokenToValidate.trim()) {
      setError("Por favor ingrese un token válido");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setValidationResult(null);

      console.log("Validando token:", tokenToValidate);

      const response = await inscripcionService.validateEntry(
        tokenToValidate.trim()
      );

      console.log("Respuesta de validación:", response);

      if (response.success) {
        setValidationResult(response.data);
        // Limpiar el input después de una validación exitosa
        if (response.data.valid) {
          setTimeout(() => {
            setToken("");
            setValidationResult(null);
          }, 5000); // Limpiar después de 5 segundos
        }
      } else {
        setError(response.message || "Error al validar entrada");
      }
    } catch (error) {
      console.error("Error validando entrada:", error);
      setError(
        error.response?.data?.message ||
          "Error al validar entrada. Verifique el token e inténtelo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && token.trim() && !loading) {
      handleValidate();
    }
  };

  const clearResult = () => {
    setValidationResult(null);
    setError("");
    setToken("");
  };

  // Iniciar escaneo con cámara
  const startCameraScanning = async () => {
    try {
      setError("");
      setIsCameraOpen(true); // Primero establecer true para que se renderice el div

      // Esperar a que React renderice el elemento
      await new Promise((resolve) => setTimeout(resolve, 200));

      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        setError("No se pudo inicializar el lector de QR. Intente nuevamente.");
        setIsCameraOpen(false);
        setScanMode("manual");
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR escaneado exitosamente
          console.log("QR escaneado:", decodedText);

          // Detener la cámara primero
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current
              .stop()
              .then(() => {
                if (html5QrCodeRef.current) {
                  html5QrCodeRef.current.clear();
                }
                html5QrCodeRef.current = null;
                setIsCameraOpen(false);
                setToken(decodedText);
                setScanMode("manual");
                // Validar automáticamente
                validateWithToken(decodedText);
              })
              .catch((err) => {
                console.error("Error deteniendo cámara tras escaneo:", err);
                setIsCameraOpen(false);
                html5QrCodeRef.current = null;
                setToken(decodedText);
                setScanMode("manual");
                validateWithToken(decodedText);
              });
          } else {
            setToken(decodedText);
            setScanMode("manual");
            validateWithToken(decodedText);
          }
        },
        () => {
          // Error de escaneo (normal mientras escanea)
        }
      );

      setScanMode("camera"); // Cambiar el modo después de iniciar
    } catch (err) {
      console.error("Error iniciando cámara:", err);
      setError("No se pudo acceder a la cámara. Verifique los permisos.");
      setIsCameraOpen(false);
      setScanMode("manual");
    }
  };

  // Detener escaneo con cámara
  const stopCameraScanning = () => {
    if (html5QrCodeRef.current && isCameraOpen) {
      try {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.clear();
            }
            setIsCameraOpen(false);
            html5QrCodeRef.current = null;
          })
          .catch((err) => {
            console.error("Error deteniendo cámara:", err);
            setIsCameraOpen(false);
            html5QrCodeRef.current = null;
          });
      } catch (err) {
        console.error("Error al intentar detener cámara:", err);
        setIsCameraOpen(false);
        html5QrCodeRef.current = null;
      }
    } else {
      setIsCameraOpen(false);
      html5QrCodeRef.current = null;
    }
  };

  // Limpiar cámara al desmontar componente
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isCameraOpen) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [isCameraOpen]);

  // Manejar subida de archivo QR
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setToken(code.data);
          setScanMode("manual");
          setLoading(false);
          // Validar automáticamente con el token decodificado
          console.log("QR decodificado de imagen:", code.data);
          validateWithToken(code.data);
        } else {
          setError(
            "No se pudo leer el código QR de la imagen. Intente con otra imagen."
          );
          setLoading(false);
        }
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    event.target.value = "";
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-warning">
        <div className="container-fluid">
          <span className="navbar-brand">Panel de Validador</span>
          <div className="navbar-nav ms-auto">
            <button className="btn btn-outline-dark" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="text-center mb-4">
          <h2>Validación de Entradas</h2>
          <p className="text-muted">Bienvenido, {user?.name}</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="bi bi-qr-code-scan"></i> Escanear o Ingresar
                  Token
                </h5>
              </div>
              <div className="card-body">
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

                {/* Selector de método de escaneo */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Método de Validación:
                  </label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${
                        scanMode === "manual"
                          ? "btn-warning"
                          : "btn-outline-warning"
                      }`}
                      onClick={() => {
                        setScanMode("manual");
                        if (isCameraOpen) stopCameraScanning();
                      }}
                    >
                      <i className="bi bi-keyboard"></i> Escribir
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        scanMode === "camera"
                          ? "btn-warning"
                          : "btn-outline-warning"
                      }`}
                      onClick={() => {
                        if (!isCameraOpen) {
                          startCameraScanning();
                        } else {
                          stopCameraScanning();
                          setScanMode("manual");
                        }
                      }}
                    >
                      <i className="bi bi-camera"></i>{" "}
                      {isCameraOpen ? "Detener Cámara" : "Escanear"}
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        scanMode === "file"
                          ? "btn-warning"
                          : "btn-outline-warning"
                      }`}
                      onClick={() => {
                        setScanMode("file");
                        if (isCameraOpen) stopCameraScanning();
                        fileInputRef.current?.click();
                      }}
                    >
                      <i className="bi bi-upload"></i> Subir QR
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Vista de cámara */}
                {isCameraOpen && (
                  <div className="mb-3">
                    <div id="qr-reader" style={{ width: "100%" }}></div>
                    <p className="text-center text-muted mt-2">
                      <small>Apunte la cámara hacia el código QR</small>
                    </p>
                  </div>
                )}

                {/* Input manual */}
                {scanMode === "manual" && !isCameraOpen && (
                  <div className="mb-3">
                    <label htmlFor="token" className="form-label">
                      Token de Entrada
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ingrese el token manualmente"
                      disabled={loading}
                      autoFocus
                    />
                    <small className="text-muted">
                      Ingrese el token manualmente o use los botones arriba para
                      escanear.
                    </small>
                  </div>
                )}

                <div className="d-grid gap-2">
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={handleValidate}
                    disabled={!token.trim() || loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Validando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Validar Entrada
                      </>
                    )}
                  </button>
                  {(validationResult || error) && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={clearResult}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i> Nueva
                      Validación
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Resultado de Validación */}
            {validationResult && (
              <div className="card shadow mt-4">
                <div className="card-body">
                  {validationResult.status === "valid" &&
                    validationResult.valid && (
                      <div className="alert alert-success text-center mb-0">
                        <div style={{ fontSize: "4rem" }}>✅</div>
                        <h3 className="mt-3">¡ENTRADA VÁLIDA!</h3>
                        <hr />
                        <div className="text-start">
                          <p className="mb-2">
                            <strong>Participante:</strong>{" "}
                            {validationResult.inscripcion?.user?.name}
                          </p>
                          <p className="mb-2">
                            <strong>Email:</strong>{" "}
                            {validationResult.inscripcion?.user?.email}
                          </p>
                          <p className="mb-0">
                            <strong>Hora de ingreso:</strong>{" "}
                            {new Date(
                              validationResult.inscripcion?.entryDate
                            ).toLocaleString("es-ES")}
                          </p>
                        </div>
                      </div>
                    )}

                  {validationResult.status === "already_used" &&
                    !validationResult.valid && (
                      <div className="alert alert-warning text-center mb-0">
                        <div style={{ fontSize: "4rem" }}>⚠️</div>
                        <h3 className="mt-3">ENTRADA YA UTILIZADA</h3>
                        <hr />
                        <div className="text-start">
                          <p className="mb-2">
                            <strong>Participante:</strong>{" "}
                            {validationResult.inscripcion?.user?.name}
                          </p>
                          <p className="mb-0">
                            <strong>Ingresó el:</strong>{" "}
                            {new Date(
                              validationResult.inscripcion?.entryDate
                            ).toLocaleString("es-ES")}
                          </p>
                        </div>
                        <p className="mt-3 mb-0 text-danger">
                          <strong>
                            Esta entrada ya fue usada anteriormente
                          </strong>
                        </p>
                      </div>
                    )}

                  {validationResult.status === "payment_pending" &&
                    !validationResult.valid && (
                      <div className="alert alert-warning text-center mb-0">
                        <div style={{ fontSize: "4rem" }}>💳</div>
                        <h3 className="mt-3">PAGO PENDIENTE</h3>
                        <hr />
                        <div className="text-start">
                          <p className="mb-2">
                            <strong>Participante:</strong>{" "}
                            {validationResult.inscripcion?.user?.name}
                          </p>
                          <p className="mb-0">
                            <strong>Estado:</strong>{" "}
                            {validationResult.inscripcion?.paymentStatus}
                          </p>
                        </div>
                        <p className="mt-3 mb-0 text-warning">
                          <strong>
                            El pago de esta inscripción aún no ha sido
                            confirmado
                          </strong>
                        </p>
                      </div>
                    )}

                  {validationResult.status === "wrong_date" &&
                    !validationResult.valid && (
                      <div className="alert alert-danger text-center mb-0">
                        <div style={{ fontSize: "4rem" }}>📅</div>
                        <h3 className="mt-3">FECHA INCORRECTA</h3>
                        <p className="mb-0">
                          Este evento no es para el día de hoy
                        </p>
                      </div>
                    )}

                  {validationResult.status === "invalid" &&
                    !validationResult.valid && (
                      <div className="alert alert-danger text-center mb-0">
                        <div style={{ fontSize: "4rem" }}>❌</div>
                        <h3 className="mt-3">TOKEN INVÁLIDO</h3>
                        <p className="mb-0">
                          El token ingresado no es válido o no existe
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="card shadow mt-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Instrucciones</h6>
              </div>
              <div className="card-body">
                <ul className="mb-0">
                  <li>
                    <strong>Escribir:</strong> Ingrese el token manualmente y
                    presione Enter o el botón Validar
                  </li>
                  <li>
                    <strong>Escanear:</strong> Active la cámara y apunte hacia
                    el código QR para escanear automáticamente
                  </li>
                  <li>
                    <strong>Subir QR:</strong> Seleccione una imagen del código
                    QR desde su dispositivo
                  </li>
                  <li>
                    El sistema validará automáticamente la entrada después de
                    escanear o subir
                  </li>
                  <li>
                    Si es válida, se registrará el ingreso con fecha y hora
                  </li>
                  <li>Las entradas solo pueden usarse una vez</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidadorPage;
