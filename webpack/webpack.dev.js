const path = require('path');
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common");
const Dotenv = require('dotenv-webpack');

const devConfig = {
    mode: "development",
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'bundle.dev.js'
    },
    plugins: [
        new Dotenv({
            path: path.resolve(__dirname, '..', './.env.development'),
        })
    ],
    devtool: 'eval-source-map',
};

module.exports = merge(commonConfig, devConfig);