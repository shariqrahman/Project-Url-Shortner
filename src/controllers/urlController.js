const urlModel = require("../models/urlModel")
const shortid = require('short-id')


const urlShortner = async (req, res) => {
    try {
        let baseUrl = 'http://localhost:3000';
        let longUrl = req.body.longUrl
        let urlCode = shortid.generate()
        let shortUrl = baseUrl + '/' + urlCode;
        let data = { urlCode: urlCode, longUrl: longUrl, shortUrl: shortUrl }

        if (!(/^https?:\/\/\w/).test(baseUrl)) {
            return res.status(400).send({ status: false, msg: "Please check your Base Url, Provide a valid One." })
        }

        if (!longUrl) {
            return res.status(400).send({ status: false, msg: "Please provide a longUrl" })
        }

        if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(longUrl))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid longUrl" })
        }

       
        let urlDetails = await urlModel.create(data)
        let result = { 
            urlCode: urlDetails.urlCode,
            longUrl: urlDetails.longUrl,
            shortUrl: urlDetails.shortUrl
        }
        return res.status(400).send({ status: true, url: result })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const urlCode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode

        if (urlCode.length != 6) { 
            return res.status(400).send({ status: false, msg: "Please provide a valid urlCode" }) 
        }
        
        const url = await urlModel.findOne({ urlCode: urlCode })
        if (!url) {
            return res.status(404).send({ status: false, message: "No Url Found" })
        }
        else {
            let oldUrl = url.longUrl
            res.status(302).redirect(oldUrl)
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.urlShortner = urlShortner
module.exports.urlCode = urlCode
