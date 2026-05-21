import { PluginSettingTab, Setting, Notice } from 'obsidian';
import { existsSync } from 'fs';
import { delimiter, isAbsolute } from 'path';
import CopsidianPlugin from './main';
import { VIEW_TYPE } from './types';
import type { McpServerConfig, PermissionLevel, SyncRule } from './types';
import { setLocale, t as locale } from './i18n/index';

interface AutoScrollView {
  setAutoScrollEnabled?: (enabled: boolean) => void;
}

interface LocaleAwareView {
  refreshLocale?: () => void;
}

export class CopsidianSettingsTab extends PluginSettingTab {
  constructor(private plugin: CopsidianPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const labels = locale().settings;

    // ── Connection ──
    new Setting(containerEl).setName(labels.connection).setHeading();

    new Setting(containerEl)
      .setName(labels.opencodePath.name)
      .setDesc(labels.opencodePath.desc)
      .addText((t) => t.setValue(s.opencodePath)
        .onChange(async (v) => {
          const trimmed = v.trim();
          if (this.validateOpencodePath(trimmed)) {
            s.opencodePath = trimmed;
            await this.save();
          }
        }));

    new Setting(containerEl)
      .setName(labels.reconnect.name)
      .setDesc(labels.reconnect.desc)
      .addButton((b) => b.setButtonText(labels.reconnect.button).setCta()
        .onClick(async () => {
          const connected = await this.plugin.initClient();
          new Notice(connected ? locale().settings.reconnect.success : locale().settings.reconnect.failed);
        }));

    new Setting(containerEl)
      .setName(labels.autostart.name)
      .setDesc(labels.autostart.desc)
      .addToggle((t) => t.setValue(s.autoConnect ?? true)
        .onChange(async (v) => { s.autoConnect = v; await this.save(); }));

    // ── Agent ──
    new Setting(containerEl).setName(labels.agent).setHeading();

    new Setting(containerEl)
      .setName(labels.defaultAgent)
      .addDropdown((d) => d.addOptions({ build: 'build', plan: 'plan', docs: 'docs' })
        .setValue(s.defaultAgent)
        .onChange(async (v) => { s.defaultAgent = v; await this.save(); }));

    new Setting(containerEl)
      .setName(labels.permissionMode.name)
      .setDesc(labels.permissionMode.desc)
      .addDropdown((d) => d.addOptions({
        yolo: labels.permissionMode.yolo,
        plan: labels.permissionMode.plan,
        safe: labels.permissionMode.safe,
      })
        .setValue(s.permissionMode)
        .onChange(async (v) => {
          s.permissionMode = v as PermissionLevel;
          await this.save();
          if (this.plugin.client) this.plugin.client.permissionMode = v;
        }));

    // ── System Prompt ──
    new Setting(containerEl).setName(labels.systemPrompt.heading).setHeading();

    new Setting(containerEl)
      .setName(labels.systemPrompt.name)
      .setDesc(labels.systemPrompt.desc)
      .addTextArea((c) => {
        c.setPlaceholder(labels.systemPrompt.placeholder);
        c.inputEl.rows = 6;
        c.inputEl.classList.add('copsidian-prompt-input');
        c.onChange(async (v) => {
          s.systemPrompt = v;
          await this.save();
        });
      });

    // ── Notes & Context ──
    new Setting(containerEl).setName(labels.notes.heading).setHeading();

    new Setting(containerEl)
      .setName(labels.notes.defaultSyncFolder)
      .setDesc(labels.notes.defaultSyncFolderDesc)
      .addText((t) => t.setValue(s.defaultNoteFolder)
        .onChange(async (v) => { s.defaultNoteFolder = v; await this.save(); }));

    new Setting(containerEl)
      .setName(labels.notes.maxNoteSize)
      .setDesc(labels.notes.maxNoteSizeDesc)
      .addText((t) => t.setValue(String(s.maxNoteSize))
        .setPlaceholder('8000')
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) { s.maxNoteSize = n; await this.save(); new Notice(locale().settings.notes.saved); }
        }));

    // ── MCP Servers ──
    new Setting(containerEl).setName(labels.mcp.heading).setHeading();

    for (const server of s.mcpServers) {
      this.addMcpServerBlock(containerEl, server);
    }

    new Setting(containerEl)
      .setName('')
      .addButton((b) => b.setButtonText(labels.mcp.add)
        .onClick(async () => {
          const server: McpServerConfig = {
            id: Date.now().toString(),
            enabled: true,
            name: 'filesystem',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
          };
          s.mcpServers.push(server);
          await this.save();
          this.display();
        }));

    // ── Sync Rules ──
    new Setting(containerEl).setName(labels.sync.heading).setHeading();

    for (const rule of s.syncRules) {
      this.addSyncRuleBlock(containerEl, rule);
    }

    new Setting(containerEl)
      .setName('')
      .addButton((b) => b.setButtonText(labels.sync.add)
        .onClick(async () => {
          const rule: SyncRule = {
            id: Date.now().toString(),
            enabled: true,
            toolName: 'edit',
            folder: s.defaultNoteFolder,
            filenameTemplate: '{{tool}}-{{date}}-{{shortId}}',
          };
          s.syncRules.push(rule);
          await this.save();
          this.display();
        }));

    // ── Appearance ──
    new Setting(containerEl).setName(labels.appearance.heading).setHeading();

    new Setting(containerEl)
      .setName(labels.appearance.language)
      .setDesc(labels.appearance.languageDesc)
      .addDropdown((d) => d.addOptions({ en: 'English', zh: '中文' })
        .setValue(s.language)
        .onChange(async (v) => {
          s.language = v;
          setLocale(v);
          await this.save();
          this.refreshOpenViewsLocale();
          this.display();
        }));

    new Setting(containerEl)
      .setName(labels.appearance.autoScroll)
      .setDesc(labels.appearance.autoScrollDesc)
      .addToggle((t) => t.setValue(s.autoScrollEnabled ?? true)
        .onChange(async (v) => {
          s.autoScrollEnabled = v;
          await this.save();
          const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
          for (const leaf of leaves) {
            const view = leaf.view as AutoScrollView;
            if (typeof view?.setAutoScrollEnabled === 'function') {
              view.setAutoScrollEnabled(v);
            }
          }
        }));

    // ── Session Limits ──
    new Setting(containerEl).setName(labels.sessionLimits.heading).setHeading();

    new Setting(containerEl)
      .setName(labels.sessionLimits.maxMessages)
      .setDesc(labels.sessionLimits.maxMessagesDesc)
      .addText((t) => t.setValue(String(s.maxSessionMessages ?? 200))
        .setPlaceholder('200')
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) {
            s.maxSessionMessages = n;
            await this.save();
          }
        }));

    new Setting(containerEl)
      .setName(labels.sessionLimits.retentionDays)
      .setDesc(labels.sessionLimits.retentionDaysDesc)
      .addText((t) => t.setValue(String(s.sessionRetentionDays ?? 30))
        .setPlaceholder('30')
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) {
            s.sessionRetentionDays = n;
            await this.save();
          }
        }));
  }

  private addSyncRuleBlock(containerEl: HTMLElement, rule: SyncRule): void {
    const labels = locale().settings.sync;
    const block = containerEl.createDiv({ cls: 'copsidian-sync-rule' });
    block.createEl('strong', { text: labels.label.replace('{tool}', rule.toolName) });

    new Setting(block)
      .setName(labels.tool)
      .addDropdown((d) => d.addOptions({
        read: 'read',
        edit: 'edit',
        write: 'write',
        execute: 'execute',
        fetch: 'fetch',
        search: 'search',
        other: 'other',
        all: '*',
      })
        .setValue(rule.toolName)
        .onChange(async (v) => { rule.toolName = v; await this.save(); }));

    new Setting(block)
      .setName(labels.folder)
      .addText((t) => t.setValue(rule.folder)
        .onChange(async (v) => { rule.folder = v; await this.save(); }));

    new Setting(block)
      .setName(labels.filenameTemplate)
      .setDesc(labels.filenameTemplateDesc)
      .addText((t) => t.setValue(rule.filenameTemplate)
        .onChange(async (v) => { rule.filenameTemplate = v; await this.save(); }));

    const delBtn = block.createEl('button', { text: labels.delete, cls: 'mod-warning' });
    delBtn.onclick = async () => {
      this.plugin.settings.syncRules = this.plugin.settings.syncRules.filter((r: SyncRule) => r.id !== rule.id);
      await this.save();
      this.display();
    };
  }

  private addMcpServerBlock(containerEl: HTMLElement, server: McpServerConfig): void {
    const labels = locale().settings.mcp;
    const block = containerEl.createDiv({ cls: 'copsidian-mcp-server' });
    block.createEl('strong', { text: labels.label.replace('{name}', server.name || labels.unnamed) });

    new Setting(block)
      .setName(labels.enabled)
      .addToggle((toggle) => toggle.setValue(server.enabled)
        .onChange(async (value) => { server.enabled = value; await this.save(); }));

    new Setting(block)
      .setName(labels.name)
      .setDesc(labels.nameDesc)
      .addText((text) => text.setValue(server.name)
        .onChange(async (value) => { server.name = value.trim(); await this.save(); }));

    new Setting(block)
      .setName(labels.command)
      .setDesc(labels.commandDesc)
      .addText((text) => text.setValue(server.command)
        .onChange(async (value) => { server.command = value.trim(); await this.save(); }));

    new Setting(block)
      .setName(labels.args)
      .setDesc(labels.argsDesc)
      .addTextArea((text) => {
        text.setValue(server.args.join('\n'));
        text.inputEl.rows = 4;
        text.inputEl.classList.add('copsidian-mcp-args');
        text.onChange(async (value) => {
          server.args = value.split('\n').map((arg) => arg.trim()).filter(Boolean);
          await this.save();
        });
      });

    const delBtn = block.createEl('button', { text: locale().settings.sync.delete, cls: 'mod-warning' });
    delBtn.onclick = async () => {
      this.plugin.settings.mcpServers = this.plugin.settings.mcpServers.filter((item) => item.id !== server.id);
      await this.save();
      this.display();
    };
  }

  private async save(): Promise<void> {
    await this.plugin.savePluginData();
  }

  private refreshOpenViewsLocale(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as LocaleAwareView;
      view.refreshLocale?.();
    }
  }

  private validateOpencodePath(path: string): boolean {
    if (!path) return false;
    if (isAbsolute(path) || path.includes('/') || path.includes('\\')) {
      if (existsSync(path)) return true;
      new Notice(locale().settings.opencodePath.notFound.replace('{path}', path));
      return false;
    }

    const executableNames = process.platform === 'win32' ? [path, `${path}.cmd`, `${path}.exe`] : [path];
    const found = (process.env.PATH ?? '')
      .split(delimiter)
      .some((dir) => executableNames.some((name) => existsSync(`${dir}/${name}`)));

    if (!found) new Notice(locale().settings.opencodePath.notFound.replace('{path}', path));
    return found;
  }
}
