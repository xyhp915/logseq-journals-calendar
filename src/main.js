import '@logseq/libs'
import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import 'v-calendar/dist/style.css'
import VCalendar from 'v-calendar'

import customParseFormat from 'dayjs/esm/plugin/customParseFormat'
import advancedFormat from 'dayjs/esm/plugin/advancedFormat'
import isToday from 'dayjs/esm/plugin/isToday'
import dayjs from 'dayjs/esm/index'

dayjs.extend(customParseFormat)
dayjs.extend(advancedFormat)
dayjs.extend(isToday)

/** settings **/
const settingsSchema = [{
  key: 'showTodayBtn',
  type: 'boolean',
  title: 'Do you like today button?',
  description: 'Do you want to show Today button from toolbar? (reload needed)',
  default: true
}, {
  key: 'firstDayOfWeek',
  type: 'number',
  title: 'The first day of week',
  description: 'Day number for the first day of the week (1: Sun - 7: Sat). Ignore setting this prop if you want to allow the locale to determine this setting.',
  default: 1
}, {
  key: 'backgroundColorOfContainerLight',
  type: 'string',
  title: 'The background color of calendar container (light mode)',
  description: '🌝 color of light mode!',
  default: '#ffffff',
  inputAs: 'color'
}, {
  key: 'backgroundColorOfContainerDark',
  type: 'string',
  title: 'The background color of calendar container (dark mode)',
  description: '🌚 color of dark mode!',
  default: '#000000',
  inputAs: 'color'
}]

let app = null

/**
 * user model
 */
function createModel () {
  const model = {
    openCalendar (e) {
      const { rect } = e
      const inner = document.querySelector('.calendar-inner')

      Object.assign(inner.style, {
        top: `${rect.top + 30}px`, left: `${rect.left - 115}px`,
      })

      logseq.showMainUI()
    },

    goToDayOfJournal (date) {
      if (typeof date !== 'string') {
        date = dayjs(date).format('YYYY-MM-DD')
      }

      app?._onDaySelect({ event: {}, id: date })
    },

    goToToday () {
      model.goToDayOfJournal(Date.now())
    }
  }

  return model
}

/**
 * app entry
 */
function main () {
  logseq.setMainUIInlineStyle({
    position: 'fixed', zIndex: 11,
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
    key: 'open-calendar', template: `
      <a class="button" 
      data-on-click="openCalendar"
      data-rect>
       <i class="ti ti-calendar-event"></i> 
      </a>
    `,
  })

  if (logseq.settings.showTodayBtn) {
    logseq.App.registerUIItem('toolbar', {
      key: 'goto-today', template: `
      <a 
      class="button" title="Today's journal" 
      data-on-click="goToToday">
        <i class="ti ti-edit-circle"></i>
      </a>
    `,
    })
  }

  // main UI
  app = createApp(App)
    .use(VCalendar, {})
    .mount('#app')
}

// bootstrap
logseq
  .useSettingsSchema(settingsSchema)
  .ready(createModel())
  .then(main)
  .catch(null)
