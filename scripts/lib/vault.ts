/** Vault Library */
import { readdirSync, statSync, renameSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

export class Vault {
  constructor(private basePath: string) {}

  readFolder(folder: string): Array<{filename: string; metadata: any}> {
    try {
      const fullPath = join(this.basePath, folder);
      if (!existsSync(fullPath)) return [];
      const files = readdirSync(fullPath);
      return files.filter(f => f.endsWith('.md')).map(filename => {
        const stats = statSync(join(fullPath, filename));
        return { filename, metadata: { created: stats.birthtime?.toISOString() }};
      });
    } catch { return []; }
  }

  createNote(folder: string, title: string, content: string): string {
    const fullFolder = join(this.basePath, folder);
    if (!existsSync(fullFolder)) {
      mkdirSync(fullFolder, { recursive: true });
    }
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}-${safeTitle}.md`;
    const filepath = join(fullFolder, filename);
    writeFileSync(filepath, content);
    return filepath;
  }

  moveNote(filename: string, fromFolder: string, toFolder: string): void {
    const fromPath = join(this.basePath, fromFolder, filename);
    const toPath = join(this.basePath, toFolder, filename);
    if (!existsSync(dirname(toPath))) {
      mkdirSync(dirname(toPath), { recursive: true });
    }
    renameSync(fromPath, toPath);
  }
}
export default Vault;
