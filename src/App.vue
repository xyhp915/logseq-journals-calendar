<template>
  <div class="calendar-wrap"
       @click="_onClickOutside"
  >
    <div class="calendar-inner">
      <Transition name="fade">
        <v-calendar
          v-if="ready"
          ref="calendar"
          :onDayclick="_onDaySelect"
          @did-move="_onToPage"
          v-bind="opts"
        />
      </Transition>
    </div>
  </div>
</template>

<script>
import kebabCase from 'lodash.kebabcase'
import dayjs from 'dayjs/esm/index'

function createSetterContainerStyle (mode) {
  let containerStyle = null

  return (k, v, ...args) => {
    if (!containerStyle) {
      containerStyle = document.querySelector('.calendar-inner').style
    }

    if (['backgroundColor'].includes(k)) {
      containerStyle?.setProperty(`--vc-custom-bg`, v)
    } else {
      containerStyle?.setProperty(kebabCase(k), v, ...args)
    }
  }
}

const setLightContainerStyle = createSetterContainerStyle('light')
const setDarkContainerStyle = createSetterContainerStyle('dark')

async function safeLogseqAppCall (name, ...args) {
  try {
    return await logseq.App[name]?.apply(null, args)
  } catch (e) {
    console.warn(e)
    return false
  }
}

