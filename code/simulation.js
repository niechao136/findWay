//#region 处理表格数据

function markdownTableToTwoDArray(mdString) {
  // 1. 先將字串按行拆分，並過濾掉純空白行
  const rows = mdString.trim().split('\n').filter(row => row.trim() !== '')
  const result = []
  let separatorCount = 0 // 用來計算遇到了幾次分隔線行

  for (let line of rows) {
    const trimmedLine = line.trim()

    // 如果是空行，直接跳過（不代表結束，增加容錯率）
    if (!trimmedLine) continue

    // 判斷是否為分隔線行 (例如 | --- | --- |)
    const isSeparator = /^\|?(\s*:?-+:?\s*\|?)+\s*$/.test(trimmedLine)

    if (isSeparator) {
      separatorCount++;
      // 如果遇到了第二次分隔線，說明進入了第二個 Sheet 的結構
      if (separatorCount >= 2) {
        // 移除已經推入 result 的第二個表格的標題行（即 result 的最後一筆）
        result.pop()
        break
      }
      continue // 跳過第一個表格的分隔線行，不存入陣列
    }

    // 解析資料列
    const cells = trimmedLine
      .replace(/^\||\|$/g, '')
      .split('|')
      .map(cell => cell.trim())

    result.push(cells)
  }

  return result
}
function main({text}) {
  const list = markdownTableToTwoDArray(text)
  const question = [], answer = []
  if (list.length > 1) {
    list.slice(1).forEach(arr => {
      const q = arr?.[0], a = arr?.[1]
      if (!!q && !!a && typeof q === 'string' && typeof a === 'string') {
        question.push(q)
        answer.push(a)
      }
    })
  }
  const error = '请上传标准问答表格文件，需要表头并且至少包括一组标准问答！'
  return {
    answer,
    error,
    question,
  }
}

//#endregion
//#region 处理模拟问题

function handleLLM(text = '') {
  let str = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const blockMatch = str.match(/```json\s*([\s\S]*)/i)
  let jsonPart = blockMatch ? blockMatch[1] : str
  jsonPart = jsonPart.replace(/```[\s\S]*$/, '').trim()
  const cleanJson = jsonPart
    .replace(/\/\/(?!\s*http)[^\n]*/g, '') // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')     // 移除多行注释
    .replace(/\xA0/g, ' ')                 // 关键：修复 \xA0 空格
    .replace(/,\s*([\]}])/g, '$1')         // 关键：修复 JSON 尾随逗号
    .trim()
  try {
    return JSON.parse(cleanJson)
  } catch (e) {
    return {}
  }
}
function main({output}) {
  const simulation = []
  const simulation_question = []
  const simulation_index = {}
  Array.from(output).forEach((text, index) => {
    const obj = handleLLM(text)
    const list = Array.isArray(obj?.paraphrases) ? Array.from(obj?.paraphrases) : []
    list.forEach(item => {
      const query = String(item?.text ?? '')
      if (!!query) {
        simulation_index[simulation.length] = index
        const request = {
          inputs: {},
          query,
          response_mode: 'blocking',
          conversation_id: '',
          user: 'simulation_test',
          files: [],
        }
        simulation.push(JSON.stringify(request))
        simulation_question.push(query)
      }
    })
  })
  return {
    simulation,
    simulation_index,
    simulation_question,
  }
}

//#endregion
//#region 处理调用结果

function main({output, simulation_index, question, answer, simulation_question}) {
  const question_list = Array.from(question)
  const answer_list = Array.from(answer)
  const simulation_list = Array.from(simulation_question)
  const prompt = []
  const simulation_obj = []
  Array.from(output).forEach((body, index) => {
    const event = JSON.parse(String(body ?? '{}'))
    const res = JSON.parse(String(event?.answer ?? '{}'))
    const replay = String(res?.AI_reply ?? '')
    const question = question_list[simulation_index[index]]
    const answer = answer_list[simulation_index[index]]
    const simulation = simulation_list[index]
    prompt.push(`
- 【标准问题】：${question}
- 【标准答案】：${answer}
- 【模拟问题】：${simulation}
- 【模拟答案】：${replay}
      `)
    simulation_obj.push({
      question,
      answer,
      simulation,
      replay,
    })
  })
  return {
    prompt,
    simulation_obj,
  }
}

//#endregion
//#region 处理相似度

function handleLLM(text = '') {
  let str = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const blockMatch = str.match(/```json\s*([\s\S]*)/i)
  let jsonPart = blockMatch ? blockMatch[1] : str
  jsonPart = jsonPart.replace(/```[\s\S]*$/, '').trim()
  const cleanJson = jsonPart
    .replace(/\/\/(?!\s*http)[^\n]*/g, '') // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')     // 移除多行注释
    .replace(/\xA0/g, ' ')                 // 关键：修复 \xA0 空格
    .replace(/,\s*([\]}])/g, '$1')         // 关键：修复 JSON 尾随逗号
    .trim()
  try {
    return JSON.parse(cleanJson)
  } catch (e) {
    return {}
  }
}
function main({output, simulation_obj}) {
  const head = '|標準問題|標準回答|模擬問題|模擬答案|相關係數|\n'
  const split = '|---|---|---|---|---|\n'
  const file = '評估報告'
  const list = Array.from(simulation_obj)
  let markdown = head + split
  Array.from(output).forEach((text, index) => {
    const obj = handleLLM(text)
    const item = list[index]
    const question = String(item.question).replaceAll('\n', ';').replaceAll('|', '¦')
    const answer = String(item.answer).replaceAll('\n', ';').replaceAll('|', '¦')
    const simulation = String(item.simulation).replaceAll('\n', ';').replaceAll('|', '¦')
    const replay = String(item.replay).replaceAll('\n', ';').replaceAll('|', '¦')
    const score = String(obj.similarity_score).replaceAll('\n', ';').replaceAll('|', '¦')
    markdown += `|${question}|${answer}|${simulation}|${replay}|${score}|\n`
  })
  return {
    markdown,
    file,
  }
}

//#endregion
//#region Test
//#endregion
