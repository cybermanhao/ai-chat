#!/usr/bin/env node

/**
 * MCP 工具创建脚本
 * 自动生成新工具的模板代码并更新注册文件
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 工具模板生成器
 */
class ToolGenerator {
  constructor(toolName, description, params) {
    this.toolName = toolName;
    this.description = description;
    this.params = params || [];
    this.className = this.toPascalCase(toolName);
    this.fileName = `${toolName}-tool.ts`;
  }

  /**
   * 转换为 PascalCase
   */
  toPascalCase(str) {
    return str.replace(/(?:^|-)(.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * 转换为 camelCase
   */
  toCamelCase(str) {
    return str.replace(/-(.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * 生成输入接口
   */
  generateInputInterface() {
    if (this.params.length === 0) {
      return `export interface ${this.className}ToolInput {
  // 添加你的参数定义
}`;
    }

    const paramLines = this.params.map(param => {
      const optional = param.optional ? '?' : '';
      return `  ${param.name}${optional}: ${param.type};`;
    }).join('\n');

    return `export interface ${this.className}ToolInput {
${paramLines}
}`;
  }

  /**
   * 生成 Schema 定义
   */
  generateSchema() {
    if (this.params.length === 0) {
      return `export const ${this.toCamelCase(this.toolName)}ToolSchema = {
  title: "${this.toolName}",
  description: "${this.description}",
  inputSchema: {
    // 定义你的输入参数 schema
  }
};`;
    }

    const schemaLines = this.params.map(param => {
      const zodType = this.getZodType(param.type);
      const optional = param.optional ? '.optional()' : '';
      const description = param.description ? `.describe("${param.description}")` : '';
      return `    ${param.name}: z.${zodType}${optional}${description}`;
    }).join(',\n');

    return `export const ${this.toCamelCase(this.toolName)}ToolSchema = {
  title: "${this.toolName}",
  description: "${this.description}",
  inputSchema: {
${schemaLines}
  }
};`;
  }

  /**
   * 获取对应的 Zod 类型
   */
  getZodType(jsType) {
    const typeMap = {
      'string': 'string()',
      'number': 'number()',
      'boolean': 'boolean()',
      'string[]': 'array(z.string())',
      'number[]': 'array(z.number())',
      'object': 'object({})',
      'any': 'any()'
    };
    return typeMap[jsType] || 'string()';
  }

  /**
   * 生成处理函数
   */
  generateHandler() {
    const paramDestructure = this.params.length > 0 
      ? `{ ${this.params.map(p => p.name).join(', ')} }`
      : 'input';

    return `export async function ${this.toCamelCase(this.toolName)}ToolHandler(${paramDestructure}: ${this.className}ToolInput) {
  try {
    console.log(\`[MCPServer] ${this.toolName} tool called, input:\`, ${paramDestructure});
    
    // TODO: 实现你的工具逻辑
    const result = {
      message: "工具执行成功",
      input: ${paramDestructure}
    };
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error(\`[MCPServer] ${this.toolName} tool error:\`, error);
    return {
      content: [
        { 
          type: "text" as const, 
          text: \`错误: \${error instanceof Error ? error.message : String(error)}\` 
        }
      ]
    };
  }
}`;
  }

  /**
   * 生成完整的工具文件内容
   */
  generateToolFile() {
    return `import { z } from "zod";

/**
 * ${this.description}
 */

/**
 * ${this.toolName} 工具的输入参数类型
 */
${this.generateInputInterface()}

/**
 * ${this.toolName} 工具的 Schema 定义
 */
${this.generateSchema()}

/**
 * ${this.toolName} 工具的实现函数
 */
${this.generateHandler()}
`;
  }

  /**
   * 生成导出语句
   */
  generateExports() {
    return `export {
  ${this.toCamelCase(this.toolName)}ToolSchema,
  ${this.toCamelCase(this.toolName)}ToolHandler,
  type ${this.className}ToolInput
} from "./${this.fileName.replace('.ts', '.js')}";`;
  }
}

/**
 * 更新工具索引文件
 */
async function updateToolIndex(generator) {
  const indexPath = path.join(__dirname, '../mcp-node/src/tools/index.ts');
  let content;
  
  try {
    content = await fs.readFile(indexPath, 'utf-8');
  } catch (error) {
    content = '// MCP 工具导出索引\n\n';
  }

  const newExport = generator.generateExports();
  
  if (!content.includes(newExport)) {
    content += '\n' + newExport + '\n';
    await fs.writeFile(indexPath, content);
    console.log(`✅ 已更新工具索引: ${indexPath}`);
  }
}

/**
 * 更新注册器文件
 */
async function updateRegistry(generator) {
  const registryPath = path.join(__dirname, '../mcp-node/src/registry.ts');
  let content = await fs.readFile(registryPath, 'utf-8');

  // 添加导入
  const importLine = `  ${generator.toCamelCase(generator.toolName)}ToolSchema,\n  ${generator.toCamelCase(generator.toolName)}ToolHandler,`;
  if (!content.includes(importLine)) {
    const importSection = content.match(/(import {\s*\n)([\s\S]*?)(\n} from "\.\/tools\/index\.js";)/);
    if (importSection) {
      const newImportSection = importSection[1] + importSection[2] + importLine + '\n' + importSection[3];
      content = content.replace(importSection[0], newImportSection);
    }
  }

  // 添加注册代码
  const registrationCode = `
    // 注册 ${generator.toolName} 工具
    serverInstance.registerTool(
      "${generator.toolName}",
      ${generator.toCamelCase(generator.toolName)}ToolSchema,
      ${generator.toCamelCase(generator.toolName)}ToolHandler
    );`;

  if (!content.includes(registrationCode.trim())) {
    // 在 registerTools 方法中添加注册代码
    const registerToolsMatch = content.match(/(private static async registerTools\([\s\S]*?{\s*\n)([\s\S]*?)(\n\s*console\.log\(\"\[MCPFunctionRegistry\])/);
    if (registerToolsMatch) {
      const newRegisterTools = registerToolsMatch[1] + registerToolsMatch[2] + registrationCode + '\n' + registerToolsMatch[3];
      content = content.replace(registerToolsMatch[0], newRegisterTools);
      
      // 更新日志消息
      const logMatch = content.match(/console\.log\("\[MCPFunctionRegistry\] 工具注册完成: ([^"]+)"\);/);
      if (logMatch) {
        const currentTools = logMatch[1];
        const newTools = currentTools + `, ${generator.toolName}`;
        content = content.replace(logMatch[0], `console.log("[MCPFunctionRegistry] 工具注册完成: ${newTools}");`);
      }
    }
  }

  await fs.writeFile(registryPath, content);
  console.log(`✅ 已更新注册器: ${registryPath}`);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🛠️  MCP 工具创建脚本
==================

用法:
  node scripts/create-tool.js <工具名> [选项]

选项:
  --description <描述>    工具功能描述
  --param <name:type:optional:description>  添加参数

示例:
  # 创建简单工具
  node scripts/create-tool.js hello-world --description "Hello World工具"

  # 创建带参数的工具
  node scripts/create-tool.js user-info \\
    --description "获取用户信息" \\
    --param "userId:string:false:用户ID" \\
    --param "includeDetails:boolean:true:是否包含详细信息"

参数类型支持: string, number, boolean, string[], number[], object, any
`);
    process.exit(1);
  }

  const toolName = args[0];
  let description = "新创建的工具";
  const params = [];

  // 解析命令行参数
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--description' && i + 1 < args.length) {
      description = args[i + 1];
      i++;
    } else if (args[i] === '--param' && i + 1 < args.length) {
      const paramStr = args[i + 1];
      const [name, type, optional, desc] = paramStr.split(':');
      params.push({
        name,
        type: type || 'string',
        optional: optional === 'true',
        description: desc || ''
      });
      i++;
    }
  }

  console.log(`🔧 创建工具: ${toolName}`);
  console.log(`📝 描述: ${description}`);
  if (params.length > 0) {
    console.log(`📋 参数:`);
    params.forEach(param => {
      const optionalStr = param.optional ? ' (可选)' : '';
      console.log(`   - ${param.name}: ${param.type}${optionalStr} - ${param.description}`);
    });
  }

  try {
    // 创建工具生成器
    const generator = new ToolGenerator(toolName, description, params);

    // 确保目录存在
    const toolsDir = path.join(__dirname, '../mcp-node/src/tools');
    await fs.mkdir(toolsDir, { recursive: true });

    // 生成工具文件
    const toolFilePath = path.join(toolsDir, generator.fileName);
    const toolContent = generator.generateToolFile();
    await fs.writeFile(toolFilePath, toolContent);
    console.log(`✅ 已创建工具文件: ${toolFilePath}`);

    // 更新索引文件
    await updateToolIndex(generator);

    // 更新注册器
    await updateRegistry(generator);

    console.log(`
🎉 工具创建成功！

接下来的步骤:
1. 编辑 ${toolFilePath} 实现具体逻辑
2. 运行 npm run build:mcp-node 编译代码
3. 运行 npm run start:mcp-node 启动服务器
4. 测试你的新工具

测试命令示例:
curl -X POST http://127.0.0.1:8000/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "${toolName}",
      "arguments": {}
    }
  }'
`);

  } catch (error) {
    console.error('❌ 创建工具失败:', error);
    process.exit(1);
  }
}

main().catch(console.error);
