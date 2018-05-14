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
        publicPath: 'dist/',
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
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10000,
                            mimetype: 'application/font-woff'
                        }
                    }
                ]
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                use: [
                    {loader: 'file-loader'}
                ]
            }
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            moment: 'moment',
        }),
    ]
};
