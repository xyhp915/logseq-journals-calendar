import '@logseq/libs'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import 'v-calendar/dist/style.css'
import VCalendar from 'v-calendar'

/** settings **/
// const settingsSchema = [
//   {
//     key: 'firstDayOfWeek',
//     type: 'number',
//     title: 'The first day of week',
//     description: 'Day number for the first day of the week (1: Sun - 7: Sat). Ignore setting this prop if you want to allow the locale to determine this setting.',
//     default: 1
//   }
// ]

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
    }
  `)

  // external btns
  logseq.App.registerUIItem('toolbar', {
    key: 'open-calendar',
    template: `
      <a class="button" 
      data-on-click="openCalendar"
      data-rect>
       <i class="ti ti-calendar-event"></i> 
      </a>
    `,
  })

  // main UI
  createApp(App).use(VCalendar, {}).mount('#app')
}

// bootstrap
logseq
  .ready(createModel())
  .then(main)
  .catch(null)
