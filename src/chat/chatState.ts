import type { SerializedMessage, SessionConfigOption, AvailableCommand } from '../types';

export interface PendingToolCall {
	toolCallId: string;
	title: string;
	kind: string;
	status: string;
	parentEl: HTMLElement | null;
}

export interface ThinkingState {
	content: string;
	el: HTMLDivElement | null;
	collapsed: boolean;
}

export interface UsageInfo {
	totalTokens: number;
	inputTokens: number;
	outputTokens: number;
	thoughtTokens?: number;
	cost?: { amount: number; currency: string };
}

export class ChatState {
	// Session
	sessionId: string | null = null;
	isConnected = false;

	// Messages
	messages: SerializedMessage[] = [];

	// Streaming
	isStreaming = false;
	currentMessageId: string | null = null;
	currentTextEl: HTMLDivElement | null = null;
	currentTextContent = '';
	currentThinking: ThinkingState | null = null;
	pendingTools = new Map<string, PendingToolCall>();
	toolCallEls = new Map<string, HTMLDivElement>();
	planEl: HTMLDivElement | null = null;

	// Usage
	usage: UsageInfo | null = null;

	// Config (from ACP session)
	configOptions: SessionConfigOption[] = [];
	availableCommands: AvailableCommand[] = [];
	availableModels: Array<{ modelId: string; name: string }> = [];
	currentModelId: string | null = null;
	currentModeId: string | null = null;
	availableModes: Array<{ id: string; name: string; description?: string }> = [];

	// Auto-scroll
	autoScrollEnabled = true;

	// Attention
	needsAttention = false;

	// Error
	lastError: string | null = null;

	addMessage(msg: SerializedMessage): void {
		this.messages.push(msg);
	}

	resetStreamingState(): void {
		this.currentTextEl = null;
		this.currentTextContent = '';
		this.currentThinking = null;
		this.pendingTools.clear();
		this.isStreaming = false;
		this.currentMessageId = null;
	}

	clear(): void {
		this.messages = [];
		this.usage = null;
		this.configOptions = [];
		this.availableCommands = [];
		this.availableModels = [];
		this.currentModelId = null;
		this.currentModeId = null;
		this.availableModes = [];
		this.lastError = null;
		this.needsAttention = false;
		this.resetStreamingState();
		this.toolCallEls.clear();
		this.planEl = null;
	}
}
