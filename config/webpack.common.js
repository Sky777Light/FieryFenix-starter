const webpack = require('webpack');
const helpers = require('./helpers');

const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AwesomeTypescriptLoader = require('awesome-typescript-loader');
const HtmlElementsPlugin = require('./html-elements-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ngcWebpack = require('ngc-webpack');


const HMR = helpers.hasProcessFlag('hot');
const AOT = process.env.BUILD_AOT || helpers.hasNpmFlag('aot');
const METADATA = {
  title: 'Fiery Fenix Starter',
  baseUrl: '/',
  isDevServer: helpers.isWebpackDevServer(),
  HMR: HMR,
  AOT: AOT
};


module.exports = function (options) {
  isProd = options.env === 'production';
  return {
    entry: {
      'polyfills': './src/polyfills.browser.ts',
      'main': AOT ? './src/main.browser.aot.ts' : './src/main.browser.ts'
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      modules: [helpers.root('src'), helpers.root('node_modules')],
    },
    module: {

      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ng-router-loader',
              options: {
                loader: 'async-import',
                genDir: 'compiled',
                aot: AOT
              }
            },
            {
              loader: 'awesome-typescript-loader',
              options: {
                configFileName: 'tsconfig.webpack.json',
                useCache: !isProd
              }
            },
            {
              loader: 'ngc-webpack',
              options: {
                disable: !AOT,
              }
            },
            {
              loader: 'angular2-template-loader'
            }
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        },
        {
          test: /\.css$/,
          use: ['to-string-loader', 'css-loader'],
          exclude: [helpers.root('src', 'styles')]
        },
        {
          test: /\.s[ac]ss$/,
          use: ['to-string-loader', 'css-loader', 'sass-loader'],
          exclude: [helpers.root('src', 'styles')]
        },
        {
          test: /\.html$/,
          use: 'raw-loader',
          exclude: [helpers.root('src/index.html')]
        },
        {
          test: /\.(jpg|png|gif|svg)$/,
          use: 'file-loader'
        },
        {
          test: /\.(eot|woff2?|ttf)([\?]?.*)$/,
          use: 'file-loader'
        }

      ],

    },
    plugins: [
      new AwesomeTypescriptLoader.CheckerPlugin(), //check types in separate process (webpack is not wait)
      new CommonsChunkPlugin({ //get common modules and put it in common chunk
        name: 'polyfills',
        chunks: ['polyfills']
      }),
      // new CommonsChunkPlugin({
      //   name: 'vendor',
      //   chunks: ['main'],
      //   minChunks: module => /node_modules/.test(module.resource)
      // }),
      // new CommonsChunkPlugin({
      //   name: ['polyfills', 'vendor'].reverse()
      // }),
      // new CommonsChunkPlugin({  //for manifest
      //   name: ['manifest'],
      //   minChunks: Infinity,
      // }),
      new ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)@angular/, //The (\\|\/) piece accounts for path separators in *nix and Windows
        helpers.root('src'), // location of your src
        {} //Your Angular Async Route paths relative to this root directory
      ),
      new CopyWebpackPlugin([  //copy files from ...to
        { from: 'src/assets', to: 'assets' },
        { from: 'src/meta'}
      ],
        isProd ? { ignore: [ 'mock-data/**/*' ] } : undefined //exclude files which do not need to be copied
      ),
      new HtmlWebpackPlugin({
        template: 'src/index.html', //set path to template
        title: METADATA.title, //title
        chunksSortMode: function (a, b) { //sort all chunks how it should be included to the template
          const entryPoints = ["inline","polyfills","sw-register","styles","vendor","main"];
          return entryPoints.indexOf(a.names[0]) - entryPoints.indexOf(b.names[0]);
        },
        metadata: METADATA, // custom option for using some data
        inject: 'body'  //inject all script at the body
      }),

      new ScriptExtHtmlWebpackPlugin({ //Enhances html-webpack-plugin functionality with different deployment options
        sync: /polyfills|vendor/, // will not add attr async
        defaultAttribute: 'async', // all scripts should be loaded async (added attr async)
        preload: [/polyfills|vendor|main/], //scripts that should be preloaded rel="preload"
        prefetch: [/chunk/]
      }),
      new HtmlElementsPlugin({ //Generate html tags based on javascript maps. custom plugin
        headTags: require('./head-config.common')
      }),
      new ngcWebpack.NgcWebpackPlugin({ //If false the plugin is a ghost, it will not perform any action.
        disabled: !AOT, // This property can be used to trigger AOT on/off depending on your build target
        tsConfig: helpers.root('tsconfig.webpack.json'),
      }),
      // new InlineManifestWebpackPlugin(), //for manifest
    ],
    node: { //Include polyfills or mocks for various node stuff
      global: true,
      crypto: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  };
}
