const env = require('./env');

const processEnv = env.get();

const { argv } = require('yargs');
const { createLauncher, proc } = require('process-launch');
const { logger } = require('jege/server');
const path = require('path');

const log = logger('[dock-defenders]');

const outputPath = path.resolve(__dirname, '../output');

const processDefinitions = {
  'audio:merge_and_divide': proc(
    'sh',
    [
      './launch.sh',
      ...argv._,
    ],
    {
      cwd: `./packages/sound-synthesizer`,
      stdio: 'inherit',
    },
  ),
  'audio:spectrogram': proc(
    'python3',
    [
      './app.py',
      outputPath,
    ],
    {
      cwd: './packages/spectrogram-creator',
      stdio: 'inherit',
    },
  ),
  websiteDev: proc(
    'node',
    [
      './scripts/launch.js',
      ...argv._,
    ],
    {
      cwd: `./packages/website`,
      env: {
        NODE_ENV: 'development',
        ...processEnv,
      },
      stdio: 'inherit',
    },
  ),
  websiteEject: proc(
    'node',
    [
      './scripts/launch.js',
      ...argv._,
    ],
    {
      cwd: `./packages/website`,
      env: {
        NODE_ENV: 'production',
        ...processEnv,
      },
      stdio: 'inherit',
    },
  ),
};

const processGroupDefinitions = {
  default: ['websiteDev'],
};

function launcher() {
  try {
    log('launcher(): argv: %j', argv);

    const Launcher = createLauncher({
      processDefinitions,
      processGroupDefinitions,
    });

    if (argv.operation === undefined) {
      Launcher.run({
        process: argv.process,
        processGroup: argv.processGroup,
      });
    } else {
      Launcher.runInSequence({
        order: [
          'audio:merge_and_divide',
          'audio:spectrogram',
        ],
      });
    }
  } catch (err) {
    log('launcher(): Error reading file', err);
  }
}

module.exports = launcher;

if (require.main === module) {
  launcher();
}
