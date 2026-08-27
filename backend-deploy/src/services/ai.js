// 使用 Node 18+ 内置 fetch

// 调用大模型, 返回文本; 超时控制 (默认 AI_TIMEOUT)
export async function callLLM(messages) {
  const timeout = Number(process.env.AI_TIMEOUT || configTimeout()) || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const provider = process.env.AI_PROVIDER || 'doubao';
    let url = process.env.AI_API_BASE;
    let body;
    if (provider === 'openai') {
      url = (process.env.AI_API_BASE || 'https://api.openai.com/v1') + '/chat/completions';
      body = { model: process.env.AI_MODEL, messages, temperature: 0.7 };
    } else {
      // 豆包 / 兼容 OpenAI 格式
      body = { model: process.env.AI_MODEL, messages, temperature: 0.7 };
    }
    const resp = await fetch(url + (provider === 'openai' ? '' : '/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`AI 调用失败 ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    return json.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

function configTimeout() {
  return 30000;
}

// 组装 Prompt (严格套用 PRD 模板)
export function buildPrompt({ student_name, style_instruction, time_range, teacher_notes, dims, focus_points }) {
  const rangeText = { recent_2w: '近2周', recent_1m: '近1个月', custom: '自定义周期' }[time_range] || time_range;
  let realData = '';
  if (dims.has_score && dims.score_summary) {
    realData += `\n1. 成绩情况：${dims.score_summary}`;
  }
  if (dims.has_tag && dims.tag_summary) {
    realData += `\n2. 课堂表现：${dims.tag_summary}`;
  }
  if (dims.has_attendance && dims.attendance_summary) {
    realData += `\n3. 考勤情况：${dims.attendance_summary}`;
  }
  if (!realData) realData = '\n（本周期无选中维度的有效数据）';

  const focusText = focus_points?.length ? focus_points.join('、') : '';
  if (focusText) {
    realData += `\n4. 教师重点关注的维度：${focusText}`;
  }

  return `你是一名资深中小学班主任，基于真实数据为学生撰写学情反馈。
【严格禁令】
1. 严禁编造任何未在下方数据和备注中出现的信息。
2. 没有数据的维度直接跳过，不要提及「暂无数据」。
3. 严格遵守字数要求，语言符合教师与家长沟通的口语化风格。

【学生姓名】${student_name}
【风格要求】${style_instruction}
【反馈周期】${rangeText}

【真实数据】${realData}

【教师补充备注（优先级最高）】
${teacher_notes || '（无）'}

【教师指定关注点（必须在反馈中重点回应，逐条给出分析与建议）】
${focusText || '（无）'}

【输出要求】
必须返回严格JSON格式，不要任何多余解释，字段如下：
{
  "short_version": "简短微信版，80-100字，口语化，适合直接发家长",
  "full_version": {
    "advantages": "优点与亮点，80-120字",
    "problems": "待改进问题，80-120字",
    "suggestions": "家校共育建议，80-120字"
  }
}`;
}

// 解析大模型 JSON 输出 (容错: 去除代码块包裹)
export function parseLLMJson(text) {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  return JSON.parse(t);
}