export default {
  name: 'App',

  data () {
    const d = new Date()
    const {
      props, firstDayOfWeek,
      backgroundColorOfContainerLight, backgroundColorOfContainerDark,
      keepOpenOnSelect,
      showWeekNumbers,
      showIsoWeeknumbers,
    } = logseq.settings

    return {
      ready: false,
      bgColor: {
        dark: backgroundColorOfContainerDark,
        light: backgroundColorOfContainerLight,
      },
      preferredDateFormat: null,
      journals: null,
      opts: {
        color: 'orange',
        [`show-weeknumbers`]: showWeekNumbers,
        [`show-iso-weeknumbers`]: showIsoWeeknumbers,
        attributes: [
          {
            dot: true,
            dates: [],
          },
          {
            key: 'today',
            highlight: true,
            dates: new Date(),
          },
        ],
        [`first-day-of-week`]: firstDayOfWeek,
        ...(props || {}),
      },
      mDate: {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      },
      keepOpenOnSelect,
    }
  },

  mounted () {
    logseq.App.onThemeModeChanged(({ mode }) => {
      this.opts[`is-dark`] = mode === 'dark'
    })

    logseq.App.onCurrentGraphChanged(() => {
      this.journals = null
    })

    logseq.App.onTodayJournalCreated(({ title }) => {
      this.opts.attributes[1] = {
        key: 'today',
        highlight: true,
        dates: new Date(),
      }
    })

    this.$watch('mDate', () => {
      this._updateCalendarInMonth()
    }, {
      immediate: true,
    })

    this.$watch('currentBgColor', (color) => {
      setLightContainerStyle('backgroundColor', `${color}`, 'important')
    }, {
      immediate: true,
    })

    const refreshConfigs = this._refreshUserConfigs.bind(this)

    // TODO: expose
    setDarkContainerStyle('borderColor', 'rgba(81,81,81,0.21)')

    logseq.on('ui:visible:changed', ({ visible }) => {
      if (visible) {
        this.ready = true
        refreshConfigs().then(() => {
          this._updateCalendarInMonth()
        })
      }
    })

    logseq.on('settings:changed', (settings) => {
      const {
        props, firstDayOfWeek,
        backgroundColorOfContainerDark, backgroundColorOfContainerLight,
        keepOpenOnSelect,
        showWeekNumbers,
        showIsoWeeknumbers,
      } = settings || {}

      this.opts[`first-day-of-week`] = firstDayOfWeek
      this.opts[`show-weeknumbers`] = showWeekNumbers
      this.opts[`show-iso-weeknumbers`] = showIsoWeeknumbers
      this.bgColor.dark = backgroundColorOfContainerDark
      this.bgColor.light = backgroundColorOfContainerLight
      this.keepOpenOnSelect = keepOpenOnSelect
    })

    setTimeout(refreshConfigs, 1000)

    // ESC
    document.addEventListener('keydown', this._closeHandle)
  },

  methods: {
    _closeHandle (e) {
      if (e.which === 27) {
        logseq.hideMainUI()
      }
    },

    async _refreshUserConfigs () {
      const configs = await logseq.App.getUserConfigs()

      if (configs.preferredDateFormat) {
        this.preferredDateFormat = configs.preferredDateFormat
      }
      if (configs.preferredLanguage) {
        this.opts[`locale`] = configs.preferredLanguage
      }
      if (configs.preferredThemeMode === 'dark') {
        this.opts[`is-dark`] = true
      }
    },

    async _updateCalendarInMonth () {
      const journals = await this._getCurrentRepoRangeJournals()

      this.journals = journals.reduce((ac, it) => {
        const k = it[`journal-day`].toString()
        ac[k] = it
        return ac
      }, {})

      // console.debug('[query journals]', journals)

      // Use the deduplicated journals object instead of the original array
      const dates = Object.values(this.journals).map(it => {
        const d = dayjs(it[`journal-day`].toString())
        if (d.isValid() && !d.isToday()) {
          return d.toDate()
        }
      }).filter(Boolean) // Filter out undefined values

      this.opts.attributes[0] = {
        dot: true,
        dates,
      }

      this.opts.attributes = [...this.opts.attributes]
    },

    _onToPage (e) {
      if (!e?.[0]?.year) {
        throw new Error(`Invalid month change event: ${e}`)
      }

      const { month, year } = e[0]
      this.mDate = { month, year }
    },

    async _getCurrentRepoRangeJournals () {
      const { month, year } = this.mDate
      const my = year + (month < 10 ? '0' : '') + month
      const graph = await logseq.App.getCurrentGraph()
      const isDB = graph.name?.startsWith('logseq_db')

      let ret

      try {
        ret = await logseq.DB.datascriptQuery(`
          [:find (pull ?p [*])
           :where
           [?p :block/journal-day ?d]
           [(>= ?d ${my}01)] [(<= ?d ${my}31)]]
        `)

        // console.debug('[query journals]', ret)
      } catch (e) {
        console.error(e)
      }

      return (ret || []).flat()
    },

    _onClickOutside ({ target }) {
      const inner = target.closest('.calendar-inner')

      !inner && logseq.hideMainUI({
        restoreEditingCursor: true,
      })
    },

    async _onDaySelect (payload, event) {
      const { id } = payload

      this.date = id

      let t = id
      let k = id.replaceAll('-', '')

      if (this.journals?.hasOwnProperty(k)) {
        const target = this.journals[k]
        t = target?.[`original-name`] || target?.[`name`] || target?.[`title`]
      }

      if (((t === id) || !t) && this.preferredDateFormat) {
        const format = this.preferredDateFormat.replace('yyyy', 'YYYY').
          replace('dd', 'DD').
          replace('do', 'Do').
          replace('EEEE', 'dddd').
          replace('EEE', 'ddd').
          replace('EE', 'dd').
          replace('E', 'ddd')

        t = dayjs(id).format(format)
      }

      if (!this.keepOpenOnSelect) {
        logseq.hideMainUI()
      }

      const { supportDb } = await logseq.App.getInfo()
      let isDbGraph = false
      try {
        isDbGraph = await logseq.App.checkCurrentIsDbGraph()
      } catch (e) {
        // Method doesn't exist, fallback to checking graph name
        const graph = await logseq.App.getCurrentGraph()
        isDbGraph = graph?.name?.startsWith('logseq_db') || false
      }
      let page = await logseq.Editor.getPage(t)

      if (isDbGraph || supportDb || event.shiftKey) {
        if (page == null) {
          // Journal entry does not exist. Create it.
          page = await logseq.Editor.createPage(t, {}, {
            journal: true,
            redirect: false,
          })
        }
      }

      if (event.shiftKey) {
        logseq.Editor.openInRightSidebar(page?.uuid)
        logseq.hideMainUI()
      } else {
        if (isDbGraph || supportDb) {
          t = page?.uuid
        }

        logseq.App.pushState('page', { name: t })
      }
    },
  },

  computed: {
    currentBgColor () {
      if (this.opts[`is-dark`]) {
        return this.bgColor.dark
      } else {
        return this.bgColor.light
      }
    },
  },

  beforeUnmount () {
    logseq.off('ui:visible:changed')
    logseq.off('settings:changed')
    document.removeEventListener('keydown', this._closeHandle)
  },
}
</script>
