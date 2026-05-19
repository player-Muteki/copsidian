export interface ToolbarCallbacks {
  onAgentChange?: (agent: string) => void;
  onModelChange?: (model: string) => void;
  onEffortChange?: (effort: string) => void;
}

export class InputToolbar {
  private agentSelect: HTMLSelectElement;
  private modelSelect: HTMLSelectElement;
  private effortSelect: HTMLSelectElement;
  private sendingEl: HTMLSpanElement;

  constructor(container: HTMLDivElement, private callbacks: ToolbarCallbacks) {
    container.addClass('copsidian-toolbar');

    this.modelSelect = container.createEl('select', { cls: 'copsidian-dropdown tb-select tb-model' });
    this.modelSelect.title = 'Model';
    this.modelSelect.onchange = () => this.callbacks.onModelChange?.(this.modelSelect.value);

    this.agentSelect = container.createEl('select', { cls: 'copsidian-dropdown tb-select tb-agent' });
    this.agentSelect.title = 'Agent mode';
    this.agentSelect.onchange = () => this.callbacks.onAgentChange?.(this.agentSelect.value);

    this.effortSelect = container.createEl('select', { cls: 'copsidian-dropdown tb-select tb-effort' });
    this.effortSelect.title = 'Thinking effort';
    this.effortSelect.onchange = () => this.callbacks.onEffortChange?.(this.effortSelect.value);

    this.sendingEl = container.createSpan({ cls: 'copsidian-toolbar-sending' });
    this.sendingEl.style.display = 'none';
  }

  updateAgents(options: Array<{ value: string; label: string }>, current?: string): void {
    this.agentSelect.empty();
    if (options.length === 0) {
      this.agentSelect.createEl('option', { text: '—', value: '' });
    } else {
      for (const o of options) {
        this.agentSelect.createEl('option', { text: o.label, value: o.value });
      }
      if (current) this.agentSelect.value = current;
    }
  }

  updateModels(options: Array<{ value: string; label: string }>, current?: string): void {
    this.modelSelect.empty();
    if (options.length === 0) {
      this.modelSelect.createEl('option', { text: 'No models', value: '' });
    } else {
      for (const o of options) {
        this.modelSelect.createEl('option', { text: o.label, value: o.value });
      }
      if (current) this.modelSelect.value = current;
    }
  }

  updateEffort(options: Array<{ value: string; label: string }>, current?: string): void {
    this.effortSelect.empty();
    for (const o of options) {
      this.effortSelect.createEl('option', { text: o.label, value: o.value });
    }
    if (current) this.effortSelect.value = current;
  }

  setSending(on: boolean): void {
    this.sendingEl.style.display = on ? '' : 'none';
  }
}
