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
    key: 'firstDayOfWeek',
    type: 'number',
    title: 'The first day of week',
    description: 'Day number for the first day of the week (1: Sun - 7: Sat). Ignore setting this prop if you want to allow the locale to determine this setting.',
    default: 1,
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
    key: 'hotkeyPrevDay',
    type: 'string',
    title: 'Hotkey to go to previous day journal',
    description: 'Navigate to yesterday\'s journal (e.g., "mod+shift+left")',
    default: 'mod+shift+left',
  }, {
    key: 'hotkeyNextDay',
    type: 'string',
    title: 'Hotkey to go to next day journal',
    description: 'Navigate to tomorrow\'s journal (e.g., "mod+shift+right")',
    default: 'mod+shift+right',
  }, {
    key: 'keepOpenOnSelect',
    type: 'boolean',
    title: '',
    description: 'Keep the calendar open after selecting a date',
    default: false,
  }, {
    key: 'showWeekNumbers',
    type: 'boolean',
    title: '',
    description: 'Show week numbers in calendar',
    default: false,
  },{
    key: 'showIsoWeeknumbers',
    type: 'boolean',
    title: '',
    description: 'Show week number in ISO format',
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

  async goToPreviousDayJournal () {
    try {
      // Get current page
      const currentPage = await logseq.Editor.getCurrentPage()
      console.log('[Previous Day] Current page:', JSON.stringify(currentPage, null, 2))

      if (!currentPage) {
        console.warn('[Previous Day] No current page found')
        return
      }

      // Check if it's a journal page by checking if journalDay exists
      const journalDay = currentPage.journalDay
      console.log('[Previous Day] journalDay value:', journalDay, 'type:', typeof journalDay)

      if (!journalDay) {
        console.warn('[Previous Day] Not a journal page (journalDay is null or undefined)')
        return
      }

      // Parse YYYYMMDD format
      const referenceDate = dayjs(journalDay.toString(), 'YYYYMMDD')
      console.log('[Previous Day] Parsed date:', referenceDate.format('YYYY-MM-DD'), 'isValid:', referenceDate.isValid())

      if (!referenceDate.isValid()) {
        console.warn('[Previous Day] Invalid date parsed from journalDay:', journalDay)
        return
      }

      // Calculate previous day
      const previousDay = referenceDate.subtract(1, 'day')
      console.log('[Previous Day] Navigating to:', previousDay.format('YYYY-MM-DD'))

      // Navigate to previous day journal
      model.goToDayOfJournal(previousDay.format('YYYY-MM-DD'))
    } catch (error) {
      console.error('[Previous Day] Error:', error)
      console.error('[Previous Day] Error stack:', error.stack)
    }
  },

  async goToNextDayJournal () {
    try {
      // Get current page
      const currentPage = await logseq.Editor.getCurrentPage()
      console.log('[Next Day] Current page:', JSON.stringify(currentPage, null, 2))

      if (!currentPage) {
        console.warn('[Next Day] No current page found')
        return
      }

      // Check if it's a journal page by checking if journalDay exists
      const journalDay = currentPage.journalDay
      console.log('[Next Day] journalDay value:', journalDay, 'type:', typeof journalDay)

      if (!journalDay) {
        console.warn('[Next Day] Not a journal page (journalDay is null or undefined)')
        return
      }

      // Parse YYYYMMDD format
      const referenceDate = dayjs(journalDay.toString(), 'YYYYMMDD')
      console.log('[Next Day] Parsed date:', referenceDate.format('YYYY-MM-DD'), 'isValid:', referenceDate.isValid())

      if (!referenceDate.isValid()) {
        console.warn('[Next Day] Invalid date parsed from journalDay:', journalDay)
        return
      }

      // Calculate next day
      const nextDay = referenceDate.add(1, 'day')
      console.log('[Next Day] Navigating to:', nextDay.format('YYYY-MM-DD'))

      // Navigate to next day journal
      model.goToDayOfJournal(nextDay.format('YYYY-MM-DD'))
    } catch (error) {
      console.error('[Next Day] Error:', error)
      console.error('[Next Day] Error stack:', error.stack)
    }
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

  // Previous day shortcut
  if (logseq.settings.hotkeyPrevDay) {
    logseq.App.registerCommandShortcut({
      binding: logseq.settings.hotkeyPrevDay,
    }, async () => {
      await model.goToPreviousDayJournal()
    })
  }

  // Next day shortcut
  if (logseq.settings.hotkeyNextDay) {
    logseq.App.registerCommandShortcut({
      binding: logseq.settings.hotkeyNextDay,
    }, async () => {
      await model.goToNextDayJournal()
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
