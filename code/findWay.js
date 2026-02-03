//#region 处理历史

function main({query, history}) {
  const index = Number(query)
  const filter = history?.result?.[index] ?? null
  const find = Array.from(history?.result ?? []).find(o => {
    return o?.child_space_name === query || !!o?.product?.find(v => v.product_name === query)
  })
  const can_reply = !!filter || !!find
  const answer = {
    AI_reply: '根據你的提問，已找到相關資訊',
    info: [filter ?? find],
  }
  return {
    can_reply,
    answer,
  }
}

//#endregion
//#region 处理检索结果

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
function main({result, query}) {
  const list = Array.from(result).map(o => {
    return parseKeyValueText(o.content)
  })
  let chunk = ''
  if (Array.from(result).length > 0) {
    chunk = result[0]?.metadata?.child_chunks?.[0]?.content ?? ''
  }
  const store = []
  const check = {}
  list.forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = store.length
      store.push({
        child_space_id: obj.child_space_id,
        description: obj.store_description,
        product: [],
      })
    }
    store[check[obj.child_space_id]].product.push(obj.name)
  })
  const prompt = store.map(o => {
    return `
1. 門店原始簡介：${o.description}
2. 用戶問題：${query}
3. 相關產品檢索結果（可能为空）：${JSON.stringify(o.product)}`
  })
  return {
    list,
    chunk,
    store,
    prompt,
  }
}

//#endregion
//#region 处理用户意图

function handleLLM(text) {
  const regex = /```json([\s\S]*?)```/
  const _res = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const match = _res.match(regex);
  const res = !!match ? match[1].trim() : _res
  const str = res.replaceAll(/\/\/.*$/gm, '').replaceAll(/\/\*[\s\S]*?\*\//g, '')
  let obj
  try {
    obj = JSON.parse(str)
  } catch (e) {
    obj = {}
  }
  return obj
}
function main({text}) {
  const obj = handleLLM(text)
  const intent = obj.intent || ''
  return {
    intent,
  }
}

//#endregion
//#region 处理回答

function main({text}) {
  const answer = {
    AI_reply: text.replaceAll(/<think>[\s\S]*?<\/think>/g, ''),
    info: [],
  }
  return {
    answer
  }
}

//#endregion
//#region 整合信息

function main({list, intent, output, store}) {
  const dear_by_id = {}
  Array.from(store).forEach((obj, index) => {
    dear_by_id[obj.child_space_id] = output[index]
  })
  const filter = []
  const check = {}
  const array = '根據你的提問，以下商店可能符合你的需求'
  const target = '根據你的提問，已找到相關資訊'
  const none = '抱歉，沒有檢索到相關信息，請重新提問。'
  Array.from(list).forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = filter.length
      filter.push({
        space_id: obj.space_id,
        space_name: obj.space_name,
        child_space_id: obj.child_space_id,
        child_space_name: obj.store_name,
        time: obj.store_time,
        description: dear_by_id[obj.child_space_id] ?? obj.store_description,
        product: []
      })
    }
    if (intent === 'product') {
      filter[check[obj.child_space_id]].product.push({
        product_id: obj.product_id,
        product_name: obj.name,
        price: obj.price,
      })
    }
  })
  const need_filter = filter.length > 1
  const history = !need_filter ? {} : {
    intent,
    result: filter,
  }
  const answer = {
    AI_reply: need_filter ? array : (filter.length === 0 ? none : target),
    info: filter,
  }
  return {
    history,
    answer,
  }
}

//#endregion
//#region Test
//#endregion
