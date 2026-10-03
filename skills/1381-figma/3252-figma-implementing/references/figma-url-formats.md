# Figma URL Formats

## Supported URL Patterns

### Design / File URL (most common)

```
https://www.figma.com/design/<FILE_KEY>/<optional-title>?node-id=<NODE_ID>
https://www.figma.com/file/<FILE_KEY>/<optional-title>?node-id=<NODE_ID>
```

- `design` is the current path segment; `file` is the legacy equivalent — both work identically.
- `<FILE_KEY>` is the alphanumeric ID segment after `/design/` or `/file/`.
- `?node-id=` points to a specific frame, component, or group. If absent, the URL targets the root page.

### Prototype URL

```
https://www.figma.com/proto/<FILE_KEY>/<optional-title>?node-id=<NODE_ID>
```

The file key and node ID extraction are identical. Prototype URLs point to frames, so the node is still inspectable.

### Component Library URL

No separate URL format — component instances in the canvas share the same `figma.com/design/` URL. The component master lives in the same or a linked library file.

## Extracting the File Key and Node ID

### File key

The file key is the path segment immediately after `/design/`, `/file/`, or `/proto/`:

```
https://www.figma.com/design/ABCD1234efgh5678/My-Design?...
                              ^^^^^^^^^^^^^^^^  ← file key
```

### Node ID

The node ID is the value of the `node-id` query parameter:

```
?node-id=123-456      ← format A  (dash-separated)
?node-id=123%3A456    ← format B  (URL-encoded colon)
```

Both represent the same node. Figma MCP tools typically accept either form; prefer the decoded form `123:456` in tool calls.

### Shell extraction example

```bash
URL="https://www.figma.com/design/ABCD1234efgh5678/My-Design?node-id=123-456"

FILE_KEY=$(echo "$URL" | sed -E 's|.*/design/([^/?]+).*|\1|')
NODE_ID=$(echo "$URL" | grep -oE 'node-id=([^&]+)' | cut -d= -f2 | sed 's/%3A/:/g; s/-/:/g')

echo "File key: $FILE_KEY"   # ABCD1234efgh5678
echo "Node ID:  $NODE_ID"    # 123:456
```

## Edge Cases

**No `node-id` in URL**
The user copied the file URL without selecting a node. Ask them to open Figma, right-click the target frame or component, and copy the link — this includes the `node-id`.

**`node-id` with a `t=` parameter**
The `t` parameter is a session token for sharing; it does not affect the node. Ignore it.

**Branch URLs**
Figma branches have a `branch-id` query parameter. The file key still identifies the main file; the branch data may differ from main. Note this to the user if a branch parameter is present.

**Figma Community file URL**
```
https://www.figma.com/community/file/<FILE_KEY>
```
Community files may be view-only. The user must duplicate the file to their drafts before Dev Mode tools can inspect it.
