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
        use: ['ts-loader','html-loader'],
        exclude: [/node_modules/],
      },
      // Add more rules here for other file types (e.g., CSS, images) if needed
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
