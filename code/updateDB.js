
//#region 处理知识库文档列表

function main({body}) {
  const res = JSON.parse(body) || {}
  const arr = Array.isArray(res.data) ? Array.from(res.data) : []
  const result = arr.map(o => o.id)
  return {
    result: result
  }
}

//#endregion
//#region 生成表格数组

function main({text, body}) {
  const result = text.split('\n').slice(2).map(line => line.replace(/\|/g, '').trim()).filter(Boolean)
  const res = JSON.parse(body) || {}
  const request = result.map(name => {
    return {
      name: `${name}.csv`,
      indexing_technique: res.indexing_technique || 'high_quality',
      doc_form: res.doc_form || 'text_model',
      "process_rule": {
        "mode": "custom",
        "rules": {
          "pre_processing_rules": [
            {
              "id": "remove_extra_spaces",
              "enabled": false
            },
            {
              "id": "remove_urls_emails",
              "enabled": false
            }
          ],
          "segmentation": {
            "delimiter": "\n",
            "max_tokens": 1024,
            "chunk_overlap": 50
          }
        },
        "limits": {
          "indexing_max_segmentation_tokens_length": 4000
        }
      },
      "retrieval_model": res.retrieval_model_dict || {
        "search_method": "semantic_search",
        "reranking_enable": false,
        "reranking_mode": null,
        "reranking_model": {
          "reranking_provider_name": "",
          "reranking_model_name": ""
        },
        "weights": null,
        "top_k": 5,
        "score_threshold_enabled": false,
        "score_threshold": null
      },
      "embedding_model_provider": res.embedding_model_provider || "azure_openai",
      "embedding_model": res.embedding_model || "text-embedding-3-large"
    }
  })
  return {
    result,
    request,
  }
}

//#endregion
//#region 生成request

function main({text, request, index}) {
  const md = String(text).replace(/(?<!\|)\n(?!\|)/g, ' ').replaceAll('\r', ' ')
  return {
    request: JSON.stringify({
      ...request[index] || {}
    }),
    md,
  }
}

//#endregion
//#region Test
//#endregion
