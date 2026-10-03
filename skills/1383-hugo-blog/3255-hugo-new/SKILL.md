---
name: hugo-new
description: >
  This skill should be used when the user asks to "create new content", "hugo new", "new post", "new blog post", "write a post", "new page", "create article",
  "add content", "scaffold content", "use archetype", "create from archetype", "list archetypes", "create page bundle", or wants to create new Hugo content
  files using archetypes. Provides guidance on Hugo archetype discovery, selection, and content creation via `hugo new`.
---

# Hugo New Content via Archetypes

Create new Hugo content files using the project's archetypes. Archetypes are content templates that Hugo applies when creating new pages with `hugo new`,
ensuring consistent frontmatter and body structure.

## Workflow

### 1. Discover Available Archetypes

Before creating content, discover what archetypes are available in the project. Check these locations in order of priority:

1. **Project archetypes**: `archetypes/` in the project root (highest priority)
2. **Theme/module archetypes**: `themes/<theme-name>/archetypes/` or module paths

List all archetype files to understand available content types:

```
Glob: archetypes/*.md
Glob: themes/*/archetypes/*.md
```

Read each archetype to understand the frontmatter fields and body scaffold it provides.

### 2. Determine Content Type and Path

Hugo selects archetypes based on the content path's first directory segment (the "section"):

- `hugo new posts/my-post.md` → looks for `archetypes/posts.md`
- `hugo new articles/my-article.md` → looks for `archetypes/articles.md`
- Falls back to `archetypes/default.md` if no section-specific archetype exists
- Falls back to theme archetypes if no project-level archetype exists

Use `--kind` to override automatic archetype selection:

```bash
hugo new --kind gallery posts/my-gallery.md
```

This is essential when:

- The target path does not match the desired archetype name
- Content is deeply nested
- A specific archetype is needed regardless of section

### 3. Identify Target Path Convention

Before running `hugo new`, check the existing content directory to understand the project's path conventions:

```
Glob: content/**/*.md
```

Common patterns to look for:

- **Flat**: `content/posts/my-post.md`
- **Date-prefixed**: `content/posts/2026/0208-my-post.md`
- **Page bundles**: `content/posts/my-post/index.md` (allows co-located assets)
- **Nested by year**: `content/posts/2026/my-post/index.md`

Match the existing convention when constructing the path for `hugo new`.

### 4. Create Content

Run `hugo new` with the determined path:

```bash
hugo new <section>/<path>.md
# or with explicit archetype:
hugo new --kind <archetype-name> <section>/<path>.md
```

**Page bundles**: To create a page bundle (directory with `index.md`), use:

```bash
hugo new <section>/<slug>/index.md
```

After creation, read the generated file and fill in or adjust frontmatter fields and body content as needed.

### 5. Present Result

After creating content:

1. Read the generated file to confirm it was created correctly
2. Show the user the frontmatter fields that need attention (title, tags, etc.)
3. Offer to fill in fields based on user input

## Archetype Template Syntax

Archetypes support Go template actions evaluated **once** at creation time. The most commonly used variables:

| Template Variable | Description                     |
| ----------------- | ------------------------------- |
| `{{ .Name }}`     | Filename without extension      |
| `{{ .Date }}`     | Current date in RFC 3339 format |

For the complete list of template variables and string functions, see `references/archetype-mechanics.md`.

## Key Rules

- **Extension matters**: An `.md` archetype is NOT used for `.markdown` targets and vice versa. Match the file extension.
- **Section mapping**: Hugo maps the first path segment after `content/` to the archetype name. Use `--kind` to override.
- **Project overrides theme**: A project-level archetype takes priority over the same-named theme archetype.
- **Check before creating**: Always discover archetypes and content conventions before running `hugo new` to avoid mismatched templates or inconsistent paths.

## Additional Resources

### Reference Files

For detailed archetype mechanics and advanced usage:

- **`references/archetype-mechanics.md`** - Detailed archetype resolution logic, template variables, and advanced patterns
