import '@logseq/libs'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import VCalendar from 'v-calendar'
import iconCalendar from './calendar.svg'

/**
 * user model
 */
function createModel () {
  return {
    openCalendar (e) {
      const { rect } = e
      const inner = document.querySelector('.calendar-inner')

      console.log(rect)
      Object.assign(inner.style, {
        top: `${rect.top + 30}px`,
        left: `${rect.left - 115}px`,
      })

      logseq.showMainUI()
    },
  }
}

/**
 * app entry
 */
function main () {
  logseq.setMainUIInlineStyle({
    position: 'fixed',
    zIndex: 11,
  })

  const key = logseq.baseInfo.id

  logseq.provideStyle(`
    div[data-injected-ui=open-calendar-${key}] {
      display: flex;
      align-items: center;
      font-weight: 500;
      position: relative;
      top: -1px;
    }
    
    div[data-injected-ui=open-calendar-${key}] a {
      opacity: .8;
      padding: 6px;
    }
    
    div[data-injected-ui=open-calendar-${key}] iconfont {
      font-size: 18px;
    }
  `)

  // external btns
  logseq.App.registerUIItem('toolbar', {
    key: 'open-calendar',
    template: `
      <a class="button" 
      data-on-click="openCalendar"
      data-rect>
        ${iconCalendar.content}
      </a>
    `,
  })

  // main UI
  createApp(App).use(VCalendar, {}).mount('#app')
}

// bootstrap
logseq.ready(createModel()).then(main)
