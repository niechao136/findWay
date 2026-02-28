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
  const check = {}
  list.forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = info.length
      info.push({
        space_id: obj.space_id,
        space: obj.space_name,
        child_space_id: obj.child_space_id,
        name: obj.store_name,
        time: obj.store_time,
        product: []
      })
    }
    info[check[obj.child_space_id]].product.push({
      price: obj.price,
      name: obj.name,
    })
  })
  const answer = {
    AI_reply,
    info,
  }
  return {
    answer,
  }
}


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
  const list = Array.isArray(result) ? Array.from(result).map(o => {
    return parseKeyValueText(o.content)
  }) : []
  const store = []
  const check = {}
  list.forEach(obj => {
    if (check[obj.child_space_id] === undefined) {
      check[obj.child_space_id] = store.length
      store.push({
        space_id: obj.space_id,
        space: obj.space_name,
        child_space_id: obj.child_space_id,
        name: obj.store_name,
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
    result: JSON.stringify(store),
  }
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
  // 检查点 1: 确保 data 真的传进来了
  if (!result) return [];

  // 检查点 2: 必须 return 整个链式调用的结果
  const store = result
    .sort((a, b) => b.metadata.score - a.metadata.score)
    .map(item => {
      const lines = item.content.split('\n');
      const info = {};
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key) {
          info[key.trim()] = valueParts.join(':').trim();
        }
      });

      return {
        name: info.store_name,
        space_id: info.space_id,
        space: info.space_name,
        child_space_id: info.child_space_id,
        time: info.store_time,
        product: [
          {
            name: info.name,
            price: info.price
          }
        ]
      };
    }); // map 结束

  return {
    now: getCurrentTimeByOffset(timezone),
    result: JSON.stringify(store),
  }
}

function main({text, result}) {
  const AI_reply = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')

  const info = JSON.parse(result)
  const answer = {
    AI_reply,
    info,
  }

  return {
    answer,
  }
}


