const merge = require('webpack-merge');

module.exports = function(config) {
  config = merge.smart(config, {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: /node_modules/,
          use: ['react-hot-loader/webpack']
        },
        {
          test: /\.css$/,
          fallback: ['style-loader'],
          use: ['css-loader']
        },
        {
          test: [/\.tsx?$/],
          exclude: /node_modules/,
          use: 'ts-loader'
        },
        {
          test: /\.html$/,
          use: {
            loader: 'file-loader',
            options: {
              attrs: [':data-src']
            }
          }
        },
        {
          test: /\.json$/,
          exclude: /node_modules/,
          loader: 'json-loader'
        }
      ]
    },
    output: {
      globalObject: 'this'
    }
  });

  return config;
};
