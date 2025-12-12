export   出口 导出默认async函数处理程序（req, res） {default   默认的 async   异步 function   函数 handler(req   要求的, res) {
  // 设置跨域和预检请求
  res.setHeader(‘Access-Control-Allow-Origin’,‘*’);res.setHeader('Access-Control-Allow-Origin'“Access-Control-Allow-Origin”, '*');
  res.setHeader('Access-Control-Allow-Methods'“Access   “访问-Control   控制-Allow   允许-Methods”, 'POST， OPTIONS')；res.setHeader('Access-Control-Allow-Methods'“Access-Control-Allow-Methods”, 'POST, OPTIONS'   “,选择”);
  res.setHeader(“Access-Control-Allow-Headers”、“内容类型”);res.setHeader('Access-Control-Allow-Headers'“Access-Control-Allow-Headers”, 'Content-Type'   “内容类型”);
  if   如果   如果 (req   要求的.method   方法 === 'OPTIONS'   “选项”) return   返回   返回 res.status   状态(200).end   结束();
  if   如果   如果 (req   要求的.method   方法 !== 'POST'   “职位”) return   返回   返回 res.status   状态(405).json({ error   错误: '只支持POST请求' });

     尝试{try   试一试 {
    Const {image   图像} = req   要求的.body；const { image   图像 } = req   要求的.body   身体;
    if   如果   如果 (!image   图像) return   返回   返回 res.status   状态(400).json({ error   错误: '没有收到图片数据' });

    const   常量 apiKey = process   过程.env.ALIYUN_API_KEY；const apiKey = process   过程.env.ALIYUN_API_KEY;
    if   如果   如果 (!apiKey) return   返回   返回 res.status   状态(500).json({ error   错误: '服务器配置错误' });

    // 调用阿里云通义千问视觉模型
    const   常量 dashResponse = await   等待 fetch   获取('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
         方法:“文章”,method   方法: 'POST'   “职位”,
         标题:{headers   头: {
        ‘Authorization’： ‘来人${apiKey} ’，'Authorization': `Bearer ${apiKey}`,   “授权”
        “内容类型”:“application / json”,'Content-Type'   “内容类型”: 'application/json'   “application / json”,
      },
         身体:JSON.stringify ({body   身体: JSON.stringify({
        "model"   “模型”: "Qwen3-vl-plus",
           “输入”:{"input"   “输入”: {
             “消息”:[{"messages"   “消息”: [{
               “角色”:“用户”,"role"   “角色”: "user"   “用户”,
               “内容”:("content"   “内容”: [
                 {"image": image}，{ "image": image },   “图像”
              { "text": "请从图片中精确提取以下信息，并以JSON格式返回：\n1. title: 活动标题\n2. content: 主要内容\n3. location: 活动地点\n4. time: 活动时间（如果是日期时间请转换为标准格式）\n5. requirements: 活动要求\n\n如果某项信息不存在，请设置为空字符串。确保返回纯JSON格式，不要有其他文字。" }
            ]
          }]
        },
        “parameters”： {"result_format"   “result_format”: "message"}"   “参数”parameters": { "result_format": "message" }
      })
    });

    if   如果   如果 (!dashResponse.ok   好吧) throw   扔 new   新 Error   错误(`阿里云API请求失败: ${dashResponse.status   状态}`);
    const   常量    结果result = await   等待 dashResponse.json()；const result = await   等待 dashResponse.json();

    // 解析返回的文本
    const   常量 msgContent = result   结果?.output?.choices?.[0]?.message?.content || [];
    const   常量 textItem = msgContent.find(item => item.text)?.text || '{}';
    const   常量 jsonMatch = textItem.match(/\{[\s\S]*\}/);
    const   常量 parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // 返回给快捷指令的标准格式
    res.json({
      success: true,
      data: {
        title: parsed.title || '',
        content: parsed.content || '',
        location: parsed.location || '',
        time: parsed.time || '',
        requirements: parsed.requirements || ''
      }
    });

  } catch (error   错误) {
    console.error   错误('处理错误:', error   错误);
    res.status   状态(500).json({ success: false, error   错误: '处理失败: ' + error   错误.message });
  }

}

