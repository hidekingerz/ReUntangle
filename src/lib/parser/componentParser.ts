import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import * as t from '@babel/types';
import type { ComponentInfo, ImportInfo, FileInfo, HookUsage, PropsInfo, PropProperty } from '@/types';

/**
 * Parse a file and extract component information
 */
export class ComponentParser {
  /**
   * Parse a single file and extract all components
   */
  parseFile(fileInfo: FileInfo): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    try {
      const ast = this.parseCode(fileInfo.content, fileInfo.extension);
      const imports = this.extractImports(ast);
      const componentData = this.extractComponents(ast);

      for (const data of componentData) {
        const hooks = this.extractHooks(data.body);
        const customHookCalls = this.extractCustomHookCalls(data.body);
        const propsInfo = this.extractPropsInfo(ast, data.name, fileInfo.extension);
        const linesOfCode = this.calculateLinesOfCode(data.body);
        const externalLibraryCount = this.countExternalLibraries(imports);

        // Combine import-based dependencies and custom hook calls
        const importDeps = this.extractDependencies(data.name, imports);
        const allDependencies = [...new Set([...importDeps, ...customHookCalls])];

        components.push({
          id: `${fileInfo.path}:${data.name}`,
          name: data.name,
          filePath: fileInfo.path,
          type: data.type,
          dependencies: allDependencies,
          imports,
          linesOfCode,
          hooks,
          propsCount: propsInfo?.properties.length || 0,
          propsInfo,
          complexity: this.calculateComplexity({
            linesOfCode,
            dependencyCount: allDependencies.length,
            hooksCount: hooks.reduce((sum, h) => sum + h.count, 0),
            propsCount: propsInfo?.properties.length || 0,
            externalLibraryCount,
          }),
        });
      }
    } catch (error) {
      console.warn(`Failed to parse ${fileInfo.path}:`, error);
    }

