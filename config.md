# Configuration options

Default options are in config-default.json

Do not edit config-default.json unless you are making your own fork of project. All custom config options should be added to config.json. Create empty config.json:

```
{
}
```

then add custom configuration variables to it.


## Server configiration

#### port

Port to listen on. Default value is 3000

#### env-port

If true, script will check for environment variable "PORT" and if it is set, it will overwrite configuration option "port"

#### region

Region string to identify server. Set it if you run multiple servers to easily identify which server you are conneting to.

To check which server you are connected to, open /version in browser.

#### env-region

If true, script will check for environment variable "REGION" and if it is set, it will overwrite configuration option "region"

#### custom-icon-dirs

List of directories with custom json files. By default list contains only directory "json". Directories should be relative to current working directory.

#### serve-default-icons

True if default SimpleSVG icons set should be served.

#### index-page

URL to redirect browser when browsing main page. Redirection is permanent.


## Cache controls

Cache configiration is stored in "cache" object. Object properties:

#### timeout

Cache timeout, in seconds.

#### min-refresh

Minimum page refresh timeout. Usually same as "timeout" value.

#### private

Set to true if page cache should be treated as private.


## Reloading icon sets

SimpleSVG icons server has ability to reload collections without restarting server. That allows to run server uninterrupted during icon sets updates.


#### reload-secret

To be able reload entire collection you need to set configuration variable reload-secret before starting server. Set value to any string.

To reload collections follow these steps:

* Upload new json files on server
* Open /reload?key=your-reload-secret in browser

This will reload all collections.

Server will respond identically with "ok" message regardless of reload status to prevent visitors from trying to guess your secret key, so few seconds after reload you can verify that icons were reloaded by trying to open one of icons that were supposed to be added or removed.
