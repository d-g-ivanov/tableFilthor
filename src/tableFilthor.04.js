/*!
 * TableFilthor - Add filtering to tables on any webpage
 *
 * tableFilthor v0.3.0
 * (c) 2022 Daniel Ivanov
 */

/**
 * @summary Add filtering to tables on any webpage
 * @license MIT
 * @author Daniel Ivanov
 * @param {object} PUBLIC_API - Single object that contains the public api of the plugin; available under window.tableFilthor namespace. Currently exports only init function that takes a css selector for the affected tables, and a config object. Both are optional.
 */

/*

/*
WHAT'S NEW IN 0.4
1. Dropdowns for simple filtering - excel-like
    dropdowns: {
        use: true,
        columns: [], column names, or index (0 based)
        limit: -1, no limit, default; number of items to be displayed. If over that number, menu will not contain itesm
    }

    NOTE - dropdowns dos not update based on handwritten filters
   
2. Cell highlighting and comments column
    highlights: {
        uniqueId: string, column name to be used as reference for localStorage. should be unique to the table so that the roww can be identified between refreshes
        comments: boolean; indicates whether to use or not a comments column
        label: string; name for the comments column
        commentsWidth: number; initial width of the comments column; defaults to 200
    }

3. Added "blank" as keyword to isolate cells with no content; used as "=blank" or "!=blank"

4. Added user confirm if they want to keep hidden columns when exporting the table to csv

5. options.skipColumns is not a 0-based array

6. Added options.processors.pre = [] - alows for custom functions to be performed on the table, before adding the filtering and all that jazz
*/

