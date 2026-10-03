---
name: sql-server-query
description: "Ad-hoc queries against the SQL Server database of any .NET application via sqlcmd on Windows — find the connection string in the project yourself, build the command, read-only by default. Trigger: 'look in the database', 'search the database', 'check in SQL', 'what's the structure of this table'."
---

# Querying a SQL Server database (.NET application, Windows / VS Code)

Goal: with no prior knowledge of the project, find the database connection, connect
with `sqlcmd`, and run queries. **Read-only** by default.

## 1. Find the connection string in the project

Search in this order (Grep across the repository):

1. `appsettings.Development.json`, `appsettings.development.json`,
   `appsettings.*.json`, `appsettings.json` — the `ConnectionStrings` key or the
   patterns `Data Source=` / `Server=`
2. **User secrets**: if the `.csproj` has a `<UserSecretsId>` element, check
   `%APPDATA%\Microsoft\UserSecrets\<id>\secrets.json`
3. Older projects (.NET Framework): see [Legacy .NET Framework projects](#legacy-net-framework-projects)
4. `docker-compose*.yml`, `.env`, `launchSettings.json` (environment variables of
   the form `ConnectionStrings__...`)

If you find more than one connection string, ask the user which database is the
right one — don't guess (unless it's obvious from context, e.g. the only
development string).

## Legacy .NET Framework projects

You recognize them by `packages.config`, `web.config`/`app.config`, and a `.csproj`
with `<TargetFrameworkVersion>v4.x</TargetFrameworkVersion>`.

**Where to look for the connection string:**

1. **Web applications**: `web.config` → the `<connectionStrings>` element. Watch
   out for **config transforms** — `Web.Debug.config` / `Web.Release.config` /
   `Web.<env>.config` can override the value per environment via
   `xdt:Transform="SetAttributes"`; for local development the base `web.config`
   or the Debug transform usually applies.
2. **Desktop/services (WinForms, WPF, Windows Service, console)**: `app.config`
   in the project; after the build the same content lives in
   `bin\...\<AppName>.exe.config`.
3. **Class library**: a library's `app.config` is IGNORED at runtime — the config
   of the **startup project** (exe or web) applies. Always search there.
4. **Entity Framework 6 / EDMX**: the connection string has the form
   `metadata=res://*/Model.csdl|...;provider connection string="Data Source=..."` —
   extract the actual SQL connection string from the inner
   `provider connection string` part.
5. **Encrypted `<connectionStrings>`** (you see `configProtectionProvider=...` and
   `<EncryptedData>`): decrypt with
   ```powershell
   & "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe" -pdf "connectionStrings" "C:\path\to\folder\with\web.config"
   ```
   (requires admin rights on the machine where it was encrypted) — or ask the
   user for the values.
6. Rarely: `machine.config`, or `<appSettings>` with a key like `ConnStr`.

**Connection quirks in legacy projects:**

- `Data Source=(LocalDB)\MSSQLLocalDB` or `(LocalDB)\v11.0` → **LocalDB**; sqlcmd
  connects the same way (`-S "(LocalDB)\MSSQLLocalDB" -E`); start the instance if
  needed with `sqllocaldb start MSSQLLocalDB` (list: `sqllocaldb info`).
- `AttachDbFilename=|DataDirectory|\Database.mdf` → the database is a file in
  `App_Data`; connect to the LocalDB/Express instance and find the database by
  file name (`SELECT name, physical_name FROM sys.master_files`).
- `Data Source=.\SQLEXPRESS` → local SQL Server Express instance.
- `Provider=SQLOLEDB` / `SQLNCLI` (OLE DB strings, e.g. classic ADO): ignore
  `Provider=`, parse the rest (`Data Source`, `Initial Catalog`, `User ID`…) the
  same way.
- Old servers (SQL 2008/2012) often don't support the TLS 1.2 settings of the new
  go-sqlcmd → if `-C` doesn't help, add `-N o` (disable encryption) or use the
  classic ODBC sqlcmd that ships with SSMS.

## 2. Parse the connection string

- `Data Source=` / `Server=` → server (careful: a named instance contains `\`,
  e.g. `HOST\SQL2022`)
- `Initial Catalog=` / `Database=` → database
- `User ID=` + `Password=` → SQL authentication (`-U` / `-P`)
- `Integrated Security=True` / `Trusted_Connection=True` → Windows authentication
  (`-E`); on Windows this normally just works
- `TrustServerCertificate=True` / `Encrypt=False` → add `-C` (and, if needed,
  `-N o` with go-sqlcmd)

## 3. Check that sqlcmd is available

```powershell
Get-Command sqlcmd
```

If it's missing, install the modern go-sqlcmd:

```powershell
winget install sqlcmd
```

(Alternative: sqlcmd also ships with SQL Server Management Studio or the
"Microsoft Command Line Utilities for SQL Server" package.)

## 4. Build the command

Windows authentication:

```powershell
sqlcmd -S "HOST\INSTANCE" -E -d DatabaseName -C -Q "SET NOCOUNT ON; SELECT TOP 10 * FROM schema.TableName"
```

SQL authentication:

```powershell
sqlcmd -S "HOST\INSTANCE" -U Username -P "password" -d DatabaseName -C -Q "..."
```

For machine-readable output add: `-h -1 -W -s "|"` and put `SET NOCOUNT ON;` in
the query.

PowerShell notes:
- quote paths containing `\` (named instances),
- on TLS errors (self-signed cert) add `-C`; if that doesn't help, with go-sqlcmd
  also add `-N o`.

## 5. Useful exploration queries

```sql
-- list of tables
SELECT TABLE_SCHEMA + '.' + TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY 1;

-- columns of a table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schema' AND TABLE_NAME = 'TableName' ORDER BY ORDINAL_POSITION;

-- find a table/column by name
SELECT TABLE_SCHEMA + '.' + TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%search%';

-- definition of a stored procedure / view
EXEC sp_helptext 'schema.ProcedureName';

-- foreign key relations of a table
EXEC sp_fkeys @pktable_name = 'TableName', @pktable_owner = 'schema';
```

## 6. Safety rules (MANDATORY)

- **SELECT only by default.** Never `INSERT`/`UPDATE`/`DELETE`/`ALTER`/`DROP`/`EXEC`
  (except `sp_helptext`, `sp_fkeys` and similar), unless the user explicitly
  requests it for one specific statement.
- **Never print the password** in your reply to the user; use it in commands, but
  mask it in any summary.
- On large tables always use `TOP N` — don't pull whole tables.
- If the connection string points at a production database (the name/host suggests
  production), explicitly warn the user before running anything.
