const helpers = require('./helpers');
const webpackMerge = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HashedModuleIdsPlugin = require('webpack/lib/HashedModuleIdsPlugin')
const IgnorePlugin = require('webpack/lib/IgnorePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeJsPlugin = require('optimize-js-plugin');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 8080;
const AOT = process.env.BUILD_AOT || helpers.hasNpmFlag('aot');
const METADATA = {
  host: HOST,
  port: PORT,
  ENV: ENV,
  HMR: false,
  AOT: AOT
};

module.exports = function (env) {
  return webpackMerge(commonConfig({env: ENV}), {
    devtool: 'source-map',
    output: {
      path: helpers.root('dist'),
      filename: '[name].[chunkhash].bundle.js',
      sourceMapFilename: '[file].map',
      chunkFilename: '[name].[chunkhash].chunk.js'
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader'
          }),
          include: [helpers.root('src', 'styles')]
        },
        {
          test: /\.s[ca]ss$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader!sass-loader'
          }),
          include: [helpers.root('src', 'styles')]
        }
      ]
    },

    plugins: [
      new ModuleConcatenationPlugin(),
      new OptimizeJsPlugin({ //optimize a JavaScript file for faster initial load by wrapping eagerly-invoked functions.
        sourceMap: false
      }),
      new ExtractTextPlugin('[name].[contenthash].css'), //extract css from js
      new DefinePlugin({
        'ENV': JSON.stringify(METADATA.ENV),
        'HMR': METADATA.HMR,
        'AOT': METADATA.AOT,
        'process.env': {
            'ENV': JSON.stringify(METADATA.ENV),
            'NODE_ENV': JSON.stringify(METADATA.ENV),
            'HMR': METADATA.HMR
        }
      }),
      new UglifyJsPlugin({ //Minimize all JavaScript output of chunks. Loaders are switched into minimizing mode. To debug prod builds uncomment //debug lines and comment //prod lines
        parallel: true,
        uglifyOptions: {
          ie8: false, //Enable IE8 Support
          ecma: 6, //Supported ECMAScript Version (5, 6, 7 or 8). Affects parse, compress && output options
          warnings: true, //Display Warnings
          mangle: true, // debug false
          output: {
            comments: false,
            beautify: false,  // debug true
          }
        },
        warnings: true,
      }),
      new NormalModuleReplacementPlugin( //Replace resources that matches resourceRegExp with newResource
        /(angular2|@angularclass)((\\|\/)|-)hmr/,
        helpers.root('config/empty.js')
      ),
      new NormalModuleReplacementPlugin(
        /zone\.js(\\|\/)dist(\\|\/)long-stack-trace-zone/,
        helpers.root('config/empty.js')
      ),
      new HashedModuleIdsPlugin(),

      (AOT ? ( //Manually remove compiler just to make sure it's gone
        new NormalModuleReplacementPlugin(
          /@angular(\\|\/)compiler/,
          helpers.root('config/empty.js')
        )
      ) : (new LoaderOptionsPlugin({}))),
      new LoaderOptionsPlugin({
        minimize: true,
        debug: false,
        options: {
          // TODO: Need to workaround Angular 2's html syntax => #id [bind] (event) *ngFor
          htmlLoader: {
            minimize: true,
            removeAttributeQuotes: false,
            caseSensitive: true,
            customAttrSurround: [
              [/#/, /(?:)/],
              [/\*/, /(?:)/],
              [/\[?\(?/, /(?:)/]
            ],
            customAttrAssign: [/\)?\]?=/]
          }
        }
      }),
    ],
    node: { //Include polyfills or mocks for various node stuff
      global: true,
      crypto: 'empty',
      process: false,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  });
}
