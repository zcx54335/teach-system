import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

// 强行覆盖 Webpack 的 ProgressPlugin 以解决 Node 22 + Webpack 5.91+ 的兼容报错
try {
  const webpack = require('webpack')
  const OriginalProgressPlugin = webpack.ProgressPlugin
  webpack.ProgressPlugin = function (options: any) {
    // 过滤掉 WebpackBar 传入的非标准属性
    if (options && typeof options === 'object') {
      delete options.name
      delete options.color
      delete options.reporters
      delete options.reporter
      delete options.basic
      delete options.fancy
    }
    return new OriginalProgressPlugin(options)
  }
} catch (e) {
  // ignore
}

// https://taro-docs.jd.com/docs/next/config-detail
export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport = {
    projectName: 'xiongxiong-miniapp',
    date: '2026-04-15',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {
    },
    copy: {
      patterns: [
      ],
      options: {
      }
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: false
      }
    },
    cache: {
      enable: false
    },
    logger: {
      quiet: false,
      stats: true
    },
    mini: {
        webpackChain(chain) {
        // 强行删掉导致崩溃的两个进度条插件
        chain.plugins.delete('progress');
        chain.plugins.delete('taroWebpackBar');
        },
        postcss: {
        pxtransform: {
            enable: true,
            config: {}
        },
        url: {
            enable: true,
            config: {
            limit: 1024 // 设定转换尺寸上限
            }
        },
        cssModules: {
            enable: false, // 默认为 false，如需使用 css modules 请配置为 true
            config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
            }
        }
        }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 请确认在组件中正确使用了 classname
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }
  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})
