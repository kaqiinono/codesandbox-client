const webpack = require('webpack');
const merge = require('webpack-merge');
// const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const commonConfig = require('./webpack.common');
const save = require('./utils');

const devEntries = ['webpack-dev-server/client?/'];

const APP_HOT = Boolean(process.env.APP_HOT);

const config = merge(
  {
    entry: {
      app: APP_HOT
        ? [
            'webpack-dev-server/client?http://localhost:3000',
            'webpack-hot-middleware/client',
          ]
        : devEntries,
      ...(APP_HOT ? {} : { embed: devEntries }),
    },
  },
  commonConfig,
  {
    devtool: false,
    mode: 'development',
    output: {
      filename: 'static/js/[name].js',
      pathinfo: true,
    },
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
    plugins: [
      new WebpackBar(),
      new webpack.EvalSourceMapDevToolPlugin({
        include: /src\/app/,
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
  }
);
save(config, true);
module.exports = config;