;(function (PUBLIC_API) {
  /* ARRAY FIND POLIFIL */
  if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined')
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('Predicate must be a function')
      }
      var list = Object(this)
      var length = list.length >>> 0
      var thisArg = arguments[1]
      var value

      for (var i = 0; i < length; i++) {
        value = list[i]
        if (predicate.call(thisArg, value, i, list)) {
          return value
        }
      }
      return undefined
    }
  }

  /* DEFAULT SETTINGS */
  const DEFAULT_OPTIONS = {
    debouceTime: 500,
    minRows: 20,
    skipColumns: [],
    exactMatches: false,
    summaryType: 'simple',
    hiddenColumns: [],

    // css
    theme: {
      background: '#47b',
      color: 'white',
      inputBackground: '#444',
      inputColor: 'white',
      actionColor: 'white',
      iconFill: 'white',
      iconActiveFill: 'yellow',
      resizerActiveFill: 'yellow',
    },

    // refresh
    refresh: {
      autorefresh: false,
      autorefreshRate: 60 * 60 * 1000, // 1 hour
      shouldDiff: false,
      columnToDiffBy: null,
      pre: [
        function startSpinner(table) {
          table.panel.querySelector('[data-action=refresh]').style.animation =
            'table-filthor-spin 4s linear infinite'
        },
      ],
      post: [
        function stopSpinner(table) {
          table.panel.querySelector('[data-action=refresh]').style.animation =
            ''
        },
      ],
      keepDefaultHooks: true,
    },

    // dropdowns
    dropdowns: { use: false, limit: -1 },
  }

  /* ICONS */
  const ASSETS = {
    download:
      '<svg enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m286 241h-60c-8.291 0-15 6.709-15 15v135h-30c-5.684 0-10.869 3.208-13.418 8.291-2.534 5.083-1.992 11.162 1.421 15.703l75 91c2.827 3.779 7.28 6.006 11.997 6.006s9.17-2.227 11.997-6.006l75-91c3.413-4.541 3.955-10.62 1.421-15.703-2.549-5.083-7.734-8.291-13.418-8.291h-30v-135c0-8.291-6.709-15-15-15z"/><path d="m419.491 151.015c-6.167-30.205-30.703-53.848-62.446-58.872-13.096-52.72-61.011-92.143-116.045-92.143-54.917 0-102.305 38.837-115.737 91.117-1.407-.073-2.827-.117-4.263-.117-66.167 0-121 53.833-121 120s54.833 120 121 120h60v-75c0-24.814 20.186-45 45-45h60c24.814 0 45 20.186 45 45v75h90c49.629 0 91-40.371 91-90 0-50.127-42.06-91.23-92.509-89.985z"/></g></svg>',
    exact:
      '<svg enable-background="new 0 0 467.765 467.765" height="512" viewBox="0 0 467.765 467.765" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m175.412 87.706h58.471v29.235h58.471v-87.706h-292.354v87.706h58.471v-29.235h58.471v292.353h-58.471v58.471h175.383v-58.471h-58.442z"/><path d="m233.882 175.412v87.706h58.471v-29.235h29.235v146.176h-29.235v58.471h116.941v-58.471h-29.235v-146.177h29.235v29.235h58.471v-87.706h-233.883z"/></svg>',
    help:
      '<svg height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m512 346.5c0-63.535156-36.449219-120.238281-91.039062-147.820312-1.695313 121.820312-100.460938 220.585937-222.28125 222.28125 27.582031 54.589843 84.285156 91.039062 147.820312 91.039062 29.789062 0 58.757812-7.933594 84.210938-23.007812l80.566406 22.285156-22.285156-80.566406c15.074218-25.453126 23.007812-54.421876 23.007812-84.210938zm0 0"/><path d="m391 195.5c0-107.800781-87.699219-195.5-195.5-195.5s-195.5 87.699219-195.5 195.5c0 35.132812 9.351562 69.339844 27.109375 99.371094l-26.390625 95.40625 95.410156-26.386719c30.03125 17.757813 64.238282 27.109375 99.371094 27.109375 107.800781 0 195.5-87.699219 195.5-195.5zm-225.5-45.5h-30c0-33.085938 26.914062-60 60-60s60 26.914062 60 60c0 16.792969-7.109375 32.933594-19.511719 44.277344l-25.488281 23.328125v23.394531h-30v-36.605469l35.234375-32.25c6.296875-5.761719 9.765625-13.625 9.765625-22.144531 0-16.542969-13.457031-30-30-30s-30 13.457031-30 30zm15 121h30v30h-30zm0 0"/></svg>',
    pin:
      '<svg enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><g><path d="m316.685 449.874-254.559-254.559c-4.288-4.288-5.583-10.741-3.252-16.345 2.32-5.614 7.789-9.26 13.859-9.26 99.064 0 188.039-55.022 232.227-143.583l8.918-17.826c2.144-4.319 6.256-7.333 11.011-8.11 4.765-.766 9.602.798 13.01 4.205l169.706 169.706c3.408 3.408 4.972 8.245 4.205 13.01-.777 4.754-3.791 8.866-8.11 11.011l-17.816 8.908c-88.573 44.197-143.594 133.172-143.594 232.236 0 6.07-3.646 11.539-9.26 13.859-5.604 2.331-12.057 1.036-16.345-3.252z"/></g><path d="m136.372 311.988-110.765 110.766c-1.647 1.647-2.89 3.656-3.625 5.863l-21.213 63.64c-1.792 5.397-.394 11.332 3.625 15.351s9.954 5.417 15.351 3.625l63.64-21.213c2.206-.735 4.216-1.978 5.863-3.625l110.766-110.766z"/></g></svg>',
    filter:
      '<svg enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m215.546 85.327h-162.264c-18.073 0-28.679 20.379-18.31 35.187.133.199-3.448-4.682 130.024 177.006 5.921 8.587 4.149-.599 4.149 190.987 0 19.245 21.993 30.358 37.542 18.791 57.536-43.372 71.516-48.257 71.516-70.955 0-133.909-1.721-130.311 4.149-138.823l27.851-37.923c-70.082-25.496-112.087-99.608-94.657-174.27z"/><path d="m281.951 30.166c-75.076 67.31-38.685 187.35 55.962 206.05 75.479 15.948 143.193-43.867 143.193-116.945 0-102.594-122.364-157.159-199.155-89.105zm118.529 106.804c9.515 9.466 2.715 25.676-10.603 25.676-8.014 0-10.022-3.79-28.462-22.158-18.064 17.984-20.27 22.158-28.472 22.158-13.349 0-20.063-16.264-10.603-25.676l17.769-17.699-17.769-17.699c-14.107-14.035 7.142-35.322 21.216-21.297l17.859 17.779 17.849-17.779c14.074-14.025 35.331 7.254 21.216 21.297l-17.769 17.699z"/></g></svg>',
    remove:
      '<svg enable-background="new 0 0 515.556 515.556" height="512" viewBox="0 0 515.556 515.556" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m64.444 451.111c0 35.526 28.902 64.444 64.444 64.444h257.778c35.542 0 64.444-28.918 64.444-64.444v-322.222h-386.666z"/><path d="m322.222 32.222v-32.222h-128.889v32.222h-161.111v64.444h451.111v-64.444z"/></svg>',
    save:
      '<svg enable-background="new 0 0 384 384" version="1.1" viewBox="0 0 384 384" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M369.936,49.936l-35.888-35.888C325.056,5.056,312.848,0,300.112,0H288v96H64V0H32C14.32,0,0,14.32,0,32v320    c0,17.68,14.32,32,32,32h320c17.68,0,32-14.32,32-32V83.888C384,71.152,378.944,58.944,369.936,49.936z M320,320H64V158.944h256    V320z"/><rect x="208" y=".002" width="48" height="64"/><rect x="96" y="192" width="192" height="32"/><rect x="96" y="256" width="192" height="32"/></svg>',
    unsave:
      '<svg height="512pt" viewBox="0 0 512 512" width="512pt" xmlns="http://www.w3.org/2000/svg"><path d="m256 0c-141.164062 0-256 114.835938-256 256s114.835938 256 256 256 256-114.835938 256-256-114.835938-256-256-256zm94.273438 320.105469c8.339843 8.34375 8.339843 21.824219 0 30.167969-4.160157 4.160156-9.621094 6.25-15.085938 6.25-5.460938 0-10.921875-2.089844-15.082031-6.25l-64.105469-64.109376-64.105469 64.109376c-4.160156 4.160156-9.621093 6.25-15.082031 6.25-5.464844 0-10.925781-2.089844-15.085938-6.25-8.339843-8.34375-8.339843-21.824219 0-30.167969l64.109376-64.105469-64.109376-64.105469c-8.339843-8.34375-8.339843-21.824219 0-30.167969 8.34375-8.339843 21.824219-8.339843 30.167969 0l64.105469 64.109376 64.105469-64.109376c8.34375-8.339843 21.824219-8.339843 30.167969 0 8.339843 8.34375 8.339843 21.824219 0 30.167969l-64.109376 64.105469zm0 0"/></svg>',
    refresh:
      '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 459 459" style="enable-background:new 0 0 459 459;" xml:space="preserve"><g><g><path d="M229.5,0C102.751,0,0,102.751,0,229.5S102.751,459,229.5,459S459,356.249,459,229.5S356.249,0,229.5,0z M376.938,266.841 c-3.704,5.5-9.44,9.303-15.948,10.572c-1.589,0.31-3.192,0.463-4.788,0.463c-4.94,0-9.808-1.464-13.965-4.264l-46.315-31.192 c-11.452-7.712-14.483-23.249-6.771-34.701c7.255-10.771,21.426-14.09,32.614-8.032c-12.472-36.96-47.469-63.647-88.583-63.647 c-51.534,0-93.46,41.926-93.46,93.46s41.926,93.46,93.46,93.46c13.807,0,25,11.193,25,25s-11.193,25-25,25 c-79.104,0-143.46-64.355-143.46-143.46s64.355-143.46,143.46-143.46c64.713,0,119.547,43.075,137.359,102.056 c8.322-7.607,21.052-8.848,30.818-2.271c11.452,7.712,14.483,23.249,6.772,34.701L376.938,266.841z"/></g></svg>',
    settings:
      '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M38.86 25.95c.08-.64.14-1.29.14-1.95s-.06-1.31-.14-1.95l4.23-3.31c.38-.3.49-.84.24-1.28l-4-6.93c-.25-.43-.77-.61-1.22-.43l-4.98 2.01c-1.03-.79-2.16-1.46-3.38-1.97l-.75-5.3c-.09-.47-.5-.84-1-.84h-8c-.5 0-.91.37-.99.84l-.75 5.3c-1.22.51-2.35 1.17-3.38 1.97l-4.98-2.01c-.45-.17-.97 0-1.22.43l-4 6.93c-.25.43-.14.97.24 1.28l4.22 3.31c-.08.64-.14 1.29-.14 1.95s.06 1.31.14 1.95l-4.22 3.31c-.38.3-.49.84-.24 1.28l4 6.93c.25.43.77.61 1.22.43l4.98-2.01c1.03.79 2.16 1.46 3.38 1.97l.75 5.3c.08.47.49.84.99.84h8c.5 0 .91-.37.99-.84l.75-5.3c1.22-.51 2.35-1.17 3.38-1.97l4.98 2.01c.45.17.97 0 1.22-.43l4-6.93c.25-.43.14-.97-.24-1.28l-4.22-3.31zm-14.86 5.05c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>',
    brush:
      '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 458.178 458.178" style="enable-background:new 0 0 458.178 458.178;" xml:space="preserve"><g><path d="M130.415,277.741C95.083,313.074,45.038,324.723,0,312.697c5.918,22.164,17.568,43.116,34.956,60.504 c52.721,52.721,138.198,52.721,190.919,0c26.361-26.36,26.36-69.099,0-95.459C199.514,251.38,156.776,251.38,130.415,277.741z"/><path d="M212.771,234.276c12.728,4.827,24.403,12.338,34.317,22.252c10.077,10.077,17.456,21.838,22.19,34.378l53.47-53.47 l-56.568-56.569C245.886,201.161,226.908,220.139,212.771,234.276z"/><path d="M446.462,57.153c-15.621-15.621-40.948-15.621-56.568,0c-5.887,5.887-54.496,54.496-102.501,102.501l56.568,56.569 l102.501-102.501C462.083,98.101,462.083,72.774,446.462,57.153z"/></g></svg>',
    brush2:
      '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 218.1 218.1" style="enable-background:new 0 0 218.1 218.1;" xml:space="preserve"><path d="M207.511,114.183l-34.825-34.825L218.1,33.944l-9.9-24.041l-24.041-9.899l-45.414,45.414L103.92,10.593L64.68,49.832 l103.592,103.59L207.511,114.183z M184.276,22.983c2.994-2.994,7.849-2.993,10.843,0.001c2.994,2.994,2.994,7.849,0,10.843 c-2.994,2.994-7.85,2.994-10.844,0C181.281,30.833,181.282,25.978,184.276,22.983z M6.8,138.976l-6.8-6.8l62.933-62.932 l85.921,85.92L85.92,218.096L39.3,171.476l10.993-20.271l-20.271,10.994l-16.674-16.674l7.763-14.31L6.8,138.976z"/><g></svg>',
  }

  /* USER EVENT ACTIONS */
  // https://gist.github.com/maciejjankowski/2db91642fb9eaa771111f2c0538e4560
  function exportTableToCSV(table) {
    let includeHidden = true

    if (table.options.hiddenColumns && table.options.hiddenColumns.length)
      includeHidden = confirm(
        'You have hidden columns. Would you like to include them in the export?',
      )

    // expecting the filthor rows to be the first 2, so get all but them
    const rows = Array.prototype.slice.call(table.table.rows, 2)

    // Temporary delimiter characters unlikely to be typed by keyboard
    // This is to avoid accidentally splitting the actual contents
    const tmpColDelim = String.fromCharCode(11) // vertical tab character
    const tmpRowDelim = String.fromCharCode(0) // null character

    // actual delimiter characters for CSV format
    const colDelim = '"\t"'
    const rowDelim = '"\r\n"'

    // Grab text from table into CSV formatted string
    let csv =
      '"' +
      rows
        .map(function (row) {
          if (row.style.display === 'none') return null

          let cols = Array.prototype.slice.call(row.querySelectorAll('td, th'))

          // do not include cells that are hidden, if the user does not want them
          if (includeHidden === false)
            cols = cols.filter(
              (cell) => !cell.classList.contains('filthor-hidden'),
            )

          return cols
            .map(function (col) {
              // Clean innertext to remove multiple spaces and jumpline (break csv)
              let text = col.innerText
                .replace(/(\r\n|\n|\r)/gm, '')
                .replace(/(\s\s)/gm, ' ')
                .trim()
              // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
              return text.replace(/"/g, '""') // escape double quotes
            })
            .join(tmpColDelim)
        })
        .filter(function (row) {
          return row !== null
        })
        .join(tmpRowDelim)
        .split(tmpRowDelim)
        .join(rowDelim)
        .split(tmpColDelim)
        .join(colDelim) +
      '"'

    // Data URI
    const bom = decodeURIComponent('%EF%BB%BF') // "\uFEFF\n";
    const byteArray = []
    csv = bom + csv

    const csvA = new Uint16Array(
      csv.split('').map(function (k, v) {
        return k.charCodeAt(0)
      }),
    )

    const blob = new Blob([csvA], { type: 'text/csv;charset=UTF-16LE;' })
    const blobUrl = URL.createObjectURL(blob)

    return blobUrl
  }

  const ACTIONS = {
    // download filtered table as csv
    download: function download(event, table) {
      const csv_string = exportTableToCSV(table)
      // Download it
      let filename = 'export_' + new Date().toLocaleString() + '.csv'
      let link = document.createElement('a')
      link.style.display = 'none'
      link.setAttribute('target', '_blank')
      // https://stackoverflow.com/questions/42462764/javascript-export-csv-encoding-utf-8-issue/42466254
      // https://www.shieldui.com/javascript-unicode-csv-export
      link.setAttribute('href', csv_string)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    // should the match be exact capitalization
    exact: function exact(event, table) {
      if (event.target.checked) table.options.exactMatches = true
      else table.options.exactMatches = false
    },
    // display the help menu
    help: function help(event, table) {
      createHelpModal(event, table)
    },
    // pin/unpin the filter bar
    pin: function pin(event, table) {
      table.filterHtml.classList.toggle('sticky')
    },
    // update filter stats area
    recalculate: function recalculate(event, table) {
      table.filterHtml.querySelector(
        '.table-filthor-stats a',
      ).textContent = `${table.shown} of ${table.tr.length} rows`
    },
    // refresh table contents by fetching the html from server and replacing the rows
    refresh: function (event, table) {
      REFRESH.start(table)
    },
    // clear all filters
    reset: function reset(event, table, doNotFilter) {
      table.filters.forEach((filter) => filter && (filter.value = ''))

      // the select menu
      let presets = table.filterHtml.querySelector('[name=select]')
      if (presets) presets.value = ''

      // the dropdowns
      if (table.dropdowns && table.dropdowns.length) {
        table.dropdowns.forEach((d) => {
          if (d) {
            const inputs = [
              ...d.querySelectorAll('input[type=checkbox]:not(:checked)'),
            ]
            inputs.forEach((i) => (i.checked = true))
          }
        })
      }

      if (doNotFilter) return

      runMultiFilterBundle(table)
    },
    // remove the filter bar
    remove: function remove(event, table) {
      if (
        !confirm(
          'Are you sure you want to remove the filter bar? You will need to refresh the page in order to get it back.',
        )
      )
        return

      // remove any applied filters
      ACTIONS.reset(event, table)

      // remove
      table.filterHtml.remove()
    },
    // select changes
    select: function select(event, table) {
      const tableSelector = table.selector + '--filters'
      const filters = STORE.retrieve(tableSelector, event.target.value)

      // apply the values to the inputs
      for (let i = 0; i < filters.length; i++) {
        if (table.filters[i]) table.filters[i].value = filters[i]
      }

      runMultiFilterBundle(table)
    },
    // display stats
    stats: function stats(event, table) {
      createStatsModal(event, table)
    },
    // save current filter to local storage
    save: function save(event, table) {
      let name = prompt('Give us a short name for the filter preset.')

      if (!name || !name.trim())
        return alert('A name is required. Please try again.')

      name = name.trim()

      // get the filters in local storage and compare the name
      // if name exists, ask if it should be overwritten
      const tableSelector = table.selector + '--filters'
      if (STORE.exists(tableSelector, name)) {
        const overwrite = confirm(
          'Filter by that name already exists, do you want to overwrite it?',
        )
        if (!overwrite) return
      }

      // get the filter values
      const filterValues = table.filters.map((input) =>
        input && input.value ? input.value : null,
      )

      // save to local storage under given name
      STORE.save(tableSelector, name, filterValues)

      updatePresets(table)
    },
    // change settings
    saveSettings: function saveSettings(event, modal, table) {
      const saveBtn = modal.querySelector('.table-filthor-settings-save')
      if (saveBtn.textContent !== 'Save') return false

      // indicate saving started
      saveBtn.textContent = 'SAVING!'

      /* AUTOREFRESHES */
      // should autorefresh
      const shouldAutorefresh = modal.querySelector('[name=autorefresh]')
        .checked
      const autorefreshRate =
        parseInt(modal.querySelector('[name=autorefreshRate]').value) ||
        DEFAULT_OPTIONS.refresh.autorefreshRate

      // should diff
      let shouldDiff =
        modal.querySelector('[name=shouldDiff]').checked ||
        DEFAULT_OPTIONS.refresh.shouldDiff
      let columnToDiffBy =
        modal.querySelector('[name=columnToDiffBy]').value ||
        DEFAULT_OPTIONS.refresh.columnToDiffBy

      // validations
      // - nothing for autorefresh
      // - only for shouldDiff - at this point we need to have the column
      if (shouldDiff && !columnToDiffBy) {
        alert(
          'For diffing you always need to provide the name of the column to serve as basis to diff by.\nCells in this column should contain unique information that is not repeated in any other cell, like an ID. You can use the name as whown in the filtering field.\nAt this point, we will automatically assign first column for the diffing.',
        )
        columnToDiffBy = 0
      }

      // assign to table options
      table.options.refresh.autorefresh = shouldAutorefresh
      table.options.refresh.autorefreshRate = autorefreshRate
      table.options.refresh.shouldDiff = shouldDiff
      table.options.refresh.columnToDiffBy = columnToDiffBy

      // save to STORAGE
      if (shouldAutorefresh || shouldDiff) {
        STORE.save(
          table.selector + '--autorefresh',
          'autorefresh',
          shouldAutorefresh,
        )
        STORE.save(
          table.selector + '--autorefresh',
          'autorefreshRate',
          autorefreshRate,
        )
        STORE.save(table.selector + '--autorefresh', 'shouldDiff', shouldDiff)
        STORE.save(
          table.selector + '--autorefresh',
          'columnToDiffBy',
          columnToDiffBy,
        )
      } else {
        STORE.delete(table.selector + '--autorefresh')
      }

      // handle the autorefreshes
      REFRESH.handleAutorefresh(table)

      /* NUMBER OF ITEMS IN DROPDOWNS */
      const useDropdowns = modal.querySelector('[name=useDropdowns]').checked
      const currentUse = table.options.dropdowns.use
      const hasLimit = modal.querySelector('[name=limit]').checked

      let dropdownChanged = false

      if (useDropdowns === true && !currentUse) {
        table.options.dropdowns.use = true
        STORE.save(table.selector + '--dropdowns', 'use', true)
        dropdownChanged = true
      }

      if (useDropdowns === false) {
        table.options.dropdowns = DEFAULT_OPTIONS.dropdowns
        STORE.save(table.selector + '--dropdowns', 'use', false)
        dropdownChanged = true
      } else if (hasLimit) {
        const limit =
          parseInt(modal.querySelector('[name=limitNumber]').value) || -1

        if (table.options.dropdowns.limit !== limit) {
          table.options.dropdowns.limit = limit
          STORE.save(table.selector + '--dropdowns', 'limit', limit)
          dropdownChanged = true
        }
      } else {
        if (table.options.dropdowns.limit !== -1) {
          table.options.dropdowns.limit = -1
          STORE.save(table.selector + '--dropdowns', 'limit', -1)
          dropdownChanged = true
        }
      }

      if (dropdownChanged) {
        removeDropdowns(table)
        createDropdowns(table)
      }

      console.log(table)

      // indicate save is done
      saveBtn.textContent = 'SAVED!'

      setTimeout(() => (saveBtn.textContent = 'Save'), 3000)
    },
    // remove a filter to local storage, by filter name
    unsave: function unsave(event, table) {
      let name = prompt('Give us the name of the filter you want to delete.')

      if (!name || !name.trim())
        return alert('A name is required. Please try again.')

      name = name.trim()

      // remove from local storage
      const tableSelector = table.selector + '--filters'
      STORE.unsave(tableSelector, name)

      updatePresets(table)
    },
    // settings modal
    updateSettings: function refreshSettings(event, table) {
      createSettingsModal(event, table)
    },

    // excel-like filters
    // show/hide
    reveal: function (event, table) {
      event.target.parentElement.classList.toggle('filthor-filter-revealed')
      event.target.nextElementSibling.scrollTop = 0
    },
    // update
    apply: function (event, table) {
      const inputs = [
        ...event.target
          .closest('.filthor-filter-select')
          .getElementsByTagName('input'),
      ]
      const checked = inputs.filter((i) => i.checked === true)
      const unchecked = inputs.filter((i) => i.checked === false)

      let filterString = ''
      // process whichever is shorter
      if (checked.length === 0) {
        const hasBlank = unchecked.some((input) => input.value === '=blank')

        if (hasBlank) {
          const noBlanks = unchecked
            .map((input) => input.value)
            .filter((value) => value !== '=blank')

          if (noBlanks.length === 0) filterString = '!=blank'
          else if (noBlanks.length === 1)
            filterString = '!=blank && !' + noBlanks[0]
          else
            filterString =
              '!=blank && (' + noBlanks.map((v) => '!' + v).join(' || ') + ')'
        } else filterString = unchecked.map((i) => '!' + i.value).join(' || ')
      } else if (checked.length > unchecked.length) {
        // unchecked are less, so use them for filtering
        filterString = unchecked.map((i) => '!' + i.value).join(' || ')
      } else {
        // checked are less, so use them for filtering
        filterString = checked.map((i) => i.value).join(' || ')
      }

      const index = event.target.closest('.filthor-downdown-wrapper').dataset
        .col

      table.filters[index].value = filterString
      table.filterRow.dispatchEvent(new KeyboardEvent('keyup'))
    },
    // select and deselect
    selectAllFromDropdown: function selectAllFromDropdown(event, table) {
      const parent = event.target.closest('.filthor-filter-select')
      const inputs = Array.prototype.slice.call(
        parent.querySelectorAll('input[type=checkbox]'),
      )
      inputs.forEach((i) => (i.checked = true))

      const index = event.target.closest('.filthor-downdown-wrapper').dataset
        .col
      const toRefresh = table.filters[index].value
      table.filters[index].value = ''

      if (toRefresh) table.filterRow.dispatchEvent(new KeyboardEvent('keyup'))
    },
    deselectAllFromDropdown: function selectAllFromDropdown(event, table) {
      const parent = event.target.closest('.filthor-filter-select')
      const inputs = Array.prototype.slice.call(
        parent.querySelectorAll('input[type=checkbox]'),
      )
      inputs.forEach((i) => (i.checked = false))

      const index = event.target.closest('.filthor-downdown-wrapper').dataset
        .col
      const toRefresh = table.filters[index].value
      table.filters[index].value = ''

      if (toRefresh) table.filterRow.dispatchEvent(new KeyboardEvent('keyup'))
    },

    // modal actions
    // filter table based on which summary option was clicked on
    updateFilterFromSummary: function updateFilterFromSummary(
      event,
      modal,
      table,
    ) {
      const filterValues = JSON.parse(event.target.dataset.value)
      const filterColumnIndices = event.target.dataset.columnIndex.split(',')

      // ACTIONS.reset(null, table, true);

      for (let i = 0, len = filterValues.length; i < len; i++) {
        const val = filterValues[i]
        const col = filterColumnIndices[i]
        table.filters[col].value = val
      }

      runMultiFilterBundle(table)

      modal.querySelector('a.close-modal').click()
    },

    // _template: function (event, table) {},
  }

  /* LOCAL STORAGE */
  const STORE = {
    clear: function clear() {
      localStorage.clear()
      return true
    },
    delete: function del(tableName) {
      localStorage.removeItem(tableName)
      return true
    },
    exists: function exists(tableName, key) {
      let store = localStorage.getItem(tableName)
      if (typeof store === 'string') store = JSON.parse(store)

      if (!key) return store ? true : false
      else return store && store[key] ? true : false
    },
    retrieve: function retrieve(tableName, key) {
      let store = localStorage.getItem(tableName)

      if (!store) return null
      if (typeof store === 'string') store = JSON.parse(store)
      return key ? store[key] : store
    },
    save: function localSave(tableName, key, value, fn) {
      let store = STORE.retrieve(tableName) || {}

      if (fn) store[key] = fn(store[key])
      else store[key] = value

      localStorage.setItem(tableName, JSON.stringify(store))

      return true
    },
    unsave: function localUnsave(tableName, key, fn) {
      let store = STORE.retrieve(tableName) || {}

      if (fn) {
        const newItem = fn(store[key])
        if (newItem) store[key] = newItem
        else delete store[key]
      } else delete store[key]

      if (Object.keys(store).length === 0) STORE.delete(tableName)
      else localStorage.setItem(tableName, JSON.stringify(store))

      return true
    },
  }

  /* SUMMARY TABLES */
  const SUMMARY = {
    isVisible: function (row) {
      return row.style.display !== 'none'
    },
    options: function summaryOptions(table, columns) {
      return table.headers
        .map((headerText, index) =>
          headerText
            ? `<input type="checkbox" ${
                columns.includes(index) ? 'checked' : ''
              } id="${headerText}" value="${index}" /><label for="${headerText}">${headerText}</label>`
            : '',
        )
        .join('')
    },
    create: function createSummary(table, columns) {
      const type =
        table.options.summaryType === 'complex' ? 'complex' : 'simple'
      return this[type].create(table, columns)
    },
    simple: {
      create: function createSimple(table, columns) {
        return columns
          .map((colNum) =>
            this.extract(table.tr, colNum, table.headers[colNum]),
          )
          .map(this.generate)
          .join('')
      },
      extract: function extractSimple(rows, colNum, header) {
        return rows
          .filter(SUMMARY.isVisible)
          .map((row) => row.cells[colNum].textContent.trim())
          .reduce(
            (final, res) => {
              if (final[res]) final[res]++
              else final[res] = 1

              return final
            },
            { __header__: header, __index__: colNum },
          )
      },
      generate: function generateSimple(summary) {
        let str = `<table data-index="${summary.__index__}"><thead><th colspan="2">By ${summary.__header__}</th></thead>`

        const header = summary.__header__
        const index = summary.__index__

        delete summary.__header__
        delete summary.__index__

        // old was without the link in the td
        Object.keys(summary)
          .sort()
          .forEach(
            (key) =>
              (str += `<tr><td>${key}</td><td><a type="button" data-action="updateFilterFromSummary" data-value='["${key}"]' data-column-index="${index}" title="Filter the rows for this value">${summary[key]}</a></td></tr>`),
          )

        str += '</table>'

        return str
      },
    },
    complex: {
      create: function createComplex(table, columns) {
        // meta
        const meta = this.extract(table.tr, columns, 'Complex Summary Table')

        // tHead
        const tHead = `<thead><tr>${columns
          .map((col) => `<th>${table.headers[col]}</th>`)
          .join('')}<th>Count</th></tr></thead>`

        // tBody
        const tBody = this.generate(meta)

        return tBody ? `<table>${tHead}<tbody><tr>${tBody}</tbody></table>` : ''
      },
      extract: function extractComplex(rows, colNums, header) {
        return rows
          .filter(SUMMARY.isVisible)
          .map((row) => {
            return colNums.map((colNum) => row.cells[colNum].textContent.trim())
          })
          .reduce(
            (final, res) => {
              // res is an array
              let curr,
                position = final,
                parent
              while ((curr = res.shift())) {
                // if NOT last item
                let name = curr
                let existingPosition = position.cells.find(
                  (el) => el.name === name,
                )
                if (res.length !== 0) {
                  if (existingPosition) {
                    position = existingPosition
                  } else {
                    // parent
                    parent = position
                    // children
                    position = {
                      _parent: parent,
                      _rowspan: 0,
                      cells: [],
                      name: name,
                    }
                    parent.cells.push(position)
                  }
                  continue
                }

                // if last item
                if (existingPosition) {
                  existingPosition.value++
                } else {
                  position.cells.push({
                    name: curr,
                    value: 1,
                    _parent: position,
                  })

                  // children and other stats
                  position._rowspan++
                  final._rows++

                  while ((parent = position._parent)) {
                    parent._rowspan++
                    position = parent
                  }
                }
              }

              return final
            },
            {
              _header: header,
              _index: colNums.join(),
              _cols: colNums.length + 1,
              _rows: 0,
              _rowspan: 0,
              cells: [],
            },
          )
      },
      generate: function generateComplex(data) {
        // do sorting https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
        return data.cells
          .map((cell, index) => {
            // last 2 cells
            if (cell.value) {
              const meta = { values: [], columns: '' }

              let level = cell

              while (level) {
                if (level.name) meta.values.push(level.name)
                if (level._index) meta.columns = level._index
                level = level._parent
              }

              const last = `<td>${
                cell.name
              }</td><td><a type="button" data-action="updateFilterFromSummary" data-value='${JSON.stringify(
                meta.values.reverse(),
              )}' data-column-index="${
                meta.columns
              }" title="Filter the rows for this value">${
                cell.value
              }</a></td></tr>`
              return last
            }
            // not last 2 cells
            let html = ''
            if (index !== 0) html += '<tr>' // return `<tr><td rowspan="${cell._rowspan}">${cell.name}</td>` + generate(cell);

            return (
              html +
              `<td rowspan="${cell._rowspan}">${cell.name}</td>` +
              this.generate(cell)
            )
          })
          .join('')
      },
    },
  }

  /* LIVE REFRESH */
  const REFRESH = {
    start: async function start(table) {
      this.isRunning = true
      const opts = table.options.refresh

      // pre refresh functions
      if (
        opts &&
        typeof opts === 'object' &&
        opts.post &&
        Array.isArray(opts.pre)
      ) {
        opts.pre.forEach((fn) => fn(table))
      }

      // fetch the new table
      let newTable
      try {
        newTable = await this.fetchTable(table)
      } catch (err) {
        console.log(err)
        alert('Data refresh failed. See error in browser console.')
      }

      if (!newTable) return

      // pre-process the table, if in options, to modify the table
      if (table.options.processors && table.options.processors.pre) {
        table.options.processors.pre.forEach((fn) => fn(newTable))
      }

      if (opts.shouldDiff) {
        this.diff(table, newTable, opts.columnToDiffBy)
      } else {
        // remove old rows
        this.removeRows(table, newTable)

        // add new rows
        this.addRows(table, newTable)
      }

      // update the table object
      table.tr = getBodyRows(table.table) // the rows
      table.shown = table.tr.length // total rows
      const time = new Date()
      table.panel.querySelector(
        '.table-filthor-last-refresh',
      ).textContent = time.toLocaleTimeString() // last refresh date
      table.panel.querySelector(
        '.table-filthor-last-refresh',
      ).title = `Last updated: ${time.toLocaleTimeString()}` // last refresh date

      // post refresh functions
      if (
        opts &&
        typeof opts === 'object' &&
        opts.post &&
        Array.isArray(opts.post)
      ) {
        opts.post.forEach((fn) => fn(table))
      }

      // apply filters, if any
      runMultiFilterBundle(table)

      // hide columns
      hideColumns(table, null, true)

      // update dropdowns
      removeDropdowns(table)
      createDropdowns(table)

      // comments row
      modifyHtmlTableForHighlights(table)

      // all done
      this.isRunning = false
      console.log(table)
    },
    fetchTable: async function fetchTable(table) {
      const str = await (await fetch(location.pathname)).text()
      const parser = new DOMParser()
      const html = parser.parseFromString(str, 'text/html')
      return html.querySelector(table.selector)
    },
    handleAutorefresh: function handleAutorefresh(table) {
      const opts = table.options.refresh

      // clear if already set
      this.stopAutorefresh(table)

      if (opts.autorefresh) {
        this.interval = setInterval(() => {
          if (this.isRunning) return
          this.start(table)
        }, opts.autorefreshRate)
      }
    },
    stopAutorefresh: function stopAutorefresh(table) {
      // clear if already set
      if (this.interval) {
        clearInterval(this.interval)
        this.interval = null
      }
    },
    addRows: function addRows(target, source) {
      const toClone = source.tBodies.length
        ? [...source.tBodies]
        : [...source.rows]
      const cloned = toClone.map((el) => el.cloneNode(true))

      target.table.append(...cloned)
    },
    removeRows: function removeRows(table) {
      const toRemove = table.table.tBodies.length
        ? table.table.tBodies
        : table.tr

      for (let i = 0, len = toRemove.length; i < len; i++) {
        const item = toRemove[i]
        item.remove()
      }
    },

    // diffing
    diff: function diff(table, newTable, columnToDiffBy) {
      // tr.rowIndex || cell.cellIndex
      // columnToDiffBy = column index or thead value to learn the index from

      // ensure columnToDiff is a number
      if (typeof columnToDiffBy !== 'number')
        columnToDiffBy = table.headers.indexOf(columnToDiffBy)
      if (columnToDiffBy === -1) {
        console.log('No such column in this table. Cannot perform diffing.')
        return false
      }

      this.diffByColumn(table, newTable, columnToDiffBy)
    },
    markAddition: function markAddition(row) {
      row.style.fontWeight = 'bolder'
      row.style.boxShadow = '-5px 0px 0px 0px #03ac13'
    },
    markRemoval: function markRemoval(row) {
      row.style.textDecoration = 'line-through'
      row.style.boxShadow = '-5px 0px 0px 0px #ed2939'
    },
    markUpdate: function markUpdate(cell, oldCellClone, newCell) {
      cell.title = oldCellClone.textContent
      cell.style.outline = '2px solid #fd6a02'
    },

    // diff types
    diffByColumn: function diffByColumn(table, newTable, columnToDiffBy) {
      // extract options
      const diffOptions = table.options.diffing

      // using newTable, map its rows extracting the rowIndex of each columnToDiffBy value
      const map = {}
      const newTableRows = getBodyRows(newTable)
      for (let i = 0, len = newTableRows.length; i < len; i++) {
        const cell = newTableRows[i].cells[columnToDiffBy]
        map[cell.textContent] = i
      }

      // iterate over the oldTable row:
      const oldRows = table.tr
      for (let i = 0, len = oldRows.length; i < len; i++) {
        // get the value in columnToDiffBy
        const row = oldRows[i]
        const value = row.cells[columnToDiffBy].textContent

        // if map contains the value: POSSIBLY UPDATED CELLS
        if (map[value]) {
          // compare each cell and update the oldTable accordingly
          const newRowIndex = map[value]
          const newRow = newTableRows[newRowIndex]

          for (
            let cellIndex = 0, cellsLen = row.cells.length;
            cellIndex < cellsLen;
            cellIndex++
          ) {
            const cell = row.cells[cellIndex]
            const newCell = newRow.cells[cellIndex]

            if (cell.textContent === newCell.textContent) {
              const oldCellClone = cell.cloneNode(true)
              cell.innerHTML = newCell.innerHTML

              // MARK_UPDATE
              if (typeof diffOptions.markUpdate === 'function')
                diffOptions.markUpdate(cell, oldCellClone, newCell)
              else this.markUpdate(cell, oldCellClone, newCell)
            }
          }

          // delete the entry from the map
          delete map[value]
        }
        // if map does not contain the value: REMOVED ROW
        else {
          // MARK_REMOVED
          if (typeof diffOptions.markRemoval === 'function')
            diffOptions.markRemoval(row)
          else this.markRemoval(row)
        }
      }
      // if there is still something in the map, add to the oldTable in the same index as in the new table (???)
      // ADDED ROWS
      const remainingIndices = Object.values(map)
      if (remainingIndices.length) {
        for (let i = 0, len = remainingIndices.length; i < len; i++) {
          const index = remainingIndices[i]
          const row = table.table.inserRow(index)
          row.innerHTML = newTableRows[index].innerHTML

          // MARK_ADDITION
          if (typeof diffOptions.markAddition === 'function')
            diffOptions.markAddition(row)
          else this.markAddition(row)
        }
      }
    },

    // non-functions
    interval: null,
    isRunning: false,
  }

  /* GENERAL UTILITIES */
  function debounce(delay, fn) {
    let timerId
    return function (...args) {
      if (timerId) {
        clearTimeout(timerId)
      }
      timerId = setTimeout(() => {
        fn(...args)
        timerId = null
      }, delay)
    }
  }

  function getBodyRows(table) {
    let rows = []
    if (table.tBodies.length) {
      for (let i = 0; i < table.tBodies.length; i++) {
        let body = table.tBodies[i]
        rows = [...rows, ...body.rows]
      }
    } else {
      rows = [...table.rows]
    }

    return rows
  }

  function getTableHeaders(table) {
    let headers = table.tHead
      ? [].slice.call(table.tHead.rows[0].cells)
      : [].slice.call(table.rows[0].cells)

    return headers.map(
      (cell, index) =>
        cell.textContent.trim().replace(/\s\s+/g, ' ') ||
        `[Column ${index + 1}]`,
    )
  }

  function getCssSelector(el) {
    let path = [],
      parent
    while ((parent = el.parentNode)) {
      let tag = el.tagName,
        siblings

      if (el.id) {
        path.unshift(`#${el.id}`)
        break
      }

      siblings = parent.children
      path.unshift(
        [].filter.call(siblings, (sibling) => sibling.tagName === tag)
          .length === 1
          ? tag.toLowerCase()
          : `${tag}:nth-child(${
              1 + [].indexOf.call(siblings, el)
            })`.toLowerCase(),
      )

      el = parent
    }
    return path.join(' > ')
  }

  /* STYLE UTILITIES */
  function addGlobalStyle(css) {
    const head = document.getElementsByTagName('head')[0]

    if (!head) {
      return
    }

    const style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = css
    style.id = `table-filthor-styles-${Date.now()}`

    // could be appended to head as well
    document.body.appendChild(style)

    return style
  }

  function removeGlobalStyle(styleEl) {
    document.body.removeChild(styleEl)
  }

  function applyStyles(opts) {
    let theme = opts.theme
    let css = `
#table-filthor { /*background-color: ${theme.background};*/ color: ${theme.color}; }
/* TRs */
#table-filthor tr.filter-row { height: 3em; position: relative; }
#table-filthor tr.filter-panel { height: 2.5em; font-weight: bold; position: relative; }
/* TDs */
#table-filthor td { vertical-align: middle; color: inherit; position: relative; }
#table-filthor tr.filter-row td { text-align: center; }
#table-filthor tr.filter-panel td { padding: 0 1em; z-index: 1; }
/* RESIZERS */
#table-filthor .filthor-column-resizer { position: absolute; top: 0; right: 0; bottom: 0; width: 5px; cursor: col-resize; user-select: none; }
#table-filthor .filthor-column-resizer:hover, #table-filthor .filthor-column-resizer.filthor-resizing { border-right: 2px solid ${theme.resizerActiveFill}; }
/* FILTER-ROW CONTEXT MENU */
.filthor-filterrow-context-menu { position: absolute; top: 1em; list-style-type: none; margin: 0; padding: 0; background-color: #f7fafc; border: 1px solid #cbd5e0; border-radius: .25rem; padding: .5rem; max-height: 300px; overflow-y: auto; overflow-x: hidden; }
.filthor-filterrow-context-menu label { text-decoration: line-through; cursor: pointer; opacity: 0.7; display: block; font-size: 1.1em;}
.filthor-filterrow-context-menu label:hover {background-color: #e4e4e4;}
.filthor-filterrow-context-menu input:checked + label { text-decoration: none; opacity: 1; }
/* FLEX */
#table-filthor tr.filter-panel td > div { display: flex; flex-direction: row; align-items: stretch; }
#table-filthor tr.filter-panel td > div > * { display: flex; flex-direction: row; align-items: center; }
#table-filthor tr.filter-panel div.table-filthor-actions { border-right: 3px solid ${theme.color}; padding: 0 2em; }
#table-filthor tr.filter-panel div.table-filthor-actions.table-filthor-actions__start { padding-left: 0; }
#table-filthor tr.filter-panel div.table-filthor-actions.table-filthor-actions__end { border-right: 0; padding-right: 0; }
#table-filthor tr.filter-panel div.table-filthor-presets { display: flex; }
#table-filthor tr.filter-panel div.table-filthor-stats { text-align: right; margin-left: auto; }
#table-filthor tr.filter-panel div.table-filthor-stats a { font-size: 1.1em; }
/* STICKY */
#table-filthor.sticky td { background-color: ${theme.background}; }
#table-filthor.sticky tr.filter-panel td { position: sticky; top: 1em; }
#table-filthor.sticky tr.filter-row td { position: sticky; top: 3.7em; }
/* INPUTS AND ACTIONS */
#table-filthor tr.filter-row input[type=text] { position: absolute; left: 5px; top: 0.4em; width: calc(100% - 16px); background-color: ${theme.inputBackground}; color: ${theme.inputColor}; outline: none; border: 1px solid ${theme.inputColor}; font-size: 1.4em; }
#table-filthor a[type=button] { color: ${theme.actionColor}; cursor: pointer; font-size: 1.3em; font-weight: bold; }
#table-filthor input[type=checkbox] { display: none; }
#table-filthor input::placeholder {color: ${theme.color}; font-size: 0.85em; opacity: 0.5; text-align: center; }
#table-filthor select { font-size: 1.1em; margin: 0 0.5em; border: 0; cursor: pointer; }
#table-filthor .filthor-icon { height: 1.1em; width: 1.1em; display:inline-block; padding: 0 0 0 0px; margin: 0 0.5em; cursor: pointer; font-size: unset !important; }
#table-filthor .filthor-icon svg { height: 100%; width: 100%; pointer-events: none; }
#table-filthor .filthor-icon svg > * { fill: ${theme.iconFill} }
#table-filthor .filthor-icon:hover svg > *, #table-filthor :checked + label svg > * { fill: ${theme.iconActiveFill} }
#table-filthor .table-filthor-last-refresh { display: inline-block; margin-left: 1em; }
#table-filthor .table-filthor-last-refresh:before { content: "("; }
#table-filthor .table-filthor-last-refresh:after { content: ")"; }
/* EXCEL-LIKE DROPDOWNS */
.filthor-downdown-wrapper { transform: translateX(20px); opacity: 0; pointer-events: none; position: absolute; top: 8.5px; right: 8px; display: flex; flex-direction:column; align-items: flex-end; transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out; }
.filthor-downdown-wrapper a.filthor-dropdown-icon { width: 12px; height: 12px; line-height: 0.9em; text-align: center;background-color: #f7fafc; color: #111 !important; display: flex; align-items: flex-end; justify-content: center; text-decoration: none; padding: 3px; border-radius: 50%; }
.filthor-downdown-wrapper .filthor-filter-select { scrollbar-width: thin; display: none; max-height: 300px; max-width: 250px; overflow: auto; margin: 2px 0; background-color: #f7fafc; list-style: none; padding: 5px; border: 2px solid #444; border-radius: 5px; }
.filthor-downdown-wrapper.filthor-filter-revealed .filthor-filter-select { display: block; min-width: 80px; }
.filthor-downdown-wrapper .filthor-filter-select label { display: flex; align-items: center; cursor: pointer; }
.filthor-downdown-wrapper .filthor-filter-select input { display: block !important; }
.filthor-downdown-wrapper .filthor-filter-select-top { display: flex; justify-content: space-around; }
.filthor-downdown-wrapper .filthor-filter-select a { color: #333 !important; }

#table-filthor tr.filter-row td:hover input:not(:focus) ~ .filthor-downdown-wrapper { opacity: 1; transform: translateX(0); }
#table-filthor tr.filter-row td:hover input:not(:focus) ~ .filthor-downdown-wrapper .filthor-filter-select { pointer-events: auto; }
#table-filthor tr.filter-row td:hover input:not(:focus) ~ .filthor-downdown-wrapper a.filthor-dropdown-icon { pointer-events: auto; }

#table-filthor input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
#table-filthor input[type=color]::-webkit-color-swatch { border: none; }

/* UTILITIES */
#table-filthor ::-webkit-scrollbar { width: 5px; height: 5px; }
#table-filthor ::-webkit-scrollbar-track { background: #f1f1f1; }
#table-filthor ::-webkit-scrollbar-thumb { background: #888; }
#table-filthor ::-webkit-scrollbar-thumb:hover { background: #555; }

.filthor-hidden { display: none !important; }

@keyframes table-filthor-spin {
    100% {
        -webkit-transform: rotate(360deg);
        transform:rotate(360deg);
    }
}

`

    addGlobalStyle(css)
  }

  /* FILTER UTILITIES */
  const OPERATOR_REGEX = /^[>|<]?=?/ // /^!?[>|<]=?/;

  const MODE_REGEX = /!\||&&|\|\|/ // && = AND; || = OR; !| = XOR

  const DATE_REGEX = {
    dmy: /^(0?[1-9]|[12][0-9]|3[01])[ \/\-/.](0?[1-9]|1[012])[ \/\-/.]\d{4}$/,
    ymd: /^\d{4}[ \/\-/.](0?[1-9]|1[012])[ \/\-/.](0?[1-9]|[12][0-9]|3[01])$/,
    mdy: /^(0?[1-9]|1[012])[ \/\-/.](0?[1-9]|[12][0-9]|3[01])[ \/\-/.](19|20)?[0-9]{2}$/,
  }

  const NUMBER_FUNCTIONS = {
    '>': function (source, target) {
      return source > target
    },
    '<': function (source, target) {
      return source < target
    },
    '>=': function (source, target) {
      return source >= target
    },
    '<=': function (source, target) {
      return source <= target
    },
  }

  const DATE_FUNCTIONS = {
    '>=': function (source, target) {
      return source[3] >= target[3]
    },
    '<=': function (source, target) {
      return source[3] <= target[3]
    },
    '>': function more(source, target) {
      // check years
      if (source[0] > target[0]) return true
      if (source[0] < target[0]) return false

      // check months if years are equal
      if (source[1] > target[1]) return true
      if (source[1] < target[1]) return false

      // check days if months are equal
      if (source[2] > target[2]) return true
      return false
    },
    '<': function less(source, target) {
      // check years
      if (source[0] < target[0]) return true
      if (source[0] > target[0]) return false

      // check months if years are equal
      if (source[1] < target[1]) return true
      if (source[1] > target[1]) return false

      // check days if months are equal
      if (source[2] < target[2]) return true
      return false
    },
  }

  const MODE_FUNCTIONS = {
    '&&': function (text, filters, opts) {
      return filters.every((filter) => _everyMatch(text, filter, opts))
    },
    '||': function (text, filters, opts) {
      return filters.some((filter) => _someMatch(text, filter, opts))
    },
    '!|': function (text, filters, opts) {
      return (
        filters
          .map((filter) => _everyMatch(text, filter, opts))
          .filter((v) => v).length == 1
      )
    }, //https://stackoverflow.com/questions/57714740/how-to-xor-three-variables-in-javascript
  }

  const SPECIAL_CASES = {
    today: () => {
      let now = new Date()
      now.setHours(23, 59, 59, 999)
      return {
        type: 'date',
        value: [
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getTime(),
        ],
      }
    },
    tomorrow: () => {
      let now = new Date()
      now.setDate(now.getDate() + 1)
      now.setHours(23, 59, 59, 999)
      return {
        type: 'date',
        value: [
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getTime(),
        ],
      }
    },
    yesterday: () => {
      let now = new Date()
      now.setDate(now.getDate() - 1)
      now.setHours(23, 59, 59, 999)
      return {
        type: 'date',
        value: [
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getTime(),
        ],
      }
    },
    blank: () => {
      return { type: 'special', value: (text) => text.trim() === '' }
    },
  }

  function toDate(text) {
    let date = ''

    if (DATE_REGEX.dmy.test(text)) {
      date = text.split(/[ \/\-/.]/).reverse()
    } else if (DATE_REGEX.ymd.test(text)) {
      date = text.split(/[ \/\-/.]/)
    }

    date && (date = new Date(date[0], date[1] - 1, date[2]))

    date.setHours(0)

    return date
  }

  /* MODALS */
  function createModal(content) {
    const modal = {
      style: `.table-filthor.modal,
.table-filthor .modal-box {
  z-index: 900;
}
.table-filthor .modal-sandbox {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: transparent;
}
.table-filthor.modal {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: rgb(0,0,0);
  background: rgba(0,0,0,.8);
  overflow: auto;
}
.table-filthor .modal-box {
  position: relative;
  width: 80%;
  max-width: 920px;
  margin: 100px auto;
  animation-name: modalbox;
  animation-duration: .4s;
  animation-timing-function: cubic-bezier(0,0,.3,1.6);

  background: #ECEFF1;
}
.table-filthor .modal-header {
  padding: 20px 40px;
  background: #546E7A;
  color: #ffffff;
}
.table-filthor h3 {
  color: #ffffff;
  font-size: 2.2em;
  font-family: sans-serif;
}
.table-filthor .modal-body {
  padding: 60px 40px;
  font-size: 1.2em;
}
.table-filthor .modal-body summary {
  cursor: pointer;
  outline: 0;
  font-weight: bold;
}
/* Close Button */
.table-filthor a.close-modal {
  float: right;
  cursor: pointer;
}
.table-filthor .modal-footer {
  padding: 0 40px 40px;
}
.table-filthor .modal-footer button {
  border: 1px solid #333333;
  outline: none;
  color: #333333;
  top: 50%;
  left: 50%;
  padding: 20px 40px;
  background: transparent;
  text-decoration: none;
  cursor: pointer;
}
/* Animation */
@-webkit-keyframes modalbox {
  0% {
    top: -250px;
    opacity: 0;
  }
  100% {
    top: 0;
    opacity: 1;
  }
}
@keyframes modalbox {
  0% {
    top: -250px;
    opacity: 0;
  }
  100% {
    top: 0;
    opacity: 1;
  }
}
${content.css ? content.css : ''}`,
      html: `<div class="modal-sandbox"></div>
<div class="modal-box">
  <div class="modal-header">
    <a type="button" class="close-modal">&#10006;</a>
    ${content.header}
  </div>
  <div class="modal-body">
    ${content.body}
  </div>
  <div class="modal-footer">
    <button class="close-modal">Close!</button> ${
      content.actionButtons ? content.actionButtons.join('') : ''
    }
  </div>
</div>`,
    }

    const style = addGlobalStyle(modal.style)

    const modalHTML = document.createElement('div')
    modalHTML.className = 'modal table-filthor'
    modalHTML.innerHTML = modal.html

    function close(event) {
      modalHTML.remove()
      removeGlobalStyle(style)
    }

    modalHTML
      .querySelector('button.close-modal')
      .addEventListener('click', close)
    modalHTML.querySelector('a.close-modal').addEventListener('click', close)

    return modalHTML
  }

  function createHelpModal(event, table) {
    const modal = {
      header: `<h3>Got Questions? We are here to help!</h3>`,
      body: `<p>Table Filthor aims to turn every table on the web into a searchable list. Why? Who knows, but we aim for that. We try to deliver multi-column table filtering, so that you can focus on what matters.</p>
<p>Just enter the search term into the respective field and enjoy.</p>
<p>Apart from the obvious, the fields also support certain expressions which allow you to apply more complex logic to your filter needs. Here is what we can do...</p>
<br /><br />
<details>
    <summary>Data types</summary>
    <dl>
      <dt>Text</dt>
      <dd>The obvious, just enter it straight away.</dd>
      <dt>Dates</dt>
      <dd>Enter one of the following date formats - DD-MM-YYYY or YYYY-MM-DD, and we will recognize it. The separator does not have to be a dash, following are also supported: space, comma, forward slash. <br />Use only in combination with an Operator (see below).</dd>
      <dt>Numbers</dt>
      <dd>Enter a number - interger or decimal, and we will recognize that as well. The decimal separator should be a dot (.). <br />Very useful in combination with operators like > or <.</dd>
    </dl>
</details>
    <br /><br />
<details>
    <summary>Modes</summary>
    <p>Modes allow you to chain multiple conditions for the same cell.</p>
    <dl>
      <dt>&&</dt>
      <dd>Allows you to check each cell for multiple condition at the same time.<br /> For example, "pizza && hamburger" will check if a cell contains both words pizza and hamburger.</dd>
      <dt>||</dt>
      <dd>Allows you to check if each cell conforms to at least 1 of the conditions.<br /> For example, "pizza || hamburger" will check if a cell contains either pizza, or hamburger, or both at the same time.</dd>
      <dt>!|</dt>
      <dd>Allows you to check if each cell conforms to only 1 of the conditions.<br /> For example, "pizza !| hamburger" will check if a cell contains either pizza, or hamburger, but NOT both at the same time.</dd>
      <dt>++</dt>
      <dd>Same as && above.</dd>
      <dt>--</dt>
      <dd>Allows you to exclude a value from the search.<br /> For example, "pizza --hamburger" will check if a cell contains the word pizza without any mention of hamburger. <br />Essentially, the same as using a combination of &&! (see ! below).</dd>
      <dt>Combining modes</dt>
      <dd><p>It is also possible to combine operators of different type. That is, you can do a && and || search in the same filter.</p>
        <p>How it works?</p>
        <p>Same as in maths - using parentheses (). A && B || C is ambiguous in terms of order of evaluation. Therefore, just group your intention to give "(A && B) || C" or "A && (B || C)". Deep nesting is also possible. Here are asome more examples.</p>
        <p>
          <i>Will work     - ( A !| (!B || !C)) && D </i> <br />
          <i>Will work     - ( (A && B) || !C) !| D </i> <br />
          <i>Will work     - ( (A && B && !C) !| (!D || !E)) && F </i> <br />
          <i>Will not work - !(A && B) || C </i>  <- inverting the whole group is not supported (yet).
        </p></dd>
    </dl>
</details>
<br /><br />
<details>
    <summary>Operators - the fun (math) part</summary>
    <dl>
      <dt> > </dt>
      <dd>Filters results greater than what you are searching for. <br />Used in combination with dates and numbers.</dd>
      <dt> < </dt>
      <dd>Filters results less than what you are searching for. <br />Used in combination with dates and numbers.</dd>
      <dt> >= </dt>
      <dd>Filters results greater than or equal to what you are searching for. <br />Used in combination with dates and numbers.</dd>
      <dt> <= </dt>
      <dd>Filters results less than or equal to what you are searching for. <br />Used in combination with dates and numbers.</dd>
      <dt> ! </dt>
      <dd>Filters results that do NOT contain the phrase after it.</dd>
    </dl>
</details>
<br /><br />
<details>
    <summary>Other features</summary>
    <dl>
      <dt> Hide columns </dt>
      <dd>Right-click on the control panel (the row above the filters) and pick the column you want to show / hide from the dropdown.</dd>
      <dt> Resize columns </dt>
      <dd>Hover your mouse towards the right end of the filter cell and a narrow yellow bar will show. Click over it and drag your mouse.</dd>
      <dt> Save filters </dt>
      <dd>Enter your filter, click on the floppy disk icon on the control panel and enter a name for it. Next time you need it, you should be able to find it in the dropdown menu. <br/>To delete, click the X icon.</dd>
      <dt> Export as CSV </dt>
      <dd>Click the cloud icon on the control panel and your table will be exported in CSV format - filtered or unfiltered, depending you ints current state. <br /> NOTE: Hidden columns will be exported as well.</dd>
      <dt> Special words </dt>
      <dd>Some words combined with an operator can be used as shortcuts to achieve a special filter. Here is the current list: <br /><br />
          <b>today</b> - will result in current date, end of day. Useful in combination with >, <, >= or <= to filter date columns by before or after (and including) today.<br>
          <b>tomorrow</b> - will result in tomorrow's date, end of day. Useful in combination with >, <, >= or <= to filter date columns by before or after (and including) tomorrow.<br>
          <b>yesterday</b> - will result in yesterday's date, end of day. Useful in combination with >, <, >= or <= to filter date columns by before or after (and including) yesterday.<br>
          <b>blank</b> - will filter blank cells. Used as "=blank" or "!=blank".
      </dd>
    </dl>
</details>
<br /><br />
<p>HAPPY FILTERING!</p>`,
    }

    const el = createModal(modal)

    document.body.appendChild(el)
  }

  function createStatsModal(event, table) {
    // already checked
    const store = STORE.retrieve(table.selector + '--summaries')
    let columns = store ? store.checked : []

    // checkboxes
    const checkboxes = SUMMARY.options(table, columns)

    // tables
    const tables = SUMMARY.create(table, columns)

    const modal = {
      header: '<h3>Your Stats</h3>',
      body: `<p>Apart from the obvious, the fields also support certain expressions which allow you to apply more complex logic to your filter needs. Here is what we can do...</p>
<br /><br />
<details>
  <summary>Stat Settings</summary>
  <p>Change summary display type.</p>
  <div class="table-filthor-summary-inputs">
    <input type="radio" id="simple-summary" value="simple" name="summary" ${
      table.options.summaryType !== 'complex' ? 'checked' : ''
    } /><label for="simple-summary">Simple Summary</label>
    <input type="radio" id="complex-summary" value="complex" name="summary" ${
      table.options.summaryType === 'complex' ? 'checked' : ''
    } /><label for="complex-summary">Complex Summary</label>
  </div>
  <p>Select which columns you want to see the stats for.</p>
  <div class="table-filthor-summary-inputs">
    ${checkboxes}
  </div>
</details>
<div class="table-filthor-summaries">
  ${tables}
</div>`,
      css: `.table-filthor-summary-inputs {
  display: flex;
  flex-wrap: wrap;
  margin: 0 0 1em -10px;
}
.table-filthor-summary-inputs input { display: none; }
.table-filthor-summary-inputs label {
  flex: 1 0 200px;
  box-sizing: border-box;
  background: #e6e6e6;
  padding: 10px;
  margin-left: 10px;
  margin-top: 10px;
}
.table-filthor-summary-inputs :checked + label {
  background: teal;
  color: white;
}
.table-filthor-summaries { display: flex; flex-wrap: wrap; }
.table-filthor-summaries table {
  border-collapse: collapse;
  margin: 2em 2em 0 0;
  flex: 1 0 200px;
}
.table-filthor-summaries td, .table-filthor-summaries th {
  border: 2px solid teal;
  padding: 8px;
}
.table-filthor-summaries tr:nth-child(even){background-color: #41828229;}
.table-filthor-summaries tr:hover {background-color: #ddd;}
.table-filthor-summaries th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: left;
  background-color: teal;
  color: white;
}
.table-filthor-summaries a {
  text-decoration: underline;
  cursor: pointer;
  color: blue;
  display: block;
  text-align: center;
}`,
    }

    // modal
    const modalHtml = createModal(modal)

    // events
    modalHtml.addEventListener('change', onChange)
    modalHtml.addEventListener('click', onClick.bind(table))

    document.body.appendChild(modalHtml)

    function onChange(event) {
      // if radio to change the table type
      if (event.target.type === 'radio') {
        table.options.summaryType = event.target.value

        // add the tables
        const tableStr = SUMMARY.create(table, columns)
        modalHtml.querySelector('.table-filthor-summaries').innerHTML = tableStr

        STORE.save(
          table.selector + '--summaries',
          'summaryType',
          event.target.value,
        )
        return
      }

      // if checkbox
      const colNum = parseInt(event.target.value)

      if (event.target.checked) {
        // remember
        columns.push(colNum)
      } else {
        // forget
        columns = columns.filter((num) => num !== colNum)
      }

      // add the tables
      const tableStr = SUMMARY.create(table, columns)
      modalHtml.querySelector('.table-filthor-summaries').innerHTML = tableStr

      // save the new options
      STORE.save(table.selector + '--summaries', 'checked', columns)
    }

    function onClick(event) {
      const action = event.target.dataset.action

      if (action && ACTIONS[action]) ACTIONS[action](event, modalHtml, this)
    }
  }

  function createSettingsModal(event, table) {
    const modal = {
      header: '<h3>Here are some settings you can control</h3>',
      body: `<h4>Data refreshes</h4>
<br>
<div class="table-filthor-settings-seciton">
  <input type="checkbox" id="table-filthor-autorefresh" class="table-filthor-conditional-show-controller" name="autorefresh" ${
    table.options.refresh.autorefresh ? 'checked' : ''
  } />
  <label for="table-filthor-autorefresh">Turn on autorefreshes.</label>

  <div class="table-filthor-conditional-show">
    Refresh table data every <input type="number" id="table-filthor-autorefresh-rate" name="autorefreshRate" value="${
      table.options.refresh.autorefreshRate
    }" /> milliseconds (defaults to 1 hour).
  </div>
</div>

<div class="table-filthor-settings-seciton">
  <input type="checkbox" id="table-filthor-diff" class="table-filthor-conditional-show-controller" name="shouldDiff" ${
    table.options.refresh.shouldDiff ? 'checked' : ''
  } />
  <label for="table-filthor-diff">Turn on advance refreshing which shows differences between the old version and the updates.</label>

  <div class="table-filthor-conditional-show">
    (Mandatory) Column <input type="text" id="table-filthor-columnToDiffBy" name="columnToDiffBy" value="${
      table.options.refresh.columnToDiffBy || ''
    }" /> contains unique information to identify each of the diffing rows.
  </div>
</div>

<div class="table-filthor-settings-seciton">
  <h4>Dropdowns</h4>
  <br>

  <input type="checkbox" id="table-filthor-dropdowns-disable" class="table-filthor-conditional-show-controller" name="useDropdowns" ${
    table.options.dropdowns.use ? 'checked' : ''
  } />
  <label for="table-filthor-dropdowns-disable">Use dropdown menus in the filters.</label>

  <div class="table-filthor-conditional-show">
    <input type="checkbox" id="table-filthor-dropdowns" class="table-filthor-conditional-show-controller" name="limit" ${
      table.options.dropdowns.limit !== -1 ? 'checked' : ''
    } />
    <label for="table-filthor-dropdowns">Add limit to the number of items in filter dropdowns (unselect for limitless items).</label>

    <div class="table-filthor-conditional-show">
      Create manu if there are less than <input type="number" id="table-filthor-limit-number" name="limitNumber" value="${
        table.options.dropdowns.limit === -1
          ? ''
          : table.options.dropdowns.limit
      }" /> items.
    </div>
  </div>
</div>`,
      css: `.table-filthor-settings-seciton {margin-bottom: 2em;}
.table-filthor-conditional-show { display: none; }
.table-filthor-conditional-show-controller:checked ~ .table-filthor-conditional-show { display: block; margin: 1em 0; }
.table-filthor-settings-save { background-color: #546E7A !important; color: white !important; }
.table-filthor-settings-save:hover { opacity: 0.7; }`,
      actionButtons: [
        '<button class="table-filthor-settings-save" data-action="saveSettings">Save</button>',
      ],
    }

    const modalHtml = createModal(modal)

    function onClick(event) {
      const action = event.target.dataset.action

      if (action && ACTIONS[action]) ACTIONS[action](event, modalHtml, this)
    }

    modalHtml.addEventListener('click', onClick.bind(table))

    document.body.appendChild(modalHtml)
  }

  /* FILTER VALUE PROCESSING AND COMPARISON */
  /* MDIFIED
    create && (!me || bla) && (mod !| pizza) && !HQ NPI
    - each subfilter should return true or false, ultimately
    - use map to iterate through the the subfilters with the main filter-running function as callback
    
    - at the end, compare the subfilter results based on mode
    {
    mode: &&,
       filters: [
         { type: text, modifier: null, expression: null, value: [create, mod] },
         { type: text, modifier: invert, expression: null, value: [HQ NPI] },
       ],
       subfilters: [
          { mode: ||,
            filters: [
               { type: text, modifier: invert, expression, null, value: [me] },
               { type: text, modifier: null, expression, null, value: [bla] }
             ],
            subfilters: null
           },
           ...
        ]
    } */
  // non-regexp - https://stackoverflow.com/questions/21523184/split-string-using-multiple-nested-delimiters
  function convertValue(text) {
    if (!text) return null

    // split the value - might be already split in a previous round, so no need to do it again
    let splitValue =
      typeof text === 'string' ? splitToLevelsByParentheses(text) : text

    if (typeof splitValue === 'string') {
      splitValue = [splitValue]
    } else {
      splitValue = splitValue.reduce(
        (final, val) => {
          if (typeof val === 'object') final.push(val)
          else if (typeof val === 'string') final[0] += val
          return final
        },
        [''],
      )
    }

    let value = splitValue.shift()
    let subfilters = splitValue

    // insert the shortcuts
    value = value.replace('--', '&&!').replace('++', '&&')

    // find the mode - AND OR
    let mode = value.match(MODE_REGEX)
    mode = mode ? mode[0] : '&&'

    // return the filters
    let filters = value
      .split(mode)
      .map((v) => v.trim())
      .map(_convertValue)
      .filter((val) => val !== null)

    filters = filters
      .reduce(
        (final, filter) => {
          if (filter.type !== 'text') {
            final.push(filter)
            return final
          }

          if (filter.modifier) final[0].value.push(filter.value)
          else final[1].value.push(filter.value)

          return final
        },
        [
          { type: 'text', modifier: 'invert', expression: null, value: [] }, // modified
          { type: 'text', modifier: null, expression: null, value: [] }, // regular
        ],
      )
      .filter((val) => val.value.length !== 0)

    return {
      mode: mode,
      filters: filters,
      subfilters: subfilters.map(convertValue),
    }
  }

  function splitToLevelsByParentheses(text) {
    if (Array.isArray(text))
      return text.map((t) => splitToLevelsByParentheses(t))

    var d = null,
      str_split = text.split(/([\(\)])/).filter((t) => t.trim()),
      result = [],
      tr = '',
      depth = 0,
      groups = []
    if (str_split.length <= 1) return text
    for (let i = 0; i < str_split.length; i++) {
      tr = str_split[i]

      if (tr === '(') {
        if (d === null) {
          if (result.length) groups.push(result.join(''))
          d = depth
          result = []
        }
        depth++
      }
      if (tr === ')') {
        depth--
      }

      result.push(tr)
      if (d !== null && d === depth && tr === ')') {
        let fr = result.join('')
        if (fr === text && RegExp('^\\(').test(fr) && RegExp('\\)$').test(fr)) {
          let ntext = text.replace(/(^\(|\)$)/g, '')
          fr = splitToLevelsByParentheses(ntext)
        }
        groups.push(fr)
        d = null
        result = []
      }
    }
    if (result.length) groups.push(result.join(''))
    return groups.map((g) => splitToLevelsByParentheses(g))
  }

  function _convertValue(value) {
    if (!value) return null

    // check for modifiers
    let modifier = null
    if (value[0] === '!') {
      modifier = 'invert'
      value = value.slice(1).trim()
    }

    // check for expressions
    let expression = value.match(OPERATOR_REGEX) || []
    if (expression[0]) {
      let func = expression[0]
      const text = value.slice(func.length).trim()

      // is date
      if (DATE_REGEX.dmy.test(text) || DATE_REGEX.ymd.test(text)) {
        let fDate = toDate(text)

        if (fDate && fDate.toString() !== 'Invalid Date') {
          return {
            type: 'date',
            value: [
              fDate.getFullYear(),
              fDate.getMonth(),
              fDate.getDate(),
              fDate.getTime(),
            ],
            expression: func,
            modifier: modifier,
          }
        }
      }

      // is number
      if (+text)
        return {
          type: 'number',
          value: +text,
          expression: func,
          modifier: modifier,
        }

      // special cases
      if (SPECIAL_CASES[text]) {
        let value = SPECIAL_CASES[text]()
        return { ...value, expression: func, modifier: modifier }
      }
    }

    // if plain text
    return { type: 'text', value: value, expression: null, modifier: modifier }
  }

  function doesMatch(text, filter, opts) {
    // combine filters and subfilters
    const final = [
      MODE_FUNCTIONS[filter.mode](text, filter.filters, opts), // evaluate the filters
      ...filter.subfilters.map((f) => doesMatch(text, f, opts)), // evaluate subfilters
    ]

    // combine the results ( each would be a single boolean )
    return MODE_FUNCTIONS[filter.mode](text, final, opts)
  }

  // MODIFIED
  function _everyMatch(text, filterValue, opts) {
    return _generalMatch(text, filterValue, opts, 'every')
  }
  function _someMatch(text, filterValue, opts) {
    return _generalMatch(text, filterValue, opts, 'some')
  }
  // generalized function... just added mode = can be every or some
  function _generalMatch(text, filterValue, opts, mode) {
    if (typeof filterValue === 'boolean') return filterValue

    // at this point filterValue can only be an object
    let isMatch

    // if date
    if (filterValue.type === 'date') {
      let tDate = toDate(text)

      if (tDate && tDate.toString() !== 'Invalid Date') {
        tDate = [
          tDate.getFullYear(),
          tDate.getMonth(),
          tDate.getDate(),
          tDate.getTime(),
        ]
        isMatch = DATE_FUNCTIONS[filterValue.expression](
          tDate,
          filterValue.value,
        )
      }
    }

    // if number
    else if (filterValue.type === 'number')
      isMatch = NUMBER_FUNCTIONS[filterValue.expression](
        +text,
        filterValue.value,
      )
    // if special
    else if (filterValue.type === 'special') {
      isMatch = filterValue.value(text)
    }

    // if plain text - value is array in this case
    else if (opts && opts.exactMatches)
      isMatch = filterValue.value[mode]((word) => text.indexOf(word) > -1)
    else
      isMatch = filterValue.value[mode](
        (word) => text.toLowerCase().indexOf(word.toLowerCase()) > -1,
      )

    // return
    return filterValue.modifier ? !isMatch : isMatch
  }

  /* FILTER BAR CREATIONS */
  function createFilters(table) {
    const f = document.createElement('thead')
    f.id = 'table-filthor'
    f.className = 'sticky'

    // filter row
    table.filterRow = createFilterRow(table)

    // filter control panel
    table.panel = createFilterControlPanel(table)

    f.append(table.panel, table.filterRow)

    return f
  }

  function createFilterControlPanel(table) {
    // filterRow actions panel
    const panel = document.createElement('tr')
    panel.className = 'filter-panel'
    panel.innerHTML = `<td colspan="${table.tr[0].cells.length}"><div>
<div class="table-filthor-actions table-filthor-actions__start">
   <input type='checkbox' name='pin' value='pinned' id="pinning" checked/>
   <label for="pinning" class="filthor-icon" title="Pin/unpin the filter bar">${
     ASSETS.pin
   }</label>
   <input type='checkbox' name='exact' value='exact' id="exact" />
   <label for="exact" class="filthor-icon" title="Search exact capitalization">${
     ASSETS.exact
   }</label>
</div>
<div class="table-filthor-actions">
   <a class="filthor-icon" type="button" data-action="reset" title="Clear all filters">${
     ASSETS.filter
   }</a>
   <a class="filthor-icon" type="button" data-action="remove" title="Remove the filters' bar">${
     ASSETS.remove
   }</a>
   <a class="filthor-icon" type="button" data-action="download" title="Download table as CSV file">${
     ASSETS.download
   }</a>
</div>
<div class="table-filthor-actions table-filthor-presets">
   <a class="filthor-icon" type="button" data-action="save" title="Save current filter for future use">${
     ASSETS.save
   }</a>
   <a class="filthor-icon" type="button" data-action="unsave" title="Delete a saved filter by its name">${
     ASSETS.unsave
   }</a>
</div>
${
  table.options.refresh
    ? `<div class="table-filthor-actions">
   <a class="filthor-icon" type="button" data-action="refresh" title="Manually re-fetch table from server">${
     ASSETS.refresh
   }</a>
   <span class="table-filthor-last-refresh" title="Last updated: ${new Date().toLocaleString()}">${new Date().toLocaleTimeString()}</span>
</div>`
    : ''
}
<div class="table-filthor-actions table-filthor-actions__end">
   <a class="filthor-icon" type="button" data-action="updateSettings" title="Update settings">${
     ASSETS.settings
   }</a>
   <a class="filthor-icon" type="button" data-action="help" title="Open info panel">${
     ASSETS.help
   }</a>
</div>
<div class="table-filthor-stats">
   <a type="button" data-action="stats" title="See more stats">${
     table.shown
   } of ${table.tr.length} rows</a>
</div>
</td>`

    // add event delegation
    // panel.addEventListener('click', handleClick.bind(table) );
    // panel.addEventListener('change', handleChange.bind(table) );

    return panel
  }

  function createFilterRow(table) {
    table.filters = []

    const filterRow = document.createElement('tr')
    filterRow.className = 'filter-row'

    table.filterRow = filterRow

    // fill with TDs
    for (let i = 0, l = table.headers.length; i < l; i++) {
      addFilterCell(table)
    }

    // return
    return filterRow
  }

  function addFilterCell(table) {
    const i = table.filters.length
    // create filter cell
    const td = document.createElement('td')

    // create filter field only if needed
    if (table.options.skipColumns.indexOf(i) !== -1) {
      table.filters.push(null)
    } else {
      // the input
      const input = createTextInput(i, table.headers[i])
      table.filters.push(input)
      td.appendChild(input)
    }

    table.filterRow.appendChild(td)
  }

  function createTextInput(index, placeholder) {
    const input = document.createElement('input')
    input.type = 'text'
    input.dataset.index = index
    input.placeholder = placeholder

    return input
  }

  function updatePresets(table) {
    // remove previous select if such exists
    const previous = table.filterHtml.querySelector(
      '.table-filthor-presets select',
    )
    if (previous) previous.remove()

    // if no more presets exist, do not add a select
    const tableSelector = table.selector + '--filters'
    if (!STORE.exists(tableSelector)) return

    // presets exist, so add a select
    const store = STORE.retrieve(tableSelector)

    const select = document.createElement('select')
    select.name = 'select'
    const options =
      '<option value="" disabled selected>Pick a preset</option>' +
      Object.keys(store)
        .map((preset) => `<option value="${preset}">${preset}</option>`)
        .join('')
    select.innerHTML = options

    table.filterHtml.querySelector('.table-filthor-presets').appendChild(select)

    // SummaryType
    const summaryStore = STORE.retrieve(table.selector + '--summaries')
    if (summaryStore && summaryStore.summaryType)
      table.options.summaryType = summaryStore.summaryType

    // Autorefreshes
    const autorefreshStore = STORE.retrieve(table.selector + '--autorefresh')
    if (autorefreshStore) {
      if (autorefreshStore.autorefresh)
        table.options.refresh.autorefresh = autorefreshStore.autorefresh
      if (autorefreshStore.autorefreshRate)
        table.options.refresh.autorefreshRate = autorefreshStore.autorefreshRate
      if (autorefreshStore.shouldDiff)
        table.options.refresh.shouldDiff = autorefreshStore.shouldDiff
      if (autorefreshStore.columnToDiffBy)
        table.options.refresh.columnToDiffBy = autorefreshStore.columnToDiffBy

      REFRESH.handleAutorefresh(table)
    }

    // Dropdowns
    const dropdowns = STORE.retrieve(table.selector + '--dropdowns') || {}

    // if the user explicitly set the dropdowns
    if (dropdowns.use === false || dropdowns.use === true) {
      dropdowns.use
        ? (table.options.dropdowns = {
            ...table.options.dropdowns,
            ...dropdowns,
          })
        : (table.options.dropdowns = DEFAULT_OPTIONS.dropdowns)
    }
    // else the user was not explicit, so the programmer decides the user, user helps with the settings
    else {
      table.options.dropdowns = { ...table.options.dropdowns, ...dropdowns }
    }
  }

  function attachEvents(table) {
    // add event delegation
    table.filterHtml.addEventListener('click', handleClick.bind(table))
    table.filterHtml.addEventListener('change', handleChange.bind(table))

    // table.panel.addEventListener('click', handleClick.bind(table) );
    // table.panel.addEventListener('change', handleChange.bind(table) );

    // table.filterRow.addEventListener('click', handleClick.bind(table) );
    // table.filterRow.addEventListener('change', handleChange.bind(table) );

    // add event delegation
    table.filterRow.addEventListener(
      'keyup',
      debounce(table.options.debouceTime, handleKeyUp.bind(table)),
    )
  }

  /* EVENT HANDLERS */
  function handleKeyUp(event) {
    if (!event.target.tagName === 'INPUT') return

    runMultiFilterBundle(this)
  }

  function handleClick(event) {
    const action = event.target.dataset.action

    if (action && ACTIONS[action]) ACTIONS[action](event, this)
  }

  function handleChange(event) {
    const action = event.target.name

    if (action && ACTIONS[action]) ACTIONS[action](event, this)
  }

  /* RESIZERS */
  function addResizers(table) {
    const resizers = (table.resizers = [])
    const filterCells = table.filterRow.cells

    for (let i = 0, l = filterCells.length; i < l; i++) {
      const td = filterCells[i]
      addResizer(table, td)

      /*
            // the resizer
            const resizer = document.createElement('div');
            resizer.className = 'filthor-column-resizer';
            td.appendChild(resizer);
            resizers.push(resizer);

            // activate
            const col = table.headerHTML[i];
            createResizableColumn(col, resizer);*/
    }
  }

  function addResizer(table, cell) {
    // the resizer
    const resizer = document.createElement('div')
    resizer.className = 'filthor-column-resizer'
    cell.appendChild(resizer)
    table.resizers.push(resizer)

    // activate
    const col = table.headerHTML[table.resizers.length - 1]
    createResizableColumn(col, resizer)
  }

  function createResizableColumn(col, resizer) {
    // Track the current position of mouse
    let x = 0
    let w = 0

    const mouseDownHandler = function (e) {
      // Get the current mouse position
      x = e.clientX

      // Calculate the current width of column
      const styles = window.getComputedStyle(col)
      w = parseInt(styles.width, 10)

      // Attach listeners for document's events
      document.addEventListener('mousemove', mouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)

      resizer.classList.add('resizing')
    }

    const mouseMoveHandler = function (e) {
      // Determine how far the mouse has been moved
      const dx = e.clientX - x

      // Update the width of column
      col.style.width = `${w + dx}px`
    }

    // When user releases the mouse, remove the existing event listeners
    const mouseUpHandler = function () {
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)

      resizer.classList.remove('resizing')
    }

    resizer.addEventListener('mousedown', mouseDownHandler)
  }

  /* SHOW / HIDE COLUMNS */
  function rightClickMenu(table) {
    let defaultHiddenColumns =
      STORE.retrieve(table.selector + '--context-menu', 'hidden') ||
      table.options.hiddenColumns // there should be an [] by default in the options
    // keep reference
    table.options.hiddenColumns = defaultHiddenColumns

    // build the menu
    const menu = document.createElement('ul')
    menu.className = 'filthor-filterrow-context-menu filthor-hidden'
    table.contextMenu = menu
    table.panel.cells[0].appendChild(menu)

    // add items
    updateHideColumnItems(table)

    // events
    menu.addEventListener('change', function (e) {
      e.target.checked
        ? showColumn(table, e.target.value)
        : hideColumn(table, e.target.value)

      // save or unsave to local storage
      const colNumber = parseInt(e.target.value)
      if (e.target.checked) {
        defaultHiddenColumns = defaultHiddenColumns.filter(
          (val) => val !== colNumber,
        )
      } else {
        defaultHiddenColumns.push(colNumber)
      }

      STORE.save(
        table.selector + '--context-menu',
        'hidden',
        defaultHiddenColumns,
      )
    })

    // Handle the `contextmenu` event of the header
    table.panel.cells[0].addEventListener('contextmenu', function (e) {
      // do nothing if the right click is within the ocntext menu itself
      if (menu.contains(e.target)) return

      // Prevent the default context menu from being shown
      e.preventDefault()

      // Show the menu
      const rect = table.filterRow.getBoundingClientRect()
      const x = e.clientX - rect.left
      // const y = e.clientY - rect.top;

      // Set the position for menu
      // menu.style.top = `${y}px`;
      menu.style.left = `${x}px`

      menu.classList.remove('filthor-hidden')

      document.addEventListener('click', documentClickHandler(table))

      // keep reference in options
      table.options.hiddenColumns = defaultHiddenColumns
    })
  }

  function updateHideColumnItems(table) {
    table.contextMenu.innerHTML = ''
    const defaultHiddenColumns = table.options.hiddenColumns
    const headers = table.headers

    for (let i = 0, l = headers.length; i < l; i++) {
      // Build the menu item
      const li = document.createElement('li')

      const label = document.createElement('label')
      label.setAttribute('for', table.selector + '-' + headers[i] + '-' + i)
      label.textContent = headers[i]

      const checkbox = document.createElement('input')
      checkbox.setAttribute('type', 'checkbox')
      checkbox.value = i
      checkbox.id = table.selector + '-' + headers[i] + '-' + i
      checkbox.checked = defaultHiddenColumns.indexOf(i) === -1 ? true : false

      li.appendChild(checkbox)
      li.appendChild(label)

      li.appendChild(label)
      table.contextMenu.appendChild(li)
    }

    // hide columns if any
    if (defaultHiddenColumns.length) hideColumns(table, defaultHiddenColumns)
  }

  function hideColumns(table, indexArray, forcedReset) {
    if (forcedReset) {
      ;[...table.filterRow.cells].forEach((cell) =>
        cell.classList.remove('filthor-hidden'),
      )
    }

    if (!indexArray) indexArray = table.options.hiddenColumns || []
    indexArray.map((index) => hideColumn(table, index))
  }

  function hideColumn(table, index) {
    // check if already hidden
    if (table.filterRow.cells[index].classList.contains('filthor-hidden'))
      return

    getColumn(table.table, index).forEach(function (cell) {
      //cell.style.display = 'none';
      cell.classList.add('filthor-hidden')
    })
  }

  function showColumn(table, index) {
    // do nothing if already shown
    if (!table.filterRow.cells[index].classList.contains('filthor-hidden'))
      return

    getColumn(table.table, index).forEach(function (cell) {
      //cell.style.display = '';
      cell.classList.remove('filthor-hidden')
    })
  }

  function getColumn(htmlTable, col) {
    var rows = htmlTable.rows
    var n = htmlTable.rows.length
    var i,
      cols = [],
      tr,
      td

    // First check that col is not less then 0
    if (col < 0) {
      return cols
    }

    for (i = 0; i < n; i++) {
      tr = rows[i]

      if (tr.classList.contains('filter-panel')) continue

      if (tr.cells.length > col) {
        // Check that cell exists before you try to access it.
        td = tr.cells[col]
        cols.push(td)
      }
    }
    return cols
  }

  function documentClickHandler(table) {
    return function handler(e) {
      const isClickedOutside = !table.contextMenu.contains(e.target)
      if (isClickedOutside) {
        // Hide the menu
        table.contextMenu.classList.add('filthor-hidden')

        // Remove the event handler
        document.removeEventListener('click', handler)
      }
    }
  }

  /* DROPDOWN FILTERS */
  function createDropdowns(table) {
    if (!table.options.dropdowns.use) return

    table.dropdowns = new Array(table.headers.length).fill(null)

    const html = table.table

    const columns = table.options.dropdowns.columns || table.headers

    const columnIndices = columns
      .map((col) => {
        if (typeof col === 'number') return col
        return table.headers.indexOf(col)
      })
      .filter((c) => c != -1 && table.options.skipColumns.indexOf(c) === -1)

    for (let i = 0, len = columnIndices.length; i < len; i++) {
      createDropdown(table, columnIndices[i])
    }
  }

  function createDropdown(table, columnIndex, el) {
    const values = getUniqueColumnValues(
      table.tr,
      columnIndex,
      table.options.dropdowns.limit,
    )
    const filter = (table.dropdowns[columnIndex] = toDropdownHtml(values))
    filter.dataset.col = columnIndex
    ;(el || table.filterRow.cells[columnIndex]).append(filter)
  }

  function removeDropdowns(table) {
    console.log('called', table.dropdowns)
    table.dropdowns = table.dropdowns.map((d, index) =>
      removeDropdown(table, index, d),
    )
    // table.dropdowns = new Array(table.headers.length).fill(null);
  }

  function removeDropdown(table, columnIndex, el) {
    if (el) el.remove()
    else table.dropdowns[columnIndex] && table.dropdowns[columnIndex].remove()
    table.dropdowns[columnIndex] = null
    return null
  }

  function toDropdownHtml(values) {
    const wrapper = document.createElement('div')
    wrapper.className = 'filthor-downdown-wrapper'

    const f =
      '<li class="filthor-filter-select-top"><a type="button" data-action="selectAllFromDropdown">All</a><a type="button" data-action="deselectAllFromDropdown">Clear</a></li>'

    wrapper.innerHTML = `<a type="button" data-action="reveal" class="filthor-dropdown-icon">&#9998;</a>
        <ul class="filthor-filter-select">
           ${
             typeof values === 'string'
               ? `<li>${values}</li>`
               : f +
                 values
                   .sort()
                   .map(
                     (value) =>
                       `<li><label><input type="checkbox" data-action="apply" value="${
                         value ? value : '=blank'
                       }" checked/>${value ? value : '(blank)'}</label></li>`,
                   )
                   .join('')
           }
        </ul>`

    return wrapper
  }

  function getUniqueColumnValues(rows, col, limit = -1) {
    limit === -1 && (limit = Infinity)

    var n = rows.length
    var i,
      vals = new Set(),
      tr,
      td

    for (i = 0; i < n; i++) {
      tr = rows[i]

      if (tr.cells.length > col) {
        // Check that cell exists before you try to access it.
        td = tr.cells[col].textContent.trim()
        vals.add(td)

        if (vals.size > limit) return `Over ${limit} options.`
      }
    }
    return [...vals]
  }

  /* HIGHLIGHTS - TESTING FOR NOW */
  function createHighlights(table) {
    if (!table.options.highlights.uniqueId) return

    // build into the html table
    modifyHtmlTableForHighlights(table)

    // insert before table.panel find .table-filthor-actions__end, with div.table-filthor-actions
    const before = table.panel.querySelector('.table-filthor-actions__end')
    table.panel.children[0].children[0].insertBefore(
      createHighlightsHtml(),
      before,
    )

    // update the actions
    ACTIONS.toggleHighlighting = toggleHighlighting
  }

  function modifyHtmlTableForHighlights(table) {
    // mark the rows for ease of use
    const uniqueIndex = table.headers.findIndex(
      (entry) => entry === table.options.highlights.uniqueId,
    )
    table.tr.forEach(
      (row) =>
        (row.dataset.filthorId = row.cells[uniqueIndex].textContent.trim()),
    )

    // add comments column
    if (table.options.highlights.comments) addHighlightsCommentsColumn(table)

    // update if highlights are available
    hydrateHighlights(table)
  }

  function hydrateHighlights(table) {
    const tableName = table.selector + '--highlights'
    const store = STORE.retrieve(tableName)
    const missing = []

    if (store) {
      Object.values(store).forEach((value) => {
        const row = table.table.querySelector(`[data-filthor-id=${value.id}]`)
        if (row) {
          if (value.cells) {
            value.cells.forEach((cell) => {
              const el = row.cells[cell.cellIndex]
              el.dataset.filthorPreviousColor = el.style.backgroundColor
              el.dataset.filthorHighlightColor = cell.color
              el.style.backgroundColor = cell.color
            })
          }

          if (value.comment) {
            const index = table.headers.lastIndexOf(
              table.options.highlights.label || 'Comments',
            )
            row.cells[index].children[0].textContent = value.comment
          }
        } else {
          missing.push(value.id)
        }
      })
    }

    if (missing.length) {
      const msg =
        'Some rows with highlights are missing. Do you want to still keep track of them?\r\n\r\n' +
        missing.join('\r\n')

      if (confirm(msg)) return

      // remove missing from store
      missing.forEach((id) => STORE.unsave(tableName, id))
    }
  }

  function createHighlightsHtml() {
    const div = document.createElement('div')
    div.className = 'table-filthor-actions table-filthor-highlights'

    // div.innerHTML = `<a class="filthor-icon" type="button" data-action="toggleHighlighting" title="Toggle highlighting on and off">${ASSETS.brush}</a>`;

    div.innerHTML = `
        <input type="checkbox" name="highlighting" value="highlight" data-action="toggleHighlighting" id="highlighting" />
        <label for="highlighting" class="filthor-icon" title="Pin/unpin the filter bar">${ASSETS.brush2}</label>

        <input type="color" name="highlightColor" id="filthor-highlight-color-picker" value="#90EE90" style="width: 19px; height: 19px; cursor: pointer; margin-left: 10px;" />
        `

    return div
  }

  function toggleHighlighting(event, table) {
    const checked = event.target.checked

    const bodies = [...table.table.tBodies]

    if (checked) {
      const bound = highlightsHandler.bind(table)
      bodies.forEach((body) => body.addEventListener('click', bound))

      table.highlightsBoundHandler = bound
    } else
      bodies.forEach((body) =>
        body.removeEventListener('click', table.highlightsBoundHandler),
      )
  }

  function addHighlightsCommentsColumn(table) {
    if (!table.head) return

    // add filtering
    if (!table.head.querySelector('th strong[title=Comments')) {
      // header
      const th = document.createElement('th')
      th.style = 'background-color:#ddd;'
      th.className = 'header'
      th.innerHTML = `<small><strong title="Comments">${
        table.options.highlights.label
          ? table.options.highlights.label
          : 'Comments'
      }</strong></small>`

      table.head.rows[0].append(th)

      // update some table meta data
      table.table.style.height = '1px'
      table.headers.push(table.options.highlights.label || 'Comments')
      addFilterCell(table)
      addResizer(table, table.filterRow.cells[table.filterRow.cells.length - 1])
      setTimeout(
        () => createDropdown(table, table.filterRow.cells.length - 1),
        1000,
      )
    }

    // append cells
    table.tr.forEach((row) => {
      const td = document.createElement('td')

      td.style.width = `${table.options.highlights.commentsWidth || '200'}px`

      td.innerHTML = `<div contenteditable style="height: 100%; border: 1px dashed #444444a6;"></div>` // <textarea style="width: 100%;"></textarea>

      row.append(td)

      td.children[0].addEventListener('blur', textareaBlur)
    })

    // add column to context menu
    updateHideColumnItems(table)

    // textarea onblur
    function textareaBlur() {
      const row = this.closest('tr')
      const id = row.dataset.filthorId
      if (!id) return

      const comment = this.textContent

      // if there is comment, save it
      if (comment)
        STORE.save(`${table.selector}--highlights`, id, null, (item) => {
          if (!item) return { id, comment }
          item.comment = comment
          return item
        })
      // if there is no comment, possibly remove the item
      else
        STORE.unsave(`${table.selector}--highlights`, id, (item) => {
          if (!item) return null
          delete item.comment
          if (item.cells) return item
          else return null
        })

      // reset the dropdown
      removeDropdown(table, table.filterRow.cells.length - 1)
      createDropdown(table, table.filterRow.cells.length - 1)
    }
  }

  // the handler
  function highlightsHandler(event) {
    const td = event.target.closest('td')
    if (!td) return

    const hasColor = td.dataset.filthorHighlightColor

    if (hasColor) {
      removeHighlightColor(this, td)
    } else {
      addHighlightColor(this, td)
    }
  }

  function addHighlightColor(table, el) {
    const color = document.getElementById('filthor-highlight-color-picker')
      .value
    // to cell
    el.dataset.filthorPreviousColor = el.style.backgroundColor
    el.dataset.filthorHighlightColor = color
    el.style.backgroundColor = color

    // to storage
    const row = el.closest('tr')
    const id = row.dataset.filthorId

    if (!id) return

    STORE.save(`${table.selector}--highlights`, id, null, (item) => {
      // if item is not there
      if (!item) return { id, cells: [{ color, cellIndex: el.cellIndex }] }

      // if item is there and has no cells
      if (!item.cells) item.cells = [{ color, cellIndex: el.cellIndex }]
      // if item is there, and has cells
      else item.cells.push({ color, cellIndex: el.cellIndex })

      return item
    })
  }

  function removeHighlightColor(table, el) {
    // from cell
    const color = el.dataset.filthorPreviousColor || ''
    el.style.backgroundColor = color
    el.removeAttribute('data-filthor-previous-color')
    el.removeAttribute('data-filthor-highlight-color')

    // from storage
    const row = el.closest('tr')
    const id = row.dataset.filthorId

    if (!id) return

    STORE.unsave(`${table.selector}--highlights`, id, (item) => {
      if (!item) return null
      // remove the cell from the item
      item.cells = item.cells.filter((cell) => cell.cellIndex !== el.cellIndex)
      // return null, if no comment or cells
      if (item.cells.length === 0 && !item.comment) return null
      // remove the cells, if empty
      if (item.cells.length === 0) delete item.cells
      // return the item
      return item
    })
  }

  /* FILTER FUNCTIONS */
  function runMultiFilter(tableObj) {
    // Declare variables
    const table = tableObj.table
    const tr = tableObj.tr
    let filterValues = []

    // convert the filter values
    for (let a = 0, g = tableObj.filters.length; a < g; a++) {
      const input = tableObj.filters[a]

      if (input === null || !input.value) continue

      const converted = convertValue(input.value)
      converted.COL_INDEX = a
      filterValues.push(converted)
    }

    // reset stats
    tableObj.shown = tr.length

    // TR - Loop through all table rows, and hide those who don't match the search query
    for (let i = 0, rowLen = tr.length; i < rowLen; i++) {
      let row = tr[i]
      let shouldDisplay = true

      // TD
      for (let j = 0, len = filterValues.length; j < len; j++) {
        let filter = filterValues[j]
        let td = row.cells[filter.COL_INDEX]

        // actual filtering
        shouldDisplay = doesMatch(td.textContent, filter, tableObj.options)

        if (!shouldDisplay) break
      }

      if (shouldDisplay) row.style.display = ''
      else {
        row.style.display = 'none'
        tableObj.shown--
      }
    }
  }

  function runMultiFilterBundle(tableObj) {
    runMultiFilter(tableObj)

    ACTIONS.recalculate(null, tableObj)
  }

  /* CORE */
  function createOptions(opts) {
    let options
    if (opts) {
      options = Object.assign({}, DEFAULT_OPTIONS, opts)
      options.theme = opts.theme
        ? Object.assign({}, DEFAULT_OPTIONS.theme, opts.theme)
        : Object.assign({}, DEFAULT_OPTIONS.theme)
      options.refresh = opts.refresh
        ? Object.assign({}, DEFAULT_OPTIONS.refresh, opts.refresh)
        : Object.assign({}, DEFAULT_OPTIONS.refresh)
      if (opts.dropdowns && Object.keys(opts.dropdowns).length)
        options.dropdowns.use = true
      if (
        (opts.refresh.pre || opts.refresh.post) &&
        options.refresh.keepDefaultHooks
      ) {
        options.refresh.pre = (opts.refresh.pre || []).concat(
          DEFAULT_OPTIONS.refresh.pre,
        )
        options.refresh.post = (opts.refresh.post || []).concat(
          DEFAULT_OPTIONS.refresh.post,
        )
      }
    } else {
      options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS))
      options.regresh.pre = [
        function startSpinner(table) {
          table.panel.querySelector('[data-action=refresh]').style.animation =
            'table-filthor-spin 4s linear infinite'
        },
      ]
      options.regresh.post = [
        function stopSpinner(table) {
          table.panel.querySelector('[data-action=refresh]').style.animation =
            ''
        },
      ]
    }

    return options
  }

  function prepTables(selector, options) {
    let tables = Array.prototype.slice.call(
      document.querySelectorAll(selector || 'table'),
    )

    tables.forEach((table, i) => {
      const t = {}

      // pre-process the table, if in options, to modify the table
      if (options.processors && options.processors.pre) {
        options.processors.pre.forEach((fn) => fn(table))
      }

      // keep reference to original headers
      t.head = table.tHead

      // get the rows in the body/bodies of the table
      t.tr = getBodyRows(table)

      // do not process if table is too short
      if (t.tr.length <= options.minRows) return

      // other data
      t.table = table
      t.selector = getCssSelector(table)
      t.headers = getTableHeaders(table)
      t.headerHTML = table.tHead
        ? table.tHead.rows[0].cells
        : table.rows[0].cells
      t.shown = t.tr.length
      t.options = options
      t.dropdowns = []

      // create the filter fields
      t.filterHtml = createFilters(t)
      // add the filter thead
      t.table.prepend(t.filterHtml)

      // apply filthor css with custom theme
      applyStyles(options)

      // update opts with data from local storage - filters, summary types, refresh
      updatePresets(t)
      // event listeners
      attachEvents(t)
      // add resizers
      addResizers(t)
      // right-click menu
      rightClickMenu(t)
      // excel-like dropdowns
      createDropdowns(t)

      // highlights
      createHighlights(t)

      console.log(t)
    })
  }

  function init(selector, opts) {
    // create the options for the table groups under the given selector
    const options = createOptions(opts)

    // process the tables
    prepTables(selector, options)
  }

  // PUBLIC API
  PUBLIC_API.init = init
})((window.tableFilthor = window.tableFilthor || {}))
