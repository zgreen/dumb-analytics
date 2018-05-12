const querystring = require('querystring')
const { promisify } = require('util')
const micro = require('micro')
const microCors = require('micro-cors')
const redis = require('redis')

const {
  ALLOWED_ORIGIN,
  REDIS_URL,
  REDIS_USER,
  REDIS_PASSWORD,
  REDIS_PORT
} = process.env
if (
  !ALLOWED_ORIGIN ||
  !REDIS_URL ||
  !REDIS_USER ||
  !REDIS_PASSWORD ||
  !REDIS_PORT
) {
  console.log(`The following environment variables are required:
- ALLOWED_ORIGIN,
- REDIS_URL,
- REDIS_USER,
- REDIS_PASSWORD,
- REDIS_PORT
`)
}
const client = redis.createClient({
  url: `redis://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_URL}:${REDIS_PORT}`
})
const cors = microCors({
  allowMethods: ['GET'],
  allowHeaders: ['Access-Control-Allow-Origin']
})
const asyncGet = promisify(client.get).bind(client)
const asyncIncr = promisify(client.incr).bind(client)
const asyncSadd = promisify(client.sadd).bind(client)
const asyncSmembers = promisify(client.smembers).bind(client)

const getDateStr = () => {
  const date = new Date()
  const month = date.getMonth() + 1
  const dateNum = date.getDate()
  return `${date.getFullYear()}${month < 10 ? `0${month}` : month}${
    dateNum < 10 ? `0${dateNum}` : dateNum
  }`
}

const server = micro(
  cors(async (req, res) => {
    const [, queryStr] = req.url.split('/?')
    const parsed = queryStr ? querystring.parse(queryStr) : {}
    switch (true) {
      case req.headers.origin === ALLOWED_ORIGIN && Boolean(parsed.url): {
        try {
          const dateStr = getDateStr()
          asyncIncr(parsed.url)
          asyncIncr(`${dateStr}:${parsed.url}`)
          asyncIncr('overallTotal')
          asyncSadd('overallUrls', parsed.url)
          asyncSadd('overallDates', dateStr)
          return 'ok'
        } catch (err) {
          console.error(err)
          return 'Something went wrong.'
        }
      }
      default: {
        try {
          const urls = await asyncSmembers('overallUrls')
          const dates = await asyncSmembers('overallDates')
          const byDate = dates.reduce(async (acc, date) => {
            const results = Promise.all(
              urls.map(async url => ({
                total: parseInt(await asyncGet(`${date}:${url}`), 10),
                date,
                url
              }))
            )
            return [...acc, ...(await results)]
          }, [])
          const byUrl = Promise.all(
            urls.map(async url => ({
              url,
              total: parseInt(await asyncGet(url), 10)
            }))
          )
          return {
            err: null,
            byDate: await byDate,
            byUrl: await byUrl,
            total: parseInt(await asyncGet('overallTotal'), 10)
          }
        } catch (err) {
          console.error(err)
          return { err, byDate: [], byUrl: [], total: -1 }
        }
      }
    }
  })
)

module.exports = server
