#!/bin/sh
set -e

REPO_URL="https://github.com/puutaro/webdi.git"
TOML_URL="https://raw.githubusercontent.com/puutaro/webdi/master/webdi.toml"
BINARY_NAME="webdi"
INSTALL_DIR="/usr/local/bin"
OS="$(uname -s)"

# macOSかつbrewがインストールされていない場合はエラーを出して即終了
if [ "$OS" = "Darwin" ] && ! command -v brew >/dev/null 2>&1; then
    echo "Error: Homebrew is required on macOS. Please install Homebrew (https://brew.sh/) and try again." >&2
    exit 1
fi

# sudoが必要な場合に事前に認証を通す (stdinからの入力トラブルを回避)
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
        if [ -t 0 ]; then
            $SUDO -v
        fi
    else
        echo "Error: sudo command not found. Please run this script as root." >&2
        exit 1
    fi
fi

# 1. Gitの確認・自動インストール (macOS用ビルド時のみ使用)
ensure_git() {
    if ! command -v git >/dev/null 2>&1; then
        echo "==> Git is not installed. Installing Git..."
        brew install git
    fi
}

# 2. Goの確認・自動インストール (macOS用ビルド時のみ使用)
ensure_go() {
    if ! command -v go >/dev/null 2>&1; then
        echo "==> Go is not installed. Installing Go..."
        GO_VERSION="1.22.5"
        ARCH="$(uname -m)"
        if [ "$ARCH" = "x86_64" ]; then
            ARCH="amd64"
        elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            ARCH="arm64"
        fi
        GO_TARBALL="go${GO_VERSION}.darwin-${ARCH}.tar.gz"
        curl -sLO "https://golang.org/dl/${GO_TARBALL}"
        $SUDO rm -rf /usr/local/go
        $SUDO tar -C /usr/local -xzf "${GO_TARBALL}"
        rm -f "${GO_TARBALL}"
    fi
    export PATH="/usr/local/go/bin:$PATH"
    export PATH="$HOME/go/bin:$PATH"
    if command -v go >/dev/null 2>&1; then
        export PATH="$PATH:$(go env GOPATH)/bin"
    fi
}

# 3. Node.js (npm) の確認・自動インストール (macOS用ビルド時のみ使用)
ensure_node() {
    if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
        echo "==> Node.js/npm is not installed. Installing Node.js..."
        brew install node
    fi
}

# 4. Wails CLIの確認・自動インストール (macOS用ビルド時のみ使用)
ensure_wails() {
    if ! command -v wails >/dev/null 2>&1; then
        echo "==> Wails CLI is not installed. Installing Wails..."
        go install github.com/wailsapp/wails/v2/cmd/wails@latest
    fi
}

# --- 実行フロー ---
case "$OS" in
    Linux)
        TEMP_DIR=$(mktemp -d)
        trap 'rm -rf "$TEMP_DIR"' EXIT

        echo "==> Fetching version from webdi.toml..."
        RAW_VERSION=$(curl -fsSL "$TOML_URL" | grep -E '^[[:space:]]*version[[:space:]]*=' | head -n 1 | sed -E 's/.*=[[:space:]]*"([^"]+)".*/\1/')
        if [ -z "$RAW_VERSION" ]; then
            echo "Error: Failed to parse version from webdi.toml" >&2
            exit 1
        fi
        VERSION="v${RAW_VERSION}"
        echo "==> Detected version: ${VERSION}"
        ARCH="$(uname -m)"
        if [ "$ARCH" = "x86_64" ]; then
            DOWNLOAD_URL="https://github.com/puutaro/webdi/releases/download/${VERSION}/webdi_${VERSION}_linux_amd64"
        elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            DOWNLOAD_URL="https://github.com/puutaro/webdi/releases/download/${VERSION}/webdi_${VERSION}_linux_arm64"
        else
            echo "Error: Unsupported Linux architecture ($ARCH)" >&2
            exit 1
        fi
        echo "==> Downloading $BINARY_NAME for Linux ($ARCH) from $DOWNLOAD_URL..."
        curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_DIR/$BINARY_NAME"
        chmod +x "$TEMP_DIR/$BINARY_NAME"
        BUILT_BINARY="$TEMP_DIR/$BINARY_NAME"
        ;;
    Darwin)
        ensure_git
        ensure_go
        ensure_node
        ensure_wails

        MAC_BUILD_DIR="$HOME/.webdi_build"
        
        if [ -d "$MAC_BUILD_DIR" ]; then
            echo "==> Updating repository in $MAC_BUILD_DIR..."
            cd "$MAC_BUILD_DIR"
            git fetch --all
            git reset --hard origin/master
        else
            echo "==> Cloning repository to $MAC_BUILD_DIR..."
            git clone --depth 1 "$REPO_URL" "$MAC_BUILD_DIR"
            cd "$MAC_BUILD_DIR"
        fi

        echo "==> Building for macOS..."
        wails build --clean -ldflags "-s -w" -v 2
        BUILT_BINARY="$MAC_BUILD_DIR/build/bin/${BINARY_NAME}.app/Contents/MacOS/$BINARY_NAME"
        ;;
    *)
        echo "Error: Unsupported OS ($OS)" >&2
        exit 1
        ;;
esac

# バイナリのインストール処理
if [ -f "$BUILT_BINARY" ]; then
    echo "==> Installing to $INSTALL_DIR..."
    $SUDO cp "$BUILT_BINARY" "$INSTALL_DIR/$BINARY_NAME"
    $SUDO chmod 755 "$INSTALL_DIR/$BINARY_NAME"
    
    # macOS用コード署名 (コピー後に配置先のファイルへ直接アドホック署名)
    if [ "$OS" = "Darwin" ]; then
        echo "==> Signing $INSTALL_DIR/$BINARY_NAME..."
        $SUDO codesign --force --sign - "$INSTALL_DIR/$BINARY_NAME"
    fi

    echo "==> Successfully installed: $INSTALL_DIR/$BINARY_NAME"
else
    echo "Error: Target binary not found." >&2
    exit 1
fi