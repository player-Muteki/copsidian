import type { ContextRef } from '../types';

export interface InputCallbacks {
  onSend: (text: string, refs?: ContextRef[]) => void;
  onStop: () => void;
  onToggleMention: () => void;
  onToggleSlash: () => void;
  onAddRef: (ref: ContextRef) => void;
  onRemoveRef: (id: string) => void;
}

export class ChatInput {
  private textarea: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private disabled = false;
  private streaming = false;

  constructor(
    container: HTMLDivElement,
    private callbacks: InputCallbacks,
  ) {
    this.textarea = container.createEl('textarea', { placeholder: 'Type a message…' });
    this.textarea.rows = 1;
    this.textarea.addClass('copsidian-input');

    this.sendBtn = container.createEl('button', { text: 'Send', cls: 'copsidian-send-btn' });
    this.sendBtn.onclick = () => this.handleButtonClick();

    this.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.streaming) {
        e.preventDefault();
        this.callbacks.onStop();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
        return;
      }
      if (e.key === '@') {
        e.preventDefault();
        this.callbacks.onToggleMention();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        this.callbacks.onToggleSlash();
        return;
      }
    });

    this.autoResize();
  }

  private handleButtonClick(): void {
    if (this.streaming) {
      this.callbacks.onStop();
    } else {
      this.send();
    }
  }

  private send(): void {
    const text = this.textarea.value.trim();
    if (!text || this.disabled) return;
    this.callbacks.onSend(text, []);
    this.textarea.value = '';
    this.autoResize();
  }

  setStreaming(on: boolean): void {
    this.streaming = on;
    this.sendBtn.textContent = on ? 'Stop' : 'Send';
    this.sendBtn.classList.toggle('mod-stop', on);
    this.textarea.disabled = on;
    this.sendBtn.disabled = false;
  }

  setDisabled(on: boolean): void {
    this.disabled = on;
    this.textarea.disabled = on;
    this.sendBtn.disabled = on;
  }

  focus(): void { this.textarea.focus(); }

  appendValue(text: string): void {
    this.textarea.value += text;
    this.autoResize();
  }

  private autoResize(): void {
    const el = this.textarea;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }
}
