#!/usr/bin/env bash
# Verify the Figma Dev Mode MCP server is reachable on localhost:3845.
set -euo pipefail

HOST="127.0.0.1"
PORT="3845"
TIMEOUT=3

if curl --silent --max-time "$TIMEOUT" --output /dev/null \
    "http://${HOST}:${PORT}/mcp"; then
  echo "OK: Figma MCP server is reachable at http://${HOST}:${PORT}/mcp"
  exit 0
fi

# curl may exit non-zero for a valid server that returns an error body;
# check if the port is at least open via nc.
if nc -z -w "$TIMEOUT" "$HOST" "$PORT" 2>/dev/null; then
  echo "OK: Port ${PORT} is open (server running, MCP endpoint may require a session)"
  exit 0
fi

echo "ERROR: Figma MCP server not reachable on ${HOST}:${PORT}"
echo ""
echo "Checklist:"
echo "  1. Figma desktop is running"
echo "  2. Dev Mode is enabled for your organisation"
echo "  3. Preferences > Dev Mode > 'Enable Dev Mode MCP Server' is toggled on"
echo "  4. No firewall blocking loopback connections"
exit 1
