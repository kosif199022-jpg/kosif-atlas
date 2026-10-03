# Keeping Your Angular Projects Up-to-Date

Source: https://v20.angular.dev/update

---

## Getting Notified of New Releases

- Follow [@angular on X (Twitter)](https://x.com/angular)
- Subscribe to the [Angular blog](https://blog.angular.dev)

---

## Learning About New Features

- [Angular blog release announcements](https://blog.angular.dev/) — most important changes per release
- [Angular changelog](https://github.com/angular/angular/blob/main/CHANGELOG.md) — complete list of changes organized by version

---

## Checking Your Current Version

```bash
ng version
```

Run from within your project directory.

---

## Finding the Latest Angular Version

- Check [npm @angular/core](https://www.npmjs.com/package/%40angular/core) — shown under "Version"
- Or run `ng update` (without arguments) — lists available updates

---

## Updating Your App

1. **[Angular Update Guide](https://update.angular.io)** — interactive guide with customized instructions based on your current and target versions. Includes basic and advanced paths, troubleshooting, and recommended manual changes.

2. **CLI command** (for simple updates):
   ```bash
   ng update
   ```
   Without arguments: lists available updates and recommended steps.
   
   ```bash
   ng update @angular/core @angular/cli
   ```

---

## Resources

| Resource | Link |
|---|---|
| Release announcements | https://blog.angular.dev |
| Full changelog | https://github.com/angular/angular/blob/main/CHANGELOG.md |
| Interactive update guide | https://update.angular.io |
| `ng update` CLI reference | https://v20.angular.dev/cli/update |
| Versioning & support policy | https://v20.angular.dev/reference/releases |

---

## Notes

- For AngularJS (v1.x) upgrades, see: https://angular.io/guide/upgrade
- Angular follows semantic versioning — the release version number indicates the level of change expected
