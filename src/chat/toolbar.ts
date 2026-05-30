import { t, onLocaleChange } from '../i18n/index';

export interface UsageInfo {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  thoughtTokens?: number;
  contextWindow?: number;
  contextTokens?: number;
  percentage?: number;
}

export interface ToolbarCallbacks {
  onAgentChange?: (agent: string) => void;
  onModelChange?: (model: string) => void;
  onEffortChange?: (effort: string) => void;
  onPermissionChange?: (mode: string) => void;
  onSend?: () => void;
  onStop?: () => void;
}

export class InputToolbar {
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

  // Mode segmented buttons
  private modeGroupEl: HTMLDivElement;
  private modeOptions: Array<{ value: string; label: string }> = [];
  private currentMode: string | undefined;

  // Custom effort selector
  private effortSelectorEl: HTMLDivElement;
  private effortBtnEl: HTMLDivElement;
  private effortLabelEl: HTMLSpanElement;
  private effortDropdownEl: HTMLDivElement;
  private effortOptions: Array<{ value: string; label: string }> = [];
  private currentEffort: string | undefined;

  // Permission toggle
  private permToggleEl: HTMLDivElement;
  private permLabelEl: HTMLSpanElement;
  private permSwitchEl: HTMLDivElement;
  private currentPermission: string = 'safe';

  // Context arc meter
  private meterEl: HTMLDivElement;
  private meterArcFill: SVGCircleElement;
  private meterPctEl: HTMLSpanElement;

