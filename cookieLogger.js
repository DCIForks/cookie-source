/**
 * Cookie Logger
 */


const getSymbolValue = (object, symbolString) => {
  const key = Object.getOwnPropertySymbols(object)
                    .filter( symbol => (
                      symbol.description === symbolString
                    ))[0]
  return object[key];
}

const cookieLogger = (response) => {
  // response will be an object with a #kOutHeaders property:
  // { ...,
  //   [Symbol(kOutHeaders)]: [Object: null prototype] {
  //    'x-powered-by': [ 'X-Powered-By', 'Express' ],
  //    'set-cookie': [ 'Set-Cookie', [
  //       Array
  //     ]
  //   ]
  // }

  const kOutHeaders = getSymbolValue(response, "kOutHeaders")
  const cookieArray = kOutHeaders["set-cookie"][1]
                     .map( cookie => decodeURIComponent(cookie))
  console.log("cookieArray:", cookieArray);
}

module.exports = cookieLogger
