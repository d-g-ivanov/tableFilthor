<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/d-g-ivanov/tableFilthor">
    <img src="https://github.com/d-g-ivanov/tableFilthor/blob/main/logo/logo.png" alt="Filthor Logo" width="126">
  </a>

  <h3 align="center">Table Filthor</h3>

  <p align="center">
    Add advanced filter functionality to your web tables.
    <!-- <br />
    <a href="https://github.com/othneildrew/Best-README-Template"><strong>Explore the docs »</strong></a>
    <br /> -->
    <br />
    <a href="https://github.com/d-g-ivanov/tableFilthor/issues">Report Bug</a>
    ·
    <a href="https://github.com/d-g-ivanov/tableFilthor/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
	<li><a href="#usage">Usage</a></li>
	<li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

Because it should be easy to find information in large tables.

### Built With

Pure Javascript, no dependencies.



<!-- GETTING STARTED -->
## Getting Started

In the ` src ` folder you will find 2 JavaScript files. Pick the one that suits your needs.

1. ` tableFilthor.js ` - made for the browser. Once loaded there will be a global object exposed with a single init method. Namespace is ` tableFilthor `.

2. ` tableFilthor.userscript.js`  - userscript version for use wtih the Tampermonkey browser extension. By default, the script will run for all pages and on all tables. Edit the ` @match ` field of the script to limit the affected URLs, and/or change the init invocation at the end to limit the tables to which filtering should be applied (as well as other options).

### Prerequisites

None.

### Compatibility

Scripts use very few "new" JavaScript features, such as template literals.

### Installation

**>> Browser**
1. Insert a script tag with a link to the browser version of tableFilthor.


**>> Userscript**
1. Install the Tampermonkey extension.
2. Load the userscript.
3. [Optional] Edit the ` @match ` field of the script to limit the affected URLs, and/or change the init invocation at the end to limit the tables to which filtering should be applied (as well as other options).


<!-- USAGE EXAMPLES -->
## Usage

**>> Browser**

Once loaded the script exposes global object called ` tableFilthor `. For now, it contains only 1 method named ` init ` that allows you to initiate it multiple times to create filter settings per table or group of tables.


### Init Signature

The ` init ` method takes in to parameters:

 - a ` selector ` which is any valid html/css element selector
 - a ` config ` object which applies certain personalization options
  
```sh
tableFilthor.init({
	debouceTime: 500,
	minRows: 3,
	skipColumns: [],
	exactMatches: false,
	summaryType: 'simple',

	// css
	theme: {
		background: '#47b',
		color: 'white',
		inputBackground: '#444',
		inputColor: 'white',
		actionColor: 'white',
		iconFill: 'white',
		iconActiveFill: 'yellow',
	},
	
	// refresh options, v0.3
	refresh: {
            autorefresh: false,
            autorefreshRate: 60 * 60 * 1000, // 1 hour
            shouldDiff: false,
            columnToDiffBy: null,
            pre: [function startSpinner(table) { ... }],
            post: [function stopSpinner(table) { ... }],
            keepDefaultHooks: true,
	    markAddition: Function,
     	    markRemoval: Function,
     	    markUpdate: Function,
        }
})
  ```
  
### Config Signature

The config object can contain following properties.
	
` debounceTime ` - number of miliseconds, defaults to 500.<br/>
Since applying the filters to the table happens while typing, the application is delayed by the `debounceTime` value to spare resources.

` minRows ` - integer, defailts to 15.<br/>
Minimum number of table rows for the filtering to be applied to a table. If the table has less rows than that, the filter bar will be omitted.

` skipColumns ` - array of integers, dafults to empty array.<br/>
Defines which columns should **NOT** received a filter input. I.e., the columns should not be filterable. Column numbers are 1-based, meaning that first column is 1, second column is 2, etc.

` exactMatches ` - boolean, defaults to false.<br/>
Determines if the search term should be case sensitive. This can be controlled once the filter bar is applied.

` summaryType ` - string, 'simple' or 'complex', defaults to 'simple'.<br/>
TableFilthor can create a summary table with count statistics for the different column values. The summary tables can be simple (based on only 1 column) or complex (based on multi-column cross-referencing). This can be controlled once the filter bar is applied.

