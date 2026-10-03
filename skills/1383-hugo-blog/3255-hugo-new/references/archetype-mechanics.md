# Hugo Archetype Mechanics

## Archetype Resolution Order

When `hugo new <path>` is invoked, Hugo resolves the archetype in this order:

1. `archetypes/<section>.md` in the project root
2. `archetypes/default.md` in the project root
3. `archetypes/<section>.md` in the theme or Hugo module
4. `archetypes/default.md` in the theme or Hugo module
5. Hugo's internal default (title + date frontmatter)

Where `<section>` is the first directory segment of the content path. For example, `hugo new posts/2026/my-post.md` uses section `posts`.

### Overriding with --kind

The `--kind <name>` flag bypasses section-based resolution and forces Hugo to use `archetypes/<name>.md`. This is useful when:

- Content is nested deeper than one level and the section doesn't match the desired type
- Multiple content types share the same section directory
- Creating content that maps to a theme archetype by a different name

Example:

```bash
# Uses archetypes/gallery.md even though the path is in posts/
hugo new --kind gallery posts/2026/my-gallery/index.md
```

## Frontmatter Formats

Archetypes can use any of Hugo's supported frontmatter formats:

| Format | Delimiters | Example              |
| ------ | ---------- | -------------------- |
| TOML   | `+++`      | `title = "My Post"`  |
| YAML   | `---`      | `title: "My Post"`   |
| JSON   | `{` `}`    | `"title": "My Post"` |

Match the format used by existing archetypes in the project for consistency.

## Template Variables

All Go template variables available in archetypes:

### File-related

- `{{ .Name }}` - Filename without extension (e.g., `my-post`)
- `{{ .File.ContentBaseName }}` - Same as .Name for regular files, `index` for bundles
- `{{ .File.Dir }}` - Directory path relative to content/
- `{{ .File.Ext }}` - File extension
- `{{ .File.LogicalName }}` - Filename with extension
- `{{ .File.Path }}` - Full path relative to content/
- `{{ .File.TranslationBaseName }}` - Filename without extension and language suffix

### Content-related

- `{{ .Date }}` - Current date/time in RFC 3339 format
- `{{ .Type }}` - Content type (defaults to section name)
- `{{ .Site.Title }}` - Site title from configuration
- `{{ .Site.BaseURL }}` - Site base URL from configuration

### String Functions

Common functions used in archetypes:

- `{{ replace .Name "-" " " | title }}` - Convert slug to title case
- `{{ .Date | time.Format "2006-01-02" }}` - Custom date format
- `{{ lower .Name }}` - Lowercase
- `{{ upper .Name }}` - Uppercase

## Page Bundles

Hugo supports two types of page bundles:

### Leaf Bundle

A directory with `index.md` — represents a single page with associated resources:

```
content/posts/my-post/
├── index.md          # The page content
├── image1.jpg        # Page resource
└── data.csv          # Page resource
```

Create with:

```bash
hugo new posts/my-post/index.md
```

### Branch Bundle

A directory with `_index.md` — represents a section/list page:

```
content/posts/
├── _index.md         # Section page
├── post-1.md
└── post-2.md
```

Create with:

```bash
hugo new posts/_index.md
```

## Directory Archetypes

For page bundles, Hugo also supports directory archetypes. Instead of a single `archetypes/<name>.md` file, create a directory:

```
archetypes/
└── posts/
    ├── index.md      # Archetype for the page
    └── bio.md        # Additional file scaffolded alongside
```

When `hugo new --kind posts posts/my-post` is run, Hugo copies the entire directory structure.

## Body Content in Archetypes

Archetypes can include body content below the frontmatter to scaffold consistent page structures:

```markdown
---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
tags: []
---

## Introduction

Write your introduction here.

## Main Content

Add your main content here.

## Conclusion

Summarize your key points.
```

This is useful for:

- Blog posts with consistent sections
- Recipe pages with ingredients/preparation structure
- Documentation pages with standard headings
- Review pages with rating sections

## Creating Custom Archetypes

To create a new archetype for the project:

1. Create `archetypes/<name>.md` in the project root
2. Add frontmatter with all fields relevant to this content type
3. Use template variables for dynamic values (date, title)
4. Optionally add body content for scaffolding
5. Test with `hugo new --kind <name> <section>/test.md`
6. Verify the generated file matches expectations
7. Delete the test file

### Example: Custom Article Archetype

```markdown
---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true
description: ""
tags: []
categories: []
author: ""
---
```

### Example: Custom Review Archetype with Body

```markdown
---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true
rating: 0
tags: []
---

## Overview

Brief overview of what is being reviewed.

## Pros

-

## Cons

-

## Verdict

Final thoughts and rating justification.
```

## Troubleshooting

### Archetype not being used

- Verify the archetype filename matches the section name
- Check file extension matches (`.md` vs `.markdown`)
- Use `--kind` to explicitly select the archetype
- Check if a project-level archetype is shadowing a theme archetype

### Template variables not resolved

- Ensure using `{{ }}` syntax (double curly braces)
- Template actions are only evaluated at creation time, not build time
- Check for typos in variable names (case-sensitive)

### Wrong frontmatter format

- Hugo respects the delimiters in the archetype (`+++` for TOML, `---` for YAML)
- Match the format used by the rest of the project for consistency

## References

- [Hugo Archetypes Documentation](https://gohugo.io/content-management/archetypes/)
- [Hugo Page Bundles](https://gohugo.io/content-management/page-bundles/)
- [Hugo Templating Functions](https://gohugo.io/functions/)
