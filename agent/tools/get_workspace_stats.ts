import { defineTool } from "eve/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export default defineTool({
  description: "Retrieve structural statistics of a workspace directory, including file counts, total size, and package details.",
  inputSchema: z.object({
    directoryPath: z.string().default("."),
  }),
  async execute({ directoryPath }) {
    const targetPath = path.resolve(directoryPath);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Directory does not exist: ${targetPath}`);
    }

    let fileCount = 0;
    let dirCount = 0;
    let totalSize = 0;
    let packageName = "unknown";
    let version = "unknown";

    const packageJsonPath = path.join(targetPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        packageName = pkg.name || packageName;
        version = pkg.version || version;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    function traverse(current: string, depth = 0) {
      if (depth > 5) return; // Prevent too deep traversal
      try {
        const stats = fs.statSync(current);
        if (stats.isDirectory()) {
          dirCount++;
          const files = fs.readdirSync(current);
          for (const file of files) {
            if (file === "node_modules" || file === ".git" || file === "target") continue;
            traverse(path.join(current, file), depth + 1);
          }
        } else if (stats.isFile()) {
          fileCount++;
          totalSize += stats.size;
        }
      } catch (err) {
        // Skip inaccessible files
      }
    }

    traverse(targetPath);

    return {
      resolvedPath: targetPath,
      packageName,
      version,
      fileCount,
      dirCount,
      totalBytes: totalSize,
      totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    };
  },
});
