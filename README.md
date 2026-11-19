Foco · Gestor de tareas
Proyecto Integrador del Módulo 4 de Full Stack. Foco es una SPA de MateCode para gestionar tareas personales. Cada cuenta puede crear, editar, completar, reabrir y eliminar sus tareas. La lista se sincroniza en tiempo real y el resumen por correo incluye todas las tareas de la cuenta, aunque haya un filtro activo.

La lista permite filtrar por estado, ordenar por prioridad o vencimiento y guardar un orden manual. Para reordenar, seleccioná Todas y Orden manual. Usá el asa de cada fila con el mouse, con el dedo o con las teclas Espacio y flechas.
URL de producción
Pendiente de completar con la URL pública que entregue Vercel al importar el repositorio.
Instalación
Requiere Node.js 24 y npm.
npm ci
cp .env.example .env
npm run dev
En Windows, podés crear el archivo con Copy-Item .env.example .env. Completá las variables web antes de iniciar Vite y abrí la dirección que imprime la terminal.
Comando	Función
npm run dev	Ejecuta el frontend con Vite.
npm test	Ejecuta Vitest y React Testing Library una vez.
npm run test:watch	Repite las pruebas al guardar cambios.
npm run build	Comprueba los tipos y genera dist/.
npm run preview	Sirve la compilación de producción en local.
npx vercel dev	Ejecuta el frontend y la función de correo con Vercel CLI.


npm run dev sirve la SPA. Usá npx vercel dev para probar la ruta /api/send-summary con un proyecto de Vercel vinculado y las variables de servidor cargadas.
Firebase
1. Creá un proyecto de Firebase y registrá una aplicación Web. Copiá apiKey, authDomain, projectId y appId de su configuración a las variables VITE_FIREBASE_* correspondientes.
2. En Authentication → Sign-in method, habilitá Correo electrónico/contraseña.
3. En Firestore Database, creá la base (default) en modo producción. En la pestaña Reglas, pegá y publicá el contenido de firestore.rules. Como alternativa, usá npx firebase-tools deploy --only firestore:rules --project TU_PROJECT_ID.
4. Para la función de correo, generá una clave JSON en Configuración del proyecto → Cuentas de servicio. Usá project_id, client_email y private_key en las tres variables de servidor. Usá el mismo proyecto para el cliente y Firebase Admin.
5. Agregá el dominio público de Vercel en Authentication → Settings → Authorized domains. Si probás con Firebase real en local, agregá también localhost si tu proyecto lo requiere.
La colección tasks se crea con la primera tarea. El orden manual se guarda en taskOrders/{uid}. Las consultas de la aplicación filtran por userId y las reglas de Firestore comprueban la propiedad en cada lectura y escritura. Los timestamps los asigna Firestore. Documentación de reglas de Firestore
AWS SES
1. Elegí una región de SES y verificá una identidad de envío, que puede ser un correo o un dominio. Usá una dirección de esa identidad en SES_FROM_EMAIL.
2. Configurá credenciales IAM con permiso ses:SendEmail para esa identidad. Cargalas junto con la región en las variables SES_AWS_*.
3. Si tu cuenta de SES está en sandbox, verificá también el correo receptor en esa región. El receptor debe completar además la verificación de correo de Firebase Authentication desde Foco. Para enviar a usuarios con correos que SES no haya verificado, solicitá el acceso a producción de SES. Sandbox de Amazon SES
Variables de entorno
.env.example enumera las variables con valores vacíos. .env y sus variantes locales quedan excluidos de Git. Las variables VITE_ se incorporan al frontend cuando compila Vite.
Variable	Ámbito	Valor
VITE_FIREBASE_API_KEY	Web	apiKey de la aplicación web de Firebase.
VITE_FIREBASE_AUTH_DOMAIN	Web	authDomain de Firebase.
VITE_FIREBASE_PROJECT_ID	Web	ID del proyecto Firebase.
VITE_FIREBASE_APP_ID	Web	appId de la aplicación web.
VITE_USE_FIREBASE_EMULATORS	Local	Valor opcional true para usar los emuladores de Auth y Firestore con Vite.
FIREBASE_PROJECT_ID	Servidor	project_id de la cuenta de servicio.
FIREBASE_CLIENT_EMAIL	Servidor	client_email de la cuenta de servicio.
FIREBASE_PRIVATE_KEY	Servidor	private_key de la cuenta de servicio, con saltos reales o literales \n.
SES_AWS_REGION	Servidor	Región de la identidad SES, por ejemplo us-east-1.
SES_AWS_ACCESS_KEY_ID	Servidor	ID de la clave IAM.
SES_AWS_SECRET_ACCESS_KEY	Servidor	Secreto de la clave IAM.
SES_FROM_EMAIL	Servidor	Dirección remitente verificada en SES.


