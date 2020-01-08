const merge = require('webpack-merge')

module.exports = function (config) {
  config = merge.smart(config, {
    module: {
      rules: [{
          test: /\.jsx?$/,
          include: /node_modules/,
          use: ['react-hot-loader/webpack']
        },
        {
          test: /\.css$/i,
          include: /node_modules/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: ['ts-loader']
        },
        {
          test: /\.json$/,
          exclude: /node_modules/,
          loader: 'json-loader'
        }
      ]
    }
  })

  return config
}