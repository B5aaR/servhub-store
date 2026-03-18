#!/bin/bash
echo "🚀 Starting ServHub Installation..."

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_LIKE=$ID_LIKE
else
    echo "❌ Unsupported OS."
    exit 1
fi

if [[ "$OS" == "arch" || "$OS" == "cachyos" || "$OS" == "manjaro" || "$OS_LIKE" == *"arch"* ]]; then
    echo "🐧 Arch-based system detected. Installing from AUR..."
    if command -v yay &> /dev/null; then
        yay -S net.servexa.servhub
    elif command -v paru &> /dev/null; then
        paru -S net.servexa.servhub
    else
        echo "❌ No AUR helper found. Please install 'yay' or 'paru' first."
        exit 1
    fi
elif [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS" == "linuxmint" || "$OS_LIKE" == *"debian"* ]]; then
    echo "📦 Debian-based system detected. Fetching latest release..."
    DEB_URL=$(curl -s https://api.github.com/repos/B5aaR/servhub-store/releases/latest | grep "browser_download_url.*deb" | cut -d '"' -f 4)

    if [ -z "$DEB_URL" ]; then
        echo "❌ Could not find the .deb file on GitHub Releases."
        exit 1
    fi

    echo "⬇️ Downloading from $DEB_URL..."
    curl -L -o servhub-latest.deb "$DEB_URL"

    echo "⚙️ Installing dependencies and package..."
    sudo apt install ./servhub-latest.deb -y

    echo "🧹 Cleaning up..."
    rm servhub-latest.deb
else
    echo "⚠️ Unsupported OS: $OS. Please download the AppImage from GitHub Releases."
    exit 1
fi
echo "✅ ServHub installed successfully!"
