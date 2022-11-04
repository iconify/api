# Iconify API

This repository contains Iconify API script. It is a HTTP server, written in Node.js that:

-   Provides icon data, used by icon components that load icon data on demand (instead of bundling thousands of icons).
-   Generates SVG, which you can link to in HTML or stylesheet.
-   Provides search engine for hosted icons, which can be used by icon pickers.

## How to use it

First, you need to install NPM dependencies and run build script:

```
npm install
npm run build
```

Then you can start server:

```
npm run start
```

By default, server will:

-   Automatically load latest icons from [`@iconify/json`](https://github.com/iconify/icon-sets).
-   Serve data on port 3000.

You can customise API to:

-   Serve custom icon sets, loaded from various sources.
-   Run on different port.
-   Disable search engine if you do not need it, reducing memory usage.

## Port and HTTPS

It is recommended that you do not run API on port 80. Server can handle pretty much anything, but it is still not as good as a dedicated solution such as nginx.

Run API on obscure port, hidden from outside world with firewall rules, use nginx as reverse proxy.

HTTPS is not supported. It is a very resource intensive process, better handled by a dedicated solution such as nginx. Use nginx to run as HTTP and HTTPS server, forward queries to API HTTP server on hidden port such as default port 3000.

## Configuration

There are several ways to change configuration:

-   Editing files in `src/config/`, then rebuilding script. This is required for some advanced options, such as using API with custom icons.
-   Using environment variables, such as `PORT=3100 npm run start`.
-   Using `.env` file to store environment variables.

### Env options

Options that can be changed with environment variables and their default values (you can find all of them in `src/config/app.ts`):

-   `HOST=0.0.0.0`: IP address or hostname HTTP server listens on.
-   `PORT=3000`: port HTTP server listens on.
-   `REDIRECT_INDEX=https://iconify.design/`: redirect for `/` route. API does not serve any pages, so index page redirects to main website.
-   `STATUS_REGION=`: custom text to add to `/version` route response. Iconify API is ran on network of servers, visitor is routed to closest server. It is used to tell which server user is connected to.
-   `ENABLE_ICON_LISTS=true`: enables `/collections` route that lists icon sets and `/collection?prefix=whatever` route to get list of icons. Used by icon pickers. Disable it if you are using API only to serve icon data.
-   `ENABLE_SEARCH_ENGINE=true`: enables `/search` route. Requires `ENABLE_ICON_LISTS` to be enabled.
-   `ALLOW_FILTER_ICONS_BY_STYLE=true`: allows searching for icons based on fill or stroke, such as adding `style=fill` to search query. This feature uses a bit of memory, so it can be disabled. Requires `ENABLE_SEARCH_ENGINE` to be enabled.

### Updating icons

Icons are automatically updated when server starts.

In addition to that, API can update icon sets without restarting server.

To enable automatic update, you must set `APP_UPDATE_SECRET` environment variable. Without it, update will not work.

-   `ALLOW_UPDATE=true`: enables `/update` route.
-   `UPDATE_REQUIRED_PARAM=secret`: key from secret key/value pair. Cannot be empty.
-   `APP_UPDATE_SECRET=`: value from secret key/value pair. Cannot be empty.
-   `UPDATE_THROTTLE=60`: number of seconds to wait before running update.

To trigger icon sets update, open `/update?foo=bar`, where `foo` is value of `UPDATE_REQUIRED_PARAM`, `bar` is value of `APP_UPDATE_SECRET`.

Update will not be triggered immediately, it will be ran after `UPDATE_THROTTLE` seconds. This is done to prevent multiple checks when update is triggered several times in a row by something like GitHub hooks.

If update is triggered while update process is already running (as in, source was checked for update, but download is still in progress), another update check will be ran after currently running update ends.

Response to `/update` route is always the same, regardless of outcome. This is done to make it impossible to try to guess key/value pair or even see if route is enabled. To see actual result, you need to check console. Successful request and update process will be logged.

### HTTP headers

By default, server sends the following HTTP headers:

-   Various CORS headers, allowing access from anywhere.
-   Cache headers to cache responses for 604800 seconds (7 days).

To change headers, edit `headers` property in `src/config/app.ts`, then rebuild script.

## Node vs PHP

Previous version of API was also available as PHP script. This has been discontinued. Node app performs much faster, can handle thousands of queries per second and uses less memory.

## Full documentation

This file is basic.

Full documentation is available on [Iconify documentation website](https://docs.iconify.design/api/).

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/cyberalien">
    <img src='https://cyberalien.github.io/static/sponsors.svg'/>
  </a>
</p>

## Licence

Iconify API is licensed under MIT license.

`SPDX-License-Identifier: MIT`

This licence does not apply to icons hosted on API and files generated by API. You can host icons with any license, without any restrictions. Common decency applies, such as not hosting pirated versions of commercial icon sets (not sure why anyone would use commercial icon sets when so many excellent open source icon sets are available, but anyway...).

© 2022 Vjacheslav Trushkin / Iconify OÜ