  constructor(container: HTMLDivElement, private callbacks: ToolbarCallbacks) {
    container.addClass('copsidian-toolbar');
    onLocaleChange(() => this.refreshLocale());

    // ── Top row: model selector + mode buttons ──
    const topRow = container.createDiv({ cls: 'copsidian-toolbar-row copsidian-toolbar-top' });

    // Custom model selector (hover dropdown)
    this.modelSelectorEl = topRow.createDiv({ cls: 'copsidian-model-selector' });
    this.modelBtnEl = this.modelSelectorEl.createDiv({ cls: 'copsidian-model-btn' });
    this.modelLabelEl = this.modelBtnEl.createSpan({ cls: 'copsidian-model-label' });
    this.modelLabelEl.setText(t().toolbar.noModels);
    this.modelDropdownEl = this.modelSelectorEl.createDiv({ cls: 'copsidian-model-dropdown' });

    // Mode segmented buttons
    this.modeGroupEl = topRow.createDiv({ cls: 'copsidian-mode-group' });

    // ── Bottom row: effort + flask + permission + sending + send ──
    const bottomRow = container.createDiv({ cls: 'copsidian-toolbar-row copsidian-toolbar-bottom' });

    // Custom effort selector (hover dropdown)
    this.effortSelectorEl = bottomRow.createDiv({ cls: 'copsidian-effort-selector' });
    this.effortBtnEl = this.effortSelectorEl.createDiv({ cls: 'copsidian-effort-btn' });
    this.effortLabelEl = this.effortBtnEl.createSpan({ cls: 'copsidian-effort-label' });
    this.effortLabelEl.setText('—');
    this.effortDropdownEl = this.effortSelectorEl.createDiv({ cls: 'copsidian-effort-dropdown' });

    // Context arc meter (semicircle gauge)
    this.meterEl = bottomRow.createDiv({ cls: 'copsidian-arc-meter' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 40 24');
    svg.setAttribute('class', 'copsidian-arc-svg');
    const R = 18;
    const C = 20;
    const ARC_LEN = Math.PI * R;
    // Background track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    track.setAttribute('d', `M ${C - R} ${C} A ${R} ${R} 0 0 1 ${C + R} ${C}`);
    track.setAttribute('class', 'copsidian-arc-track');
    svg.appendChild(track);
    // Fill arc
    this.meterArcFill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.meterArcFill.setAttribute('cx', String(C));
    this.meterArcFill.setAttribute('cy', String(C));
    this.meterArcFill.setAttribute('r', String(R));
    this.meterArcFill.setAttribute('class', 'copsidian-arc-fill');
    this.meterArcFill.setAttribute('stroke-dasharray', `0 ${ARC_LEN}`);
    svg.appendChild(this.meterArcFill);
    this.meterEl.appendChild(svg);
    this.meterPctEl = this.meterEl.createSpan({ cls: 'copsidian-arc-pct' });
    this.meterPctEl.setText('—');
    this.meterEl.addClass('empty');

    // Permission toggle
    this.permToggleEl = bottomRow.createDiv({ cls: 'copsidian-perm-toggle' });
    this.permLabelEl = this.permToggleEl.createSpan({ cls: 'copsidian-perm-label' });
    this.permSwitchEl = this.permToggleEl.createDiv({ cls: 'copsidian-perm-switch' });
    this.permToggleEl.addEventListener('click', () => this.cyclePermission());

    // Sending indicator
    this.sendingEl = bottomRow.createSpan({ cls: 'copsidian-toolbar-sending' });
    this.sendingEl.style.display = 'none';

    // Send/Stop button
    this.sendBtn = bottomRow.createEl('button', { text: t().toolbar.send, cls: 'copsidian-send-btn' });
    this.sendBtn.onclick = () => this.handleSendClick();

    this.updatePermissionDisplay();
  }

  private handleSendClick(): void {
    if (this.sendBtn.classList.contains('mod-stop')) {
      this.callbacks.onStop?.();
    } else {
      this.callbacks.onSend?.();
    }
  }

  // ── Mode (Agent) segmented buttons ──

  updateAgents(options: Array<{ value: string; label: string }>, current?: string): void {
    this.modeOptions = [...options];
    this.currentMode = current;
    this.renderModeButtons();
  }

  private renderModeButtons(): void {
    this.modeGroupEl.empty();
    if (this.modeOptions.length === 0) return;

    for (const opt of this.modeOptions) {
      const btn = this.modeGroupEl.createDiv({ cls: 'copsidian-mode-btn' });
      btn.setText(opt.label);
      if (opt.value === this.currentMode) {
        btn.addClass('active');
      }
      btn.addEventListener('click', () => {
        this.callbacks.onAgentChange?.(opt.value);
        this.currentMode = opt.value;
        this.renderModeButtons();
      });
    }
  }

  // ── Model custom dropdown ──

  updateModels(options: Array<{ value: string; label: string }>, current?: string): void {
    this.modelOptions = [...options];
    this.currentModel = current;
    this.renderModelDropdown();

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

    // Group by provider
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

  // ── Effort custom dropdown ──

  updateEffort(options: Array<{ value: string; label: string }>, current?: string): void {
    this.effortOptions = [...options];
    this.currentEffort = current;
    this.renderEffortDropdown();

    if (current) {
      const selected = options.find(o => o.value === current);
      this.effortLabelEl.setText(selected?.label ?? options[0]?.label ?? '—');
    } else if (options.length > 0) {
      this.effortLabelEl.setText(options[0].label);
    }
  }

  private renderEffortDropdown(): void {
    this.effortDropdownEl.empty();
    const options = this.effortOptions;

    if (options.length === 0) {
      const emptyEl = this.effortDropdownEl.createDiv({ cls: 'copsidian-effort-option empty' });
      emptyEl.setText('—');
      return;
    }

    for (const opt of options) {
      const optionEl = this.effortDropdownEl.createDiv({ cls: 'copsidian-effort-option' });
      if (opt.value === this.currentEffort) {
        optionEl.addClass('selected');
      }
      optionEl.setText(opt.label);
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onEffortChange?.(opt.value);
        this.currentEffort = opt.value;
        this.effortLabelEl.setText(opt.label);
        this.renderEffortDropdown();
      });
    }
  }

  // ── Context arc meter ──

  updateContextMeter(usage: UsageInfo | null): void {
    const R = 18;
    const ARC_LEN = Math.PI * R;

    if (!usage || (!usage.contextTokens && usage.totalTokens <= 0)) {
      this.meterEl.addClass('empty');
      this.meterEl.removeClass('warning', 'critical');
      this.meterPctEl.setText('—');
      this.meterArcFill.setAttribute('stroke-dasharray', `0 ${ARC_LEN}`);
      this.meterEl.removeAttribute('data-tooltip');
      return;
    }

    this.meterEl.removeClass('empty');

    // Use opencode's pre-calculated contextTokens if available, fallback to totalTokens
    const used = usage.contextTokens ?? usage.totalTokens ?? 0;
    const contextWindow = usage.contextWindow ?? 0;
    const pct = contextWindow > 0 ? Math.min(100, Math.round((used / contextWindow) * 100)) : 0;

    // Update arc fill
    const filled = (pct / 100) * ARC_LEN;
    this.meterArcFill.setAttribute('stroke-dasharray', `${filled} ${ARC_LEN}`);

    this.meterPctEl.setText(`${pct}%`);

    this.meterEl.removeClass('warning', 'critical');
    if (pct >= 90) {
      this.meterEl.addClass('critical');
    } else if (pct >= 75) {
      this.meterEl.addClass('warning');
    }

    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
    const tooltip = [
      `Context: ${fmt(used)} / ${fmt(contextWindow)} tokens`,
      `Input: ${fmt(usage.inputTokens)}`,
      usage.thoughtTokens ? `Thinking: ${fmt(usage.thoughtTokens)}` : '',
      `Output: ${fmt(usage.outputTokens)}`,
      pct >= 80 ? '⚠ Approaching limit — run /compact' : '',
    ].filter(Boolean).join('\n');
    this.meterEl.setAttribute('data-tooltip', tooltip);
  }

  // ── Permission toggle ──

  updatePermission(mode: string): void {
    this.currentPermission = mode;
    this.updatePermissionDisplay();
  }

  private cyclePermission(): void {
    const modes = ['safe', 'plan', 'yolo'];
    const idx = modes.indexOf(this.currentPermission);
    const next = modes[(idx + 1) % modes.length];
    this.currentPermission = next;
    this.updatePermissionDisplay();
    this.callbacks.onPermissionChange?.(next);
  }

  private updatePermissionDisplay(): void {
    const labels: Record<string, string> = {
      safe: '🔒 Safe',
      plan: '📋 Plan',
      yolo: '⚡ Yolo',
    };
    this.permLabelEl.setText(labels[this.currentPermission] ?? '🔒 Safe');
    this.permToggleEl.setAttribute('title', `Permission: ${this.currentPermission} (click to switch)`);

    // Visual state
    this.permSwitchEl.className = 'copsidian-perm-switch';
    this.permSwitchEl.addClass(`mod-${this.currentPermission}`);
  }

  // ── Sending state ──

  setSending(on: boolean): void {
    this.sending = on;
    this.sendingEl.style.display = on ? '' : 'none';
    this.sendBtn.textContent = on ? t().toolbar.stop : t().toolbar.send;
    this.sendBtn.classList.toggle('mod-stop', on);
    this.sendBtn.disabled = false;
  }

  // ── Locale refresh ──

  refreshLocale(): void {
    this.modelLabelEl.setText(
      this.currentModel
        ? (this.modelOptions.find(o => o.value === this.currentModel)?.label ?? t().toolbar.noModels)
        : t().toolbar.noModels
    );
    this.renderModelDropdown();
    this.renderModeButtons();
    this.updatePermissionDisplay();
    this.updateEffort([
      { value: 'default', label: t().toolbar.effort.default },
      { value: 'low', label: t().toolbar.effort.low },
      { value: 'medium', label: t().toolbar.effort.medium },
      { value: 'high', label: t().toolbar.effort.high },
    ], this.currentEffort);
    this.setSending(this.sending);
  }
}
