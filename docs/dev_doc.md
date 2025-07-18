# Developer Documentation
<dl>
<dt><a href="#Implementation">Implementation</a></dt>
<dd><p>Detailed documentation about the classes that make up the simulation system.</p>
</dd>
<dt><a href="#API">API</a></dt>
<dd><p>API documentation of the simulation and customization options.</p>
</dd>
</dl>

<a id="Implementation" name="Implementation"></a>

# Implementation

## Classes

<dl>
<dt><a href="#ConfigGenerator">ConfigGenerator</a></dt>
<dd><p>Generates and manages the configuration of a simulation.</p>
</dd>
<dt><a href="#GraphNode">GraphNode</a></dt>
<dd><p>Represents a node in the graph.</p>
</dd>
<dt><a href="#SimulationLogic">SimulationLogic</a></dt>
<dd><p>Represents the logic of the simulation.</p>
</dd>
<dt><a href="#SimulationGraphics">SimulationGraphics</a></dt>
<dd><p>Represents the graphics of the simulation, chart, and UI.</p>
</dd>
<dt><a href="#SimulationController">SimulationController</a></dt>
<dd><p>Ties together the simulation logic and graphics, and manages the user input.</p>
</dd>
</dl>

<a id="ConfigGenerator" name="ConfigGenerator"></a>

## ConfigGenerator
Generates and manages the configuration of a simulation.

**Kind**: global class  

