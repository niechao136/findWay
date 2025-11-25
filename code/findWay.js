
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

    obj[current.key] = value;
  }

  return obj;
}
function main({result, query}) {
  let answer = '检索到以下结果，请输入序号进行选择：\n'
  const store_id = {}
  const list = Array.from(result).map(o => {
    const obj = parseToObject(o.content)
    if (!obj['product_id']) {
      const obj_n = {}
      Object.keys(obj).forEach(key => {
        if (key !== 'store_id') {
          obj_n[`store_${key}`] = obj[key]
        }
      })
      store_id[obj.store_id] = obj_n
    }
    return obj
  })
  const product = []
  const store = []
  let index = 1
  list.forEach(obj => {
    if (!obj['product_id']) {
      store.push({
        ...obj,
        index,
      })
      answer += `${index}. ${obj.name}${!!obj.time ? `（营业时间：${obj.time}）` : ''}\n`
      index++
    }
  })
  list.forEach(obj => {
    if (!!obj['product_id']) {
      product.push({
        ...obj,
        ...(store_id[obj.store_id] || {}),
        index,
      })
      answer += `${index}. ${obj.name}${!!obj.price ? `（价格：${obj.price}元）` : ''}\n`
      index++
    }
  })
  const history = {
    answer,
    query,
    product,
    store,
  }
  const need_filter = list.length > 1
  let res = ''
  if (!list[0].product_id) {
    res = `已为您找到门店：${list[0].name}。它的营业时间是：${list[0].time}。\n门店简介：${list[0].description}`
  }
  if (!!list[0].product_id && !!list[0].store_name) {
    res = `已为您找到产品：${list[0].name}（价格：${list[0].price}元），它来自门店：${list[0].store_name}（营业时间：${list[0].store_time}）。\n产品简介：${list[0].description}\n门店简介：${list[0].store_desciption}`
  }
  const info = !list[0].product_id || !!list[0].store_name ? result[0].content : ''
  const need_query = [list[0].store_id]
  const sql = !list[0].product_id || !!list[0].store_name ? '' : `
      SELECT *
      FROM test_dify.store
      WHERE store_id IN (${need_query.join(', ')});
    `
  return {
    answer,
    product,
    store,
    need_filter,
    info,
    sql,
    history,
    res,
  }
}

//#endregion
//#region 处理门店查询

function main({product, text}) {
  const md = String(text).replace(/(?<!\|)\n(?!\|)/g, ' ').replaceAll('\r', ' ')
  const lines = md.split('\n')
  const parseRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(col => col.trim())
  const head = parseRow(lines[0])
  const body = lines.slice(2)
  const store_by_id = {}
  const id = head.findIndex(o => o === 'store_id')
  body.forEach(line => {
    const cols = parseRow(line)
    store_by_id[cols[id]] = {}
    head.forEach((h, i) => {
      if (h !== 'store_id') {
        store_by_id[cols[id]][`store_${h}`] = cols[i] || ''
      }
    })
  })
  const obj = {
    ...product[0],
    ...(store_by_id[product[0].store_id] || {}),
  }
  const res = Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
  const result = `已为您找到产品：${obj.name}（价格：${obj.price}元），它来自门店：${obj.store_name}（营业时间：${obj.store_time}）。\n产品简介：${obj.description}\n门店简介：${obj.store_desciption}`
  return {
    product: res,
    result,
  }
}

//#endregion
//#region 处理历史

function main({query, history}) {
  const index = Number(query)
  const old_query = history.query || ''
  const old_answer = history.answer || ''
  const product = Array.from(history.product).find(o => o.index === index)
  const store = Array.from(history.store).find(o => o.index === index)
  const new_question = Number.isNaN(index) || (!product && !store)
  let info = '', result = ''
  if (!!store) {
    info = Object.entries(Object(store))
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
    result = `您选择了门店：${store.name}。它的营业时间是：${store.time}。\n门店简介：${store.description}`
  }
  if (!!product && !!product.store_name) {
    info = Object.entries(Object(product))
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ')
    result = `您选择了产品：${product.name}（价格：${product.price}元），它来自门店：${product.store_name}（营业时间：${product.store_time}）。\n产品简介：${product.description}\n门店简介：${product.store_desciption}`
  }
  let sql = ''
  if (!!product && !product.store_name) {
    const need_query = [product.store_id]
    sql = `
      SELECT *
      FROM test_dify.store
      WHERE store_id IN (${need_query.join(', ')});
    `
  }
  return {
    new_question,
    info,
    sql,
    product: product || {},
    old_query,
    old_answer,
    result,
  }
}

//#endregion
//#region 处理门店查询

function main({product, text}) {
  const md = String(text).replace(/(?<!\|)\n(?!\|)/g, ' ').replaceAll('\r', ' ')
  const lines = md.split('\n')
  const parseRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(col => col.trim())
  const head = parseRow(lines[0])
  const body = lines.slice(2)
  const store_by_id = {}
  const id = head.findIndex(o => o === 'store_id')
  body.forEach(line => {
    const cols = parseRow(line)
    store_by_id[cols[id]] = {}
    head.forEach((h, i) => {
      if (h !== 'store_id') {
        store_by_id[cols[id]][`store_${h}`] = cols[i] || ''
      }
    })
  })
  const obj = {
    ...product,
    ...(store_by_id[product.store_id] || {})
  }
  const res = Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}`)
    .join('; ')
  const result = `您选择了产品：${obj.name}（价格：${obj.price}元），它来自门店：${obj.store_name}（营业时间：${obj.store_time}）。\n产品简介：${obj.description}\n门店简介：${obj.store_desciption}`
  return {
    product: res,
    result,
  }
}

//#endregion
//#region Test
//#endregion
