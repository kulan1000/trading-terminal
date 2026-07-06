#!/bin/bash
# Builds "Trading Terminal.app" — a chromeless Chrome app-window wrapper for
# the production terminal (same pattern as the Cowork OS desktop launcher).
# Usage: bash desktop/build-app.sh [/Applications]
set -euo pipefail
DEST="${1:-/Applications}/Trading Terminal.app"
URL="https://trading-terminal-woad.vercel.app/market"
HERE="$(cd "$(dirname "$0")" && pwd)"

rm -rf "$DEST"
mkdir -p "$DEST/Contents/MacOS" "$DEST/Contents/Resources"

cat > "$DEST/Contents/MacOS/trading-terminal" << LAUNCH
#!/bin/bash
# Dedicated user-data-dir: Chrome starts its OWN instance so the URL loads
# reliably even when the main Chrome (with its profiles) is already running.
URL="$URL"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE="\$HOME/.trading-terminal-chrome"
mkdir -p "\$PROFILE"
if [ -x "\$CHROME" ]; then
  exec "\$CHROME" \\
    --user-data-dir="\$PROFILE" \\
    --app="\$URL" \\
    --no-first-run \\
    --no-default-browser-check \\
    --window-size=1500,950 >/dev/null 2>&1
else
  exec /usr/bin/open "\$URL"
fi
LAUNCH
chmod +x "$DEST/Contents/MacOS/trading-terminal"

cat > "$DEST/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key><string>Trading Terminal</string>
  <key>CFBundleName</key><string>Trading Terminal</string>
  <key>CFBundleExecutable</key><string>trading-terminal</string>
  <key>CFBundleIdentifier</key><string>com.caspar.trading-terminal</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

cp "$HERE/icon.icns" "$DEST/Contents/Resources/icon.icns"
codesign --force --deep -s - "$DEST" 2>/dev/null || true
touch "$DEST"
echo "Built: $DEST"
