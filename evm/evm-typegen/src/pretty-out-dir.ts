import { FileOutput, OutDir } from "@subsquid/util-internal-code-printer";
import * as prettier from "prettier";
import fs from "fs";
import path from "path";

export class PrettyOutDir extends OutDir {
  file(name: string): PrettyFileOutput {
    return new PrettyFileOutput(this.path(name));
  }
}

export class PrettyFileOutput extends FileOutput {
  constructor(public readonly file: string) {
    super(file);
  }

  async write() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(
      this.file,
      await prettier.format(this.toString(), { parser: "typescript" }),
    );
  }
}
