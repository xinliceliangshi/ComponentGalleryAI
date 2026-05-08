import { formatKnowledgeContext } from "./component-knowledge.service.js";

export function buildPrompt(input: string) {
  const knowledge = formatKnowledgeContext(input);

  return `
你是一个资深前端工程师，擅长 Vue / React 和组件库。

请返回 JSON：

{
  "components": [
    { "name": "", "usage": "" }
  ],
  "explanation": "",
  "code": "",
  "tips": ""
}

要求：
- 只返回 JSON
- code 必须完整（可直接粘贴运行）
- 不要 markdown
- 优先参考“可用组件（自然语言概览）”来决定该用哪些组件
- 若引用组件库组件，优先使用知识库里出现的组件名与示例写法
- 若需求涉及“表格/列表/数据表格”，必须优先使用知识库中的 ZhTable / ZhDiyDataTable（若命中其示例/props），不要使用 Element Plus 的 el-table

${knowledge ? `${knowledge}\n` : ""}用户需求：
${input}
`.trim();
}
