// @ts-check
// 'use module'

// 构建脚本：批量生成多尺寸头像
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [32, 48, 64, 96, 128];

// 定义多个头像目录
const avatarDirs = [
  path.join(__dirname, '../public/avatar'),      // 原有目录
  path.join(__dirname, '../web/public/avatar'),  // 新增web目录
];

const force = process.argv.includes('--force');

// 检查目录是否存在，并收集所有需要处理的文件
const allTasks = [];
for (const srcDir of avatarDirs) {
  if (!fs.existsSync(srcDir)) {
    console.log(chalk.yellow(`Warning: Directory not found: ${srcDir}`));
    continue;
  }
  
  const files = fs.readdirSync(srcDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !/-\d+\.png$/.test(f));
  
  for (const file of files) {
    const base = file.replace(/\.(png|jpg|jpeg)$/i, '');
    for (const size of sizes) {
      allTasks.push({
        srcDir,
        file,
        base,
        size,
        source: path.join(srcDir, file),
        target: path.join(srcDir, `${base}-${size}.png`)
      });
    }
  }
}

if (allTasks.length === 0) {
  console.log(chalk.red('No avatar files found in any directory!'));
  process.exit(1);
}

const spinner = ora({
  text: chalk.cyan(`Generating avatar images from ${avatarDirs.length} directories...`),
  spinner: 'dots',
}).start();

let generatedCount = 0;
let skippedCount = 0;

// 处理所有收集到的任务
const processAllTasks = async () => {
  for (const task of allTasks) {
    if (!force && fs.existsSync(task.target)) {
      skippedCount++;
      spinner.text = chalk.gray(`Skip: ${task.base}-${task.size}.png (exists)`);
      continue;
    }
    
    spinner.text = chalk.yellow(`Processing: ${task.base} -> ${task.base}-${task.size}.png`);
    
    try {
      await sharp(task.source)
        .resize(task.size, task.size)
        .toFile(task.target);
      
      generatedCount++;
      spinner.text = chalk.green(`Generated: ${task.base}-${task.size}.png`);
    } catch (e) {
      spinner.fail(chalk.red(`Error: ${task.base}-${task.size}.png`));
      console.error(e);
    }
  }
};

// 异步处理所有任务
processAllTasks().then(() => {
  spinner.succeed(chalk.green(`Avatar images done! New: ${generatedCount}, Skipped: ${skippedCount}, Force: ${force}`));
  console.log(chalk.blue('Processed directories:'), avatarDirs);
  console.log(chalk.blue('Total tasks:'), allTasks.length);
  console.log(chalk.magenta('Sizes:'), sizes);
});
