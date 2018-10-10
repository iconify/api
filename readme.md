# SimpleSVG icons website

This code runs on icons.simplesvg.com that is used to serve collections and SVG images.

PHP version is available at https://github.com/simplesvg/website-icons.php


### How to use it

To start server simply run

```
node app
```

By default server will be running on port 3000. You can change port and other configuration by adding custom config.json

File config.json is the same as config-default.json, but contains only values you have customized. See [config.md](config.md)


### Node vs PHP

Node.js version of server is faster because it loads everything only once on startup. It is a bit harder to setup though because you need to install additional software and make sure server is running (using tools such as "pm2").

PHP process ends when HTTP request ends, so PHP has to reload lots of things for each request. PHP version has caching to minimize loading times, but it is still nowhere near as fast as Node.js version. The only upside of PHP version is it is easy to setup - simply upload files and you are done.

Use Node.js version if you can for better performance.
