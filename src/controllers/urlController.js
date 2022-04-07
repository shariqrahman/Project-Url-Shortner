const urlModel = require('../models/urlModel')
const shortid = require('shortid')
const redis = require('redis')

const { promisify } = require("util");

// connect to redis
const redisClient = redis.createClient(
    12276,
    "redis-12276.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("rPmvoVMC9Rke8cKAhSoQw0GlGvW3VAH4", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



// create shortUrl
const urlShortner = async function (req, res) {
    try {
        let baseUrl = 'http://localhost:3000';
        let longUrl = req.body.longUrl
        

        if (!longUrl) {
            return res.status(400).send({ status: false, msg: "Please provide a longUrl" })
        }

        let checkUrl = longUrl.trim()

        if (!(/^https?:\/\/\w/).test(baseUrl)) {
            return res.status(400).send({ status: false, msg: "Please check your Base Url, Provide a valid One." })
        }

        if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(checkUrl))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid longUrl" })
        }

        let shortUrl = await GET_ASYNC(`${checkUrl}`)
        if(shortUrl) {
            let cacheData = JSON.parse(shortUrl)
            let cachesData = {longUrl: cacheData.longUrl, shortUrl: cacheData.shortUrl, urlCode: cacheData.urlCode}
            return res.status(200).send({status: true, message: 'short url for given long url is already exist in cache', data: cachesData})
        }

        let urlDB = await urlModel.findOne({longUrl: checkUrl}).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        if(urlDB) {
            return res.status(200).send({status: true, message: 'short url for given long url is already exist in db', data: urlDB})
        }

        const urlCode = shortid.generate().toLowerCase()
        shortUrl = baseUrl + '/' + urlCode;

        let url = { urlCode: urlCode, longUrl: longUrl, shortUrl: shortUrl }
               
        await urlModel.create(url)

        const url2 = await urlModel.findOne({urlCode}).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        
        await SET_ASYNC(`${checkUrl}`, JSON.stringify(url2))
        return res.status(201).send({ status: true, url: url2 })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}



// redirect longUrl
const urlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        
        const cacheUrl = await GET_ASYNC(`${urlCode}`)

        // if(urlCode.length != 9) {
        //     return res.status(400).send({status: false, message: 'Please Provide Valid urlCode'})
        // }

        if(cacheUrl) {
            return res.status(302).redirect(JSON.parse(cacheUrl))
        }
        const url = await urlModel.findOne({ urlCode})
        if (!url) {
            return res.status(404).send({ status: false, message: "No Url Found" })
        }
        else {
            let oldUrl = url.longUrl
            res.status(302).redirect(oldUrl)
            await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl))
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.urlShortner = urlShortner
module.exports.urlCode = urlCode