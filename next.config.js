require('dotenv').config()

const path = require('path')
const withSass = require('@zeit/next-sass')
const withTypescript = require('@zeit/next-typescript')
const withCss = require('@zeit/next-css')

const srcPath = (subdir) => path.join(__dirname, 'src', subdir)

// Workaround for an issue in `next-sass` that would cause CSS
// bundles not to be generated correctly
// See: https://github.com/zeit/next-plugins/issues/157#issuecomment-385885772
const commonsChunkConfig = (config, test = /\.css$/) => {
  config.plugins = config.plugins.map((plugin) => {
    if (
      plugin.constructor.name === 'CommonsChunkPlugin' &&
      // disable filenameTemplate checks here because they never match
      // (plugin.filenameTemplate === 'commons.js' ||
      //     plugin.filenameTemplate === 'main.js')
      // do check for minChunks though, because this has to (should?) exist
      plugin.minChunks != null
    ) {
      const defaultMinChunks = plugin.minChunks
      plugin.minChunks = (module, count) => {
        if (module.resource && module.resource.match(test)) {
          return true
        }
        return defaultMinChunks(module, count)
      }
    }
    return plugin
  })
  return config
}

module.exports = withTypescript(
  withCss(
    withSass({
      webpack: (config, options) => {
        const newConfig = Object.assign({},
          commonsChunkConfig(config, /\.(sass|scss|css)$/)
        )
        newConfig.resolve = {
          extensions: ['.ts', '.tsx', '.js', '.json'],
          alias: {
            client: srcPath('client/'),
            server: srcPath('server/')
          }
        }
        return newConfig
      },
      assetPrefix: `${process.env.HOST_DOMAIN}${process.env.BASE_PATH}`,
      onDemandEntries: {
        maxInactiveAge: 1000 * 60 * 60
      },
      publicRuntimeConfig: {
        env: process.env.NODE_ENV,
        hostDomain: process.env.HOST_DOMAIN,
        basePath: process.env.BASE_PATH,
        apiPath: process.env.API_PATH,
        auth0Host: process.env.AUTH0_HOST,
        auth0ClientID: process.env.AUTH0_CLIENT_ID,
        auth0Logout: process.env.AUTH0_LOGOUT,
        addressCompleteAPIkey: process.env.ADDRESS_COMPLETE_API_KEY,
        gtmEnabled: process.env.GTM,
        monetateEnabled: process.env.MONETATE,
        localeCookieName: process.env.LOCALE_COOKIE_NAME
      }
    })
  )
)
