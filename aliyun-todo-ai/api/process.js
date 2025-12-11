export default async function handler(req, res) {
  // 设置跨域和预检请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '只支持POST请求' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: '没有收到图片数据' });

    const apiKey = process.env.ALIYUN_API_KEY;
    if (!apiKey) return res.status(500).json({ error: '服务器配置错误' });

    // 调用阿里云通义千问视觉模型
    const dashResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "model": "qwen-vl-plus",
        "input": {
          "messages": [{
            "role": "user",
            "content": [
              { "image": image },
              { "text": "请从图片中精确提取以下信息，并以JSON格式返回：\n1. title: 活动标题\n2. content: 主要内容\n3. location: 活动地点\n4. time: 活动时间（如果是日期时间请转换为标准格式）\n5. requirements: 活动要求\n\n如果某项信息不存在，请设置为空字符串。确保返回纯JSON格式，不要有其他文字。" }
            ]
          }]
        },
        "parameters": { "result_format": "message" }
      })
    });

    if (!dashResponse.ok) throw new Error(`阿里云API请求失败: ${dashResponse.status}`);
    const result = await dashResponse.json();

    // 解析返回的文本
    const msgContent = result?.output?.choices?.[0]?.message?.content || [];
    const textItem = msgContent.find(item => item.text)?.text || '{}';
    const jsonMatch = textItem.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

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

  } catch (error) {
    console.error('处理错误:', error);
    res.status(500).json({ success: false, error: '处理失败: ' + error.message });
  }
}