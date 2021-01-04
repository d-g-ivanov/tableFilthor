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

In the src folder you will find 2 JavaScript files. Pick hte one that suits your needs.

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

` exactMatches ` - boolean, defaults to false.\ 
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
}
  ```


<!-- ROADMAP -->
## Roadmap

1. Further theme customizations

2. Adding examples



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
