
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
//#region 处理检索结果

function parseToObject(str) {
  const obj = {};

  // 只把出现在 行首、分号或换行 后的 "key:" 识别为字段名
  const regex = /(^|;|\n)\s*([A-Za-z0-9_]+)\s*:/g;
  let match;
  const keys = [];

  while ((match = regex.exec(str)) !== null) {
    // match.index 是整个 match 的起始（包含前缀），
    // 找到 key 在 match[0] 中的偏移以算出 key 的全局起始位置
    const fullMatch = match[0];
    const keyName = match[2];
    const offsetInFull = fullMatch.indexOf(keyName);
    const keyIndex = match.index + offsetInFull;
    keys.push({ key: keyName, index: keyIndex });
  }

  for (let i = 0; i < keys.length; i++) {
    const current = keys[i];
    const next = keys[i + 1];

    const start = current.index + current.key.length + 1; // skip `key:`
    const end = next ? next.index : str.length;

    // 取片段并去掉收尾的分号与空白
    let value = str.slice(start, end).trim();
    value = value.replace(/^\s*;|;\s*$/g, "").trim();

    // 清除 value 末尾的 (数字)
    value = value.replace(/\(\d+\)\s*$/, "").trim();

    obj[current.key] = value;
  }

  return obj;
}
function main({result}) {
  const list = Array.from(result).map(o => {
    return parseToObject(o.content)
  })
  const need_query = Array.from(new Set(list.map(o => o.store_name))).map(o => `'${o}'`)
  const sql = `SELECT * FROM test_dify.space WHERE child_space_name IN (${need_query.join(', ')});`
  let chunk = ''
  if (Array.from(result).length > 0) {
    chunk = result[0]?.metadata?.child_chunks?.[0]?.content ?? ''
  }
  const store = []
  const check = {}
  list.forEach(obj => {
    if (check[obj.store_id] === undefined) {
      check[obj.store_id] = store.length
      store.push({
        store_id: obj.store_id,
        description: obj.store_desciption,
        product: [],
      })
    }
    store[check[obj.store_id]].product.push(obj.product_name)
  })
  return {
    list,
    sql,
    chunk,
    store,
  }
}

//#endregion
//#region 处理位置信息

function parseRow(line) {
  return String(line).trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(col => String(col).trim())
}
function parseMd(text) {
  const md = String(text).replace(/(?<!\|)\n(?!\|)/g, ' ').replaceAll('\r', ' ')
  const lines = md.split('\n')
  const head = parseRow(lines[0])
  const body = lines.slice(2)
  return body.map(line => {
    const obj = {}
    const arr = parseRow(line)
    head.forEach((key, index) => {
      obj[key] = arr[index]
    })
    return obj
  })
}
function main({text, list, intent, output, store}) {
  const space = parseMd(text)
  const space_by_name = {}
  space.forEach(obj => {
    space_by_name[obj.child_space_name] = obj
  })
  const dear_by_id = {}
  Array.from(store).forEach((obj, index) => {
    dear_by_id[obj.store_id] = output[index]
  })
  const result = Array.from(list).map(o => {
    return {
      ...o,
      space_id: space_by_name[o.store_name].space_id || '',
      space_name: space_by_name[o.store_name].space_name || '',
      child_space_id: space_by_name[o.store_name].child_space_id || '',
      child_space_name: space_by_name[o.store_name].child_space_name || '',
    }
  })
  const filter = []
  const check = {}
  const list_answer = '根據你的提問，以下商店可能符合你的需求'
  const target_answer = '根據你的提問，已找到相關資訊'
  result.forEach(obj => {
    if (check[obj.store_id] === undefined) {
      check[obj.store_id] = filter.length
      filter.push({
        space_id: obj.space_id,
        space_name: obj.space_name,
        child_space_id: obj.child_space_id,
        child_space_name: obj.child_space_name,
        time: obj.store_time,
        description: dear_by_id[obj.store_id] ?? obj.store_desciption,
        product: []
      })
    }
    if (intent === 'product') {
      filter[check[obj.store_id]].product.push({
        product_id: obj.product_id,
        product_name: obj.product_name,
        price: obj.product_price,
      })
    }
  })
  const history = {
    intent,
    result: filter,
  }
  const need_filter = filter.length > 1
  const answer = {
    AI_reply: need_filter ? list_answer : target_answer,
    info: filter,
  }
  return {
    history,
    answer,
    need_filter,
  }
}

//#endregion
//#region 处理历史

function main({query, history}) {
  const index = Number(query)
  const filter = history.result?.[index] ?? null
  const new_question = Number.isNaN(index) || !filter
  const answer = {
    AI_reply: '根據你的提問，已找到相關資訊',
    info: [filter],
  }
  return {
    new_question,
    answer,
  }
}

//#endregion
//#region 处理检索

function main({result}) {
  let content = ''
  let chunk = ''
  if (Array.from(result).length > 0) {
    content = result[0].content
    chunk = result[0]?.metadata?.child_chunks?.[0]?.content ?? ''
  }
  return {
    content,
    chunk,
  }
}
//#endregion
//#region 处理回答

function main({text}) {
  const answer = {
    description: text
  }
  return {
    answer
  }
}

//#endregion
//#region 处理门店信息

function main({item}) {
  const description = String(item?.description ?? '')
  const product = Array.isArray(item?.product) ? Array.from(item.product) : []
  return {
    description,
    product,
  }
}

//#endregion
//#region Test
//#endregion
