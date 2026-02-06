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
function main({result}) {
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
        description: obj.store_description,
        time: obj.store_time,
        product: []
      })
    }
    store[check[obj.child_space_id]].product.push({
      name: obj.name,
      price: obj.price,
      description: obj.description,
    })
  })
  const now = new Date()
  const formatted = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
  return {
    now: formatted,
    result: JSON.stringify(store),
  }
}

//#endregion
//#region 处理历史

function main({query, history}) {
  const index = Number(query)
  const filter = history?.result?.[index - 1] ?? null
  const find = Array.from(history?.result ?? []).find(o => {
    return o?.child_space_name === query || !!o?.product?.find(v => v.product_name === query)
  })
  const can_reply = !!filter || !!find
  const trans = {
    zh: '{store_name}位於{space_name}，已為您顯示路線於地圖上',
    en: '{store_name} is located in {space_name}, and the route has been shown on the map.'
  }
  const reply = trans[history?.code] || trans.zh
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