` theme ` - object, defaults are below.<br/>
Contains theme color information for the filter bar, so that an attempt can be made to make the plug-in fit naturally to the design of the table.

```sh
{
	background: '#47b',
	color: 'white',
	inputBackground: '#444',
	inputColor: 'white',
	actionColor: 'white',
	iconFill: 'white',
	iconActiveFill: 'yellow',
	resizerActiveFill: 'yellow' // version 02 only, resizing feature availble only in it
}
  ```
  
  
` refresh ` - possibilities with explanation are below.<br/>
Contains table data refresh settings. Allows to turn server-side generated tables (sent as HTML) into autofresh-able tables. Essentially, at specified intervals (or manually activated), Filthor makes a request to the server to the current URL, parses the HTML and updates the row by either replacing them, or doing a diffing (based on settings).

`pre` and `post` arrays specify functions to be run before server request and after table update, respectively. By defualt there is a spinner start and end function in each array, so that there is at least minor indicaiton that work is being performed.

`keepDefaultHooks` allows you to keep or discard the default default `pre` and `post` spinner functions.

`autorefresh` and `autorefreshRate` specify whether table data should refresh at a given period in milliseconds.

The rest indicate if diffing between values of the old table and the new one should occur or not. `columnToDiffBy` is the name or index (0-based) of a column that would allow to uniquely identify a row. Otherwise diffing will be impossible. Could extend the funcitonality to diff rows in order in case no column is provided, but this is not implemented yet.

The `mark` functions allow you to specify how to highlight each type of change. Defaults exists.

```sh
{
	pre: [],
        post: [],
     	keepDefaultHooks: true | false,
     	autorefresh: true | false,
     	autorefreshRate: Number of milliseconds
     	shouldDiff: true | false,
     	columnToDiffBy: Number | String, // mandatory if shouldDiff is true
     	markAddition: Function, // takes the row as parameter
     	markRemoval: Function, // takes the row as parameter
     	markUpdate: Function // takes the updated cell, a clone of the old cell, and the new cell as parameters
}
  ```


<!-- ROADMAP -->
## Updates

Version 02 has just been added which introduces following updates. No breaking changes, just additional features added. Kept it in separate files as per requirement.

1. Column resizing - right border of the filter cell
2. Column hiding via context menu - context meny triggered via right-click on the control panel (bar above the filters)
3. Mixed modes via brackets, eg. smth && (smth || smth)
4. Summary table values are filterable - clicking on the count will append the filter to the table
5. Saving the summary table type (simple / complex) and loading it from local storage
6. Help menu updated to reflect new features


Version 03 has following additions:
1. Table refreshes for static or server-side generated tables
   - makes a call to the server, same as current page path, to get the new static html. Extracts the table from the html and replaces the current rows with new ones
   - manual refresh button available
   - autorefreshes possible as well
   - TOBE TESTED - cell diffing and color-coding changes / highlighting the differences (old : new value)


Version 04 has following additions:
1. Dropdowns for simple filtering - excel-like

```sh
    dropdowns: {
        use: true,
        columns: [], column names, or index (0 based)
        limit: -1, no limit, default; number of items to be displayed. If over that number, menu will not contain itesm
    }

    NOTE - dropdowns dos not update based on handwritten filters
```


2. Cell highlighting and comments column

```sh
    highlights: {
        uniqueId: string, column name to be used as reference for localStorage. should be unique to the table so that the roww can be identified between refreshes
        comments: boolean; indicates whether to use or not a comments column
        label: string; name for the comments column
        commentsWidth: number; initial width of the comments column; defaults to 200
    }
```


3. Added "blank" as keyword to isolate cells with no content; used as "=blank" or "!=blank"

4. Added user confirm if they want to keep hidden columns when exporting the table to csv

5. `options.skipColumns` is not a 0-based array

6. Added `options.processors.pre` = [] - alows for custom functions to be performed on the table, before adding the filtering and all that jazz



<!-- ROADMAP -->
## Roadmap

1. Further theme customizations

2. Adding examples

3. Excel-like filter dropdowns



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.
