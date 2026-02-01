#!/bin/bash
# Agent Autonomous Installation Script for android-use
# This script can be run by AI agents to automatically set up the skill
#
# Usage: ./install.sh [OPTIONS]
#
# Options:
#   --claude-code, -c     Install for Claude Code environment
#   --agent=NAME          Install for specific agent (claude-code, opencode, etc.)
#   --non-interactive, -n Run without interactive prompts
#   --help, -h            Show this help message

set -e

# Parse command line arguments
AGENT=""
NON_INTERACTIVE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --claude-code|-c)
      AGENT="claude-code"
      shift
      ;;
    --agent=*)
      AGENT="${1#*=}"
      shift
      ;;
    --agent)
      AGENT="$2"
      shift 2
      ;;
    --non-interactive|-n)
      NON_INTERACTIVE=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --claude-code, -c     Install for Claude Code environment"
      echo "  --agent=NAME          Install for specific agent (claude-code, opencode, etc.)"
      echo "  --non-interactive, -n Run without interactive prompts"
      echo "  --help, -h            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

REPO_URL="https://github.com/iurysza/android-use.git"
SCRIPT_NAME="android-use"

# Set skill directory based on agent
if [ "$AGENT" = "claude-code" ]; then
  SKILL_DIR="${HOME}/.claude/skills/android-use"
else
  SKILL_DIR="${HOME}/.config/opencode/skill/android-use"
fi

REPO_DIR="$SKILL_DIR/repo"

echo "=== android-use Agent Installation ==="
if [ -n "$AGENT" ]; then
  echo "Agent: $AGENT"
  echo "Install path: $SKILL_DIR"
fi
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check for git
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed"
    exit 1
fi

# Check for bun
if ! command -v bun &> /dev/null; then
    echo "Error: bun is required but not installed"
    echo "Install from: https://bun.sh"
    exit 1
fi

# Check for adb
if ! command -v adb &> /dev/null; then
    echo "Warning: adb not found. You'll need Android Platform Tools installed."
    echo "Download from: https://developer.android.com/studio/releases/platform-tools"
fi

echo "✓ Prerequisites met"
echo ""

# Create skills directory
echo "Creating skills directory..."
mkdir -p "$SKILL_DIR"
echo ""

# Clone repository
echo "Cloning repository..."
if [ -d "$REPO_DIR/.git" ]; then
    echo "Directory exists, pulling latest..."
    cd "$REPO_DIR"
    git pull
else
    # If old structure exists without repo subfolder, backup and re-clone
    if [ -d "$SKILL_DIR/.git" ]; then
        echo "Migrating from old structure..."
        mv "$SKILL_DIR" "${SKILL_DIR}.backup.$(date +%s)"
        mkdir -p "$SKILL_DIR"
    fi
    git clone "$REPO_URL" "$REPO_DIR"
fi
echo "✓ Repository cloned/updated"
echo ""

# Install dependencies
echo "Installing dependencies..."
cd "$REPO_DIR"
bun install
echo "✓ Dependencies installed"
echo ""

# Build project
echo "Building project..."
bun run build
echo "✓ Build complete"
echo ""

# Create SKILL.md
echo "Creating SKILL.md..."
cat > "$SKILL_DIR/SKILL.md" << 'EOF'
# android-use

Control Android devices via ADB commands.

## Available Tools

- `android-use` - Main CLI tool for device control

## Prerequisites

- Android device with USB debugging enabled
- ADB installed and in PATH
- bun runtime

## Usage

```bash
# Check device connection
android-use check-device

# Get screen UI hierarchy
android-use get-screen

# Tap on coordinates
android-use tap 540 960

# Type text
android-use type-text "Hello World"

# Press key
android-use key HOME

# Launch app
android-use launch-app com.android.chrome

# Swipe
android-use swipe 540 1500 540 500
```

## Examples

See `repo/examples/` directory for detailed usage examples.
EOF
echo "✓ SKILL.md created"
echo ""

# Create wrapper script at skill root
echo "Creating wrapper script..."
cat > "$SKILL_DIR/$SCRIPT_NAME" << EOF
#!/bin/bash
exec "$SKILL_DIR/repo/dist/index.js" "\$@"
EOF
chmod +x "$SKILL_DIR/$SCRIPT_NAME"
echo "✓ Wrapper script created"
echo ""

# Add to PATH if not already there
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

if [ -n "$SHELL_CONFIG" ]; then
    if ! grep -q "$SKILL_DIR" "$SHELL_CONFIG" 2>/dev/null; then
        echo "Adding to PATH in $SHELL_CONFIG..."
        echo "export PATH=\"$SKILL_DIR:\$PATH\"" >> "$SHELL_CONFIG"
        echo "✓ Added to PATH"
        echo ""
        echo "Note: Run 'source $SHELL_CONFIG' or restart your shell to use 'android-use' directly"
    else
        echo "✓ Already in PATH"
    fi
else
    echo "Could not find shell config file. Add this to your shell config:"
    echo "export PATH=\"$SKILL_DIR:\$PATH\""
fi

echo ""

# Verify installation
echo "Verifying installation..."
if "$SKILL_DIR/$SCRIPT_NAME" check-device; then
    echo ""
    echo "=== Installation Complete ==="
    echo ""
    echo "Structure:"
    echo "  $SKILL_DIR/"
    echo "  ├── SKILL.md           # Skill metadata"
    echo "  ├── android-use        # Wrapper script"
    echo "  └── repo/              # Git repository"
    echo "      ├── src/"
    echo "      ├── dist/"
    echo "      └── ..."
    echo ""
    echo "Usage:"
    echo "  Direct: $SKILL_DIR/android-use <command>"
    echo "  Or if in PATH: android-use <command>"
    echo ""
    echo "Quick start:"
    echo "  android-use check-device     # List devices"
    echo "  android-use get-screen       # Get UI state"
    echo "  android-use tap 540 960      # Tap screen"
    echo ""
    echo "See SKILL.md for more examples"
else
    echo ""
    echo "Installation complete, but device check failed."
    echo "This is expected if no Android device is connected."
    echo ""
    echo "Structure created at: $SKILL_DIR/"
    echo "To use: $SKILL_DIR/android-use <command>"
fi
