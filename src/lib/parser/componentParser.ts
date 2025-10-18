import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { File } from '@babel/types';
import type { ComponentInfo, ImportInfo, FileInfo } from '@/types';

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
        components.push({
          id: `${fileInfo.path}:${data.name}`,
          name: data.name,
          filePath: fileInfo.path,
          type: data.type,
          dependencies: this.extractDependencies(data.name, imports),
          imports,
          complexity: this.calculateComplexity(data.body),
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

    traverse(ast, {
      // Function declarations: function MyComponent() {}
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && isPotentialComponent(name)) {
          components.push({
            name,
            type: 'function',
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

        // Arrow function: const MyComponent = () => {}
        if (path.node.init?.type === 'ArrowFunctionExpression') {
          components.push({
            name,
            type: 'arrow',
            body: path.node.init.body,
          });
        }

        // Function expression: const MyComponent = function() {}
        if (path.node.init?.type === 'FunctionExpression') {
          components.push({
            name,
            type: 'function',
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
   * Check if a name is potentially a React component (PascalCase)
   */
  private isPotentialComponent(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
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
   * Calculate basic complexity score for a component
   */
  private calculateComplexity(body: unknown): number {
    let complexity = 1;

    // This is a simplified complexity calculation
    // In a real implementation, you'd traverse the AST and count:
    // - Conditional statements (if, switch, ternary)
    // - Loops (for, while, forEach)
    // - Logical operators (&&, ||)
    // - Function calls
    // etc.

    // For now, we'll use a placeholder
    if (body && typeof body === 'object') {
      complexity = Math.min(10, Math.floor(JSON.stringify(body).length / 500));
    }

    return complexity;
  }
}
