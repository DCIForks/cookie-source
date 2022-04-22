/**
 * WARNING // WARNING // WARNING // WARNING // WARNING // WARNING
 * 
 *   This script is intended for testing purposes only.
 *   The associated certification folders (such as `127.0.0.1` and 
 *   `localhost`) contain PRIVATE keys in the key.pem files.
 * 
 *   You _can_ create additional certification folders for other
 *   domain names (as described below), but DO NOT share the
 *   key.pem files with anyone, not even fellow developers.
 * 
 *   Anyone with access to the private keys may be able to
 *   control your production site. And that would be bad.
 * 
 * WARNING // WARNING // WARNING // WARNING // WARNING // WARNING
 * 
 * Usage:
 * 
 * const httpsServer = require('path/to/this/script/server.js')
 * const HOST = process.env.HOST || "domain.name"
 * const PORT = process.env.PORT || 3333
 * const NAME = process.env.NAME || "Optional Name"
 * const { express, app } = httpsServer(HOST, PORT, NAME)
 * 
 * Directory Structure
 * ———————————————————
 * 
 * The parent directory for this file must contain a
 * sub-directory with the same name as the HOST used
 * in the call to the https() method.
 * 
 * This sub-directory must contain two Transport Layer Security
 * (TLS) certificates.
 * 
 * - cert.pem
 * - key.pem
 * 
 * ├── domain.name
 * │   ├── cert.pem  <<< certificate for domain.name
 * │   └── key.pem   <<< CA root certificate, so you can trust cert
 * └── server.js     <<< this script
 * 
 * Follow this link for instructions on how to create these
 * certificates using mkcert:
 * https://web.dev/how-to-use-local-https/
 * 
 * You'll need to perform an extra step. The certificates created
 * by mkcert will be called:
 * - "domain.name.cert"
 * - "domain.name-key.cert"
 * 
 * For this script to work, you'll need to rename these to...
 * 
 * - cert.pem
 * - key.pem
 * 
 * ... and place them in a directory called "domain.name"
 * 
 * You can include several domain-name folders in the same parent
 * directory. This script will choose the correct certificates
 * by matching the folder name to the requested HOST.
 */

const fs = require("fs");
const path = require("path")
const https = require("https");
const express = require("express");


// <<< HARD-CODED certificate names
const certificates = {
  key: "key.pem",
  cert: "cert.pem"
}
// HARD-CODED >>


const getCertPaths = (directoryPath) => {
  const errors = {}
  const keys = Object.keys(certificates)
  const certsExist = keys.every( key => {
    const certPath = path.join(directoryPath, certificates[key])
    const certExists = fs.existsSync(certPath)

    if (certExists) {
      certificates[key] = certPath
    } else {
      errors[key] = certificates[key]
    }

    return certExists
  })

  if (!certsExist) {
    console.log("Missing or misnamed certificates", errors)
    process.exit(0)
  }

  return certificates
}


const httpsServer = (host, port, name) => {
  name = name ? ` "${name}"` : ""
  const certPath = path.join(__dirname, host)
  const certPaths = getCertPaths(certPath)  

  const app = express();

  const listenMessage = `Ctrl-click to visit the${name} HTTPS server at https://${host}:${port}`

  // Create a NodeJS HTTPS listener on port that points to the
  // Express app
  // Use a callback function to tell when the server is created.
  https
    .createServer({
      key: fs.readFileSync(certPaths.key),
      cert: fs.readFileSync(certPaths.cert),
    }, app)
    .listen(port, () => console.log(listenMessage));

  return {
    app,
    express
  }
}

module.exports = httpsServer
