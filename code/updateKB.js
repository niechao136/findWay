//#region 处理知识库列表

function main({body, kbName}) {
  const res = JSON.parse(body) || {}
  const arr = Array.isArray(res.data) ? Array.from(res.data) : []
  const kb = arr.find(o => o.name === kbName)
  const kb_id = String(kb?.id ?? '')
  return {
    kb_id
  }
}

//#endregion
//#region 处理知识库文档列表

function main({body, docName, kbName, kb_id, content}) {
  const res = JSON.parse(body) || {}
  const arr = Array.isArray(res.data) ? Array.from(res.data) : []
  const doc = arr.find(o => o.name === docName)
  const doc_id = String(doc?.id ?? '')
  const status = !!kb_id && !!doc_id ? 1 : 0
  const msg = !kb_id ? `找不到知识库：${kbName}` : (!doc_id ? `找不到文档：${docName}` : '')
  const full = JSON.stringify({
    name: docName,
    text: content,
    doc_form: 'hierarchical_model',
    process_rule: {
      mode: 'hierarchical',
      rules: {
        pre_processing_rules: [
          {
            id: 'remove_extra_spaces',
            enabled: false
          },
          {
            id: 'remove_urls_emails',
            enabled: false
          }
        ],
        segmentation: {
          separator: '\n\n',
          max_tokens: 4000,
        },
        parent_mode: 'paragraph',
        subchunk_segmentation: {
          separator: '\n',
          max_tokens: 1000,
          chunk_overlap: 50,
        }
      }
    }
  })
  const segments = String(content).split('\n\n').map(content => {
    return { content }
  })
  const increment = JSON.stringify({ segments })
  return {
    doc_id,
    status,
    msg,
    full,
    increment,
  }
}

//#endregion
//#region 全量更新结果

function main({body}) {
  const res = JSON.parse(body) || {}
  const status =  !!res?.document?.id ? 1 : 0
  const msg = status === 1 ? '更新成功' : (res?.message ?? '更新失败')
  return {
    status,
    msg,
  }
}

//#endregion
//#region 增量更新结果

function main({body}) {
  const res = JSON.parse(body) || {}
  const status =  Array.isArray(res?.data) ? 1 : 0
  const msg = status === 1 ? '更新成功' : (res?.message ?? '更新失败')
  return {
    status,
    msg,
  }
}

//#endregion
//#region Test
//#endregion
