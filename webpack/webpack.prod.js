const path = require('path');
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common");
const Dotenv = require('dotenv-webpack');

const prodConfig = {
    mode: "production",
    output: {
        path: path.resolve(__dirname, '../build'),
        filename: 'bundle.prod.js'
    },
    plugins: [
        new Dotenv({
            path: path.resolve(__dirname, '..', './.env.production'),
        })
    ],
    devtool: 'source-map'
};

module.exports = merge(commonConfig, prodConfig);