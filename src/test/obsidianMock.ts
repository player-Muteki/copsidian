export const MarkdownRenderer = {
  renderMarkdown: async (_markdown: string, el: HTMLElement): Promise<void> => {
    el.textContent = _markdown;
  },
};

export class Component {}
