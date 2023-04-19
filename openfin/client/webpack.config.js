const path = require('path');

const configs = [
  {
    entry: './client/src/provider.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: { fin: 'fin' },
    output: {
      filename: 'provider.bundle.js',
      library: {
        type: 'module',
      },
      path: path.resolve(__dirname, '..', '..', 'public', 'openfin-build'),
    },
    experiments: {
      outputModule: true,
    },
  },
  {
    entry: './client/src/shell.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: { fin: 'fin' },
    output: {
      filename: 'shell.bundle.js',
      library: {
        type: 'module',
      },
      path: path.resolve(__dirname, '..', '..', 'public', 'openfin-build'),
    },
    experiments: {
      outputModule: true,
    },
  },
  {
    entry: './client/src/modules/auth/login/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: { fin: 'fin' },
    output: {
      filename: 'login.bundle.js',
      library: {
        type: 'module',
      },
      path: path.resolve(__dirname, '..', '..', 'public', 'openfin-build', 'modules', 'auth'),
    },
    experiments: {
      outputModule: true,
    },
  },
  {
    entry: './client/src/modules/integrations/workspaces/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: { fin: 'fin' },
    output: {
      filename: 'workspaces.bundle.js',
      library: {
        type: 'module',
      },
      path: path.resolve(__dirname, '..', '..', 'public', 'openfin-build', 'modules', 'integrations'),
    },
    experiments: {
      outputModule: true,
    },
  },
  {
    entry: './client/src/modules/integrations/pages/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    externals: { fin: 'fin' },
    output: {
      filename: 'pages.bundle.js',
      library: {
        type: 'module',
      },
      path: path.resolve(__dirname, '..', '..', 'public', 'openfin-build', 'modules', 'integrations'),
    },
    experiments: {
      outputModule: true,
    },
  },
];

module.exports = process.env.WEBPACK_CONFIG_INDEX !== undefined ? configs[process.env.WEBPACK_CONFIG_INDEX] : configs;
