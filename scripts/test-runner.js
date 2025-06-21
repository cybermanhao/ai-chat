// 彩色可视化 test runner
import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';

const spinner = ora({ text: chalk.cyan('Running tests...'), spinner: 'dots' }).start();

try {
  const { stdout } = await execa('pnpm', ['test', '--', '--reporter=spec'], { stdio: 'pipe' });
  spinner.succeed(chalk.green('All tests finished!'));
  console.log(stdout);
} catch (e) {
  spinner.fail(chalk.red('Test failed!'));
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.error(e.stderr);
  else console.error(e);
}
