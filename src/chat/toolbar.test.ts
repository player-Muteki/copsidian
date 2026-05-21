// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { setLocale } from '../i18n/index';
import { InputToolbar } from './toolbar';
import { installObsidianDomHelpers } from '../test/domHelpers';

installObsidianDomHelpers();

describe('InputToolbar locale refresh', () => {
  it('updates tooltips, empty model text, effort labels, and send state', () => {
    setLocale('en');
    const container = document.createElement('div') as HTMLDivElement;
    const toolbar = new InputToolbar(container, {});

    toolbar.updateModels([]);
    toolbar.setSending(true);

    expect(container.querySelector('.tb-model')?.getAttribute('title')).toBe('Model');
    expect(container.querySelector('.tb-model option')?.textContent).toBe('No models');
    expect(container.querySelector('.copsidian-send-btn')?.textContent).toBe('Stop');

    setLocale('zh');
    toolbar.refreshLocale();

    expect(container.querySelector('.tb-model')?.getAttribute('title')).toBe('模型');
    expect(container.querySelector('.tb-agent')?.getAttribute('title')).toBe('Agent 模式');
    expect(container.querySelector('.tb-effort')?.getAttribute('title')).toBe('思考强度');
    expect(container.querySelector('.tb-model option')?.textContent).toBe('无可用模型');
    expect(container.querySelector('.tb-effort option')?.textContent).toBe('默认');
    expect(container.querySelector('.copsidian-send-btn')?.textContent).toBe('停止');
  });
});
