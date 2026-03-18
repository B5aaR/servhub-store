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

# Arch / CachyOS / Manjaro
if [[ "$OS" == "arch" || "$OS" == "cachyos" || "$OS" == "manjaro" || "$OS_LIKE" == *"arch"* ]]; then
    echo "🐧 Arch-based system detected. Installing from AUR..."
    if command -v yay &> /dev/null; then
        yay -S servhub
    elif command -v paru &> /dev/null; then
        paru -S servhub
    else
        echo "❌ No AUR helper found. Please install 'yay' or 'paru' first."
        exit 1
    fi

# Debian / Ubuntu / Mint
elif [[ "$OS" == "ubuntu" || "$OS" == "debian" || "$OS" == "linuxmint" || "$OS_LIKE" == *"debian"* ]]; then
    echo "📦 Debian-based system detected. Adding ServHub APT repository..."
    curl -fsSL https://apt.servexa.net/servhub.gpg | sudo gpg --dearmor -o /usr/share/keyrings/servhub.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/servhub.gpg] https://apt.servexa.net stable main" | sudo tee /etc/apt/sources.list.d/servhub.list
    sudo apt update
    sudo apt install servhub -y

# Fedora / RHEL
elif [[ "$OS" == "fedora" || "$OS" == "rhel" || "$OS" == "centos" || "$OS_LIKE" == *"fedora"* ]]; then
    echo "📦 RPM-based system detected. Fetching latest release..."
    RPM_URL=$(curl -s https://api.github.com/repos/B5aaR/servhub-store/releases/latest | grep "browser_download_url.*\.rpm" | cut -d '"' -f 4)
    if [ -z "$RPM_URL" ]; then
        echo "⚠️  No .rpm found, falling back to AppImage..."
        APPIMAGE_URL=$(curl -s https://api.github.com/repos/B5aaR/servhub-store/releases/latest | grep "browser_download_url.*\.AppImage" | cut -d '"' -f 4)
        curl -L -o "$HOME/ServHub.AppImage" "$APPIMAGE_URL"
        chmod +x "$HOME/ServHub.AppImage"
        echo "✅ AppImage saved to ~/ServHub.AppImage"
        exit 0
    fi
    curl -L -o /tmp/servhub-latest.rpm "$RPM_URL"
    sudo dnf install /tmp/servhub-latest.rpm -y 2>/dev/null || sudo rpm -i /tmp/servhub-latest.rpm
    rm /tmp/servhub-latest.rpm

# Fallback — AppImage
else
    echo "⚠️  OS not directly supported. Downloading AppImage..."
    APPIMAGE_URL=$(curl -s https://api.github.com/repos/B5aaR/servhub-store/releases/latest | grep "browser_download_url.*\.AppImage" | cut -d '"' -f 4)
    if [ -z "$APPIMAGE_URL" ]; then
        echo "❌ Could not find release."
        exit 1
    fi
    curl -L -o "$HOME/ServHub.AppImage" "$APPIMAGE_URL"
    chmod +x "$HOME/ServHub.AppImage"
    echo "✅ AppImage saved to ~/ServHub.AppImage — run it directly."
    exit 0
fi

echo "✅ ServHub installed! Launch it from your app menu."
