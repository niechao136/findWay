# 知识库API流程说明
## 1. 新增知识库
- API 地址：`http://172.22.132.97:8081/v1/datasets`
- Method：POST
- header: Authorization: Bearer dataset-Y4QLUTrJJLb1Lm57plIzTrQ8
- Request：
    ```json
    {
      "name": "测试新增",
      "description": "description",
      "indexing_technique": "high_quality",
      "permission": "all_team_members",
      "embedding_model": "text-embedding-3-large",
      "embedding_model_provider": "langgenius/azure_openai/azure_openai",
      "retrieval_model": {
        "search_method": "hybrid_search",
        "reranking_enable": false,
        "reranking_mode": "weighted_score",
        "reranking_model": {
          "reranking_model_name": "",
          "reranking_provider_name": ""
        },
        "top_k": 10,
        "score_threshold_enabled": false,
        "score_threshold": null,
        "weights": {
          "weight_type": "customized",
          "keyword_setting": {
            "keyword_weight": 0.3
          },
          "vector_setting": {
            "vector_weight": 0.7,
            "embedding_model_name": "text-embedding-3-large",
            "embedding_provider_name": "langgenius/azure_openai/azure_openai"
          }
        }
      }
    }
    ```
    - name：名称，必填
    - description：描述
    - indexing_technique：索引技术，high_quality - 高质量，economy - 经济
    - permission：访问权限，only_me - 只有我，all_team_members - 所有团队成员，partial_members - 部分团队成员
    - embedding_model：嵌入模型名称
    - embedding_model_provider：嵌入模型提供商
    - retrieval_model：检索设置，json 格式
        - search_method：搜索方法，hybrid_search - 混合检索，semantic_search - 向量检索，full_text_search - 全文检索，keyword_search - 倒排检索（用于经济模式）
        - reranking_enable：布尔，是否启用 Remark 模型
        - reranking_mode：重新排序模式，reranking_model - Remark 模型，weighted_score - 根据权重分数
        - reranking_model：Remark 模型设置，json 格式
            - reranking_model_name：Remark 模型名称
            - reranking_provider_name：Remark 模型提供商
        - top_k：返回的顶部匹配结果数量，1-10之间的整数
        - score_threshold_enabled：布尔，是否启用分数阈值来过滤结果
        - score_threshold：最低分数要求
        - weights：使用混合检索时的权重设置，json 格式
            - weight_type：权重类型，customized - 自定义，semantic_first - 向量优先，keyword_first - 关键字优先
            - keyword_setting：关键字设置，json 格式
                - keyword_weight：关键字权重
            - vector_setting：向量设置，json 格式
                - vector_weight：向量权重
                - embedding_model_name：嵌入模型名称
                - embedding_provider_name：嵌入模型提供商
- Response，需要提取其中的 `id`：
    ```json
    {
      "id": "3bfa01a5-3bc3-43d6-867f-371decb540be",
      "name": "测试新增",
      "description": "description",
      "provider": "vendor",
      "permission": "all_team_members",
      "data_source_type": null,
      "indexing_technique": "high_quality",
      "app_count": 0,
      "document_count": 0,
      "word_count": 0,
      "created_by": "8fdccaea-64ac-4a75-8f86-940c234020a5",
      "author_name": "Jack.Xu",
      "created_at": 1773642237,
      "updated_by": "8fdccaea-64ac-4a75-8f86-940c234020a5",
      "updated_at": 1773642237,
      "embedding_model": "text-embedding-3-large",
      "embedding_model_provider": "langgenius/azure_openai/azure_openai",
      "embedding_available": null,
      "retrieval_model_dict": {
        "search_method": "hybrid_search",
        "reranking_enable": false,
        "reranking_mode": "weighted_score",
        "reranking_model": {
          "reranking_provider_name": "",
          "reranking_model_name": ""
        },
        "weights": {
          "weight_type": "customized",
          "keyword_setting": {
            "keyword_weight": 0.3
          },
          "vector_setting": {
            "vector_weight": 0.7,
            "embedding_model_name": "text-embedding-3-large",
            "embedding_provider_name": "langgenius/azure_openai/azure_openai"
          }
        },
        "top_k": 10,
        "score_threshold_enabled": false,
        "score_threshold": null
      },
      "summary_index_setting": {
        "enable": null,
        "model_name": null,
        "model_provider_name": null,
        "summary_prompt": null
      },
      "tags": [],
      "doc_form": null,
      "external_knowledge_info": {
        "external_knowledge_id": null,
        "external_knowledge_api_id": null,
        "external_knowledge_api_name": null,
        "external_knowledge_api_endpoint": null
      },
      "external_retrieval_model": {
        "top_k": 10,
        "score_threshold": null,
        "score_threshold_enabled": false
      },
      "doc_metadata": [],
      "built_in_field_enabled": false,
      "pipeline_id": null,
      "runtime_mode": "general",
      "chunk_structure": null,
      "icon_info": {
        "icon_type": null,
        "icon": null,
        "icon_background": null,
        "icon_url": null
      },
      "is_published": false,
      "total_documents": 0,
      "total_available_documents": 0,
      "enable_api": true,
      "is_multimodal": false
    }
    ```

