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
const srcDir = path.join(__dirname, '../public/avatar');
const files = fs.readdirSync(srcDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !/-\d+\.png$/.test(f));
const force = process.argv.includes('--force');

const spinner = ora({
  text: chalk.cyan('Generating avatar images...'),
  spinner: 'dots',
}).start();

let generatedCount = 0;
let skippedCount = 0;

for (const file of files) {
  const base = file.replace(/\.(png|jpg|jpeg)$/i, '');
  for (const size of sizes) {
    const target = path.join(srcDir, `${base}-${size}.png`);
    if (!force && fs.existsSync(target)) {
      skippedCount++;
      spinner.text = chalk.gray(`Skip: ${base}-${size}.png (exists)`);
      continue;
    }
    spinner.text = chalk.yellow(`Processing: ${base} -> ${base}-${size}.png`);
    sharp(path.join(srcDir, file))
      .resize(size, size)
      .toFile(target)
      .then(() => {
        generatedCount++;
        spinner.text = chalk.green(`Generated: ${base}-${size}.png`);
      })
      .catch(e => {
        spinner.fail(chalk.red(`Error: ${base}-${size}.png`));
        console.error(e);
      });
  }
}

setTimeout(() => {
  spinner.succeed(chalk.green(`Avatar images done! New: ${generatedCount}, Skipped: ${skippedCount}, Force: ${force}`));
  console.log(chalk.blue('Files:'), files, chalk.magenta('Sizes:'), sizes);
}, 800);
