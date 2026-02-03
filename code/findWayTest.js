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
function main({text, list}) {
  const obj = handleLLM(text)
  const intent = obj.intent || ''
  let history = {}, answer = {}
  if (intent === 'product' || intent === 'store') {
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
          description: obj.store_description,
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
    if (filter.length > 1) {
      history = {
        intent,
        result: filter,
      }
    }
    answer = {
      AI_reply: filter.length > 1 ? array : (filter.length === 0 ? none : target),
      info: filter,
    }
  }
  return {
    intent,
    history,
    answer,
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
function main({text, list}) {
  const obj = handleLLM(text)
  const intent = obj.intent || ''
  const lang = obj.language || 'zh'
  const code = lang.includes('zh') ? 'zh' : 'en'
  const trans = {
    zh: {
      multiple: '根據你的提問，以下商店可能符合你的需求',
      single: '根據你的提問，已找到相關資訊',
      none: '抱歉，沒有檢索到相關信息，請重新提問。'
    },
    en: {
      multiple: 'Based on your question, here are some stores you might like.',
      single: 'I\'ve found some info regarding your question.',
      none: 'Sorry, I couldn\'t find anything for that question. Please try again!'
    }
  }
  let history = {}, answer = {}
  if (intent === 'product' || intent === 'store') {
    const filter = []
    const check = {}
    Array.from(list).forEach(obj => {
      if (check[obj.child_space_id] === undefined) {
        check[obj.child_space_id] = filter.length
        filter.push({
          space_id: obj.space_id,
          space_name: obj.space_name,
          child_space_id: obj.child_space_id,
          child_space_name: obj.store_name,
          time: obj.store_time,
          description: obj.store_description,
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
    if (filter.length > 1) {
      history = {
        intent,
        code,
        result: filter,
      }
    }
    answer = {
      AI_reply: filter.length > 1 ? trans[code].multiple : (filter.length === 0 ? trans[code].none : trans[code].single),
      info: filter,
    }
  }
  return {
    intent,
    history,
    answer,
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
    zh: '根據你的提問，已找到相關資訊',
    en: 'I\'ve found some info regarding your question.'
  }
  const answer = {
    AI_reply: trans[history?.code] || trans.zh,
    info: [filter ?? find],
  }
  return {
    can_reply,
    answer,
  }
}
//#endregion