## 2. 修改知识库
- API 地址：`http://172.22.132.97:8081/v1/datasets/{dataset_id}/document/create-by-file`
- Method：POST
- header: Authorization: Bearer dataset-Y4QLUTrJJLb1Lm57plIzTrQ8
- params: dataset_id - 知识库 ID，即新增知识库返回结果中的 `id`
- Request(该接口需使用 multipart/form-data 进行请求。):
    - file (File) 要上传的文件。
    - data (string) 文档元数据以及处理规则的 JSON 字符串，JSON 格式如下：
        ```json
        {
          "indexing_technique": "high_quality",
          "doc_form": "hierarchical_model",
          "process_rule": {
            "mode": "hierarchical",
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
                "separator": "\n\n",
                "max_tokens": 4000
              },
              "parent_mode": "paragraph",
              "subchunk_segmentation": {
                "separator": "\n",
                "max_tokens": 1000,
                "chunk_overlap": 50
              }
            }
          }
        }
        ```
        栏位说明：
        - indexing_technique：索引技术，high_quality - 高质量，economy - 经济
        - doc_form：索引模式，text_model - 通用，hierarchical_model - 父子模式，qa_model：QA模式
        - process_rule：文档处理规则，json 格式
            - mode：处理模式，automatic - 自动, custom - 通用, hierarchical：父子分段
            - rules：具体规则，json 格式，mode 为 custom 或 hierarchical 时可用
                - pre_processing_rules：预处理规则，json 数组
                    - id：规则id，remove_extra_spaces - 替换掉连续的空格、换行符和制表符，remove_urls_emails - 删除所有 URL 和电子邮件地址
                    - enabled：布尔，是否启用规则
                - segmentation：分段规则，json 格式
                    - separator：分段分隔符
                    - max_tokens：单个分段最大长度，dify 默认最大值为 4000
                - parent_mode：父子模式时父块的分段方式，full-doc - 整个文档作为父块，paragraph - 父块按照 segmentation 的规则分段
                - subchunk_segmentation：子块分段规则，json 格式
                    - separator：子块分段分隔符
                    - max_tokens：单个子块分段最大长度，需要小于 segmentation 中的 max_tokens
                    - chunk_overlap：重叠长度

## 3. 删除知识库
- API 地址：`http://172.22.132.97:8081/v1/datasets/{dataset_id}`
- Method：DELETE
- header: Authorization: Bearer dataset-Y4QLUTrJJLb1Lm57plIzTrQ8
- params: dataset_id - 知识库 ID，即新增知识库返回结果中的 `id`
- Request：无

## 4. 调用工作流，根据知识库ID检索不同的知识库
- API 地址：`http://172.22.132.97:8081/v1/workflows/run`
- Method：POST
- header: Authorization: Bearer app-MB7M6nkpx53DAFrWAl6XZQ2Y
- Request:
    ```json
    {
        "inputs": {
            "base": "http://172.22.132.97:8081/v1",
            "token": "dataset-Y4QLUTrJJLb1Lm57plIzTrQ8",
            "kb_id": "6efd6476-8fe6-4ff6-830f-e8a113a0de8a",
            "query": "我要茶叶蛋"
        },
        "response_mode": "blocking",
        "user": "abc123"
    }
    ```
    - inputs 参数，json 格式
        - base：知识库 Base URL
        - token：知识库 API Token
        - kb_id：知识库 ID
        - query：需要检索的内容
    - response_mode：固定带入 blocking
    - user：固定带入 abc123

## 5. 其他可能会用到的 API
### 5.1 获取知识库列表，可以获取知识库ID和知识库名称
- API 地址：`http://172.22.132.97:8081/v1/datasets`
- Method：GET
- header: Authorization: Bearer dataset-Y4QLUTrJJLb1Lm57plIzTrQ8
- params: 
   - keyword：可选，按名称搜索知识库的关键字
   - page：可选，分页页码，默认为1
   - limit：可选，每页项目数，范围是1~100，默认为20
