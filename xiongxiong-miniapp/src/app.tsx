import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

// 【终极补丁】：直接手动修复 Taro 的 URL 逻辑缺陷，不再依赖任何外部包
if (typeof global !== 'undefined') {
  const OriginalURL = (global as any).URL;
  if (OriginalURL) {
    (global as any).URL = function(url: string, base?: string) {
      if (base) {
        // 手动拼接，避开 Taro 底层解析器的多参数 Bug
        const b = base.endsWith('/') ? base.slice(0, -1) : base;
        const u = url.startsWith('/') ? url : '/' + url;
        return new OriginalURL(b + u);
      }
      return new OriginalURL(url);
    };
    // 继承原型链
    (global as any).URL.prototype = OriginalURL.prototype;
  }
}

function App({ children }: PropsWithChildren<any>) {
  return children
}

export default App