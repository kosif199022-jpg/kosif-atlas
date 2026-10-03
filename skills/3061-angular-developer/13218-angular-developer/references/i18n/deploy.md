# Deploy Multiple Locales

Source: https://v20.angular.dev/guide/i18n/deploy

## Directory Structure

Locale builds are placed in locale-specific subdirectories:

```
myapp/
  fr/         ← French version
  es/         ← Spanish version
  en-US/      ← English version
```

The `subPath` in `angular.json` controls the subdirectory name. The CLI adjusts the HTML `base href` for each version by adding the locale (or `subPath`).

```json
"locales": {
  "fr": {
    "translation": "src/locale/messages.fr.xlf",
    "subPath": ""
  }
}
```

---

## Server Configuration

### Strategy

- Redirect users to the preferred language using the `Accept-Language` HTTP header
- Fall back to default language if preferred language is unavailable
- Language switching usually handled via a menu that navigates to a different subdirectory

> **Note:** If using [Server rendering (SSR)](https://angular.dev/guide/ssr) with `outputMode: 'server'`, Angular automatically handles `Accept-Language` redirection — no manual server config needed.

---

### Nginx Example

```nginx
http {
    map $http_accept_language $accept_language {
        ~*^de de;
        ~*^fr fr;
        ~*^en "";
    }
}

server {
    listen 80;
    server_name localhost;
    root /www/data;

    # Fallback to French if no preference defined
    if ($accept_language ~ "^$") {
        set $accept_language "fr";
    }

    # Redirect "/" to preferred language
    rewrite ^/$ /$accept_language permanent;

    # Always route Angular app requests to correct locale
    location ~ ^/(fr|de|$) {
        try_files $uri /$1/index.html?$args;
    }
}
```

---

### Apache Example

```apache
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /www/data

    <Directory "/www/data">
        RewriteEngine on
        RewriteBase /
        RewriteRule ^../index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule (..) $1/index.html [L]

        # Language-based redirection
        RewriteCond %{HTTP:Accept-Language} ^de [NC]
        RewriteRule ^$ /de/ [R]

        RewriteCond %{HTTP:Accept-Language} ^en [NC]
        RewriteRule ^$ /en/ [R]

        # Fallback to French
        RewriteCond %{HTTP:Accept-Language} !^en [NC]
        RewriteCond %{HTTP:Accept-Language} !^de [NC]
        RewriteRule ^$ /fr/ [R]
    </Directory>
</VirtualHost>
```
