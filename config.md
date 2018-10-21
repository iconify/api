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

#### custom-icons-dir

Directory with custom json files.

Use {dir} variable to specify application's directory.

#### serve-default-icons

True if default Iconify icons set should be served.

#### index-page

URL to redirect browser when browsing main page. Redirection is permanent.


## Browser cache controls

Cache configiration is stored in "cache" object. Object properties:

#### timeout

Cache timeout, in seconds.

#### min-refresh

Minimum page refresh timeout. Usually same as "timeout" value.

#### private

Set to true if page cache should be treated as private.


## Reloading icon sets

Iconify API has ability to reload collections without restarting server. That allows to run server uninterrupted during icon sets updates.


#### reload-secret

To be able reload entire collection you need to set configuration variable reload-secret before starting server. Set value to any string.

To reload collections follow these steps:

* Upload new json files on server
* Open /reload?key=your-reload-secret in browser

This will reload all collections.

Server will respond identically with "ok" message regardless of reload status to prevent visitors from trying to guess your secret key, so few seconds after reload you can verify that icons were reloaded by trying to open one of icons that were supposed to be added or removed.


## Synchronizing icon sets with Git

In addition to reloading all collections without restarting server, server can pull collections from Git service and reload collections without restarting. This can be used to push collections to server whenever its updated without downtime.

There are two collections available: iconify and custom.

All configuration options are in "sync" object in config-default.json. Use {dir} variable in directories to point to application directory.

To synchronize repository send GET request to /sync?repo=iconify&key=your-sync-key
Replace repo with "custom" to synchronize custom repository and key with value of sync.secret

Server will respond identically with "ok" message regardless of status to prevent visitors from trying to guess your secret key.

Sync function is meant to be used with GitHub web hooks function. To avoid synchronizing icon sets too often, synchronization is delayed by 60 seconds (configure "sync-delay" option to change it). This way when there are multiple commits submitted within a minute, synchronization is done only once 60 seconds after first commit.

#### secret

Secret key. String. This is required configuration option. Put it in config.json, not config-default.json to make sure its not commited by mistake.

If "secret" is not set, entire synchronization module is disabled.

#### sync-on-startup

This option automatically pulls latest repositories when application is started. Possible values:

* never - disabled
* always - always synchronize all available repositories
* missing - synchronize only repositories that are missing

#### sync-delay

Delay for synchronization, in seconds. See documentation above.

This option does not affect synchronization on application startup.

#### repeated-sync-delay

If synchronization request was sent while synchronization is already in progress, this is amount of time application will wait until initializing next synchronization. Value is in seconds.

#### versions

Location of versions.json file that stores information about latest synchronized repositories.

#### storage

Location of directory where repositories will be stored.

#### git

Git command. You can change it if you need to customize command that is executed to clone repository. {repo} will be replaced with repository URL, {target} will be replaced with target directory.

#### iconify

URL of Iconify icons repository.

#### custom

URL of custom icons repository.

#### custom-dir

Location of json files in custom repository, relative to root directory of repository.

For example, if json files are located in directory "json" in your repository (like they are in iconify repository), set custom-dir value to "json".


## Logging errors

Server can automatically email you if something happens, so you don't need to check logs.

Email configuration is in "mail" object of config.json. To activate email logging set "mail.active" to "true", set correct from and to addresses and SMTP settings.

#### active

Set to true to enable logging to email.

#### throttle

Number of seconds to delay email sending. 

Default is 30 seconds. All error messages within 30 seconds will be combined to one email instead of sending multiple emails.

#### repeat

This option prevents script from sending similar errors too often. Value is number of minutes. Default value is 180 (3 hours).

#### from

Sender email address. Set this to valid email address.

#### to

Received email address. Set this to valid email address.

#### subject

Subject of emails. All emails will have same subject.

If you are running Iconify API on multiple servers, use different subjects for different servers to identify which server email came from.

#### transport

SMTP settings.

If you are using secure connection, set "secure" to true and "port" to 465, unless you are running SMTP server on different port.
