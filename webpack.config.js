const path = require('path');

module.exports = {
  entry: './client/src/extension.ts', // Path to your extension's entry point
  target: 'node', // Specify the environment (node or web)
  output: {
    filename: 'extension.js', // Output filename
    path: path.resolve(__dirname, 'out'), // Output directory
  },
  resolve: {
    extensions: ['.ts', '.js'], // File extensions to resolve
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader', // Use ts-loader for TypeScript files
      },
    ],
  },
  externals: {
	vscode: 'commonjs vscode'
  }
};