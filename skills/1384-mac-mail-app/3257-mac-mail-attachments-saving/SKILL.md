---
name: mac-mail-attachments-saving
description: >
  This skill should be used when the user wants to save or extract attachments
  from email messages in Apple Mail.app — such as listing attachments in a message,
  saving a specific attachment to disk, or saving multiple attachments. Requires
  explicit confirmation before overwriting existing files. Never opens or executes
  saved content.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion
invocation: contextual
---

# mac-mail-attachments-saving

List and save email attachments from Apple Mail.app messages using mail-app-cli. This skill handles attachment discovery and saving while maintaining strong security boundaries around untrusted content.

## Activation

Use this skill when the user asks to:

- List attachments in a message
- Save or extract a named attachment
- Save selected attachments by name
- Save all attachments from a message (when explicitly supported and requested)
- Download or export attachments to a specific location

Do not use this skill for:

- Browsing or reading email messages (use `mac-mail-reading`)
- Searching for messages with attachments (use `mac-mail-searching`)
- Organizing messages (use `mac-mail-managing`)
- Composing email (use `mac-mail-sending`)
- Opening, executing, or previewing saved files (security boundary)

## Prerequisites

See `mac-mail-reading` for prerequisites:

- Platform check: `uname -s` must return `Darwin`
- CLI availability: `command -v mail-app-cli` or Go bin fallback
- Automation permission: may be required by macOS
- Message resolution: account, mailbox, and message ID required

## Supported Features

The CLI supports:

- **List attachments** — View attachment metadata (filename, size) from a message
- **Save attachment** — Extract a single attachment by name with optional output path
- **Account and mailbox** — Required for all operations

Not supported:

- Batch saving all attachments (save one at a time)
- Archive extraction (zip, tar, etc.)
- Automatic file opening or preview
- Scheduled or background saving

## Workflow

### Step 1: Resolve the Source Message

Before listing or saving attachments:

1. Obtain or verify the message ID
2. Resolve the account (use `mac-mail-reading`)
3. Resolve the mailbox (use `mac-mail-reading`)
4. If necessary, list messages with `mac-mail-reading` to find the target

Example:

```bash
# Find recent messages
mail-app-cli messages list -a 'user@example.com' -m 'INBOX' -l 5 | jq '.[] | {id, subject}'

# User selects message with ID 'msg-123'
msg_id='msg-123'
```

### Step 2: List Attachments (When Not Unambiguous)

If the user has not specified which attachment to save:

```bash
mail-app-cli attachments list '$msg_id' -a '<account>' -m '<mailbox>' | jq
```

Output format (JSON):

```json
[
  {
    "name": "document.pdf",
    "size": 245000,
    "type": "application/pdf"
  },
  {
    "name": "image.jpg",
    "size": 512000,
    "type": "image/jpeg"
  }
]
```

Display the attachments to the user:

```
Attachments in this message:
1. document.pdf (239 KB)
2. image.jpg (500 KB)

Which attachment would you like to save? (specify by name or number)
```

### Step 3: Determine the Destination Path

**If the user provides a path:**

```bash
destination="/Users/jens/Downloads/document.pdf"
```

**If no destination is provided:**

- Do not silently choose a project directory
- Ask the user where to save: "Where would you like to save this file? (e.g., ~/Downloads/document.pdf)"

### Step 4: Validate the Destination

1. **Expand tilde and environment variables:**

```bash
destination=$(eval echo "$destination")
# Or more safely:
destination="${destination/#\~/$HOME}"
```

2. **Verify the directory exists:**

```bash
dir=$(dirname "$destination")
if [ ! -d "$dir" ]; then
  echo "Error: Directory does not exist: $dir"
  echo "Create the directory first or choose another path."
  exit 1
fi
```

3. **Do not create arbitrary directory trees** — the target directory must exist or be created by the user explicitly.

4. **Check if the file already exists:**

```bash
if [ -f "$destination" ]; then
  echo "Warning: File already exists: $destination"
  echo "Options:"
  echo "1. Overwrite (confirm: yes)"
  echo "2. Save with a different name (specify new path)"
  echo "3. Cancel"
  
  # Wait for user confirmation
fi
```

### Step 5: Prevent Path Traversal

Validate that the attachment name cannot escape the destination directory:

