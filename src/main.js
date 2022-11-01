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
const settingsSchema = [
  {
    key: 'showTodayBtn',
    type: 'boolean',
    title: 'Do you like today button?',
    description: 'Do you want to show Today button from toolbar? (reload needed)',
    default: true,
  }, {
    key: 'backgroundColorOfContainerLight',
    type: 'string',
    title: 'The background color of calendar container (light mode)',
    description: '🌝 color of light mode!',
    default: '#ffffff',
    inputAs: 'color',
  }, {
    key: 'backgroundColorOfContainerDark',
    type: 'string',
    title: 'The background color of calendar container (dark mode)',
    description: '🌚 color of dark mode!',
    default: '#000000',
    inputAs: 'color',
  }, {
    key: 'hotkey',
    type: 'string',
    title: 'Hotkey to open calendar',
    description: 'Hotkey to open calendar',
    default: null,
  }, {
    key: 'keepOpenOnSelect',
    type: 'boolean',
    title: '',
    description: 'Keep the calendar open after selecting a date',
    default: false,
  }]

let app = null

/**
 * user model
 */
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

    app?._refreshUserConfigs().then(() => {
      app._onDaySelect({ event: {}, id: date })
    })
  },

  goToToday () {
    model.goToDayOfJournal(Date.now())
  },
}

/**
 * app entry
 */
function main () {
  logseq.setMainUIInlineStyle({
    position: 'fixed', zIndex: 11,
  })

  const key = logseq.baseInfo.id

  logseq.provideModel(model)
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
      <a class="button" id="open-calendar-button"
      data-on-click="openCalendar"
      data-rect>
       <i class="ti ti-calendar-event"></i> 
      </a>
    `,
  })

  if (logseq.settings.hotkey) {
    logseq.App.registerCommandShortcut({
      binding: logseq.settings.hotkey,
    }, async () => {
      if (logseq.isMainUIVisible) {
        return logseq.hideMainUI()
      }

      const rect = await logseq.App.queryElementRect('#open-calendar-button')
      model.openCalendar({ rect })
    })
  }

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
  app = createApp(App).use(VCalendar, {}).mount('#app')
}

// bootstrap
logseq.useSettingsSchema(settingsSchema).ready(main).catch(null)
