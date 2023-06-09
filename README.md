<a href="https://www.youtube.com/@gatadios">
<img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube">
</a>
<a href="https://instagram.com/1alvarez_jose8">
<img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white">
</a>
</div>

### ✅ SHARKLITE OFICIAL

<a href="http://wa.me/50585826826?text=.menu" target="blank"><img src="https://img.shields.io/badge/1️⃣_𝙎𝙝𝙖𝙧𝙠𝙇𝙞𝙩𝙚-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
</a>
  
#### DISPONIBLE EN:
> - [x] TERMUX, REPLIT, WINDOWS, HEROKU, BOXMINE-HOST


[`😛 App Termux`](https://f-droid.org/es/packages/com.termux/)
### 🤨 INSTALACIÓN AUTOMÁTICA - TERMUX

```bash
termux-setup-storage
```
```bash
apt update -y && yes | apt upgrade && pkg install -y bash wget && wget -O - https://raw.githubusercontent.com/ElChema-Nc/SharkLite/master/sharklite.sh | bash
```
#### EN CASO QUE QUIERA USAR ESTE MÉTODO DEBE DE EDITAR (Previo a una Bifurcación)
- [`Repositorio`](https://github.com/ElChema-Nc/SharkLite/blob/26d815118042760456a4cb2408654ad5d296e146/sharklite.sh#LL153C54-L153C54)
- [`Nombre del Bot`](https://github.com/ElChema-Nc/SharkLite/blob/26d815118042760456a4cb2408654ad5d296e146/sharklite.sh#L157)
- Actualizar: `https://raw.githubusercontent.com/ElChema-Nc/SharkLite/master/sharklite.sh`
### 👻 INSTALACIÓN MANUAL - TERMUX
```bash
termux-setup-storage
apt update
apt upgrade
pkg install -y git nodejs ffmpeg imagemagick yarn
git clone https://github.com/ElChema-Nc/SharkLite
cd SharkLite
yarn install
npm install
npm start
```

### 🍁 TERMUX 24/7 🍁 
> Comandos para realizar una ejecución 24/7
- INICIAR
> Use estos comandos dentro de la carpeta SharkLite
```bash
termux-wake-lock && npm i -g pm2 && pm2 start index.js && pm2 save && pm2 logs 
```
- DETENER PM2
> Detener todos los procesos del bot
```bash
pm2 stop all && pm2 unstartup
```
- REANUDAR 
> Reanudar los procesos, usar dentro de la carpeta SharkLite
```bash
pm2 start index.js 
```
- VISUALIZAR EL PROCESO
> Usar dentro de la carpeta SharkLite para ver en tiempo real
```bash
pm2 logs 
```
- ELIMINAR PROCESOS PM2
> Eliminar todos los procesos del bot. Para volver a usar PM2 debe volver a usar los comandos de INICIAR
```bash
pm2 delete all
```
> **Note** Demanda consumo de RAM y CPU, el resultado mejora mientras las especificaciones del dispositivo sean moderadas

### 🗿 INSTALACIÓN EN REPLIT 🗿
<a target="_blank" href="https://replit.com/github/ElChema-Nc/Shark-Bot"><img alt="Run on Replit" src="https://binbashbanana.github.io/deploy-buttons/buttons/remade/replit.svg"></a>

### 🤨 INSTALACIÓN EN HEROKU 🤨
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://replit.com/github/ElChema-Nc/Shark-Bot-Heroku) 
> 👇 Añada lo siguente al Buildpack: 
```bash
heroku/nodejs
```
```bash
https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
```
```bash
https://github.com/clhuang/heroku-buildpack-webp-binaries.git
```
## 😵‍💫 INSTALACIÓN PARA WINDOWS/VPS/RDP 😵‍💫

* Descargar e instala Git [`Aquí`](https://git-scm.com/downloads)
* Descargar e instala NodeJS [`Aquí`](https://nodejs.org/en/download)
* Descargar e instala FFmpeg [`Aquí`](https://ffmpeg.org/download.html) (**No olvide agregar FFmpeg a la variable de entorno PATH**)
* Descargar e instala ImageMagick [`Aquí`](https://imagemagick.org/script/download.php)
* Descargar e instala Yarn [`Aquí`](https://classic.yarnpkg.com/en/docs/install#windows-stable)
```bash
git clone https://replit.com/github/ElChema-Nc/Shark-Bot && cd SharkLite && yarn install && npm install && npm update && node .
```
### Instalación de FFmpeg para Windows 
* Descarga cualquiera de las versiones de FFmpeg disponibles haciendo clic en [FFmpeg](https://www.gyan.dev/ffmpeg/builds/).
* Extraer archivos a `C:\` path.
* Cambie el nombre de la carpeta extraída a `ffmpeg`.
* Ejecute el símbolo del sistema como administrador.
* Ejecute el siguiente comando:
```cmd
> setx /m PATH "C:\ffmpeg\bin;%PATH%"
```
Si tiene éxito, le dará un mensaje como: `SUCCESS: specified value was saved`.
* Ahora que tiene FFmpeg instalado, verifique que funcionó ejecutando este comando para ver la versión:
```cmd
> ffmpeg -version
```
### 👑 CREADOR
[![ElChema-Nc](https://github.com/ElChema-Nc.png?size=300)](https://github.com/ElChema-Nc) 
