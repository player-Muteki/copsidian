import type { SyncRule } from '../types';

export interface SyncContext {
  toolCallId: string;
  toolName: string;
  toolStatus: string;
  rawInput?: Record<string, unknown>;
  rawOutput?: Record<string, unknown>;
  content?: string;
}

export function ruleMatches(rule: SyncRule, ctx: SyncContext): boolean {
  if (!rule.enabled) return false;
  if (rule.toolName !== '*' && rule.toolName !== ctx.toolName) return false;
  if (rule.pathPattern && ctx.rawInput) {
    const fp = typeof ctx.rawInput.filePath === 'string' ? ctx.rawInput.filePath : undefined;
    if (fp && !globLikeMatch(rule.pathPattern, fp)) return false;
  }
  return true;
}

function globLikeMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
  return regex.test(value);
}

export function buildSyncNote(ctx: SyncContext, folder: string, filenameTemplate: string, template?: string): { path: string; content: string } {
  const now = new Date().toISOString();
  const shortId = Math.random().toString(36).slice(2, 8);
  const path = (filenameTemplate
    .replace(/\{\{tool\}\}/g, ctx.toolName)
    .replace(/\{\{date\}\}/g, now.slice(0, 10))
    .replace(/\{\{shortId\}\}/g, shortId));
  const fm = ['---', `tool: ${ctx.toolName}`, `timestamp: ${now}`, `status: ${ctx.toolStatus}`, '---'].join('\n');
  const body = template ?? `## ${ctx.toolName}\n\n${getSyncBody(ctx)}`;
  return { path: `${folder}/${path}`, content: fm + '\n\n' + body };
}

function getSyncBody(ctx: SyncContext): string {
  if (ctx.content) return ctx.content;

  const output = ctx.rawOutput?.output;
  if (typeof output === 'string') return output;
  if (output !== undefined) return JSON.stringify(output, null, 2);

  return '(no output)';
}
