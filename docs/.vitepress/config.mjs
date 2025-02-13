import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/blog/',
  title: "个人博客",
  description: "小屁正的个人博客,基于vitepress实现",
  lang: 'en-US',
  lastUpdated: true,
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      { text: '主页', link: '/' },
      { text: '技术文章', link: '/technology/' },
      { text: '杂记', link: '/fussy/' },
      { text: '关于我', link: '/aboutme/' },
    ],
    sidebar: {
      '/technology/':[
        {
          text: '技术文章',
          items: [
            {text: 'nginx',link: '/technology/nginx'},
            {text: 'JavaScript',link: '/technology/js'},
          ]
        }
      ]
    },
    outline: {
      level: 'deep',
      label: '当前页',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Eason99/blog' }
    ]
  }
})