- Response：
    ```json
    {
      "data": [
        {
          "id": "3bfa01a5-3bc3-43d6-867f-371decb540be",
          "name": "测试新增",
          "description": "description",
          "provider": "vendor",
          "permission": "all_team_members",
          "data_source_type": null,
          "indexing_technique": "high_quality",
          "app_count": 0,
          "document_count": 0,
          "word_count": 0,
          "created_by": "8fdccaea-64ac-4a75-8f86-940c234020a5",
          "author_name": "Jack.Xu",
          "created_at": 1773642237,
          "updated_by": "8fdccaea-64ac-4a75-8f86-940c234020a5",
          "updated_at": 1773642237,
          "embedding_model": "text-embedding-3-large",
          "embedding_model_provider": "langgenius/azure_openai/azure_openai",
          "embedding_available": true,
          "retrieval_model_dict": {
            "search_method": "hybrid_search",
            "reranking_enable": false,
            "reranking_mode": "weighted_score",
            "reranking_model": {
              "reranking_provider_name": "",
              "reranking_model_name": ""
            },
            "weights": {
              "weight_type": "customized",
              "keyword_setting": {
                "keyword_weight": 0.3
              },
              "vector_setting": {
                "vector_weight": 0.7,
                "embedding_model_name": "text-embedding-3-large",
                "embedding_provider_name": "langgenius/azure_openai/azure_openai"
              }
            },
            "top_k": 10,
            "score_threshold_enabled": false,
            "score_threshold": null
          },
          "summary_index_setting": {
            "enable": null,
            "model_name": null,
            "model_provider_name": null,
            "summary_prompt": null
          },
          "tags": [],
          "doc_form": null,
          "external_knowledge_info": {
            "external_knowledge_id": null,
            "external_knowledge_api_id": null,
            "external_knowledge_api_name": null,
            "external_knowledge_api_endpoint": null
          },
          "external_retrieval_model": {
            "top_k": 10,
            "score_threshold": null,
            "score_threshold_enabled": false
          },
          "doc_metadata": [],
          "built_in_field_enabled": false,
          "pipeline_id": null,
          "runtime_mode": "general",
          "chunk_structure": null,
          "icon_info": {
            "icon_type": null,
            "icon": null,
            "icon_background": null,
            "icon_url": null
          },
          "is_published": false,
          "total_documents": 0,
          "total_available_documents": 0,
          "enable_api": true,
          "is_multimodal": false
        }
      ],
      "has_more": false,
      "limit": 20,
      "total": 12,
      "page": 1
    }
    ```
    可能需要的栏位
    - data
        - id：知识库ID
        - name：知识库名称
        
### 5.2 获取可用的嵌入模型，新增知识库设置嵌入模型时，可能要用到
- API 地址：`http://172.22.132.97:8081/v1/workspaces/current/models/model-types/text-embedding`
- Method：GET
- header: Authorization: Bearer dataset-Y4QLUTrJJLb1Lm57plIzTrQ8
- Response：
    ```json
    {
        "data": [
            {
                "tenant_id": "de79cda4-cae0-4be5-8bff-50ddcacf186f",
                "provider": "langgenius/azure_openai/azure_openai",
                "label": {
                    "zh_Hans": "Azure OpenAI Service Model",
                    "en_US": "Azure OpenAI Service Model"
                },
                "icon_small": {
                    "zh_Hans": "http://172.22.132.97:8081/console/api/workspaces/de79cda4-cae0-4be5-8bff-50ddcacf186f/model-providers/langgenius/azure_openai/azure_openai/icon_small/zh_Hans",
                    "en_US": "http://172.22.132.97:8081/console/api/workspaces/de79cda4-cae0-4be5-8bff-50ddcacf186f/model-providers/langgenius/azure_openai/azure_openai/icon_small/en_US"
                },
                "icon_small_dark": null,
                "status": "active",
                "models": [
                    {
                        "model": "text-embedding-3-large",
                        "label": {
                            "zh_Hans": "text-embedding-3-large",
                            "en_US": "text-embedding-3-large"
                        },
                        "model_type": "text-embedding",
                        "features": null,
                        "fetch_from": "customizable-model",
                        "model_properties": {
                            "context_size": 8191,
                            "max_chunks": 32
                        },
                        "deprecated": false,
                        "status": "active",
                        "load_balancing_enabled": false,
                        "has_invalid_load_balancing_configs": false
                    }
                ]
            }
        ]
    }
    ```
    可能需要的栏位
    - data
       - provider：嵌入模型提供商
       - models：
           - model：嵌入模型名称
