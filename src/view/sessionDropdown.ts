import type { SessionStore } from '../chat/session';
import { t } from '../i18n/index';
import type { AgentCapabilities } from '../types';

export interface SessionDropdownCallbacks {
	onSwitch(sessionId: string): Promise<void>;
	onDelete(sessionId: string): Promise<void>;
	onNewSession(): Promise<void>;
}

export class SessionDropdown {
	private dropdownEl: HTMLDivElement | null = null;
	private outsideHandler: ((e: MouseEvent) => void) | null = null;

	constructor(
		private container: HTMLElement,
		private anchorEl: HTMLElement,
		private sessionStore: SessionStore,
		private getCurrentSessionId: () => string | null,
		private callbacks: SessionDropdownCallbacks,
		private getCapabilities: () => AgentCapabilities | null,
	) {}

	open(): void {
		if (this.dropdownEl) {
			this.close();
			return;
		}

		const list = this.sessionStore.list();
		const caps = this.getCapabilities();
		const canList = caps?.sessionCapabilities?.list !== false;

		const dd = this.container.createDiv({ cls: 'copsidian-session-list' });

		const rect = this.anchorEl.getBoundingClientRect();
		dd.style.position = 'fixed';
		dd.style.top = `${rect.bottom + 4}px`;
		dd.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;

		let searchInput: HTMLInputElement | null = null;
		if (canList) {
			searchInput = dd.createEl('input', {
				cls: 'copsidian-session-search',
				attr: { placeholder: t().session.search, type: 'text' },
			});
		}

		const itemsContainer = dd.createDiv({ cls: 'copsidian-session-items' });
		const currentId = this.getCurrentSessionId();

		const renderItems = (filter: string) => {
			itemsContainer.empty();
			let filtered = filter
				? list.filter(s => s.title?.toLowerCase().includes(filter.toLowerCase()))
				: list;

			if (!canList) {
				filtered = currentId ? list.filter(s => s.sessionId === currentId) : [];
			}

			if (filtered.length === 0) {
				itemsContainer.createDiv({
					cls: 'copsidian-session-empty',
					text: t().session.empty,
				});
				return;
			}

			for (const s of filtered) {
				const it = itemsContainer.createDiv({
					cls: `copsidian-session-item${s.sessionId === currentId ? ' active' : ''}`,
				});
				it.createSpan({ text: s.title || s.sessionId, cls: 'session-label' });

				const controls = it.createSpan({ cls: 'session-controls' });

				const forkBtn = controls.createSpan({ text: '⎇', cls: 'session-action session-fork' });
				if (caps?.sessionCapabilities?.fork === false || caps?.sessionCapabilities?.fork === undefined) {
					forkBtn.classList.add('disabled');
					forkBtn.title = t().sessionDropdown.forkDisabled;
				} else {
					forkBtn.onclick = (e) => e.stopPropagation();
				}

				const resumeBtn = controls.createSpan({ text: '▶', cls: 'session-action session-resume' });
				if (caps?.sessionCapabilities?.resume === false || caps?.sessionCapabilities?.resume === undefined) {
					resumeBtn.classList.add('disabled');
					resumeBtn.title = t().sessionDropdown.resumeDisabled;
				} else {
					resumeBtn.onclick = (e) => e.stopPropagation();
				}

				const delBtn = controls.createSpan({ text: '×', cls: 'session-action session-delete' });
				if (caps?.sessionCapabilities?.close === false || caps?.sessionCapabilities?.close === undefined) {
					delBtn.classList.add('disabled');
					delBtn.title = t().sessionDropdown.closeDisabled;
				} else {
					delBtn.onclick = async (e: MouseEvent) => {
						e.stopPropagation();
						this.sessionStore.remove(s.sessionId);
						await this.sessionStore.save();
						if (s.sessionId === currentId) {
							await this.callbacks.onNewSession();
						}
						this.close();
					};
				}

				it.onclick = async () => {
					await this.callbacks.onSwitch(s.sessionId);
				};
			}
		};

		if (searchInput) {
			searchInput.addEventListener('input', () => {
				renderItems(searchInput!.value);
			});
		}

		renderItems('');

		this.dropdownEl = dd;
		this.outsideHandler = (evt: MouseEvent) => {
			if (!this.dropdownEl) return;
			const target = evt.target as Node;
			if (this.dropdownEl.contains(target) || this.anchorEl.contains(target)) return;
			this.close();
		};
		document.addEventListener('mousedown', this.outsideHandler, true);
	}

	close(): void {
		if (this.dropdownEl) {
			this.dropdownEl.remove();
			this.dropdownEl = null;
		}
		if (this.outsideHandler) {
			document.removeEventListener('mousedown', this.outsideHandler, true);
			this.outsideHandler = null;
		}
	}

	isOpen(): boolean {
		return this.dropdownEl !== null;
	}

	destroy(): void {
		this.close();
	}
}
