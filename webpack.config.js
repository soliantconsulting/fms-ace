const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        'Common': 'app/Common.js'
    },
    resolve: {
        modules: [
            '.',
            'es6',
            'node_modules',
        ],
    },
    output: {
        path: path.resolve(__dirname, 'public/dist/'),
        filename: '[name].bundle.js',
        publicPath: '/dist/',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    plugins: ['transform-runtime'],
                    presets: ['es2015'],
                },
            },
            {
                test: /\.html$/,
                loader: ['html-loader'],
            },
            {
                test: /\.mp3$/,
                loader: ['file-loader'],
            },
            {
                test: /\.jpg$/,
                loader: ['file-loader'],
            },
            {
                test: /\.css$/,
                loader: ['style-loader', 'css-loader'],
            },
            {
                test: /\.png$/,
                loader: 'url-loader?limit=100000',
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    limit: 10000,
                },
            },
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            moment: 'moment',
        }),
    ]
};
