Proyecto Final Ingeniería Web II
1. Descripción General del Proyecto
El sistema permite que organizadores creen eventos y administren inscripciones.
Los participantes pueden inscribirse y usar un código QR para validar su ingreso el día del evento.
Además, se incluye un acceso público, sin registro ni inicio de sesión, para que cualquier persona
pueda ver afiches de eventos futuros y sus detalles principales.
El backend expone una API monolítica que maneja toda la lógica, y el frontend ofrece interfaces
separadas para:
• Visitantes públicos (sin cuenta).
• Participantes registrados.
• Organizadores con privilegios administrativos.
• Validadores de ingresos
Acceso como visitante
No requiere cuenta. Tiene acceso a lo siguiente:
• Ver el listado público de próximos eventos.
o Cada evento muestra:
▪ Afiche
▪ Título
▪ Descripción
▪ Fecha y Hora
▪ Ubicación en mapa.
• Ver cada evento individual con su afiche, descripción y detalles básicos.
• No puede inscribirse a los eventos, para eso debe registrarse con un correo, nombre
completo y contraseña
Acceso como participante
Necesita tener una sesión iniciada, o haberse registrado previamente.
Tendrá las siguientes capacidades:
• Ver eventos disponibles y participar en ellos. Para participar en los eventos es necesario
registrar esta participación. En caso del evento tener un precio, se pedirá enviar un
comprobante de depósito.
o Cada participante solo se puede inscribir una vez al evento (evitar duplicados)
o Se genera un QR para cada inscripción realizada.
o El QR debe contener una url que lleve directamente a la validación del código,
siempre, esto debe funcionar solamente si se tiene una sesión iniciada como
validador de ingresos. La url debería incluir un token generado y almacenado en
la BD.
• Ver QR de sus inscripciones para el ingreso.
• Cancelar inscripción (En caso de que el evento todavía esté vigente y no se haya
realizado un pago).
Acceso como organizador
Requiere un usuario y contraseña en el rol válido para ingresar
• Crear, editar y eliminar eventos.
o Los eventos tendrán los campos mencionados anteriormente y la capacidad
máxima de personas. No se podrá inscribir más personas que la capacidad
máxima.
• Subir o un afiche del evento.
• Administrar inscritos del evento (ver y eliminar) y validar sus comprobantes de
inscripción.
o Al validar comprobantes, si se rechaza o acepta, se mostrará ese resultado al
participante.
• Descargar listas de inscritos para impresión.
• Ver reporte de estadísticas del evento, filtrable por fecha
o El reporte debe mostrar: inscritos totales, asistentes confirmados, cupos libres.
Acceso como administrador de sistema
Requiere un usuario y contraseña en el rol válido para ingresar
• Tendrá acceso a la lista de usuarios administradores, podrá insertar, editar, eliminar,
cambiar de contraseña y cambiar roles.
Acceso como Validador de ingresos
El validador de ingresos será el encargado de validar las entradas en el lugar del evento.
Requiere un usuario y contraseña en el rol válido para ingresar
Tendrá permiso de:
• Acceder a la página de validación de QR.
• Validar entradas el día del evento.
o Si el ingreso es válido, se debe registrar el ingreso del participante, con fecha y hora
y marcar la inscripción como “ingresada”.
• Ver solamente información mínima necesaria para confirmar ingreso:
• Nombre del participante
• Estado de la validación (válido, ya ingresado, inválido)
Solo podrá hacer eso, no puede realizar ninguna otra tarea.