// 只依赖 engine/utils 的工具测试
import { markdownToHtml, renderJson, tryParseJson, prettifyObj } from '../utils/markdown';
import { describe, it, expect } from 'vitest';

describe('markdownToHtml', () => {
  it('能渲染基本 markdown', () => {
    expect(markdownToHtml('# hi')).toContain('<h1>hi</h1>');
  });
});

describe('renderJson', () => {
  it('能渲染 json 代码块', () => {
    expect(renderJson({ a: 1 })).toContain('"a": 1');
  });
});

describe('tryParseJson', () => {
  it('能解析 json 字符串', () => {
    expect(tryParseJson('{"a":1}')).toEqual({ a: 1 });
  });
  it('解析失败返回原字符串', () => {
    expect(tryParseJson('not-json')).toBe('not-json');
  });
});

describe('prettifyObj', () => {
  it('能美化 json', () => {
    expect(prettifyObj({ a: 1 })).toBe(`{
  "a": 1
}`);
  });
});
