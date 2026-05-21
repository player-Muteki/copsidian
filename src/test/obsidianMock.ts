export const MarkdownRenderer = {
  renderMarkdown: async (_markdown: string, el: HTMLElement): Promise<void> => {
    el.textContent = _markdown;
  },
};

export class Component {}

export class ItemView extends Component {
  contentEl: HTMLDivElement;

  constructor(public leaf: unknown) {
    super();
    this.contentEl = document.createElement('div');
  }

  getViewType(): string { return ''; }
  getDisplayText(): string { return ''; }
  getIcon(): string { return ''; }
  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}
}
