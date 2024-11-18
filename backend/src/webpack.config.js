const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
require('dotenv').config(); // Load environment variables from .env file
const excludeTests = (modulePath) => {
  return /node_modules/.test(modulePath) || /rating[\\/]__tests__/.test(modulePath);
};
module.exports = {
  mode: 'production', // or 'development'
  entry: './index.ts',
  target: 'node', // Ensure it targets Node.js environment
  externals: [nodeExternals()], // To exclude node_modules from the bundle
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, ''),
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: excludeTests,
      },
      {
        test: /\.html$/,
        use: 'html-loader',
        exclude: excludeTests,
      },
      {
        test: /\.js$|\.jsx$/,
        use: 'babel-loader',
        exclude: excludeTests,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.html'],
    
  },
  plugins: [
    // // Define environment variables to expose to the client-side bundle
    // new webpack.DefinePlugin({
    //   'process.env.RDS_HOST': JSON.stringify(process.env.RDS_HOST),
    //   'process.env.RDS_USER': JSON.stringify(process.env.RDS_USER),
    //   'process.env.RDS_PASSWORD': JSON.stringify(process.env.RDS_PASSWORD),
    //   'process.env.RDS_DATABASE': JSON.stringify(process.env.RDS_DATABASE),
    //   'process.env.RDS_PORT': JSON.stringify(process.env.RDS_PORT),
    //   'process.env.GITHUB_TOKEN': JSON.stringify(process.env.GITHUB_TOKEN),
    // }),
  ],
};
