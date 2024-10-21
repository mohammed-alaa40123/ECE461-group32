const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production', // or 'development'
  entry: './index.ts',
  target: 'node', // Ensure it targets Node.js environment
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /rating/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, ''),
    libraryTarget: 'commonjs2',
  },
  externals: [
    nodeExternals(),
  ],
};
