import ts from "typescript";

export type IsolatedTypecheckResult = {
  passed: boolean;
  diagnostics: string[];
};

/**
 * Prove that invalid TypeScript is blocked by the typecheck gate without
 * importing the snippet into the production compile graph.
 */
export function typecheckIsolatedSnippet(
  sourceText: string,
  fileName = "invalid-article.ts",
): IsolatedTypecheckResult {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
  };

  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => {
    if (name === fileName || name.endsWith(`/${fileName}`)) {
      return ts.createSourceFile(
        fileName,
        sourceText,
        languageVersion,
        true,
        ts.ScriptKind.TS,
      );
    }

    return originalGetSourceFile(name, languageVersion, onError, shouldCreate);
  };

  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (name) =>
    name === fileName || name.endsWith(`/${fileName}`) || originalFileExists(name);

  const originalReadFile = host.readFile.bind(host);
  host.readFile = (name) =>
    name === fileName || name.endsWith(`/${fileName}`)
      ? sourceText
      : originalReadFile(name);

  const program = ts.createProgram([fileName], options, host);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];

  return {
    passed: diagnostics.length === 0,
    diagnostics: diagnostics.map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    ),
  };
}
