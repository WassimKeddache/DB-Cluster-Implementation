#!/bin/bash

# Source: https://medium.com/@ther12k/offline-installation-of-docker-on-ubuntu-a-step-by-step-guide-3afce826b4be

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Check if correct number of arguments provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <architecture> <distro>"
  exit 1
fi

ARCHITECTURE=$1
DISTRO=$2

# Current directory
CURRENT_DIR=$(pwd)

# URL of the HTML page with the list of Docker files
HTML_URL="https://download.docker.com/linux/ubuntu/dists/${DISTRO}/pool/stable/${ARCHITECTURE}/"

# Function to download a specific package with a progress bar
download_package() {
  PACKAGE=$1
  URL="${HTML_URL}${PACKAGE}"
  echo "Downloading $PACKAGE..."
  curl -L --progress-bar "$URL" -o "$CURRENT_DIR/$PACKAGE"
}

# List of required packages and their versions
declare -A PACKAGES=(
  ["containerd.io"]="containerd.io_1.7.24-1_amd64.deb"
  ["docker-buildx-plugin"]="docker-buildx-plugin_0.17.1-1~ubuntu.22.04~jammy_amd64.deb"
  ["docker-ce-cli"]="docker-ce-cli_27.3.1-1~ubuntu.22.04~jammy_amd64.deb"
  ["docker-ce"]="docker-ce_27.3.1-1~ubuntu.22.04~jammy_amd64.deb"
  ["docker-compose-plugin"]="docker-compose-plugin_2.29.7-1~ubuntu.22.04~jammy_amd64.deb"
)

# Download and install each package
for TYPE in "${!PACKAGES[@]}"; do
  PACKAGE="${PACKAGES[$TYPE]}"
  download_package "$PACKAGE"
  echo "Installing $PACKAGE..."
  sudo dpkg -i "./$PACKAGE"
done

echo "Docker packages downloaded and installed successfully!"