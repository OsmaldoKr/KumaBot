# 👺 KumaBot

Bot de WhatsApp desarrollado por **OsmaldoKr**, basado en Baileys y Node.js.

## Plataformas compatibles

- ✅ Windows
- ✅ Termux
- ✅ Replit
- ✅ VPS / RDP
- ✅ ZippoNodes
- ✅ BoxMine Host

## Requisitos

Antes de iniciar, necesitas:

- Node.js 20 o superior
- Git
- FFmpeg
- ImageMagick
- Una cuenta de WhatsApp para vincular mediante QR

Puedes comprobar tu versión de Node.js con:

```bash
node -v
```

---

## Instalación en Windows

1. Instala las siguientes herramientas:

   - [Node.js](https://nodejs.org/)
   - [Git](https://git-scm.com/downloads)
   - [FFmpeg](https://ffmpeg.org/download.html)
   - [ImageMagick](https://imagemagick.org/script/download.php)

2. Abre CMD, PowerShell o la terminal de Visual Studio Code.

3. Clona el repositorio:

```bash
git clone https://github.com/OsmaldoKr/KumaBot.git
cd KumaBot
```

4. Instala las dependencias:

```bash
npm install
```

5. Inicia el bot:

```bash
npm start
```

6. Escanea el código QR desde WhatsApp:

   **WhatsApp → Dispositivos vinculados → Vincular un dispositivo**

---

## Instalación en Termux

Descarga Termux desde F-Droid:

[Descargar Termux](https://f-droid.org/repo/com.termux_118.apk)

Luego ejecuta:

```bash
termux-setup-storage
pkg update -y && pkg upgrade -y
pkg install -y git nodejs ffmpeg imagemagick
```

Clona e instala el bot:

```bash
git clone https://github.com/OsmaldoKr/KumaBot.git
cd KumaBot
npm install
npm start
```

---

## Mantener KumaBot activo en Termux con PM2

Instala PM2:

```bash
npm install -g pm2
```

Inicia KumaBot:

```bash
pm2 start index.js --name KumaBot
pm2 save
```

Ver los registros en tiempo real:

```bash
pm2 logs KumaBot
```

Reiniciar el bot:

```bash
pm2 restart KumaBot
```

Detenerlo:

```bash
pm2 stop KumaBot
```

Eliminar el proceso:

```bash
pm2 delete KumaBot
```

Ver todos los procesos administrados por PM2:

```bash
pm2 list
```

> PM2 consume recursos adicionales. Se recomienda usarlo en dispositivos con memoria RAM suficiente.

---

## Instalación en Replit

1. Crea un Repl de tipo **Node.js**.
2. Sube o clona el repositorio.
3. Abre la terminal de Replit.
4. Ejecuta:

```bash
npm install
npm start
```

Si Replit requiere herramientas multimedia, instala:

```bash
npm install -g ffmpeg-static
```

---

## Instalación en VPS, RDP o hosting Linux

Actualiza el servidor e instala los requisitos:

```bash
sudo apt update
sudo apt install -y git nodejs npm ffmpeg imagemagick
```

Clona el proyecto:

```bash
git clone https://github.com/OsmaldoKr/KumaBot.git
cd KumaBot
npm install
npm start
```

Para mantenerlo activo en segundo plano:

```bash
npm install -g pm2
pm2 start index.js --name KumaBot
pm2 save
```

---

## Configuración de FFmpeg en Windows

1. Descarga una versión de FFmpeg desde:

   [FFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/)

2. Extrae el archivo descargado.
3. Mueve la carpeta a:

```text
C:\ffmpeg
```

4. Agrega esta ruta a las variables de entorno `PATH`:

```text
C:\ffmpeg\bin
```

5. Comprueba que quedó instalado:

```bash
ffmpeg -version
```

Si muestra información de versión, la instalación fue correcta.

---

## Problema con Yarn en PowerShell

Si PowerShell bloquea Yarn por la política de ejecución, abre PowerShell como administrador y ejecuta:

```powershell
Set-ExecutionPolicy RemoteSigned
```

Confirma con `Y` y presiona Enter.

> KumaBot utiliza NPM como gestor principal, por lo que Yarn no es obligatorio.

---

## Comandos disponibles

| Comando | Función |
|---|---|
| `npm start` | Inicia el bot |
| `npm run dev` | Inicia el bot con reinicio automático |
| `npm test` | Ejecuta `test.js` |
| `npm run lint` | Revisa el código con ESLint |
| `pm2 logs KumaBot` | Muestra los registros del bot |
| `pm2 restart KumaBot` | Reinicia el proceso administrado por PM2 |

---

## Estructura del proyecto

```text
KumaBot/
├── index.js          # Iniciador y administrador del proceso
├── main.js           # Conexión principal con WhatsApp
├── handler.js        # Gestión de mensajes y eventos
├── config.js         # Configuración global
├── plugins/          # Comandos y funciones del bot
├── lib/              # Utilidades internas
├── KumaSession/      # Sesión de WhatsApp
├── package.json      # Dependencias y scripts
└── README.md         # Documentación
```

> No compartas ni subas públicamente la carpeta `KumaSession`, ya que contiene las credenciales de tu cuenta vinculada de WhatsApp.

---

## Creador

**OsmaldoKr**

- GitHub: [@OsmaldoKr](https://github.com/OsmaldoKr)
- Proyecto: [KumaBot](https://github.com/OsmaldoKr/KumaBot)

## Licencia

Este proyecto se distribuye bajo la licencia **GPL-3.0-or-later**.
