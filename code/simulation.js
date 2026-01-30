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
//#region Test
//#endregion
