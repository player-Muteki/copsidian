import { t, onLocaleChange } from '../i18n/index';

export interface ToolbarCallbacks {
  onAgentChange?: (agent: string) => void;
  onModelChange?: (model: string) => void;
  onEffortChange?: (effort: string) => void;
  onSend?: () => void;
  onStop?: () => void;
}

export class InputToolbar {
  private agentSelect: HTMLSelectElement;
  private effortSelect: HTMLSelectElement;
  private sendBtn: HTMLButtonElement;
  private sendingEl: HTMLSpanElement;
  private sending = false;

  // Custom model selector
  private modelSelectorEl: HTMLDivElement;
  private modelBtnEl: HTMLDivElement;
  private modelLabelEl: HTMLSpanElement;
  private modelDropdownEl: HTMLDivElement;
  private modelOptions: Array<{ value: string; label: string }> = [];
  private currentModel: string | undefined;

  constructor(container: HTMLDivElement, private callbacks: ToolbarCallbacks) {
    container.addClass('copsidian-toolbar');
    onLocaleChange(() => this.refreshLocale());

    // Custom model selector (hover dropdown)
    this.modelSelectorEl = container.createDiv({ cls: 'copsidian-model-selector' });
    this.modelBtnEl = this.modelSelectorEl.createDiv({ cls: 'copsidian-model-btn' });
    this.modelLabelEl = this.modelBtnEl.createSpan({ cls: 'copsidian-model-label' });
    this.modelLabelEl.setText(t().toolbar.noModels);
    this.modelDropdownEl = this.modelSelectorEl.createDiv({ cls: 'copsidian-model-dropdown' });

    this.agentSelect = container.createEl('select', { cls: 'copsidian-dropdown tb-select tb-agent' });
    this.agentSelect.title = t().toolbar.agentTitle;
    this.agentSelect.onchange = () => this.callbacks.onAgentChange?.(this.agentSelect.value);

    this.effortSelect = container.createEl('select', { cls: 'copsidian-dropdown tb-select tb-effort' });
    this.effortSelect.title = t().toolbar.effortTitle;
    this.effortSelect.onchange = () => this.callbacks.onEffortChange?.(this.effortSelect.value);

    this.sendingEl = container.createSpan({ cls: 'copsidian-toolbar-sending' });
    this.sendingEl.style.display = 'none';

    this.sendBtn = container.createEl('button', { text: t().toolbar.send, cls: 'copsidian-send-btn' });
    this.sendBtn.onclick = () => this.handleSendClick();
  }

  private handleSendClick(): void {
    if (this.sendBtn.classList.contains('mod-stop')) {
      this.callbacks.onStop?.();
    } else {
      this.callbacks.onSend?.();
    }
  }

  updateAgents(options: Array<{ value: string; label: string }>, current?: string): void {
    this.agentSelect.empty();
    if (options.length === 0) {
      this.agentSelect.createEl('option', { text: '—', value: '' });
    } else {
      for (const o of options) this.agentSelect.createEl('option', { text: o.label, value: o.value });
      if (current) this.agentSelect.value = current;
    }
  }

  updateModels(options: Array<{ value: string; label: string }>, current?: string): void {
    this.modelOptions = [...options];
    this.currentModel = current;
    this.renderModelDropdown();

    // Update button label
    if (options.length === 0) {
      this.modelLabelEl.setText(t().toolbar.noModels);
    } else {
      const selected = options.find(o => o.value === current);
      this.modelLabelEl.setText(selected?.label ?? options[0].label);
    }
  }

  private renderModelDropdown(): void {
    this.modelDropdownEl.empty();
    const options = this.modelOptions;

    if (options.length === 0) {
      const emptyEl = this.modelDropdownEl.createDiv({ cls: 'copsidian-model-option empty' });
      emptyEl.setText(t().toolbar.noModels);
      return;
    }

    // Group by provider (split on first '/')
    const groups = new Map<string, Array<{ value: string; label: string }>>();
    for (const opt of options) {
      const parts = opt.value.split('/');
      const group = parts.length > 1 ? parts[0] : '';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(opt);
    }

    for (const [group, groupOptions] of groups) {
      if (group && groups.size > 1) {
        const separator = this.modelDropdownEl.createDiv({ cls: 'copsidian-model-group' });
        separator.setText(group);
      }
      for (const opt of groupOptions) {
        const optionEl = this.modelDropdownEl.createDiv({ cls: 'copsidian-model-option' });
        if (opt.value === this.currentModel) {
          optionEl.addClass('selected');
        }
        optionEl.setText(opt.label);
        optionEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.callbacks.onModelChange?.(opt.value);
          this.modelLabelEl.setText(opt.label);
          this.renderModelDropdown();
        });
      }
    }
  }

  updateEffort(options: Array<{ value: string; label: string }>, current?: string): void {
    this.effortSelect.empty();
    for (const o of options) this.effortSelect.createEl('option', { text: o.label, value: o.value });
    if (current) this.effortSelect.value = current;
  }

  setSending(on: boolean): void {
    this.sending = on;
    this.sendingEl.style.display = on ? '' : 'none';
    this.sendBtn.textContent = on ? t().toolbar.stop : t().toolbar.send;
    this.sendBtn.classList.toggle('mod-stop', on);
    this.sendBtn.disabled = false;
  }

  refreshLocale(): void {
    this.modelLabelEl.setText(
      this.currentModel
        ? (this.modelOptions.find(o => o.value === this.currentModel)?.label ?? t().toolbar.noModels)
        : t().toolbar.noModels
    );
    this.agentSelect.title = t().toolbar.agentTitle;
    this.effortSelect.title = t().toolbar.effortTitle;
    this.renderModelDropdown();
    this.updateEffort([
      { value: 'default', label: t().toolbar.effort.default },
      { value: 'low', label: t().toolbar.effort.low },
      { value: 'medium', label: t().toolbar.effort.medium },
      { value: 'high', label: t().toolbar.effort.high },
    ], this.effortSelect.value);
    this.setSending(this.sending);
  }
}
