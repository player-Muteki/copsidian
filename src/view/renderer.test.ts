// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { setLocale } from '../i18n/index';
import { ChatRenderer } from './renderer';
import { installObsidianDomHelpers } from '../test/domHelpers';

installObsidianDomHelpers();

describe('ChatRenderer locale refresh', () => {
  it('updates existing usage tooltip labels after locale switch', () => {
    setLocale('en');
    const container = document.createElement('div') as HTMLDivElement;
    document.body.appendChild(container);
    const renderer = new ChatRenderer(container, { vault: {} } as never, () => false);

    renderer.showUsage({
      modelId: 'provider/model-x',
      totalTokens: 30,
      inputTokens: 10,
      outputTokens: 15,
      thoughtTokens: 5,
    });

    const usage = container.querySelector('.copsidian-usage') as HTMLDivElement;
    expect(usage.title).toBe('Model: provider/model-x | Input: 10, Output: 15, Thinking: 5');

    setLocale('zh');
    renderer.refreshLocale();

    expect(usage.title).toBe('模型: provider/model-x | 输入: 10, 输出: 15, 思考: 5');
  });
});