    return components;
  }

  /**
   * Parse code string into AST
   */
  private parseCode(code: string, extension: string): File {
    const plugins: ('jsx' | 'typescript')[] = ['jsx'];

    if (extension === '.tsx' || extension === '.ts') {
      plugins.push('typescript');
    }

    return parse(code, {
      sourceType: 'module',
      plugins,
    });
  }

  /**
   * Extract import statements from AST
   */
  private extractImports(ast: File): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const isReactImport = this.isReactImport.bind(this);

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const specifiers: string[] = [];

        for (const spec of path.node.specifiers) {
          if (spec.type === 'ImportDefaultSpecifier') {
            specifiers.push(spec.local.name);
          } else if (spec.type === 'ImportSpecifier') {
            specifiers.push(spec.local.name);
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            specifiers.push(`* as ${spec.local.name}`);
          }
        }

        imports.push({
          source,
          specifiers,
          isReactComponent: isReactImport(source, specifiers),
        });
      },
    });

    return imports;
  }

  /**
   * Check if an import is likely a React component
   */
  private isReactImport(source: string, specifiers: string[]): boolean {
    // Local imports (relative paths) are likely components
    if (source.startsWith('.') || source.startsWith('/')) {
      return true;
    }

    // Named imports with PascalCase are likely components
    return specifiers.some((spec) => {
      const name = spec.replace('* as ', '');
      return /^[A-Z]/.test(name);
    });
  }

  /**
   * Extract component definitions from AST
   */
  private extractComponents(
    ast: File
  ): Array<{ name: string; type: ComponentInfo['type']; body: unknown }> {
    const components: Array<{
      name: string;
      type: ComponentInfo['type'];
      body: unknown;
    }> = [];
    const isPotentialComponent = this.isPotentialComponent.bind(this);
    const isCustomHook = this.isCustomHook.bind(this);

    traverse(ast, {
      // Function declarations: function MyComponent() {} or function useMyHook() {}
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && isPotentialComponent(name)) {
          components.push({
            name,
            type: isCustomHook(name) ? 'hook' : 'function',
            body: path.node.body,
          });
        }
      },

      // Variable declarations with arrow functions or function expressions
      VariableDeclarator(path) {
        const name = path.node.id.type === 'Identifier' ? path.node.id.name : null;

        if (!name || !isPotentialComponent(name)) {
          return;
        }

        const isHook = isCustomHook(name);

        // Arrow function: const MyComponent = () => {} or const useMyHook = () => {}
        if (path.node.init?.type === 'ArrowFunctionExpression') {
          components.push({
            name,
            type: isHook ? 'hook' : 'arrow',
            body: path.node.init.body,
          });
        }

        // Function expression: const MyComponent = function() {} or const useMyHook = function() {}
        if (path.node.init?.type === 'FunctionExpression') {
          components.push({
            name,
            type: isHook ? 'hook' : 'function',
            body: path.node.init.body,
          });
        }
      },

      // Class components: class MyComponent extends React.Component {}
      ClassDeclaration(path) {
        const name = path.node.id?.name;
        if (name && isPotentialComponent(name)) {
          components.push({
            name,
            type: 'class',
            body: path.node.body,
          });
        }
      },
    });

    return components;
  }

  /**
   * Check if a name is potentially a React component (PascalCase) or custom hook (use*)
   */
  private isPotentialComponent(name: string): boolean {
    // React components: PascalCase (e.g., MyComponent)
    const isComponent = /^[A-Z][a-zA-Z0-9]*$/.test(name);
    // Custom hooks: start with 'use' followed by uppercase letter (e.g., useMyHook)
    const isCustomHook = /^use[A-Z][a-zA-Z0-9]*$/.test(name);
    return isComponent || isCustomHook;
  }

  /**
   * Check if a name is a custom hook (starts with 'use')
   */
  private isCustomHook(name: string): boolean {
    return /^use[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  /**
   * Extract component dependencies from imports
   */
  private extractDependencies(componentName: string, imports: ImportInfo[]): string[] {
    const dependencies: string[] = [];

    for (const imp of imports) {
      if (imp.isReactComponent) {
        dependencies.push(...imp.specifiers);
      }
    }

    return dependencies.filter((dep) => dep !== componentName);
  }

  /**
   * Extract custom hook calls from component body
   * This finds all calls to functions starting with 'use' (e.g., useMyHook())
   */
  private extractCustomHookCalls(body: unknown): string[] {
    const hookCalls = new Set<string>();

    if (!body || typeof body !== 'object') {
      return [];
    }

    // Create a minimal AST wrapper for traversal
    const fakeFile = {
      type: 'File' as const,
      program: {
        type: 'Program' as const,
        body: [body as t.Statement],
        directives: [],
        sourceType: 'module' as const,
        interpreter: null,
        sourceFile: '',
      },
      comments: null,
      tokens: null,
    };

    const isCustomHook = this.isCustomHook.bind(this);

    traverse(fakeFile, {
      CallExpression(path) {
        // Check if the callee is an identifier (direct function call)
        if (t.isIdentifier(path.node.callee)) {
          const hookName = path.node.callee.name;
          // Only include custom hooks (not built-in React hooks)
          if (isCustomHook(hookName)) {
            hookCalls.add(hookName);
          }
        }
      },
    });

    return Array.from(hookCalls);
  }

  /**
   * Extract React Hooks usage from component body
   */
  private extractHooks(body: unknown): HookUsage[] {
    const hookCounts = new Map<string, number>();

    if (!body || typeof body !== 'object') {
      return [];
    }

    // Common React hooks to detect
    const reactHooks = [
      'useState',
      'useEffect',
      'useContext',
      'useReducer',
      'useCallback',
      'useMemo',
      'useRef',
      'useImperativeHandle',
      'useLayoutEffect',
      'useDebugValue',
      'useTransition',
      'useDeferredValue',
      'useId',
    ];

    // Create a minimal AST wrapper for traversal
    const fakeFile = {
      type: 'File' as const,
      program: {
        type: 'Program' as const,
        body: [body as t.Statement],
        directives: [],
        sourceType: 'module' as const,
        interpreter: null,
        sourceFile: '',
      },
      comments: null,
      tokens: null,
    };

    traverse(fakeFile, {
      CallExpression(path) {
        if (t.isIdentifier(path.node.callee)) {
          const hookName = path.node.callee.name;
          // Detect React hooks and custom hooks (starting with 'use')
          if (reactHooks.includes(hookName) || /^use[A-Z]/.test(hookName)) {
            hookCounts.set(hookName, (hookCounts.get(hookName) || 0) + 1);
          }
        }
      },
    });

    return Array.from(hookCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }

  /**
   * Extract Props information from TypeScript interfaces/types
   */
  private extractPropsInfo(ast: File, componentName: string, extension: string): PropsInfo | undefined {
    if (extension !== '.tsx' && extension !== '.ts') {
      return undefined;
    }

    let propsInfo: PropsInfo | undefined;

    // Look for TypeScript interfaces or type aliases for props
    const propsTypeName = `${componentName}Props`;
    const getTypeAnnotation = this.getTypeAnnotation.bind(this);

    traverse(ast, {
      TSInterfaceDeclaration(path) {
        if (path.node.id.name === propsTypeName) {
          const properties: PropProperty[] = [];

          for (const prop of path.node.body.body) {
            if (t.isTSPropertySignature(prop) && t.isIdentifier(prop.key)) {
              properties.push({
                name: prop.key.name,
                type: getTypeAnnotation(prop.typeAnnotation),
                required: !prop.optional,
              });
            }
          }

          propsInfo = {
            name: propsTypeName,
            properties,
          };
        }
      },
      TSTypeAliasDeclaration(path) {
        if (path.node.id.name === propsTypeName && t.isTSTypeLiteral(path.node.typeAnnotation)) {
          const properties: PropProperty[] = [];

          for (const prop of path.node.typeAnnotation.members) {
            if (t.isTSPropertySignature(prop) && t.isIdentifier(prop.key)) {
              properties.push({
                name: prop.key.name,
                type: getTypeAnnotation(prop.typeAnnotation),
                required: !prop.optional,
              });
            }
          }

          propsInfo = {
            name: propsTypeName,
            properties,
          };
        }
      },
    });

    return propsInfo;
  }

  /**
   * Get type annotation as string
   */
  private getTypeAnnotation(typeAnnotation: t.TSTypeAnnotation | undefined | null): string {
    if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
      return 'unknown';
    }

    const type = typeAnnotation.typeAnnotation;

    if (t.isTSStringKeyword(type)) return 'string';
    if (t.isTSNumberKeyword(type)) return 'number';
    if (t.isTSBooleanKeyword(type)) return 'boolean';
    if (t.isTSAnyKeyword(type)) return 'any';
    if (t.isTSUnknownKeyword(type)) return 'unknown';
    if (t.isTSVoidKeyword(type)) return 'void';
    if (t.isTSNullKeyword(type)) return 'null';
    if (t.isTSUndefinedKeyword(type)) return 'undefined';
    if (t.isTSTypeReference(type) && t.isIdentifier(type.typeName)) {
      return type.typeName.name;
    }

    return 'complex';
  }

  /**
   * Calculate lines of code for component body
   */
  private calculateLinesOfCode(body: unknown): number {
    if (!body || typeof body !== 'object') {
      return 0;
    }

    // Get the source code representation and count lines
    const bodyStr = JSON.stringify(body);
    // This is approximate - ideally we'd use the actual source location
    return Math.max(1, Math.floor(bodyStr.length / 50));
  }

  /**
   * Count external library dependencies
   */
  private countExternalLibraries(imports: ImportInfo[]): number {
    const externalLibraries = new Set<string>();

    for (const imp of imports) {
      // External libraries don't start with . or /
      if (!imp.source.startsWith('.') && !imp.source.startsWith('/')) {
        // Ignore 'react' itself
        if (imp.source !== 'react' && imp.source !== 'react-dom') {
          externalLibraries.add(imp.source);
        }
      }
    }

    return externalLibraries.size;
  }

  /**
   * Calculate complexity score based on multiple factors
   * Algorithm from features.md:
   * - Lines of code (25%)
   * - Dependency count (20%)
   * - Hooks count (20%)
   * - Props count (15%)
   * - External library count (5%)
   * - Base complexity (15%) - conditionals, loops, etc.
   */
  private calculateComplexity(metrics: {
    linesOfCode: number;
    dependencyCount: number;
    hooksCount: number;
    propsCount: number;
    externalLibraryCount: number;
  }): number {
    // Normalize each metric to 0-100 scale
    const locScore = Math.min(100, (metrics.linesOfCode / 200) * 100); // 200 LOC = max
    const depScore = Math.min(100, (metrics.dependencyCount / 10) * 100); // 10 deps = max
    const hooksScore = Math.min(100, (metrics.hooksCount / 10) * 100); // 10 hooks = max
    const propsScore = Math.min(100, (metrics.propsCount / 15) * 100); // 15 props = max
    const libScore = Math.min(100, (metrics.externalLibraryCount / 5) * 100); // 5 libs = max

    // Weighted average according to features.md
    const complexity =
      locScore * 0.25 +
      depScore * 0.2 +
      hooksScore * 0.2 +
      propsScore * 0.15 +
      libScore * 0.05 +
      20 * 0.2; // Base complexity (20%)

    return Math.round(Math.min(100, complexity));
  }
}
