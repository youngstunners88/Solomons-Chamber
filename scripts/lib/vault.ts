/** Vault Library */
import { readdirSync, statSync, renameSync } from "fs";
import { join } from "path";

export class Vault {
  constructor(private basePath: string) {}

  readFolder(folder: string): Array<{filename: string; metadata: any}> {
    try {
      const files = readdirSync(join(this.basePath, folder));
      return files.filter(f => f.endsWith('.md')).map(filename => {
        const stats = statSync(join(this.basePath, folder, filename));
        return { filename, metadata: { created: stats.birthtime?.toISOString() }};
      });
    } catch { return []; }
  }

  moveNote(filename: string, fromFolder: string, toFolder: string): void {
    renameSync(join(this.basePath, fromFolder, filename), join(this.basePath, toFolder, filename));
  }
}
export default Vault;
