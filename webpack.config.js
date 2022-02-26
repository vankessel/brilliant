const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    static: true,
    watchFiles: ['src/**/*', 'public/**/*'],
  },
  plugins: [
    new webpack.ProvidePlugin({
      p5: 'p5',
    })
  ],
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
        test: /\.(jpg|png)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
      {
        test: /\.(otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]'
        }
      },
      {
        test: /\.(ogg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'sounds/[hash][ext][query]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/', // The leading slash is important!
  },
};