El prefijo SES_AWS_ evita los nombres de variables reservados por Vercel, como AWS_REGION. Si pegás la clave privada en .env con saltos \n, encerrá el valor entre comillas dobles. Mantené el JSON de la cuenta de servicio fuera del repositorio. Variables reservadas de Vercel
Arquitectura
Carpeta	Responsabilidad
src/pages	Pantallas de inicio de sesión, registro y tareas.
src/components	Formularios, lista, filtros, resumen, diálogos y avisos.
src/routes, src/features/auth	Rutas públicas y privadas, contexto y estado de la sesión.
src/hooks, src/services	Acceso al contexto, suscripciones, operaciones de Firestore y llamadas de red.
src/types, src/utils	Modelo Task, validación, fechas y ordenamiento.
api, server	Vercel Function y servicios de servidor para Firebase Admin y SES.
tests	Pruebas unitarias y de componentes con servicios simulados.


onAuthStateChanged decide cuándo mostrar la ruta privada. useTasks escucha las tareas y el orden en Firestore con onSnapshot y cancela las dos suscripciones al desmontarse. Una tarea nueva aparece arriba en el orden manual hasta que el usuario la reubica. El orden se guarda en una sola escritura y sus IDs se cruzan con las tareas de la sesión.

La lección 10 ubica las funciones de Vercel en api/. Los módulos de servidor quedan fuera de src/ para que el bundle del navegador solo importe el cliente de Firebase.
Envío de correo
1. Enviar resumen solicita un token de Firebase actualizado e invoca POST /api/send-summary usando el header Authorization: Bearer <token>.
2. La función valida el método, el cuerpo vacío y la vigencia del token con Firebase Admin. Si el correo aún no está verificado, el botón ofrece enviar un enlace con Firebase Authentication.
3. La función aplica una espera de 30 segundos por cuenta para evitar envíos repetidos. Consulta Firestore por el uid autenticado y forma un resumen en texto con los totales y el estado de cada tarea.
4. AWS SES recibe el mensaje para el correo verificado de la sesión. La pantalla indica el envío, la verificación requerida o el error.
Prueba local con emuladores
Para verificar autenticación, CRUD y reglas con datos de prueba, usá Firebase Emulator Suite y Java. Con npm ci ya ejecutado, abrí dos terminales.
# Terminal 1
npx firebase-tools emulators:start --project demo-foco --only auth,firestore
Agregá VITE_USE_FIREBASE_EMULATORS=true a tu .env y ejecutá npm run dev en la segunda terminal. El emulador usa el proyecto local demo-foco y las reglas incluidas en el repositorio. Para cambiar a Firebase real, quitá esa opción y reiniciá Vite.

La suite verifica formularios vacíos, navegación protegida, filtros, orden, formato del correo y respuestas del endpoint. La comprobación en navegador con emuladores cubrió sesión persistente, sincronización entre pestañas y CRUD. Se verificó con dos cuentas que Firestore deniega lecturas y escrituras ajenas. La función también se ejecutó localmente en el runtime Node de Vercel con un token de Firebase emulado. La recepción real del correo se comprueba con las credenciales y las identidades de AWS SES del despliegue.
GitHub y Vercel
1. Creá un repositorio público y vacío en GitHub. El ZIP incluye el historial local. Desde la carpeta extraída, ejecutá git log --oneline para verlo y luego agregá el remoto indicado por GitHub.git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
2. Importá el repositorio en Vercel como proyecto Vite. vercel.json configura el build, dist y las rutas directas de la SPA. Seleccioná Node.js 24 en el proyecto.
3. Cargá en Vercel las cuatro variables web y las siete de servidor de la tabla y desplegá. Si cambiás las variables web, generá un nuevo despliegue para que el frontend reciba los valores actualizados.
4. Desde la URL pública, registrate, creá una tarea, editala, marcala como completada y pedí el resumen. Verificá el correo si Foco te lo solicita. Validá la recepción por SES y actualizá la sección URL de producción del README. Entregá el enlace público del repositorio.
Uso de IA
El pedido inicial a Codex fue «completa el trabajo final dame el codigo final […] basandote en el material del curso. sigue al pie de la letra la guia». También se pidió consultar el repositorio de un compañero y dejar GitHub, Vercel y Firestore a cargo del usuario. La guía, la rúbrica y la presentación oficial se contrastaron para identificar los requisitos. El repositorio de la cursada sirvió como referencia de estructura para la SPA y la función de Vercel. Repositorio de referencia

La IA fue más efectiva para revisar responsabilidades entre capas y proponer casos de prueba concretos. Un patrón aplicado fue convertir cada requisito en un comportamiento verificable, como abrir una ruta privada sin sesión, rechazar una tarea vacía o mostrar un error de SES. Se mantuvo el ID de usuario en la consulta y en las reglas porque cada capa cumple una función distinta. Para el correo, se eligió buscar las tareas y el destinatario en el servidor a partir del token, lo que permite que el botón resuma también las tareas ocultas por el filtro.

Foto de escritorio de Unsplash. Imagen original