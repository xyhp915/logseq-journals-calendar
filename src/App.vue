<template>
  <div class="calendar-wrap"
       @click="_onClickOutside"
  >
    <div class="calendar-inner" v-if="ready">
      <v-calendar
        :onDayclick="_onDaySelect"
        @update:to-page="_onToPage"
        v-bind="opts"/>
    </div>
  </div>
</template>

<script>
import customParseFormat from 'dayjs/esm/plugin/customParseFormat'
import dayjs from 'dayjs/esm/index'

dayjs.extend(customParseFormat)

export default {
  name: 'App',

  data () {
    const d = new Date()
    return {
      ready: false,
      preferredDateFormat: null,
      journals: null,
      opts: {
        color: 'orange',
        [`is-dark`]: false,
        attributes: [
          {
            dot: true,
            dates: [],
          },
        ],
      },
      mDate: {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      },
    }
  },

  mounted () {
    logseq.App.onThemeModeChanged((label) => {
      this.opts[`is-dark`] = label === 'dark'
    })

    const refreshConfigs = () => logseq.App.getUserConfigs().then((configs) => {
      if (configs.preferredDateFormat) {
        this.preferredDateFormat = configs.preferredDateFormat
      }
    })

    this.$watch('mDate', () => {
      this._updateCalendarInMonth()
    }, {
      immediate: true,
    })

    logseq.on('ui:visible:changed', ({ visible }) => {
      visible && (this.ready = true, refreshConfigs())
    })
  },

  methods: {
    async _updateCalendarInMonth () {
      const journals = await this._getCurrentRepoRangeJournals()

      this.journals = journals.reduce((ac, it) => {
        const k = it[`journal-day`].toString()
        ac[k] = it
        return ac
      }, {})

      console.debug('[query journals]', journals)

      const dates = journals.map(it => {
        const d = dayjs(it[`journal-day`].toString())
        if (d.isValid()) {
          return d.toDate()
        }
      })

      this.opts.attributes = [
        {
          dot: true,
          dates,
        },
      ]
    },

    _onToPage (e) {
      this.mDate = e
    },

    async _getCurrentRepoRangeJournals () {
      const { month, year } = this.mDate
      const my = year + (month < 10 ? '0' : '') + month

      let ret

      try {
        ret = await logseq.DB.datascriptQuery(`
          [:find (pull ?p [*])
           :where
           [?b :block/page ?p]
           [?p :block/journal? true]
           [?p :block/journal-day ?d]
           [(>= ?d ${my}01)] [(<= ?d ${my}31)]]
        `)
      } catch (e) {
        console.error(e)
      }

      return (ret || []).flat()
    },

    _onClickOutside ({ target }) {
      const inner = target.closest('.calendar-inner')

      !inner && logseq.hideMainUI()
    },

    _onDaySelect ({ id }) {
      this.date = id

      let t = id
      let k = id.replaceAll('-', '')

      if (this.journals.hasOwnProperty(k)) {
        id = this.journals[k][`original-name`]
      } else if (this.preferredDateFormat) {
        // TODO: user preferred date format?
        // const format = this.preferredDateFormat.replace('yyyy', 'YYYY').
        //   replace('dd', 'DD').
        //   replace('EEEE', 'dddd').
        //   replace('EEE', 'ddd').
        //   replace('EE', 'dd').
        //   replace('E', 'dd')

        // t = dayjs(id).format(format)
      }

      logseq.hideMainUI()
      logseq.App.pushState('page', { name: id })
    },
  },
}
</script>
