const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    static: true,
    watchFiles: ['src/**/*', 'public/**/*'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: [
          path.resolve(__dirname, 'src')
        ],
      },
      {
        test: /\.(jpg|png)/,
        use: 'file-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.png'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/', // The leading slash is important!
  },
};
