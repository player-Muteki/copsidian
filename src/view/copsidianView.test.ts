// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { CopsidianView } from './copsidianView';
import { setLocale } from '../i18n/index';
import { installObsidianDomHelpers } from '../test/domHelpers';
import type CopsidianPlugin from '../main';

installObsidianDomHelpers();

describe('CopsidianView inline edit preview', () => {
  it('renders changed lines and applies edited text to the active editor selection', () => {
    setLocale('en');
    const view = createView();
    const editor = createEditor();
    setPendingInlineEdit(view, 'old line', editor);

    view.showInlineEditDiff('old line', 'new line');

    expect(texts(view, '.diff-line.removed')).toEqual(['-old line']);
    expect(texts(view, '.diff-line.added')).toEqual(['+new line']);

    click(view, '.copsidian-inline-edit-actions .mod-cta');

    expect(editor.replaceSelection).toHaveBeenCalledWith('new line');
    expect(view.contentEl.querySelector('.copsidian-inline-edit-panel')).toBeNull();
  });

  it('discards preview without replacing selected text', () => {
    setLocale('en');
    const view = createView();
    const editor = createEditor();
    setPendingInlineEdit(view, 'original', editor);

    view.showInlineEditDiff('original', 'edited');
    click(view, '.copsidian-inline-edit-actions button:not(.mod-cta)');

    expect(editor.replaceSelection).not.toHaveBeenCalled();
    expect(view.contentEl.querySelector('.copsidian-inline-edit-panel')).toBeNull();
  });

  it('refreshes inline edit labels when the locale changes', () => {
    setLocale('en');
    const view = createView();
    setPendingInlineEdit(view, 'old', createEditor());

    view.showInlineEditDiff('old', 'new');
    expect(text(view, '.copsidian-inline-edit-title')).toBe('AI Edit Preview');
    expect(text(view, '.mod-cta')).toBe('Apply');

    setLocale('zh');
    view.refreshLocale();

    expect(text(view, '.copsidian-inline-edit-title')).toBe('AI 编辑预览');
    expect(text(view, '.mod-cta')).toBe('应用');
    expect(text(view, '.copsidian-inline-edit-actions button:not(.mod-cta)')).toBe('放弃');
  });
});

describe('CopsidianView runtime session sync', () => {
  it('loads restored sessions with configured MCP servers', async () => {
    const mcpServers = [
      { id: 'fs', enabled: true, name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
    ];
    const client = {
      getCurrentSessionId: vi.fn(() => 'other-session'),
      loadSession: vi.fn().mockResolvedValue(undefined),
    };
    const view = createView({
      app: { vault: { adapter: { getBasePath: () => '/vault' } } },
      settings: { maxNoteSize: 8000, syncRules: [], mcpServers },
      getClient: () => client,
    } as unknown as CopsidianPlugin);

    await Reflect.get(view, 'syncRuntimeSession').call(view, 'restored-session');

    expect(client.loadSession).toHaveBeenCalledWith('restored-session', '/vault', mcpServers);
  });
});

function createView(plugin = createPlugin()): CopsidianView {
  return new CopsidianView({} as never, plugin);
}

function createPlugin(): CopsidianPlugin {
  return {
    app: { vault: {} },
    settings: { maxNoteSize: 8000, syncRules: [] },
    getClient: () => null,
  } as unknown as CopsidianPlugin;
}

function createEditor(): { replaceSelection: ReturnType<typeof vi.fn> } {
  return { replaceSelection: vi.fn() };
}

function setPendingInlineEdit(
  view: CopsidianView,
  original: string,
  editor: { replaceSelection: ReturnType<typeof vi.fn> },
): void {
  Reflect.set(view, 'pendingInlineEdit', { original, editor });
}

function click(view: CopsidianView, selector: string): void {
  const button = view.contentEl.querySelector(selector) as HTMLButtonElement | null;
  expect(button).not.toBeNull();
  button?.click();
}

function text(view: CopsidianView, selector: string): string | null | undefined {
  return view.contentEl.querySelector(selector)?.textContent;
}

function texts(view: CopsidianView, selector: string): string[] {
  return [...view.contentEl.querySelectorAll(selector)].map((el) => el.textContent ?? '');
}
