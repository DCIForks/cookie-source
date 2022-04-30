/**
 * Cookie-Source is a simple Express server which serves a
 * number of cookies:
 *
 *   { sameSite: strict }
 *   { sameSite: lax }
 *   { sameSite: none, secure: true }
 *   { sameSite: none, secure: true, expires: <tomorrow> }
 *   { sameSite: 'none', secure: true, httpOnly: true }
 *
 * When the page at "/" is visited, all these cookies will be
 * sent back to the server. When a page on a different host
 * server shows just the web_beacon.png image from this site,
 * the browser will nend only the three { sameSite: none, ... }
 * cookies.
 *
 * Deployment
 * ——————————
 * This app is deployed at https://cookie-source.herokuapp.com/
 * Use `heroku logs -n 20` to see the last 20 lines of the logs
 * created on the Heroku server.
 *
 * Testing Locally
 * ———————————————
 * You can also serve the page locally using:
 *
 *   npm start # from the cookie-source directory
 * OR
 *   heroku local web
 *   // This will use port 5000
 * OR
 *   npm run start:source # from the parent directory
 *
 * When testing locally, an HTTPS server will be created, using
 * certificates contained in the `https` directory in the same\
 * folder as this script.
 *
 * Viewing Cookies
 * ———————————————
 * When you visit the page, use the Developer Tools Inspector to
 * view the cookies that have been set for third-party domains:
 *
 * Chrome: Dev Tools > Application > Storage > Cookies
 * Firefox: Dev Tools > Storage > Cookies
 */

require("dotenv").config();
let express, app;
const cookieParser = require("cookie-parser");
const cookieLogger = require("./cookieLogger");

const HEROKU_PORT = "5000"; // process.env for heroku local web
const DEFAULT_PORT = "5000"; // used by npm start
const PORT = process.env.PORT || DEFAULT_PORT;

if ([HEROKU_PORT, DEFAULT_PORT].includes(PORT)) {
  // Create an HTTPS server running on localhost
  const https = require("./https/server");

  const HOST = process.env.HOST || "localhost";
  const NAME = process.env.NAME || "Secure";

  ({ express, app } = https(HOST, PORT, NAME));
} else {
  // Assume that this app is running on Heroku
  express = require("express");
  app = express();

  app.listen(PORT, () => {
    console.log(`Heroku port: ${PORT}`);
  });
}

const convertDateToString = (date = new Date()) => {
  const time = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((number) => (number < 10 ? "0" + number : number));

  return time.slice(3).join(":") + " on " + time.slice(0, 3).join("-");
};

const treatCookies = (request, response, next) => {
  const url = request.originalUrl;
  const protocol = request.protocol;
  const host = request.headers.host;
  const referer = request.get("Referer");
  const now = convertDateToString();

  console.log(`******
Request for
  ${protocol}://${host}${url}
from
  ${referer}
at ${now}
******`);

  if (["/", "/favicon.ico"].includes(url)) {
    // For simplicity, neither set nor display cookies
    // if the request is not for the web_beacon.jpg file
    console.log(`No cookies for "${url}"`)

  } else {
    console.log("request.cookies:", request.cookies);
    console.log(`Sending cookies for: "${url}"`);

    sendCookies(request, response, referer, now);

    cookieLogger(response);
    console.log("******\n")
  }

  return next();
};

const sendCookies = (request, response, referer, now) => {
  const hostName = request.hostname;
  const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

  response
    // Cookie only available when request url === host url
    .cookie(
      "key",
      `STRICT: set at ${now}`,
      { sameSite: "strict" }
    )

    // Cookie available from request url if navigating to host url
    .cookie(
      "property",
      `LAX: set at ${now}`,
      { sameSite: "lax" }
    )

    // Cookies available from any request url
    .cookie(
      "source",
      `NONE: ${hostName} set at ${now}`,
      { sameSite: "none", secure: true }
     )
    .cookie(
      "referer",
      `NONE: ${referer} set at ${now}`,
      { sameSite: "none", secure: true }
    )
    .cookie(
      "24-hours",
      `NONE: from ${now} `,
      {
        sameSite: "none",
        secure: true,
        expires: tomorrow,
      }
    )
    .cookie(
      "secret",
      `NONE + httpOnly: set at ${now}`,
      {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      }
    );
};

// request.cookies is undefined if cookieParser() is not used
app.use(cookieParser());
app.get("*", treatCookies);
// Use express.static() to serve the content if it exists...
app.use(express.static("public"));

app.get("/hello", (req, res) => {
  res.send("Hello from the cookie-source express server.");
});

// ...but if not, a 404 Not Found will be served
app.get("*", (request, response) => response.sendStatus(404));
