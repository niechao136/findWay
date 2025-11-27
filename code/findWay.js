
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
function main({text, query}) {
  const obj = handleLLM(text)
  const find = obj.find || ''
  const description = obj.text || ''
  const tran = obj.tran || query
  const answer = {
    description
  }
  return {
    find,
    answer,
    tran,
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
function main({result, find}) {
  let answer = '检索到以下结果，请输入序号进行选择：\n'
  const list = Array.from(result).map(o => {
    return parseToObject(o.content)
  })
  const filter = []
  const check = {}
  let index = 1
  list.forEach(obj => {
    if (find === 'store') {
      if (!check[obj.store_id]) {
        check[obj.store_id] = true
        filter.push({
          ...obj,
          index,
        })
        answer += `${index}. ${obj.store_name}${!!obj.store_time ? `（营业时间：${obj.store_time}）` : ''}\n`
        index++
      }
    }
    if (find === 'product') {
      filter.push({
        ...obj,
        index,
      })
      answer += `${index}. ${obj.name}${!!obj.price ? `（价格：${obj.price}元）` : ''}\n`
      index++
    }
  })
  const need_filter = filter.length > 1
  const need_query = Array.from(new Set(filter.map(o => o.store_name))).map(o => `'${o}'`)
  const sql = `SELECT * FROM test_dify.space WHERE child_space_name IN (${need_query.join(', ')});`
  return {
    answer: {
      description: answer
    },
    filter,
    need_filter,
    sql,
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
function main({text, filter, find}) {
  const space = parseMd(text)
  const space_by_name = {}
  space.forEach(obj => {
    space_by_name[obj.child_space_name] = obj
  })
  const result = Array.from(filter).map(o => {
    return {
      ...o,
      space_id: space_by_name[o.store_name].space_id || '',
      space_name: space_by_name[o.store_name].space_name || '',
      child_space_id: space_by_name[o.store_name].child_space_id || '',
      child_space_name: space_by_name[o.store_name].child_space_name || '',
    }
  })
  const history = {
    find,
    result,
  }
  let res = ''
  if (find === 'store') {
    res = `已为您找到门店：${filter[0].store_name}。它的营业时间是：${filter[0].store_time}。\n门店简介：${filter[0].store_desciption}`
  }
  if (find === 'product') {
    res = `已为您找到产品：${filter[0].name}（价格：${filter[0].price}元），它来自门店：${filter[0].store_name}（营业时间：${filter[0].store_time}）。\n产品简介：${filter[0].description}\n门店简介：${filter[0].store_desciption}`
  }
  const answer = {
    space_id: result[0].space_id,
    space_name: result[0].space_name,
    child_space_id: result[0].child_space_id,
    child_space_name: result[0].child_space_name,
    description: res
  }
  return {
    history,
    answer,
  }
}

//#endregion
//#region 处理历史

function main({query, history}) {
  const index = Number(query)
  const find = history.find || ''
  const filter = Array.from(history.result).find(o => o.index === index)
  const new_question = Number.isNaN(index) || !filter
  let result = ''
  if (!!filter && find === 'store') {
    result = `您选择了门店：${filter.store_name}。它的营业时间是：${filter.store_time}。\n门店简介：${filter.store_desciption}`
  }
  if (!!filter && find === 'product') {
    result = `您选择了产品：${filter.name}（价格：${filter.price}元），它来自门店：${filter.store_name}（营业时间：${filter.store_time}）。\n产品简介：${filter.description}\n门店简介：${filter.store_desciption}`
  }
  const answer = {
    space_id: filter?.space_id ?? '',
    space_name: filter?.space_name ?? '',
    child_space_id: filter?.child_space_id ?? '',
    child_space_name: filter?.child_space_name ?? '',
    description: result
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
//#region Test
//#endregion
