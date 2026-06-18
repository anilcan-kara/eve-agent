import { defineTool } from "eve/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

export default defineTool({
  description: "Check the workspace package.json dependencies and list declared engines and library counts.",
  inputSchema: z.object({
    directoryPath: z.string().default("."),
  }),
  async execute({ directoryPath }) {
    const targetPath = path.resolve(directoryPath);
    const packageJsonPath = path.join(targetPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return {
        hasPackageJson: false,
        message: "No package.json found in the target directory.",
      };
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const dependencies = pkg.dependencies || {};
      const devDependencies = pkg.devDependencies || {};
      const engines = pkg.engines || {};

      return {
        hasPackageJson: true,
        packageName: pkg.name || "unnamed",
        version: pkg.version || "0.0.0",
        dependencyCount: Object.keys(dependencies).length,
        devDependencyCount: Object.keys(devDependencies).length,
        dependenciesList: Object.keys(dependencies),
        devDependenciesList: Object.keys(devDependencies),
        engines,
      };
    } catch (e) {
      throw new Error(`Failed to parse package.json: ${(e as Error).message}`);
    }
  },
});