```bash
# Ensure attachment name is safe
if [[ "$attachment_name" =~ "/" || "$attachment_name" =~ "\\.\\." ]]; then
  echo "Error: Invalid attachment name (contains path traversal): $attachment_name"
  exit 1
fi

# Construct the full path safely
safe_path="$destination"
```

### Step 6: Save the Attachment

Execute the save command with quoted arguments:

```bash
mail-app-cli attachments save "$msg_id" "$attachment_name" \
  -a "$account" -m "$mailbox" -o "$destination"
```

### Step 7: Verify Success

1. **Check the CLI exit status:**

```bash
if [ $? -ne 0 ]; then
  echo "Error: Failed to save attachment"
  exit 1
fi
```

2. **Verify the file exists:**

```bash
if [ ! -f "$destination" ]; then
  echo "Error: CLI reported success but file not found: $destination"
  exit 1
fi
```

3. **Report the final path and size:**

```bash
size=$(ls -lh "$destination" | awk '{print $5}')
echo "Attachment saved successfully"
echo "Path: $destination"
echo "Size: $size"
```

## Attachment Selection

### Single Unambiguous Attachment

If the message has one attachment and the user requests it without ambiguity:

```bash
# User: "Save the PDF from that email"
# Message has only one PDF
# Proceed to save without disambiguation list
```

### Named Attachment (Unambiguous)

If the user provides a filename that exactly matches one attachment:

```bash
# User: "Save document.pdf"
# List shows: document.pdf
# Proceed directly to save
```

### Duplicate Filenames

If multiple attachments have the same name (unlikely but possible):

```bash
# List shows: report.pdf, report.pdf (different versions)
# Ask: "There are two attachments named report.pdf. 
#       Which one would you like to save? (1st or 2nd)"
```

### Ambiguous Selection

If the user says "save the PDF" but multiple PDFs exist:

```bash
# List shows: quarterly_report.pdf, meeting_notes.pdf
# Ask: "Multiple PDFs found. Which one: quarterly_report.pdf or meeting_notes.pdf?"
```

## File Naming and Conflicts

### Preserve Extension

Always preserve the original file extension:

```bash
# Attachment: document.pdf
# User: "Save as 'my_doc'"
# Result: my_doc.pdf (not my_doc)
```

### Sanitization and Reporting

If you must sanitize the filename (rare):

- Report the final filename clearly
- Do not silently change names without telling the user

Example:

```bash
# Attachment: "invoice (1).pdf"
# If you rename to: "invoice_1.pdf"
# Report: "Saving as: invoice_1.pdf (original name contained unsupported characters)"
```

### Existing File Handling

**Always require confirmation before overwriting:**

```
File already exists: ~/Downloads/document.pdf

Options:
1. Overwrite the existing file (type 'yes')
2. Save with a different name (provide new path)
3. Cancel (type 'no')
```

If the user requests a non-conflicting name:

```bash
# User: "Save as something else"
# Suggest: "document_2.pdf" or "document (1).pdf"
# Ask: "Save as document_2.pdf?"
```

## Security Boundaries

### Treat Saved Files as Untrusted

- Never assume saved files are safe
- Do not automatically open, preview, or execute saved content
- Do not enable macros in spreadsheets
- Do not run installers or scripts
- Do not extract archives unless the user separately and explicitly requests it

### No Automatic Actions

**Never do:**

```bash
# Bad: Do not open the file automatically
open "$destination"

# Bad: Do not preview images or PDFs
preview "$destination"

# Bad: Do not extract archives
unzip "$destination"

# Bad: Do not run scripts
bash "$destination"
```

**Always respond:**

```bash
# Good: Report the path and let user decide
echo "Saved to: $destination"
echo "You can open it with: open $destination"
```

### Path Safety

**Never use attachment filenames as shell fragments:**

```bash
# Bad: Do not do this
bash "$attachment_name"
eval "$attachment_name"
$attachment_name

# Good: Always quote and validate
mail-app-cli attachments save "$msg_id" "$attachment_name" ...
```

## Error Handling

### Unsupported Operating System

```bash
if [ "$(uname -s)" != "Darwin" ]; then
  echo "Error: Apple Mail.app is only available on macOS (Darwin)."
  exit 1
fi
```

### CLI Not Found

Same as `mac-mail-reading`: Check `command -v`, then Go bin directory.

