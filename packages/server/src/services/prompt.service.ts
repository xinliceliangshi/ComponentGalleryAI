export function buildPrompt(input: string) {
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
  - code 必须完整
  - 不要 markdown
  
  用户需求：
  ${input}
  `.trim();
  }