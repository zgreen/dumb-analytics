# dumb-analytics

This is a simple analytics server, backed by redis. You might use it if:

* you want your analytics to be very simple
* you want your analytics to be open
* you distrust, or are wary of, Google's approach to user privacy and data collection

## Install

`npm install dumb-analytics`

## Requirements

This package requires a redis server to work. The following environment variables must be loaded:

* `ALLOWED_ORIGIN` (this should be the only origin that is allowed to update analytics on your site, e.g. `https://yoursite.cool`)
* `REDIS_USER`
* `REDIS_PASSWORD`
* `REDIS_URL`
* `REDIS_PORT`

## Usage

### The server

```js
// server.js
const dumbAnalytics = require('dumb-analytics')
dumbAnalytics.listen(3000)
```

### Updating analytics from the client

```js
// client.js
fetch(`https://myanalyticssite.cool?url=${window.location.pathname}`)
```

### View current analytics

`dumb-analytics` serves analytics data from the homepage. This is publicly viewable.

The shape of the data will be:

```json
{
  "err": null,
  "byDate": [{ "total": 1, "date": "20180511", "url": "/" }],
  "byUrl": [{ "url": "/", "total": 1 }],
  "total": 1
}
```

* `err` is an error, if any has occured.
* `byDate` is an array of objects grouped by URL and date.
* `byURL` is an array of objects with the overall visit total per URL.
* `total` is the total number of visits to the site.

## Example

This example loads environment variables using [dotenv](https://www.npmjs.com/package/dotenv).

```js
// server.js
require('dotenv').config()
const server = require('dumb-analytics')
server.listen(3000, () => console.log('Server listening...'))
```
