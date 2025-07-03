/**
 * 测试头像批处理脚本
 * 验证多目录处理功能
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义要检查的目录
const avatarDirs = [
  path.join(__dirname, '../public/avatar'),
  path.join(__dirname, '../web/public/avatar'),
];

const sizes = [32, 48, 64, 96, 128];

console.log(chalk.cyan('=== Avatar Batch Processing Test ===\n'));

// 检查目录状态
avatarDirs.forEach((dir, index) => {
  console.log(chalk.blue(`Directory ${index + 1}: ${dir}`));
  
  if (!fs.existsSync(dir)) {
    console.log(chalk.yellow('  Status: Does not exist'));
    return;
  }
  
  const files = fs.readdirSync(dir);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !/-\d+\.png$/.test(f));
  const generatedFiles = files.filter(f => /-\d+\.png$/.test(f));
  
  console.log(chalk.green(`  Status: Exists`));
  console.log(`  Source images: ${imageFiles.length}`);
  console.log(`  Generated images: ${generatedFiles.length}`);
  
  if (imageFiles.length > 0) {
    console.log(`  Source files: ${imageFiles.join(', ')}`);
  }
  
  if (generatedFiles.length > 0) {
    console.log(`  Generated files: ${generatedFiles.slice(0, 10).join(', ')}${generatedFiles.length > 10 ? '...' : ''}`);
  }
  
  console.log();
});

// 计算期望的任务数量
let expectedTasks = 0;
avatarDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const imageFiles = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !/-\d+\.png$/.test(f));
    expectedTasks += imageFiles.length * sizes.length;
  }
});

console.log(chalk.magenta(`Expected tasks: ${expectedTasks} (${expectedTasks / sizes.length} source images × ${sizes.length} sizes)`));

// 提供运行建议
console.log(chalk.cyan('\nTo run the avatar batch processing:'));
console.log(chalk.white('  node scripts/generate-avatars.js          # Generate missing only'));
console.log(chalk.white('  node scripts/generate-avatars.js --force  # Regenerate all'));
