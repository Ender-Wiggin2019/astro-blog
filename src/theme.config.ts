export const THEME_CONFIG: App.Locals['config'] = {
  /** blog title */
  title: "云隙随笔",
  /** your name */
  author: "Ender",
  /** website description */
  desc: "记录自己的各种想法",
  /** your deployed domain */
  website: "https://www.ender-wiggin.com/",
  /** your locale */
  locale: "zh-cn",
  /** theme style */
  themeStyle: "light",
  /** your socials */
  socials: [
    {
      name: "github",
      href: "https://github.com/Ender-Wiggin2019",
    },
    {
      name: "rss",
      href: "/atom.xml",
    },
    {
      name: "bilibili",
      href: "https://space.bilibili.com/12411973",
    },
    {
      name: "email",
      href: "mailto:117010097@link.cuhk.edu.cn",
    }
  ],
  /** your navigation links */
  navs: [
    {
      name: "Posts",
      href: "/",
    },
    {
      name: "Archive",
      href: "/archive",
    },
    {
      name: "Categories",
      href: "/categories"
    },
    {
      name: "About",
      href: "/about",
    },
  ],
  category_map: [
    {name: "学习笔记", path: "notes"},
    {name: "所思所想", path: "thoughts"},
    {name: "文学影视", path: "reviews"},
    {name: "桌游相关", path: "boardgames"},
  ]
}