* [ConfigGenerator](#ConfigGenerator)
    * [new ConfigGenerator(defaultConfig, SimulationController)](#new_ConfigGenerator_new)
    * [.initializeSetupPage()](#ConfigGenerator+initializeSetupPage)
    * [.renderSetupPage()](#ConfigGenerator+renderSetupPage)
    * [.updateState()](#ConfigGenerator+updateState)
    * [.addEventListeners()](#ConfigGenerator+addEventListeners)
    * [.addMetaListeners()](#ConfigGenerator+addMetaListeners)
    * [.addMetaButtons()](#ConfigGenerator+addMetaButtons)
    * [.refreshDynamicSections()](#ConfigGenerator+refreshDynamicSections)
    * [.collectConnectionTypes()](#ConfigGenerator+collectConnectionTypes) ⇒ <code>Array</code>
    * [.collectSpreadRates()](#ConfigGenerator+collectSpreadRates) ⇒ <code>Array</code>
    * [.collectRestrictions()](#ConfigGenerator+collectRestrictions) ⇒ <code>Array</code>
    * [.collectScenarios()](#ConfigGenerator+collectScenarios) ⇒ <code>Array</code>
    * [.renderNodeConfig()](#ConfigGenerator+renderNodeConfig) ⇒ <code>String</code>
    * [.renderColors()](#ConfigGenerator+renderColors) ⇒ <code>String</code>
    * [.renderConnectionTypes()](#ConfigGenerator+renderConnectionTypes) ⇒ <code>String</code>
    * [.renderSpreadRates()](#ConfigGenerator+renderSpreadRates) ⇒ <code>String</code>
    * [.renderRestrictions()](#ConfigGenerator+renderRestrictions) ⇒ <code>String</code>
    * [.renderScenarios()](#ConfigGenerator+renderScenarios) ⇒ <code>String</code>

<a id="new_ConfigGenerator_new" name="new_ConfigGenerator_new"></a>

### new ConfigGenerator(defaultConfig, SimulationController)

| Param | Type | Description |
| --- | --- | --- |
| defaultConfig | <code>Object</code> | The default configuration for the simulation. |
| SimulationController | <code>function</code> | The SimulationController class to be used for creating the simulation. |

<a id="ConfigGenerator+initializeSetupPage" name="ConfigGenerator+initializeSetupPage"></a>

### configGenerator.initializeSetupPage()
Initializes the page for the configuration generator.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+renderSetupPage" name="ConfigGenerator+renderSetupPage"></a>

### configGenerator.renderSetupPage()
Renders the HTML structure for the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+updateState" name="ConfigGenerator+updateState"></a>

### configGenerator.updateState()
Extracts the current state of the configuration from the HTML elements.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+addEventListeners" name="ConfigGenerator+addEventListeners"></a>

### configGenerator.addEventListeners()
Adds event listeners to the buttons on the configuration page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+addMetaListeners" name="ConfigGenerator+addMetaListeners"></a>

### configGenerator.addMetaListeners()
Adds event listeners to the meta buttons (back and copy).

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+addMetaButtons" name="ConfigGenerator+addMetaButtons"></a>

### configGenerator.addMetaButtons()
Adds meta buttons (back and copy) to the page after the simulation is created.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+refreshDynamicSections" name="ConfigGenerator+refreshDynamicSections"></a>

### configGenerator.refreshDynamicSections()
Refreshes sections of the page that depend on other data.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
<a id="ConfigGenerator+collectConnectionTypes" name="ConfigGenerator+collectConnectionTypes"></a>

### configGenerator.collectConnectionTypes() ⇒ <code>Array</code>
Collects the connection types from the HTML elements and returns them as an array of objects.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>Array</code> - - An array of connection type objects.  
<a id="ConfigGenerator+collectSpreadRates" name="ConfigGenerator+collectSpreadRates"></a>

### configGenerator.collectSpreadRates() ⇒ <code>Array</code>
Collects the spread rates from the HTML elements and returns them as an array of objects.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>Array</code> - - An array of spread rate objects.  
<a id="ConfigGenerator+collectRestrictions" name="ConfigGenerator+collectRestrictions"></a>

### configGenerator.collectRestrictions() ⇒ <code>Array</code>
Collects the restrictions from the HTML elements and returns them as an array of objects.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>Array</code> - - An array of restriction objects.  
<a id="ConfigGenerator+collectScenarios" name="ConfigGenerator+collectScenarios"></a>

### configGenerator.collectScenarios() ⇒ <code>Array</code>
Collects the scenarios from the HTML elements and returns them as an array of objects.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>Array</code> - - An array of scenario objects.  
<a id="ConfigGenerator+renderNodeConfig" name="ConfigGenerator+renderNodeConfig"></a>

### configGenerator.renderNodeConfig() ⇒ <code>String</code>
Renders the node configuration section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the node configuration section.  
<a id="ConfigGenerator+renderColors" name="ConfigGenerator+renderColors"></a>

### configGenerator.renderColors() ⇒ <code>String</code>
Renders the node colors section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the node colors section.  
<a id="ConfigGenerator+renderConnectionTypes" name="ConfigGenerator+renderConnectionTypes"></a>

### configGenerator.renderConnectionTypes() ⇒ <code>String</code>
Renders the connection types section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the connection types section.  
<a id="ConfigGenerator+renderSpreadRates" name="ConfigGenerator+renderSpreadRates"></a>

### configGenerator.renderSpreadRates() ⇒ <code>String</code>
Renders the spread rates section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the spread rates section.  
<a id="ConfigGenerator+renderRestrictions" name="ConfigGenerator+renderRestrictions"></a>

### configGenerator.renderRestrictions() ⇒ <code>String</code>
Renders the restrictions section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the restrictions section.  
<a id="ConfigGenerator+renderScenarios" name="ConfigGenerator+renderScenarios"></a>

### configGenerator.renderScenarios() ⇒ <code>String</code>
Renders the scenarios section of the page.

**Kind**: instance method of [<code>ConfigGenerator</code>](#ConfigGenerator)  
**Returns**: <code>String</code> - - HTML string for the scenarios section.  


<a id="GraphNode" name="GraphNode"></a>

## GraphNode
Represents a node in the graph.

**Kind**: global class  
<a id="new_GraphNode_new" name="new_GraphNode_new"></a>

### new GraphNode(infected)

| Param | Type | Description |
| --- | --- | --- |
| infected | <code>Boolean</code> | Indicates if the node is infected. |

<a id="SimulationLogic" name="SimulationLogic"></a>

## SimulationLogic
Represents the logic of the simulation.

**Kind**: global class  

* [SimulationLogic](#SimulationLogic)
    * [new SimulationLogic(config, randomFunctionsFactories)](#new_SimulationLogic_new)
    * [.resetProbabilities()](#SimulationLogic+resetProbabilities)
    * [.applyRestrictions(activeRestrictionIds)](#SimulationLogic+applyRestrictions)
    * [.decideNodeCount(nodeCount)](#SimulationLogic+decideNodeCount) ⇒ <code>Number</code>
    * [.createNodes(nodeCount, infectedPercentage)](#SimulationLogic+createNodes)
    * [.createLinks(nodeCount)](#SimulationLogic+createLinks)
    * [.deleteUnlinkedNodes()](#SimulationLogic+deleteUnlinkedNodes)
    * [.reIndexLinkNodes(unlinkedIndexes)](#SimulationLogic+reIndexLinkNodes)
    * [.reIndexNode(currentIndex, unlinkedIndexes)](#SimulationLogic+reIndexNode) ⇒ <code>Number</code>
    * [.tryInfect(node, probability, spreadRate)](#SimulationLogic+tryInfect) ⇒ <code>Boolean</code>
    * [.spreadInfection()](#SimulationLogic+spreadInfection) ⇒ <code>Number</code>
    * [.updateInfectedAmounts(newInfectionsCount)](#SimulationLogic+updateInfectedAmounts)
    * [.resetChartData()](#SimulationLogic+resetChartData)
    * [.initializeSimulation(nodeCount, infectedPercentage)](#SimulationLogic+initializeSimulation)

<a id="new_SimulationLogic_new" name="new_SimulationLogic_new"></a>

### new SimulationLogic(config, randomFunctionsFactories)

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Configuration object containing simulation parameters. |
| randomFunctionsFactories | <code>Object</code> | Object containing custom random functions factories. |

<a id="SimulationLogic+resetProbabilities" name="SimulationLogic+resetProbabilities"></a>

### simulationLogic.resetProbabilities()
Resets the probabilities to their base values.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
<a id="SimulationLogic+applyRestrictions" name="SimulationLogic+applyRestrictions"></a>

### simulationLogic.applyRestrictions(activeRestrictionIds)
Applies the active restrictions to the connection probabilities.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| activeRestrictionIds | <code>Array</code> | Array of active restriction IDs. |

<a id="SimulationLogic+decideNodeCount" name="SimulationLogic+decideNodeCount"></a>

### simulationLogic.decideNodeCount(nodeCount) ⇒ <code>Number</code>
Decides the number of nodes to create based on the provided node count.
If the node count is 0, a random number of nodes between the min + 1 and max values is generated.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
**Returns**: <code>Number</code> - - The actual number of nodes to create.  

| Param | Type | Description |
| --- | --- | --- |
| nodeCount | <code>Number</code> | The number of nodes to create specified by the user. |

<a id="SimulationLogic+createNodes" name="SimulationLogic+createNodes"></a>

### simulationLogic.createNodes(nodeCount, infectedPercentage)
Creates nodes for the simulation.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| nodeCount | <code>Number</code> | The number of nodes to create. |
| infectedPercentage | <code>Number</code> | The percentage of nodes that should be infected. |

<a id="SimulationLogic+createLinks" name="SimulationLogic+createLinks"></a>

### simulationLogic.createLinks(nodeCount)
Creates links between nodes in the simulation.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| nodeCount | <code>Number</code> | The number of nodes in the simulation. |

<a id="SimulationLogic+deleteUnlinkedNodes" name="SimulationLogic+deleteUnlinkedNodes"></a>

### simulationLogic.deleteUnlinkedNodes()
Deletes nodes that are not linked to any other nodes.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
<a id="SimulationLogic+reIndexLinkNodes" name="SimulationLogic+reIndexLinkNodes"></a>

### simulationLogic.reIndexLinkNodes(unlinkedIndexes)
Re-indexes the links to account for deleted nodes.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| unlinkedIndexes | <code>Array</code> | Array of indexes of deleted nodes. |

<a id="SimulationLogic+reIndexNode" name="SimulationLogic+reIndexNode"></a>

### simulationLogic.reIndexNode(currentIndex, unlinkedIndexes) ⇒ <code>Number</code>
Re-indexes a node's index based on the deleted nodes.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
**Returns**: <code>Number</code> - - The new index of the node after re-indexing.  

| Param | Type | Description |
| --- | --- | --- |
| currentIndex | <code>Number</code> | The current index of the node. |
| unlinkedIndexes | <code>Array</code> | Array of indexes of deleted nodes. |

<a id="SimulationLogic+tryInfect" name="SimulationLogic+tryInfect"></a>

### simulationLogic.tryInfect(node, probability, spreadRate) ⇒ <code>Boolean</code>
Attempts to infect a node based on the given probability and spread rate.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
**Returns**: <code>Boolean</code> - - True if the node was infected, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| node | <code>\*</code> | The node to infect. |
| probability | <code>Number</code> | The probability of infection. |
| spreadRate | <code>Number</code> | The spread rate of the infection. |

<a id="SimulationLogic+spreadInfection" name="SimulationLogic+spreadInfection"></a>

### simulationLogic.spreadInfection() ⇒ <code>Number</code>
Spreads the infection through the network graph.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
**Returns**: <code>Number</code> - - The number of newly infected nodes or -1 if all nodes are infected.  
<a id="SimulationLogic+updateInfectedAmounts" name="SimulationLogic+updateInfectedAmounts"></a>

### simulationLogic.updateInfectedAmounts(newInfectionsCount)
Updates the chart data.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| newInfectionsCount | <code>Number</code> | The number of newly infected nodes. |

<a id="SimulationLogic+resetChartData" name="SimulationLogic+resetChartData"></a>

### simulationLogic.resetChartData()
Resets the chart data to its initial state.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  
<a id="SimulationLogic+initializeSimulation" name="SimulationLogic+initializeSimulation"></a>

### simulationLogic.initializeSimulation(nodeCount, infectedPercentage)
Initializes the simulation.

**Kind**: instance method of [<code>SimulationLogic</code>](#SimulationLogic)  

| Param | Type | Description |
| --- | --- | --- |
| nodeCount | <code>Number</code> | The number of nodes to create. |
| infectedPercentage | <code>Number</code> | The percentage of nodes that should be infected. |

<a id="SimulationGraphics" name="SimulationGraphics"></a>

## SimulationGraphics
Represents the graphics of the simulation, chart, and UI.

**Kind**: global class  

* [SimulationGraphics](#SimulationGraphics)
    * [new SimulationGraphics(simulationLogic, config, containerElement)](#new_SimulationGraphics_new)
    * _instance_
        * [.drawSimulation(nodeCount, infectedPercentage)](#SimulationGraphics+drawSimulation) ⇒ <code>Element</code>
        * [.ticked(link, node)](#SimulationGraphics+ticked)
        * [.dragstarted(event)](#SimulationGraphics+dragstarted)
        * [.dragged(event)](#SimulationGraphics+dragged)
        * [.dragended(event)](#SimulationGraphics+dragended)
        * [.updateSimulation()](#SimulationGraphics+updateSimulation)
        * [.generateHTML(config)](#SimulationGraphics+generateHTML)
        * [.generateSpreadRateOptions(spreadRates)](#SimulationGraphics+generateSpreadRateOptions) ⇒ <code>String</code>
        * [.generateRestrictionOptions(restrictions)](#SimulationGraphics+generateRestrictionOptions) ⇒ <code>String</code>
        * [.generateRestrictionsColumn(restrictions)](#SimulationGraphics+generateRestrictionsColumn) ⇒ <code>String</code>
        * [.generateScenarioOptions(scenarios)](#SimulationGraphics+generateScenarioOptions) ⇒ <code>String</code>
        * [.generateLegend(config)](#SimulationGraphics+generateLegend) ⇒ <code>String</code>
        * [.createInfoIcon(tooltipText)](#SimulationGraphics+createInfoIcon) ⇒ <code>String</code>
        * [.getInfoTexts()](#SimulationGraphics+getInfoTexts) ⇒ <code>Object</code>
    * _static_
        * [.drawChart(infectedAmounts, totalInfectedAmounts, chartContainer)](#SimulationGraphics.drawChart) ⇒ <code>Element</code>

<a id="new_SimulationGraphics_new" name="new_SimulationGraphics_new"></a>

### new SimulationGraphics(simulationLogic, config, containerElement)

| Param | Type | Description |
| --- | --- | --- |
| simulationLogic | [<code>SimulationLogic</code>](#SimulationLogic) | The logic of the simulation. |
| config | <code>Object</code> | Configuration object containing simulation parameters. |
| containerElement | <code>Element</code> | The HTML element to contain the simulation. |

<a id="SimulationGraphics+drawSimulation" name="SimulationGraphics+drawSimulation"></a>

### simulationGraphics.drawSimulation(nodeCount, infectedPercentage) ⇒ <code>Element</code>
Draws the simulation visualization.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>Element</code> - - The SVG element containing the simulation.  

| Param | Type | Description |
| --- | --- | --- |
| nodeCount | <code>Number</code> | The number of nodes to create. |
| infectedPercentage | <code>Number</code> | The percentage of nodes that should be infected. |

<a id="SimulationGraphics+ticked" name="SimulationGraphics+ticked"></a>

### simulationGraphics.ticked(link, node)
Updates the positions of the links and nodes during the simulation.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  

| Param | Type | Description |
| --- | --- | --- |
| link | <code>\*</code> | The link elements in the SVG. |
| node | <code>\*</code> | The node elements in the SVG. |

<a id="SimulationGraphics+dragstarted" name="SimulationGraphics+dragstarted"></a>

### simulationGraphics.dragstarted(event)
Handles the drag start event.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>\*</code> | The drag event. |

<a id="SimulationGraphics+dragged" name="SimulationGraphics+dragged"></a>

### simulationGraphics.dragged(event)
Handles the drag event.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>\*</code> | The drag event. |

<a id="SimulationGraphics+dragended" name="SimulationGraphics+dragended"></a>

### simulationGraphics.dragended(event)
Handles the drag end event.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>\*</code> | The drag event. |

<a id="SimulationGraphics+updateSimulation" name="SimulationGraphics+updateSimulation"></a>

### simulationGraphics.updateSimulation()
Updates the simulation visualization by spreading the infection.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
<a id="SimulationGraphics+generateHTML" name="SimulationGraphics+generateHTML"></a>

### simulationGraphics.generateHTML(config)
Generates the HTML structure for the UI.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Configuration object containing simulation parameters. |

<a id="SimulationGraphics+generateSpreadRateOptions" name="SimulationGraphics+generateSpreadRateOptions"></a>

### simulationGraphics.generateSpreadRateOptions(spreadRates) ⇒ <code>String</code>
Generates the HTML structure for the spread rate options.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the spread rate options.  

| Param | Type | Description |
| --- | --- | --- |
| spreadRates | <code>Array</code> | Array of spread rate options. |

<a id="SimulationGraphics+generateRestrictionOptions" name="SimulationGraphics+generateRestrictionOptions"></a>

### simulationGraphics.generateRestrictionOptions(restrictions) ⇒ <code>String</code>
Generates the HTML structure for the restriction options.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the restriction options.  

| Param | Type | Description |
| --- | --- | --- |
| restrictions | <code>Array</code> | Array of restriction options. |

<a id="SimulationGraphics+generateRestrictionsColumn" name="SimulationGraphics+generateRestrictionsColumn"></a>

### simulationGraphics.generateRestrictionsColumn(restrictions) ⇒ <code>String</code>
Generates the HTML structure for a column of restrictions.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the column of restrictions.  

| Param | Type | Description |
| --- | --- | --- |
| restrictions | <code>Array</code> | Array of restriction options. |

<a id="SimulationGraphics+generateScenarioOptions" name="SimulationGraphics+generateScenarioOptions"></a>

### simulationGraphics.generateScenarioOptions(scenarios) ⇒ <code>String</code>
Generates the HTML structure for the scenario options.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the scenario options.  

| Param | Type | Description |
| --- | --- | --- |
| scenarios | <code>Array</code> | Array of scenario options. |

<a id="SimulationGraphics+generateLegend" name="SimulationGraphics+generateLegend"></a>

### simulationGraphics.generateLegend(config) ⇒ <code>String</code>
Generates the HTML structure for the legend.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the legend.  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Configuration object containing simulation parameters. |

<a id="SimulationGraphics+createInfoIcon" name="SimulationGraphics+createInfoIcon"></a>

### simulationGraphics.createInfoIcon(tooltipText) ⇒ <code>String</code>
Creates an info icon with a tooltip.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>String</code> - - HTML string for the info icon.  

| Param | Type | Description |
| --- | --- | --- |
| tooltipText | <code>String</code> | The text to display in the tooltip. |

<a id="SimulationGraphics+getInfoTexts" name="SimulationGraphics+getInfoTexts"></a>

### simulationGraphics.getInfoTexts() ⇒ <code>Object</code>
Returns the info texts for the simulation parameters.

**Kind**: instance method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>Object</code> - - Object containing the info texts for the simulation parameters.  
<a id="SimulationGraphics.drawChart" name="SimulationGraphics.drawChart"></a>

### SimulationGraphics.drawChart(infectedAmounts, totalInfectedAmounts, chartContainer) ⇒ <code>Element</code>
Draws the chart visualization.

**Kind**: static method of [<code>SimulationGraphics</code>](#SimulationGraphics)  
**Returns**: <code>Element</code> - - The SVG element containing the chart.  

| Param | Type | Description |
| --- | --- | --- |
| infectedAmounts | <code>Array</code> | Array of newly infected amounts over time. |
| totalInfectedAmounts | <code>Array</code> | Array of total infected amounts over time. |
| chartContainer | <code>Element</code> | The HTML element to contain the chart. |

<a id="SimulationController" name="SimulationController"></a>

## SimulationController
Ties together the simulation logic and graphics, and manages the user input.

**Kind**: global class  

* [SimulationController](#SimulationController)
    * [new SimulationController(config, simID, randomFunctionsFactories)](#new_SimulationController_new)
    * [.addEventListener(eventName, callback)](#SimulationController+addEventListener) ⇒ <code>Boolean</code>
    * [.removeEventListener(eventName, callback)](#SimulationController+removeEventListener) ⇒ <code>Boolean</code>
    * [.triggerEvent(eventName, data)](#SimulationController+triggerEvent)
    * [.initializeElements()](#SimulationController+initializeElements)
    * [.initializeEventListeners()](#SimulationController+initializeEventListeners)
    * [.createInitialSimulation()](#SimulationController+createInitialSimulation)
    * [.updateChart()](#SimulationController+updateChart)
    * [.updateSimulationParameters()](#SimulationController+updateSimulationParameters)
    * [.setInputState(disabled)](#SimulationController+setInputState)
    * [.disableInputs()](#SimulationController+disableInputs)
    * [.enableInputs()](#SimulationController+enableInputs)
    * [.selectSpreadRate(id)](#SimulationController+selectSpreadRate)
    * [.selectRestrictions(restrictionsToSelect)](#SimulationController+selectRestrictions)
    * [.updateScenario()](#SimulationController+updateScenario)

<a id="new_SimulationController_new" name="new_SimulationController_new"></a>

### new SimulationController(config, simID, randomFunctionsFactories)

| Param | Type | Description |
| --- | --- | --- |
| config | <code>Object</code> | Configuration object containing simulation parameters. |
| simID | <code>String</code> | The ID of the HTML element to contain the simulation. |
| randomFunctionsFactories | <code>Object</code> | Object containing custom random functions factories. |

<a id="SimulationController+addEventListener" name="SimulationController+addEventListener"></a>

### simulationController.addEventListener(eventName, callback) ⇒ <code>Boolean</code>
Adds an event listener for a specific event.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
**Returns**: <code>Boolean</code> - - True if the event listener was added successfully, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | The name of the event to listen for. |
| callback | <code>function</code> | The callback function to execute when the event is triggered. |

<a id="SimulationController+removeEventListener" name="SimulationController+removeEventListener"></a>

### simulationController.removeEventListener(eventName, callback) ⇒ <code>Boolean</code>
Removes an event listener for a specific event.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
**Returns**: <code>Boolean</code> - - True if the event listener was removed successfully, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | The name of the event to stop listening for. |
| callback | <code>function</code> | The callback function to remove. |

<a id="SimulationController+triggerEvent" name="SimulationController+triggerEvent"></a>

### simulationController.triggerEvent(eventName, data)
Executes all callbacks associated with an event.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> | The name of the event to trigger. |
| data | <code>Object</code> | The data to pass to the event listeners. |

<a id="SimulationController+initializeElements" name="SimulationController+initializeElements"></a>

### simulationController.initializeElements()
Extracts the elements from the HTML structure.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+initializeEventListeners" name="SimulationController+initializeEventListeners"></a>

### simulationController.initializeEventListeners()
Initializes the event listeners for the simulation controls.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+createInitialSimulation" name="SimulationController+createInitialSimulation"></a>

### simulationController.createInitialSimulation()
Creates a simulation based on the selected parameters.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+updateChart" name="SimulationController+updateChart"></a>

### simulationController.updateChart()
Updates the chart with the current simulation data.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+updateSimulationParameters" name="SimulationController+updateSimulationParameters"></a>

### simulationController.updateSimulationParameters()
Updates the simulation parameters based on the UI inputs.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+setInputState" name="SimulationController+setInputState"></a>

### simulationController.setInputState(disabled)
Sets the state of the input elements (enabled/disabled).

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  

| Param | Type | Description |
| --- | --- | --- |
| disabled | <code>Boolean</code> | Whether to disable the inputs or enable them. |

<a id="SimulationController+disableInputs" name="SimulationController+disableInputs"></a>

### simulationController.disableInputs()
Disables the input elements (enables the stop button).

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+enableInputs" name="SimulationController+enableInputs"></a>

### simulationController.enableInputs()
Enables the input elements (disables the stop button).

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  
<a id="SimulationController+selectSpreadRate" name="SimulationController+selectSpreadRate"></a>

### simulationController.selectSpreadRate(id)
Selects a spread rate radio button based on the provided ID.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The ID of the spread rate to select. |

<a id="SimulationController+selectRestrictions" name="SimulationController+selectRestrictions"></a>

### simulationController.selectRestrictions(restrictionsToSelect)
Selects the restrictions checkboxes based on the provided IDs.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  

| Param | Type | Description |
| --- | --- | --- |
| restrictionsToSelect | <code>Array</code> | Array of restriction IDs to select. |

<a id="SimulationController+updateScenario" name="SimulationController+updateScenario"></a>

### simulationController.updateScenario()
Updates the UI elements based on the selected scenario.

**Kind**: instance method of [<code>SimulationController</code>](#SimulationController)  

<a id="API" name="API"></a>

# API
<dl>
<dt><a href="#Configuration">Configuration Object</a></dt>
<dd><p>Documentation about the configuration object used in the simulation.</p>
</dd>
<dt><a href="#ExtendingConfiguration">Extending the Configuration Object</a></dt>
<dd><p>How to extend the configuration object for custom simulations.</p>
</dd>
<dt><a href="#EventListeners">Event Listeners</a></dt>
<dd><p>How to use event listeners for custom simulations.</p>
</dd>
<dt><a href="#RandomFunctions">Random Functions</a></dt>
<dd><p>How to use random functions for custom simulations.</p>
</dd>
</dl>

<a id="Configuration" name="Configuration"></a>

## Configuration Object
The simulation configuration object contains all the parameters needed to run the simulation. It can be easily configured via the Configuration Generator. Each section of the Configuration Generator corresponds to certain parts of the object.

The structure, along with its respective section, is as follows:

### Display Options
- **showHeader** <code>(Boolean)</code>: Controls whether the header and introduction text are displayed.

This can be configured in the Configuration Generator by selecting a checkbox.

### Node Configuration
#### Node Count Range
- **nodeCount** <code>(Object)</code>: Defines the range of nodes in the simulation.
  - **min** <code>(Number)</code>: Minimum number of nodes.
  - **max** <code>(Number)</code>: Maximum number of nodes.

The minimum and maximum values can be configured in the Configuration Generator by writing the numbers in the respective input fields.

#### Infected Percentage Range
- **infectedPercentage** <code>(Object)</code>: Defines the range of initially infected nodes.
  - **min** <code>(Number)</code>: Minimum percentage of infected nodes.
  - **max** <code>(Number)</code>: Maximum percentage of infected nodes.
  - **default** <code>(Number)</code>: Default percentage used when the simulation starts.

The minimum, maximum, and default values can be configured in the Configuration Generator by writing the numbers in the respective input fields.

### Node Colors
- **nodeColors** <code>(Object)</code>: Defines the colors for visualizing nodes.
  - **healthy** <code>(String)</code>: Color code for healthy nodes.
  - **infected** <code>(String)</code>: Color code for infected nodes.

The healthy and infected color codes can be configured in the Configuration Generator by selecting the colors from a color picker.

### Connection Types
- **connectionTypes** <code>(Array)</code>: Contains connection type objects.

The connection type objects can be added or deleted in the Configuration Generator by using the respective buttons.

Each connection type object has the following structure:
- **id** <code>(String)</code>: Unique identifier used by the code.
- **label** <code>(String)</code>: Human-readable name displayed in the UI.
- **color** <code>(String)</code>: Color code for visualizing the connection type.
- **baseProbability** <code>(Number)</code>: Base probability of infection for this connection type. Must be between 0 and 1 (0% and 100%).
- **attractionStrength** <code>(Number)</code>: Attraction strength for this connection type. Must be between 0 and 2. Higher values mean stronger attraction.

The id, label, baseProbability, and attractionStrength can be configured in the Configuration Generator by writing the values in the respective input fields. The color can be configured by selecting the color from a color picker.

### Spread Rates
- **spreadRates** <code>(Array)</code>: Contains spread rate objects.

The spread rate objects can be added or deleted in the Configuration Generator by using the respective buttons.

Each spread rate object has the following structure:
- **id** <code>(String)</code>: Unique identifier used by the code.
- **label** <code>(String)</code>: Human-readable name displayed in the UI.
- **value** <code>(Number)</code>: Spread rate multiplier value, which is applied to the base infection probabilities. Values below 1 reduce transmission, above 1 increase transmission.

The id, label, and value can be configured in the Configuration Generator by writing the values in the respective input fields.

### Restrictions
- **restrictions** <code>(Array)</code>: Contains restriction objects.

The restriction objects can be added or deleted in the Configuration Generator by using the respective buttons.

Each restriction object has the following structure:
- **id** <code>(String)</code>: Unique identifier used by the code.
- **label** <code>(String)</code>: Human-readable name displayed in the UI.
- **tooltip** <code>(String)</code>: Tooltip text displayed when hovering over the restriction name. Usually contains a description of the restriction effects.
- **multipliers** <code>(Object)</code>: Contains connection type IDs as keys and multiplier values as values. Each multiplier adjusts the transmission probability for that connection type when the restriction is active.

The id, label, and tooltip can be configured in the Configuration Generator by writing the text in the respective input fields.

The connection types are automatically listed, and the multipliers can be configured by writing the numbers in the respective connection type input fields.

### Scenarios
- **scenarios** <code>(Array)</code>: Contains scenario objects.

The scenario objects can be added or deleted in the Configuration Generator by using the respective buttons.

Each scenario object has the following structure:
- **label** <code>(String)</code>: Human-readable name displayed in the UI.
- **spreadRate** <code>(String)</code>: ID of the spread rate to apply, or null to use the last selected spread rate.
- **restrictions** <code>(Array)</code>: Array of restriction IDs to apply.

The label can be configured in the Configuration Generator by writing the text in the respective input field.

The dropdown menu for the spread rate is automatically populated with the available spread rates. It can be configured by selecting the desired spread rate from the dropdown menu.

The restrictions are automatically listed, and the selected restrictions can be configured by selecting the checkboxes of the desired restrictions.

<a id="ExtendingConfiguration" name="ExtendingConfiguration"></a>

## Extending the Configuration Object
The base structure of the configuration object must remain intact for the simulation to work correctly. However, it can be extended with additional fields to support custom features.

You can add custom fields to any part of the configuration object. The simulation will ignore these fields in its core logic, but your code can utilize them.

### Example: Adding costs to restrictions

```javascript
const config = {
    // ... other configuration fields
    restrictions: [
        {
            id: "restriction1",
            label: "Restriction 1",
            tooltip: "This is restriction 1.",
            multipliers: {
                connectionType1: 0.5,
                connectionType2: 0.8
            },
            cost: 2 // Custom field for cost of the restriction
        },
        {
            id: "restriction2",
            label: "Restriction 2",
            tooltip: "This is restriction 2.",
            multipliers: {
                connectionType1: 0.7,
                connectionType2: 0.9
            },
            cost: 5 // Custom field for cost of the restriction
        }
        // Additional restrictions can be added here
    ],
    // ... other configuration fields
};
```

<a id="EventListeners" name="EventListeners"></a>

## Event Listeners
The simulation provides an event system that allows to listen for specific events and execute custom code when those events occur. This is useful for implementing custom features that interact with the simulation lifecycle.

### Available Events
- **simulationStarted**: Triggered when the simulation begins.
- **simulationStopped**: Triggered when the simulation is stopped by the user.
- **simulationUpdated**: Triggered after each tick of the simulation.

### Event Data
Each event passes relevant data to the callback function.

- **simulationStarted**
    - `nodesAmount` - Number of nodes in the simulation
    - `initialInfectedCount` - Initial number of infected nodes
    - `spreadRate` - The selected spread rate
    - `connectionProbabilities` - Probabilities of infection for each connection type

- **simulationStopped**
    - `nodesAmount` - Number of nodes in the simulation
    - `finalInfectedCount` - Final number of infected nodes
    - `duration` - Duration of the simulation in ticks
    - `infectedAmounts` - Array of infected amounts per tick
    - `totalInfectedAmounts` - Array of total infected amounts per tick

- **simulationUpdated**
    - `nodesAmount` - Number of nodes in the simulation
    - `newInfections` - Number of new infections in the current tick
    - `totalInfected` - Total number of infected nodes
    - `tickCount` - Current tick number
    
### Example: Check game status
```javascript
// ... other code

const sim = new SimulationController(config, "sim-game");

function setupEventListeners() {
    // ... other event listeners

    // Add event listener
    sim.addEventListener('simulationUpdated', checkGameStatus);
}

function checkGameStatus(data) {
  // ... other code

  // Usage of event data
  const infectedPercentage = (data.totalInfected / data.nodesAmount) * 100;

  // ... other code
}

// Later, if you want to remove the event listener
sim.removeEventListener('simulationUpdated', checkGameStatus);
```

<a id="RandomFunctions" name="RandomFunctions"></a>

## Random Functions
The simulation allows you to replace the default D3 random functions with your own custom implementations through dependency injection. This is useful for testing with deterministic behavior, implementing custom probability distributions, creating reproducible simulations with fixed seeds, etc.

The simulation expects two random function factories:
- **randomInt(min, max)**: Creates a function which returns a random integer between min and max
- **randomBernoulli(p)**: Creates a function which returns true with probability p, false with probability 1 - p

### Example: Reproducible simulations with fixed seeds
```javascript
// ... other code

function createSeededRandomFunctions(seed) {
  const seededRandom = function() {
    let s = seed;
    // Do some operations to generate a pseudo-random number here
    return s;
  };

  const randomInt = function(min, max) {
    return () => Math.floor(seededRandom() * (max - min + 1)) + min;
  };

  const randomBernoulli = function(p) {
    return () => seededRandom() < p;
  };

  return { randomInt, randomBernoulli };
}

// Two simulations with the same seed will produce the same results
const sim1 = new SimulationController(config, "sim-1", createSeededRandomFunctions(seed));
const sim2 = new SimulationController(config, "sim-2", createSeededRandomFunctions(seed));
```
