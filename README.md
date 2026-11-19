# Foco · Gestor de tareas

Proyecto Integrador del Módulo 4 de Full Stack. Foco permite organizar tareas personales en una interfaz adaptable a escritorio y móvil. Cada cuenta puede crear, editar, completar y eliminar sus tareas, asignarles prioridad y vencimiento, y recibir un resumen por correo.

[Abrir Foco en Vercel](https://foco-modulo-4.vercel.app/)

## Cómo probar la demo

1. Entrá con Google o registrate con correo y contraseña. Creá una tarea, editala, marcala como completada y recargá la página para comprobar que se guardó.
2. Usá los filtros por estado o elegí ordenar por prioridad o vencimiento. En **Todas → Orden manual**, podés reordenar las tareas arrastrándolas desde el asa o usando el teclado.
3. Tocá **Enviar resumen**. Si Foco te pide verificar tu cuenta, elegí **Enviar enlace de verificación**, abrí el correo de Firebase y volvé a Foco para continuar. Si SES te manda su propio enlace, confirmalo y volvé a tocar **Enviar resumen**.

En sandbox, Amazon SES requiere que el destinatario confirme su identidad en la región del envío. Foco solicita el enlace desde el botón de resumen con el correo autenticado. El enlace de AWS vence a las 24 horas. En una cuenta con acceso a producción, SES admite destinatarios sin identidad verificada. [Sandbox de Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

## Tecnologías

| Área | Herramientas |
| --- | --- |
| Interfaz y navegación | React 19, TypeScript, Vite y React Router |
| Autenticación y datos | Firebase Authentication y Cloud Firestore |
| Reordenamiento | dnd-kit |
| Función de correo | Vercel Functions, Firebase Admin y AWS SDK v3 con `@aws-sdk/client-ses` |
| Pruebas | Vitest, React Testing Library y Firebase Emulator Suite para comprobaciones locales |
| Despliegue | Vercel con Node.js 24 |

## Arquitectura

| Código | Responsabilidad |
| --- | --- |
| [Páginas, componentes y rutas](src/) | `/login` y `/registro` son públicas. `/tareas` espera la comprobación de la sesión antes de mostrar datos. |
| [Autenticación](src/features/auth/) | El proveedor de contexto escucha la sesión con `onAuthStateChanged`. |
| [Hooks](src/hooks/) y [servicios](src/services/) | `useTasks` escucha los cambios de Firestore con `onSnapshot`. Al salir de la vista se cancelan las suscripciones. |
| [Tipos](src/types/) y [utilidades](src/utils/) | Modelo de tarea, validaciones, fechas, filtros y ordenamiento. |
| [API de resumen](api/send-summary.ts) y [servicios de servidor](server/) | Validación del token, consulta de las tareas de la cuenta y envío mediante SES. |
| [Pruebas](test/) | Validación de formularios, componentes, rutas protegidas y respuestas de la función. |

Cada tarea se guarda en `tasks/{id}` con el campo `userId`. El orden manual tiene su propio documento en `taskOrders/{uid}`, lo que permite guardar un reordenamiento en una sola escritura. Las reglas limitan lecturas y escrituras al propietario. [Reglas de Firestore del proyecto](firestore.rules)

## Instalación local

Necesitás Node.js **24.x**, npm y un proyecto de Firebase con una aplicación web registrada.

```bash
git clone https://github.com/xavi-di16/foco-modulo-4.git
cd foco-modulo-4
npm ci
cp .env.example .env.local
```

En PowerShell, copiá la plantilla con `Copy-Item .env.example .env.local`. Si ya tenés el archivo, completalo con los valores de tu entorno.

1. En Firebase Authentication, habilitá **Correo electrónico/contraseña** y **Google**. Agregá el dominio desde el que vas a acceder a **Dominios autorizados**. [Acceso con Google en Firebase](https://firebase.google.com/docs/auth/web/google-signin)
2. Creá la base de Firestore `(default)` en modo producción y publicá el contenido de [firestore.rules](firestore.rules).
3. Cargá las cuatro variables web de Firebase en `.env.local` y ejecutá `npm run dev`.

Para probar la función de correo en local, cargá también las variables de servidor y ejecutá `npx vercel dev` con el proyecto vinculado a Vercel. La demo publicada permite probar el flujo de correo desde el navegador.

### Variables de entorno

La plantilla del proyecto contiene los nombres con valores vacíos. [Plantilla de variables](.env.example)

| Variable | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` de la aplicación web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` de la aplicación web |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` del proyecto Firebase |
| `VITE_FIREBASE_APP_ID` | `appId` de la aplicación web |
| `VITE_USE_FIREBASE_EMULATORS` | Opción local. Usá `true` para conectar Auth y Firestore a los emuladores. |
| `FIREBASE_PROJECT_ID` | `project_id` del JSON de la cuenta de servicio |
| `FIREBASE_CLIENT_EMAIL` | `client_email` de la cuenta de servicio |
| `FIREBASE_PRIVATE_KEY` | `private_key` completa. Admite saltos reales y secuencias literales `\n`. |
| `SES_AWS_REGION` | Región de la identidad de envío de SES |
| `SES_AWS_ACCESS_KEY_ID` | ID de la clave IAM con permiso `ses:SendEmail` |
| `SES_AWS_SECRET_ACCESS_KEY` | Secreto de la clave IAM |
| `SES_FROM_EMAIL` | Correo remitente verificado en SES |

Vite incorpora las variables `VITE_` a la configuración del navegador. Guardá la clave de Firebase Admin y las credenciales de AWS en las variables de servidor de Vercel o en el entorno local. `.gitignore` excluye los archivos de entorno con valores.

## Envío de correo

1. **Enviar resumen** actualiza el token de Firebase y llama a `POST /api/send-summary` con el encabezado `Authorization: Bearer <token>`. La solicitud lleva el cuerpo vacío.
2. Firebase Admin comprueba el token y su revocación. La función toma el destinatario de la cuenta con correo verificado. Si falta la verificación, Firebase Authentication envía el enlace a pedido del usuario.
3. La función aplica un intervalo de 30 segundos entre solicitudes por cuenta, consulta las tareas por el UID autenticado y arma un resumen con los totales y el estado de cada tarea.
4. Amazon SES envía el resumen con HTML y versión de texto. El correo muestra el progreso, las tareas por estado, las prioridades y los vencimientos con la paleta de Foco. El botón abre la lista de tareas cuando Vercel proporciona `VERCEL_PROJECT_PRODUCTION_URL`.
5. Si SES rechaza al destinatario por falta de verificación, la función consulta su identidad y solicita un enlace cuando hace falta. Si hay una confirmación pendiente, la aplicación indica que abras el enlace de AWS.

### Cómo activar y recibir tu resumen

1. Entrá a Foco con **Continuar con Google** o iniciá sesión con el correo y la contraseña de tu cuenta. El resumen se envía al correo de esa sesión.
2. En **Mis tareas**, tocá **Enviar resumen**. Si te aparece **Enviar enlace de verificación**, presionalo y abrí el correo de Firebase. Ese **primer enlace** confirma tu dirección para tu cuenta de Foco. Después, volvé a la pestaña de Foco para continuar.
3. Si tu dirección todavía necesita verificarse en Amazon SES, Foco solicita automáticamente el registro de tu correo como identidad en AWS. Buscá el mensaje de **Amazon Web Services** y abrí su enlace. Ese **segundo enlace** autoriza a SES a enviarte el resumen mientras el servicio está en sandbox.
4. Una vez confirmada la dirección en AWS, volvé a Foco y tocá **Enviar resumen** otra vez. Si la app te pide esperar unos segundos, volvé a intentar cuando termine el tiempo indicado.

En el primer uso pueden aparecer **dos enlaces distintos**, uno de Firebase y otro de AWS. Si Firebase ya reconoce tu correo como verificado al entrar con Google, empezás directamente por la confirmación de AWS cuando haga falta.

> **Dónde encontrar el resumen.** En las pruebas de Foco, los resúmenes llegaron a **Spam**. Revisá esa carpeta y buscá el asunto **Resumen de tus tareas · Foco**.

## Pruebas

| Comando | Resultado comprobado |
| --- | --- |
| `npm run typecheck` | TypeScript validado |
| `npm test` | 43 pruebas aprobadas en 11 archivos |
| `npm run build` | Compilación de producción generada en `dist/` |

La suite cubre validaciones, filtros, rutas privadas y respuestas de la API. Las pruebas del endpoint simulan Firebase Admin y SES e incluyen el flujo de verificación y el cuerpo HTML del correo. Con los emuladores se comprobó el CRUD, la actualización entre pestañas y el aislamiento de las tareas de dos cuentas. En Vercel, se comprobó que la demo abre y que `GET /api/send-summary` responde `405` con el mensaje que indica usar `POST`.

Para repetir las comprobaciones con emuladores, necesitás Java 21. Iniciá Firebase Emulator Suite y, en otra terminal, ejecutá `npm run dev` con `VITE_USE_FIREBASE_EMULATORS=true` en `.env.local`.

```bash
npx firebase-tools emulators:start --project demo-foco --only auth,firestore
```

## Despliegue

1. Importá el repositorio en Vercel como un proyecto **Vite**. [vercel.json](vercel.json) define el comando de compilación, la carpeta `dist` y las rutas de la SPA.
2. En Firebase, generá el JSON de Admin desde **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**. Usá el mismo proyecto que para la aplicación web. [Configurar Firebase Admin](https://firebase.google.com/docs/admin/setup)
3. Agregá el dominio de Vercel a los dominios autorizados de Firebase Authentication. Verificá la identidad de SES en la región que configuraste y asigná a la credencial IAM el permiso `ses:SendEmail` para esa identidad.
4. Cargá las cuatro variables web y las siete de servidor en **Settings → Environment Variables → Production**. Desplegá y probá el registro, las tareas y el resumen desde la URL pública. Después de modificar variables de producción, ejecutá un nuevo despliegue. [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables)

### Permisos de SES para solicitar la verificación

En IAM, agregá este objeto al arreglo `Statement` de la política del usuario que usa Vercel. Usá la misma región que figura en `SES_AWS_REGION`. Estas dos acciones se autorizan con `Resource` igual a `*`. [Acciones y recursos de SES](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ses.html)

```json
{
  "Effect": "Allow",
  "Action": [
    "ses:GetIdentityVerificationAttributes",
    "ses:VerifyEmailIdentity"
  ],
  "Resource": "*",
  "Condition": {
    "StringEquals": { "aws:RequestedRegion": "us-east-2" }
  }
}
```

## Uso de IA

Usé Codex para contrastar la consigna El patrón que más sirvió fue dar un error concreto y comprobar el siguiente paso. Las pruebas con dos cuentas permitieron verificar las reglas de Firestore. La comprobación de la ruta publicada permitió confirmar que la función estaba disponible. Una decisión técnica fue obtener el destinatario del token verificado y consultar las tareas en el servidor para que cada cuenta solo pueda solicitar su propio resumen.

Fotografía de escritorio de Unsplash. [Imagen original](https://images.unsplash.com/photo-1499750310107-5fef28a66643)