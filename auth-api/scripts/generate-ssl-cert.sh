#!/bin/bash
# Generate self-signed SSL certificate for development/testing

set -e

CERT_DIR="nginx/ssl"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# Create SSL directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "SSL certificates already exist in $CERT_DIR"
  echo "To regenerate, delete the existing files first."
  exit 0
fi

echo "Generating self-signed SSL certificate..."

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✓ SSL certificate generated successfully!"
echo "  Certificate: $CERT_FILE"
echo "  Private Key: $KEY_FILE"
echo ""
echo "⚠️  This is a self-signed certificate for development/testing only."
echo "⚠️  For production, use certificates from a trusted CA like Let's Encrypt."
