const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');

const ENV = process.env.ENV = process.env.NODE_ENV = 'development'; //set process env const
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const PUBLIC = process.env.PUBLIC_DEV || HOST + ':' + PORT;
const AOT = process.env.BUILD_AOT || helpers.hasNpmFlag('aot'); //set true if process env has BUILD_AOT or npm has flag aot (npm run build:aot)
const HMR = helpers.hasProcessFlag('hot'); // if npm has flag  --hot (HMR mode enable if use webpack dev server with flag --hotOnly)
const METADATA = {
  host: HOST,
  port: PORT,
  public: PUBLIC,
  ENV: ENV,
  HMR: HMR,
  AOT: AOT
};

module.exports = function (options) {
  return webpackMerge(commonConfig({env: ENV}), {
    devtool: 'cheap-module-source-map',
    output: {
      path: helpers.root('dist'),
      filename: '[name].bundle.js', // [name] - is a name of files that are compiled
      sourceMapFilename: '[file].map', // [file] - is replaced by the filename of the JavaScript file.
      chunkFilename: '[id].chunk.js', //[id] - The filename of non-entry chunks as a relative path inside the output.path directory. (for all chunks is not entry - use id)
      library: 'ac_[name]', //If set, export the bundle as library. output.library is the name.
      libraryTarget: 'var',  //Export by setting a variable: var Library = xxx (default settings)
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          include: [helpers.root('src', 'styles')]
        },
        {
          test: /\.s[ac]ss$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
          include: [helpers.root('src', 'styles')]
        },
      ]
    },

    plugins: [
      new DefinePlugin({ // Define free variables. NOTE: when adding more properties, make sure you include them in custom-typings.d.ts
        'ENV': JSON.stringify(METADATA.ENV),
        'HMR': METADATA.HMR,
        'AOT': METADATA.AOT,
        'process.env': {
            'ENV': JSON.stringify(METADATA.ENV),
            'NODE_ENV': JSON.stringify(METADATA.ENV),
            'HMR': METADATA.HMR
        }
      }),
      new LoaderOptionsPlugin({ // https://gist.github.com/sokra/27b24881210b56bbaff7
        debug: true,
        options: {
          // pass stuff to the loader
        }
      }),
      new HotModuleReplacementPlugin()
    ],

    devServer: { //Webpack Development Server configuration
      port: METADATA.port, //<number> port
      host: METADATA.host, //<hostname/ip> hostname or IP. 0.0.0.0 binds to all hosts.
      hot: METADATA.HMR, // adds the HotModuleReplacementPlugin and switch the server to hot mode
      public: METADATA.public, // overrides the host and port used in --inline mode for the client
      historyApiFallback: true, //enables support for history API fallback.
      watchOptions: {
          ignored: /node_modules/
      }
    },
    node: { //Include polyfills or mocks for various node stuff
      global: true,
      crypto: 'empty',
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  });
};
