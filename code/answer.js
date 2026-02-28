//#region 处理标准回答

function parseKeyValueText(input) {
  const result = {}
  if (typeof input !== 'string') return result

  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    // 只切第一个冒号，防止 value 中包含冒号
    const idx = line.indexOf(':')
    if (idx === -1) continue

    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()

    if (!key) continue

    result[key] = value
  }

  return result
}
function main({text, result}) {
  const list = Array.from(result).map(o => {
    return parseKeyValueText(o.content)
  })
  const AI_reply = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const info = []
  const res = []
  const check = {}
  list.forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = info.length
      info.push({
        space_id: obj.space_id,
        child_space_id: obj.child_space_id,
        product_id: []
      })
      res.push({
        space_id: obj.space_id,
        space_name: obj.space_name,
        child_space_id: obj.child_space_id,
        child_space_name: obj.store_name,
        product: []
      })
    }
    info[check[obj.child_space_id]].product_id.push(obj.product_id)
    res[check[obj.child_space_id]].product.push({
      product_id: obj.product_id,
      product_name: obj.name,
    })
  })
  const answer = {
    AI_reply,
    info,
  }
  let history = {}
  if (info.length > 1) {
    history = {
      result: res,
    }
  }
  return {
    answer,
    history,
  }
}

//#endregion
//#region 获取当前时间

function parseKeyValueText(input) {
  const result = {}
  if (typeof input !== 'string') return result

  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    // 只切第一个冒号，防止 value 中包含冒号
    const idx = line.indexOf(':')
    if (idx === -1) continue

    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()

    if (!key) continue

    result[key] = value
  }

  return result
}
function getCurrentTimeByOffset(timezone) {
  const now = new Date()
  const sign = timezone.startsWith('-') ? -1 : 1
  const [hours, minutes] = timezone.slice(1).split(':').map(Number)
  const offsetInMilliseconds = sign * (hours * 3600000 + minutes * 60000)
  const targetTime = new Date(now.getTime() + offsetInMilliseconds)
  const f = (num) => String(num).padStart(2, '0')
  const YYYY = targetTime.getUTCFullYear()
  const MM = f(targetTime.getUTCMonth() + 1)
  const DD = f(targetTime.getUTCDate())
  const HH = f(targetTime.getUTCHours())
  const mm = f(targetTime.getUTCMinutes())
  const ss = f(targetTime.getUTCSeconds())
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`
}
function main({result, timezone}) {
  const list = Array.from(result).map(o => {
    return parseKeyValueText(o.content)
  })
  const store = []
  const check = {}
  list.forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = store.length
      store.push({
        name: obj.store_name,
        space: obj.space_name,
        time: obj.store_time,
        product: []
      })
    }
    store[check[obj.child_space_id]].product.push({
      name: obj.name,
      price: obj.price,
    })
  })
  return {
    now: getCurrentTimeByOffset(timezone),
    result: JSON.stringify(store),
  }
}

//#endregion
//#region 处理历史

function main({query, history, lang}) {
  const index = Number(query)
  const filter = history?.result?.[index - 1] ?? null
  const find = Array.from(history?.result ?? []).find(o => {
    return o?.child_space_name === query || !!o?.product?.find(v => v.product_name === query)
  })
  const can_reply = !!filter || !!find
  const trans = {
    'zh-TW': '{store_name}位於{space_name}，已為您顯示路線於地圖上',
    'en-US': '{store_name} is located in {space_name}, and the route has been shown on the map.'
  }
  const reply = trans[lang] || trans["zh-TW"]
  const info = filter ?? find
  const AI_reply = reply.replace('{store_name}', info?.child_space_name ?? '').replace('{space_name}', info?.space_name ?? '')
  const item = {
    space_id: info?.space_id ?? '',
    child_space_id: info?.child_space_id ?? '',
    product_id: info?.product?.map(o => o?.product_id ?? '') ?? []
  }
  const answer = {
    AI_reply,
    info: [item],
  }
  return {
    can_reply,
    answer,
  }
}

//#endregion
