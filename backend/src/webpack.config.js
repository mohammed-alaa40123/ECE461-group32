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
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        loader: 'babel-loader',
        test: /\.js$|jsx/,
        exclude: /node_modules/
    }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js','.html'],
  },
};
