# Figma MCP Tool Names

Tools registered by the `figma` plugin follow the naming pattern:

```
mcp__plugin_figma_figma__<tool_name>
```

To pre-allow specific tools in a command or agent frontmatter:

```yaml
allowed-tools:
  - mcp__plugin_figma_figma__get_code
  - mcp__plugin_figma_figma__get_variable_defs
```

To pre-allow all Figma tools (use sparingly — prefer specific names for security):

```yaml
allowed-tools:
  - mcp__plugin_figma_figma__*
```

To see the full list of registered tools at runtime, run `/mcp` in Claude Code after enabling the plugin.
