# Dify 语音文件转文本 API 说明
## 语音文件转文本（这支 API 需要配置 SPEECH2TEXT 模型，并且 Chatflow 要开启“语音转文字”功能）
- API 地址：`https://genieai.wise-apps.com:18081/v1/audio-to-text`
- Method：POST
- header: Authorization: Bearer app-lODcE70ZjA36qVGRBb6a5onT
- Request(该接口需使用 multipart/form-data 进行请求。):
    - file (File) 语音文件，支持格式：['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']，文件大小限制：15MB
    - user (string) 用户标识。
- Response：
    ```json
    {
      "text": "你好呀，亮光闪烁，很高兴见到你。今天过得怎么样呀？希望你度过了愉快的一天。我随时准备好陪你聊天，帮你解决问题，或者就这样轻松愉快的闲聊一会儿。有什么想跟我分享的吗？发光的星星。"
    }
    ```
- 特别说明，当上传mp3格式的语音文件时，文件的type要改成audio/mp3才能调用成功；wav格式不需要改；其余不常见的格式没有测试。
