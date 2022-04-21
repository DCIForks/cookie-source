require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()
const PORT = process.env.PORT || 4444


app.listen(PORT, () => console.log(`Listening on port ${PORT}`))


// request.cookies is undefined if cookieParser() is not used
app.use(cookieParser())


const logURL = (request, response, next) => {
  const url = request.originalUrl

  if (!["/", "/favicon.ico"].includes(url)) {
    console.log("originalUrl:", url);
  }
  next()
}

const setCookie = (request, response, next) => {
  if (request.originalUrl === "/favicon.ico") {
    // Browsers will make two requests to the server:
    // 1. Get the page
    // 2. Get the favicon
    console.log("favicon requested")
  }
  
  console.log("request.cookies:", request.cookies);
  response
  .cookie("key", "private", {sameSite: 'strict'})
  .cookie("property", "selective", {sameSite: 'lax'})
  .cookie("shared", "public", {sameSite: 'none', secure: true})
  
  next()
}


app.get("*", logURL, setCookie)
// Use express.static() to serve the content if it exists...
app.use(express.static('public'))

app.get('/hello', (req,res)=>{
  res.send("Hello from the cookie-share express server.")
})

// ...but if not, a 404 Not Found will be served
app.get("*", (request, response) => response.sendStatus(404))
