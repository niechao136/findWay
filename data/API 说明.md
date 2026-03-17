# way finding知识库更新
## 1. 文件上传
- API 地址：`http://172.22.132.118:8081/v1/files/upload`
- header: Authorization: Bearer app-WeOOAWCwxQwuy0FWQTUViw73
- Request(该接口需使用 multipart/form-data 进行请求。):
    - file (File) 要上传的文件。
    - user (string) 用户标识，固定带入 'abc123'。
- Response，需要提取其中的 `id`：
    ```json
    {
        "id": "2cbadb48-03d8-444b-ba83-3a55bc6f9f95",
        "name": "aic_kv_format 2.md",
        "size": 382,
        "extension": "md",
        "mime_type": "application\/octet-stream",
        "created_by": "d0130343-4d66-4560-97cd-d85d46ac325e",
        "created_at": 1773192866,
        "preview_url": null,
        "source_url": "http:\/\/172.22.132.118:8081\/files\/2cbadb48-03d8-444b-ba83-3a55bc6f9f95\/file-preview?timestamp=1773192866&nonce=b24055f701d52c2e8af2cc448c169019&sign=ekpz1G7iDGhWqFfnTuFGhe_Dhw718X1Vh-etI-rHrrE%3D",
        "original_url": null,
        "user_id": null,
        "tenant_id": "de79cda4-cae0-4be5-8bff-50ddcacf186f",
        "conversation_id": null,
        "file_key": null
    }
    ```
## 2. 调用工作流
- API 地址：`http://172.22.132.118:8081/v1/workflows/run`
- header: Authorization: Bearer app-WeOOAWCwxQwuy0FWQTUViw73
- Request:
    ```json
    {
        "inputs": {
            "base": "http://172.22.132.118:8081/v1",
            "token": "dataset-Y4QLUTrJJLb1Lm57plIzTrQ8",
            "kbName": "FindWay知识库-Elvis测试",
            "doc": {
                "transfer_method": "local_file",
                "upload_file_id": "2cbadb48-03d8-444b-ba83-3a55bc6f9f95",
                "type": "document"
            }
        },
        "response_mode": "blocking",
        "user": "abc123"
    }
    ```
    - inputs 参数，json 格式
        - base：知识库 Base URL
        - token：知识库 API Token
        - kbName：知识库名称
        - doc：上传的文件对象
            - transfer_method：固定带入 local_file
            - upload_file_id：调用 /files/upload 后取到的 `id`
            - type：固定带入 document
    - response_mode：固定带入 blocking 
    - user：固定带入 abc123
