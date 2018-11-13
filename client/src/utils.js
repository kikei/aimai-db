export function groupBy(f, xs) {
  const groups = []
  let g = []
  for (let i = 0, ylast = null; i < xs.length; i++) {
    const y = f(xs[i])
    if (ylast == null || ylast == y) {
      g.push(xs[i])
    } else {
      groups.push(g)
      g = [xs[i]]
    }
    ylast = y
  }
  if (g.length > 0) groups.push(g)
  return groups
}

export function jpy(v) {
  return Math.round(v).toLocaleString('ja-JP', {
    style: 'currency', currency: 'JPY'
  })
}

export async function fetchJSON(uri, options) {
  const headers = Object.assign(options.headers || {}, {
    "Content-Type": "application/json; charset=utf-8"
  })
  const opts = Object.assign(options, { headers: headers })
  const response = await fetch(uri, opts)
  const json = await response.json()
  return Promise.resolve({response: response, json: json})
}

export async function fetchProtectedJSON(account, uri, options) {
  var accessToken = account.accessToken
  const refreshToken = account.refreshToken
  let headers = Object.assign(options.headers || {}, {
    Authorization: `Bearer ${accessToken}`
  })
  let opts = Object.assign(options, { headers: headers })
  var {response, json} = await fetchJSON(uri, opts)
  // Renew access token by refresh token when access token is expired.
  if (response.status == 401 && options.enableRefreshToken) {
    console.log("Trying to refresh token before, uri:", uri)
    let obj = await account.requestRefresh(refreshToken)
    // {response, accessToken} = await account.requestRefresh(refreshToken)
    accessToken = obj.accessToken
    let headers = Object.assign(options.headers || {}, {
      Authorization: `Bearer ${accessToken}`
    })
    let opts = Object.assign(options, { headers: headers })
    obj = await fetchJSON(uri, opts)
    response = obj.response
    if (response.status == 401) {
      return Promise.rejext("Failed to refresh, token:", refreshToken)
    }
    json = obj.json
  }
  console.log('response:', response)
  return Promise.resolve({response: response, json: json})
}