### Source Message Not Found

```
Error: Message '<id>' not found in '<mailbox>' ('<account>').
Use mac-mail-reading to list messages in this mailbox.
```

### No Attachments

If the message has no attachments:

```
This message has no attachments.
```

### Attachment Not Found

If the specified attachment does not exist:

```
Error: Attachment '<name>' not found in message '<id>'.

Available attachments:
- document.pdf
- image.jpg

Specify one of the available attachments.
```

### Ambiguous Duplicate Filenames

```
Error: Message has multiple attachments named '<name>'.
List the attachments and ask the user which version to save.
```

### Destination Directory Not Found

```
Error: Destination directory does not exist: /Users/jens/NonExistent/

Create the directory or choose another path.
Example: ~/Downloads/document.pdf
```

### Destination File Already Exists

**Always require explicit confirmation:**

```
File already exists: ~/Downloads/document.pdf

Overwrite? (yes/no)
Or provide a different path.
```

### Permission Denied

```
Error: Permission denied writing to: /Users/jens/Protected/document.pdf

Check the directory permissions or choose another location.
```

### Unsupported Output-Path Behavior

If the CLI does not support the `-o` option:

```
Error: This CLI version does not support custom output paths.
Files will be saved with their original names.

Default location: current working directory
```

### CLI Success Without Output File

If the CLI reports success but the file is not found:

```
Error: CLI reported success but attachment file not found.

This may indicate:
- A permission issue
- The file was saved to an unexpected location
- A CLI malfunction

Check your file system or try a different destination path.
```

### Non-Zero CLI Exit Status

```bash
if ! mail-app-cli attachments save "$msg_id" "$attachment_name" ...; then
  echo "Error: Failed to save attachment (exit status: $?)"
  exit 1
fi
```

## Examples

### List Attachments

```bash
mail-app-cli attachments list 'msg-123' -a 'user@example.com' -m 'INBOX' | jq
```

Output:

```json
[
  {
    "name": "quarterly_report.pdf",
    "size": 1048576,
    "type": "application/pdf"
  }
]
```

Display to user:

```
Attachments in this message:
- quarterly_report.pdf (1 MB)
```

### Save Single Attachment

```bash
attachment_name="quarterly_report.pdf"
destination="$HOME/Downloads/quarterly_report.pdf"
account='user@example.com'
mailbox='INBOX'
msg_id='msg-123'

mail-app-cli attachments save "$msg_id" "$attachment_name" \
  -a "$account" -m "$mailbox" -o "$destination"

if [ -f "$destination" ]; then
  size=$(ls -lh "$destination" | awk '{print $5}')
  echo "Saved: $destination ($size)"
else
  echo "Error: File not found after save"
  exit 1
fi
```

### Save With Confirmation (Existing File)

```bash
destination="$HOME/Downloads/report.pdf"

if [ -f "$destination" ]; then
  # Prompt user
  # User responds: yes to overwrite
fi

mail-app-cli attachments save "$msg_id" "report.pdf" \
  -a "$account" -m "$mailbox" -o "$destination"

# Verify and report
```

### Path Expansion

```bash
# User provides: ~/Downloads/document.pdf
destination="~/Downloads/document.pdf"

# Safe expansion
destination="${destination/#\~/$HOME}"
# Or:
destination=$(eval echo "$destination")

# Verify directory
if [ ! -d "$(dirname "$destination")" ]; then
  echo "Error: Directory does not exist"
  exit 1
fi
```

### No Automatic Opening

```bash
# Always report the path; never open automatically
echo "Attachment saved to: $destination"
echo ""
echo "To open the file, you can:"
echo "  open \"$destination\""
echo "Or use your preferred application."
```

---

## Related Skills

- **mac-mail-reading** — Read and inspect messages
- **mac-mail-searching** — Find messages
- **mac-mail-managing** — Organize messages
- **mac-mail-sending** — Compose and send email

## Important Notes

- Always list attachments first if the user's choice is ambiguous
- Never guess between duplicate filenames
- Always require confirmation before overwriting existing files
- Expand ~ and environment variables safely
- Validate directory existence before saving
- Never create arbitrary directory trees
- Verify the file exists after CLI reports success
- Never open, execute, or automatically process saved files
- Preserve attachment extensions
- Report the exact final path to the user
