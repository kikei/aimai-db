const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '..', 'server', 'static'),
    filename: 'dashboard.js'
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/react'],
              ['@babel/env', {
                "targets": { "ie": 11 },
                "useBuiltIns": "usage"
              }]
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties"
            ]
          }
        }]
    }]
  },
  devtool: "source-map",
}
