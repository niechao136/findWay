
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
