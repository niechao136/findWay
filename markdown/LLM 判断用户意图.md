请完成以下任务，最终输出 JSON：
1. 将用户输入转化为繁体中文，保存在 `tran` 中
2. 分析用户意图
   - 如果找商品，`find` 为 `product`
   - 如果找门店，`find` 为 `store`
   - 如果是闲聊，`find` 为 `answer`，直接回答，答案保存在 `text` 中
