#!/data/data/com.termux/files/usr/bin/bash

set -Eeuo pipefail

REPO_URL="https://github.com/OsmaldoKr/KumaBot.git"
APP_DIR="KumaBot"

COLOR_RESET="\033[0m"
COLOR_RED="\033[1;31m"
COLOR_GREEN="\033[1;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_BLUE="\033[1;34m"
COLOR_MAGENTA="\033[1;35m"
COLOR_CYAN="\033[1;36m"

clear

echo -e "${COLOR_MAGENTA}"
echo "╔══════════════════════════════════════════════╗"
echo "║                  👺 KUMABOT                  ║"
echo "║        Instalador oficial para Termux         ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${COLOR_RESET}"

echo -e "${COLOR_CYAN}Preparando la instalación...${COLOR_RESET}"
sleep 1

if [[ ! -d "/data/data/com.termux" ]]; then
  echo -e "${COLOR_YELLOW}Advertencia: este script fue diseñado para Termux.${COLOR_RESET}"
fi

instalar_paquete() {
  local paquete="$1"
  local comando_verificacion="${2:-$1}"

  if command -v "$comando_verificacion" >/dev/null 2>&1; then
    echo -e "${COLOR_YELLOW}✓ ${paquete} ya está instalado.${COLOR_RESET}"
    return
  fi

  echo -e "${COLOR_CYAN}Instalando ${paquete}...${COLOR_RESET}"

  if pkg install -y "$paquete"; then
    echo -e "${COLOR_GREEN}✓ ${paquete} instalado correctamente.${COLOR_RESET}"
  else
    echo -e "${COLOR_RED}✗ No se pudo instalar ${paquete}.${COLOR_RESET}"
    echo -e "${COLOR_YELLOW}Verifica tu conexión a Internet y vuelve a intentarlo.${COLOR_RESET}"
    exit 1
  fi
}

echo -e "\n${COLOR_MAGENTA}Actualizando repositorios de Termux...${COLOR_RESET}"

if ! pkg update -y; then
  echo -e "${COLOR_RED}No se pudieron actualizar los repositorios.${COLOR_RESET}"
  exit 1
fi

echo -e "\n${COLOR_CYAN}Instalando herramientas necesarias...${COLOR_RESET}"

instalar_paquete "git"
instalar_paquete "nodejs" "node"
instalar_paquete "ffmpeg"
instalar_paquete "imagemagick" "convert"

echo -e "\n${COLOR_MAGENTA}Verificando el proyecto...${COLOR_RESET}"

if [[ -d "$APP_DIR/.git" ]]; then
  echo -e "${COLOR_YELLOW}El proyecto ya existe. Actualizando archivos...${COLOR_RESET}"

  cd "$APP_DIR"

  if ! git pull; then
    echo -e "${COLOR_RED}No se pudo actualizar el repositorio.${COLOR_RESET}"
    exit 1
  fi
else
  if [[ -d "$APP_DIR" ]]; then
    echo -e "${COLOR_RED}La carpeta '${APP_DIR}' ya existe, pero no es un repositorio Git.${COLOR_RESET}"
    echo -e "${COLOR_YELLOW}Renómbrala o elimínala antes de ejecutar nuevamente el instalador.${COLOR_RESET}"
    exit 1
  fi

  echo -e "${COLOR_CYAN}Descargando KumaBot...${COLOR_RESET}"

  if ! git clone "$REPO_URL" "$APP_DIR"; then
    echo -e "${COLOR_RED}No se pudo clonar el repositorio.${COLOR_RESET}"
    echo -e "${COLOR_YELLOW}Revisa que la URL configurada sea correcta:${COLOR_RESET}"
    echo "$REPO_URL"
    exit 1
  fi

  cd "$APP_DIR"
fi

echo -e "\n${COLOR_CYAN}Instalando dependencias de Node.js...${COLOR_RESET}"

if [[ -f "package-lock.json" ]]; then
  npm ci
else
  npm install
fi

echo -e "\n${COLOR_GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║       ✓ INSTALACIÓN COMPLETADA CON ÉXITO      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${COLOR_RESET}"

echo -e "${COLOR_YELLOW}Versiones detectadas:${COLOR_RESET}"
echo -e "Node.js: $(node -v)"
echo -e "NPM:     $(npm -v)"
echo -e "FFmpeg:  $(ffmpeg -version 2>/dev/null | head -n 1 || echo 'No detectado')"

echo -e "\n${COLOR_CYAN}Iniciando KumaBot...${COLOR_RESET}"
echo -e "${COLOR_YELLOW}Escanea el código QR desde WhatsApp cuando aparezca.${COLOR_RESET}\n"

npm start
