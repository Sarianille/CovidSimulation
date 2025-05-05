/* eslint-disable no-undef */

import * as d3f from "d3-force";
import * as d3sel from "d3-selection";
import * as d3d from "d3-drag";
import * as d3r from "d3-random";
import * as d3sc from "d3-scale";
import * as d3a from "d3-axis";
import * as d3sh from "d3-shape";

/**
 * Represents a node in the graph.
 * @class
 */
class GraphNode {
  /**
   * @constructor
   * @param {Boolean} infected - Indicates if the node is infected.
   */
  constructor(infected) {
    this.infected = infected;
  }
}

/**
 * Represents the logic of the simulation.
 * @class
 */
class SimulationLogic {
  /**
   * @constructor
   * @param {Object} config - Configuration object containing simulation parameters.
   * @param {Object} randomFunctionsFactories - Object containing custom random functions factories.
   */
  constructor(config, randomFunctionsFactories = {}) {
    // Helper values for proper chart rendering
    this.infectedAmounts = [{ x: 0, y: 0 }];
    this.totalInfectedAmounts = [{ x: 0, y: 0 }];
    this.tickCount = 0;

    this.nodes = [];
    this.links = [];

    this.intervalID = null;
    this.spreadRate = 1;

    this.config = config;
    this.baseProbabilities = config.connectionTypes.map(type => type.baseProbability);
    this.probabilities = [...this.baseProbabilities]; // Current active probabilities

    // Set functions via dependency injection
    this.randomInt = randomFunctionsFactories.randomInt || d3r.randomInt;
    this.randomBernoulli = randomFunctionsFactories.randomBernoulli || d3r.randomBernoulli;
  }

  /**
   * Resets the probabilities to their base values.
   * @method
   */
  resetProbabilities() {
    this.probabilities = [...this.baseProbabilities];
  }

  /**
   * Applies the active restrictions to the connection probabilities.
   * @method
   * @param {Array} activeRestrictionIds - Array of active restriction IDs.
   */
  applyRestrictions(activeRestrictionIds) {
    // Reset probabilities first to avoid cumulative effects from multiple calls
    this.resetProbabilities();

    const activeRestrictions = this.config.restrictions.filter(
      restriction => activeRestrictionIds.includes(restriction.id)
    );

    activeRestrictions.forEach(restriction => {
      this.config.connectionTypes.forEach((type, index) => {
        const typeId = type.id;
        if (restriction.multipliers[typeId]) {
          this.probabilities[index] *= restriction.multipliers[typeId];
        }
      });
    });
  }

  /**
   * Decides the number of nodes to create based on the provided node count.
   * If the node count is 0, a random number of nodes between the min + 1 and max values is generated.
   * @method
   * @param {Number} nodeCount - The number of nodes to create specified by the user.
   * @returns {Number} - The actual number of nodes to create.
   */
  decideNodeCount(nodeCount) {
    // Use min + 1 to avoid 0 nodes
    return nodeCount === 0 ? this.randomInt(this.config.nodeCount.min + 1, this.config.nodeCount.max)() : nodeCount;
  }

  /**
   * Creates nodes for the simulation.
   * @method
   * @param {Number} nodeCount - The number of nodes to create.
   * @param {Number} infectedPercentage - The percentage of nodes that should be infected.
   */
  createNodes(nodeCount, infectedPercentage) {
    this.nodes = Array.from({ length: nodeCount }, () => new GraphNode(this.randomBernoulli(infectedPercentage)()));

    // Set the initial infected count for the chart
    const initialInfectedCount = this.nodes.filter(node => node.infected).length;
    this.totalInfectedAmounts[0].y = initialInfectedCount;
  }

  /**
   * Creates links between nodes in the simulation.
   * @method
   * @param {Number} nodeCount - The number of nodes in the simulation.
   */
  createLinks(nodeCount) {
    // No links can be created if there are less than 2 nodes
    if (nodeCount < 2) return;

    this.links = [];
    for (let i = 0; i < nodeCount * 2; i++) {
      const source = this.randomInt(0, nodeCount)();
      let target = this.randomInt(0, nodeCount)();

      // Ensure source and target are not the same
      while (source === target) target = this.randomInt(0, nodeCount)();
      
      const value = this.nodes[source].infected || this.nodes[target].infected ? 3 : 1;
      const type = this.randomInt(0, this.config.connectionTypes.length)();
      
      this.links.push({ source, target, value, type });
    }
    this.deleteUnlinkedNodes();
  }

  /**
   * Deletes nodes that are not linked to any other nodes.
   * @method
   */
  deleteUnlinkedNodes() {
    const unlinkedIndexes = new Set(this.nodes.map((_, i) => i));

    // Remove indexes of linked nodes
    this.links.forEach(link => {
      unlinkedIndexes.delete(link.source);
      unlinkedIndexes.delete(link.target);
    });

    // Reverse the array to avoid index shifting issues
    Array.from(unlinkedIndexes).reverse().forEach(idx => this.nodes.splice(idx, 1));
    this.reIndexLinkNodes(Array.from(unlinkedIndexes));
  }

  /**
   * Re-indexes the links to account for deleted nodes.
   * @method
   * @param {Array} unlinkedIndexes - Array of indexes of deleted nodes.
   */
  reIndexLinkNodes(unlinkedIndexes) {
    this.links.forEach(link => {
      link.source = this.reIndexNode(link.source, unlinkedIndexes);
      link.target = this.reIndexNode(link.target, unlinkedIndexes);
    });
  }

  /**
   * Re-indexes a node's index based on the deleted nodes.
   * @method
   * @param {Number} currentIndex - The current index of the node.
   * @param {Array} unlinkedIndexes - Array of indexes of deleted nodes.
   * @returns {Number} - The new index of the node after re-indexing.
   */
  reIndexNode(currentIndex, unlinkedIndexes) {
    let offset = 0;
    unlinkedIndexes.forEach(idx => {
      if (currentIndex > idx) offset++;
    });
    return currentIndex - offset;
  }

  /**
   * Attempts to infect a node based on the given probability and spread rate.
   * @method
   * @param {*} node - The node to infect.
   * @param {Number} probability - The probability of infection.
   * @param {Number} spreadRate - The spread rate of the infection.
   * @returns {Boolean} - True if the node was infected, false otherwise.
   */
  tryInfect(node, probability, spreadRate) {
    if (node.infected) return false;
  
    node.infected = this.randomBernoulli(probability * spreadRate)();
    return node.infected;
  }

  /**
   * Spreads the infection through the network graph.
   * @returns {Number} - The number of newly infected nodes or -1 if all nodes are infected.
   */
  spreadInfection() {
    // Stop the simulation if all nodes are infected
    if (this.nodes.every(node => node.infected)) {
      clearInterval(this.intervalID);
      return -1;
    }

    const newlyInfected = [];

    // Filter links before iterating to avoid including links of newly infected nodes
    this.links
      .filter(link => link.value === 3)
      .forEach(link => {
        if (link.source.infected && this.tryInfect(link.target, this.probabilities[link.type], this.spreadRate))
          newlyInfected.push(link.target);
        if (link.target.infected && this.tryInfect(link.source, this.probabilities[link.type], this.spreadRate))
          newlyInfected.push(link.source);
      });

    // Update links of newly infected nodes
    this.links
      .filter(link => link.value !== 3)
      .forEach(link => {
        if (newlyInfected.includes(link.source) || newlyInfected.includes(link.target))
          link.value = 3;
      });

    this.updateInfectedAmounts(newlyInfected.length);

    return newlyInfected.length;
  }

  /**
   * Updates the chart data.
   * @method
   * @param {Number} newInfectionsCount - The number of newly infected nodes.
   */
  updateInfectedAmounts(newInfectionsCount) {
    this.tickCount++;

    this.infectedAmounts.push({
      x: this.tickCount,
      y: newInfectionsCount
    });

    this.totalInfectedAmounts.push({
      x: this.tickCount,
      y: this.nodes.filter(node => node.infected).length
    });
  }

  /**
   * Resets the chart data to its initial state.
   * @method
   */
  resetChartData() {
    // Get the new initial infected count
    const initialInfectedCount = this.nodes.filter(node => node.infected).length;

    this.infectedAmounts = [{ x: 0, y: 0 }];
    this.totalInfectedAmounts = [{ x: 0, y: initialInfectedCount }];
    this.tickCount = 0;
  }

  /**
   * Initializes the simulation.
   * @method
   * @param {Number} nodeCount - The number of nodes to create.
   * @param {Number} infectedPercentage - The percentage of nodes that should be infected.
   */
  initializeSimulation(nodeCount, infectedPercentage) {
    const actualNodeCount = this.decideNodeCount(nodeCount);
    this.createNodes(actualNodeCount, infectedPercentage);
    this.createLinks(actualNodeCount);
    this.resetChartData();
  }
}

/* 
 * A lot of the code in SimulationGraphics is based on the following examples:
 * https://observablehq.com/@d3/force-directed-graph/2?intent=fork
 * https://observablehq.com/@d3/inline-labels/2?intent=fork
 * I have made some modifications to the original code and added some
 * of my own code to make the simulation and chart work as intended.
 */

 /**
  * Represents the graphics of the simulation, chart, and UI.
  * @class
  */
class SimulationGraphics {
  /**
   * @constructor
   * @param {SimulationLogic} simulationLogic - The logic of the simulation.
   * @param {Object} config - Configuration object containing simulation parameters.
   * @param {Element} containerElement - The HTML element to contain the simulation.
   */
  constructor(simulationLogic, config, containerElement) {
    this.width = 800;
    this.height = 500;

    this.simulationLogic = simulationLogic;
    this.config = config;
    this.containerElement = containerElement

    this.nodeColor = [this.config.nodeColors.healthy, this.config.nodeColors.infected];
    this.linkColor = this.config.connectionTypes.map(type => type.color);
  }

  /**
   * Draws the simulation visualization.
   * @method
   * @param {Number} nodeCount - The number of nodes to create.
   * @param {Number} infectedPercentage - The percentage of nodes that should be infected.
   * @returns {Element} - The SVG element containing the simulation.
   */
  drawSimulation(nodeCount, infectedPercentage) {
    // Prepare the logic and data for the visualization
    this.simulationLogic.initializeSimulation(nodeCount, infectedPercentage);
    const { nodes, links } = this.simulationLogic;

    // Create the SVG container
    const svg = d3sel.create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add a line for each link
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.value)
      .attr("style", d => `stroke: ${this.linkColor[d.type]};`);

    // Add a circle for each node
    const node = svg.append("g")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", d => this.nodeColor[+d.infected])
      .call(d3d.drag()
        .on("start", event => this.dragstarted(event))
        .on("drag", event => this.dragged(event))
        .on("end", event => this.dragended(event))
      );

    // Initialize the D3 force simulation with several forces
    this.simulation = d3f.forceSimulation(nodes)
      .force("link", d3f.forceLink(links).id(d => d.index).strength(d => {
        return this.config.connectionTypes[d.type].attractionStrength;
      }))
      .force("charge", d3f.forceManyBody())
      .force("center", d3f.forceCenter(this.width / 2, this.height / 2))
      .on("tick", () => this.ticked(link, node));

    return svg.node();
  }

  /**
   * Updates the positions of the links and nodes during the simulation.
   * @method
   * @param {*} link - The link elements in the SVG.
   * @param {*} node - The node elements in the SVG.
   */
  ticked(link, node) {
    link
      .attr("x1", d => d.source.x ?? 0)
      .attr("y1", d => d.source.y ?? 0)
      .attr("x2", d => d.target.x ?? 0)
      .attr("y2", d => d.target.y ?? 0)
      .attr("stroke-width", d => d.value);
    node
      .attr("cx", d => d.x ?? 0)
      .attr("cy", d => d.y ?? 0)
      .attr("fill", d => this.nodeColor[+d.infected]);
  }

  /**
   * Handles the drag start event.
   * @method
   * @param {*} event - The drag event.
   */
  dragstarted(event) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  /**
   * Handles the drag event.
   * @method
   * @param {*} event - The drag event.
   */
  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  /**
   * Handles the drag end event.
   * @method
   * @param {*} event - The drag event.
   */
  dragended(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  /**
   * Draws the chart visualization.
   * @static
   * @method
   * @param {Array} infectedAmounts - Array of newly infected amounts over time.
   * @param {Array} totalInfectedAmounts - Array of total infected amounts over time.
   * @param {Element} chartContainer - The HTML element to contain the chart.
   * @returns {Element} - The SVG element containing the chart.
   */
  static drawChart(infectedAmounts, totalInfectedAmounts, chartContainer) {
    const width = 800;
    const height = 300;
    const marginTop = 30;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 30;

    // Calculate the maximum x and y for the chart so it doesn't overflow
    const maxX = Math.max(
      ...infectedAmounts.map(d => d.x),
      ...totalInfectedAmounts.map(d => d.x)
    )

    const maxY = Math.max(
      ...infectedAmounts.map(d => d.y),
      ...totalInfectedAmounts.map(d => d.y)
    )

    // Create the horizontal and vertical scales
    const x = d3sc.scaleLinear()
      .domain([0, Math.max(100, maxX)])
      .range([marginLeft, width - marginRight]);

    const y = d3sc.scaleLinear()
      .domain([0, Math.max(50, maxY)])
      .range([height - marginBottom, marginTop]);

    // Create the SVG container
    const svg = d3sel.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Add the x and y axes
    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3a.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
      .append("text")
      .attr("x", width - marginRight)
      .attr("y", -6)
      .attr("fill", "currentColor")
      .attr("text-anchor", "end")
      .text("Time");

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3a.axisLeft(y).ticks(height / 40).tickSizeOuter(0))
      .append("text")
      .attr("x", 0)
      .attr("y", 25)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Infections");

    // Create the line generator for newly infected nodes
    const newlyInfectedLine = d3sh.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    // Add the line for newly infected nodes
    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", newlyInfectedLine(infectedAmounts));

    // Create the line generator for total infected nodes
    const totalInfectedLine = d3sh.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    // Add the line for total infected nodes
    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("d", totalInfectedLine(totalInfectedAmounts));

    // Create the legend container
    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - marginRight - 100}, ${marginTop})`);

    legendGroup.append("rect")
      .attr("width", 100)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("fill-opacity", 0.8)
      .attr("rx", 5)
      .attr("ry", 5)

    const legend = legendGroup.selectAll(".legend-item")
      .data([
        { color: "red", label: "New Infections" },
        { color: "blue", label: "Total Infected" }
      ])
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(10, ${15 + i * 20})`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 2)
      .attr("fill", d => d.color);

    legend.append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text(d => d.label);

    // Clear the previous chart and append the new one
    chartContainer.innerHTML = "";
    chartContainer.appendChild(svg.node());

    return svg.node();
  }

  /**
   * Updates the simulation visualization by spreading the infection.
   * @method
   */
  updateSimulation() {
    const newInfections = this.simulationLogic.spreadInfection();
    if (newInfections === -1) return;
    else this.simulation.restart();
  }

  /**
   * Generates the HTML structure for the UI.
   * @method
   * @param {Object} config - Configuration object containing simulation parameters.
   */
  generateHTML(config) {
    const infoTexts = this.getInfoTexts();
    const containerElement = this.containerElement;

    containerElement.innerHTML = `
      <div class="sim-text">
      ${config.showHeader ? 
        `<h1>Interactive COVID-19 Simulation</h1>
        <p>
          This simulation is not meant to be a realistic representation of the spread of COVID-19,
          but a simplified model meant to encourage critical thinking. Feel free to experiment with
          the parameters and see how they affect the spread of the virus.
        </p>` : ``}
  
        <h3>Quick guide</h3>
        <div class="sim-legend">
          ${this.generateLegend(config)}
        </div>
      </div>
  
      <div class="sim-parameters">
        <div class="sim-sliders">
          <li>
            <label>${this.createInfoIcon(infoTexts.nodeCount)} Node count:</label>
            <input type="range" min="${config.nodeCount.min}" max="${config.nodeCount.max}" value="0" class="sim-slider node-count-slider">
          </li>
          <li>
            <label>${this.createInfoIcon(infoTexts.infectedPercentage)} Infected percentage:</label>
            <input type="range" min="${config.infectedPercentage.min}" max="${config.infectedPercentage.max}" value="${config.infectedPercentage.default}" class="sim-slider infected-percentage-slider">
          </li>
        </div>
  
        <div class="sim-modifiers">
          <label>${this.createInfoIcon(infoTexts.virusAggressiveness)} Virus aggressiveness:</label>
          <div>
            ${this.generateSpreadRateOptions(config.spreadRates)}
          </div>
        </div>
  
        <div class="sim-restrictions">
          <label>${this.createInfoIcon(infoTexts.restrictions)} Restrictions:</label>
          <div class="sim-restriction-options">
            ${this.generateRestrictionOptions(config.restrictions)}
          </div>
        </div>
  
        <div class="sim-scenarios">
          <label>${this.createInfoIcon(infoTexts.scenarios)} Scenario:</label>
          <select class="sim-scenario-menu">
            ${this.generateScenarioOptions(config.scenarios)}
          </select>
        </div>
      </div>
  
      <div class="sim-controls">
        <button class="sim-start-button">Start</button>
        <button disabled class="sim-stop-button">Stop</button>
      </div>

      <div class="sim-visualization-area"></div>
      <div class="sim-chart-area"></div>
    `;
  }

  /**
   * Generates the HTML structure for the spread rate options.
   * @method
   * @param {Array} spreadRates - Array of spread rate options.
   * @returns {String} - HTML string for the spread rate options.
   */
  generateSpreadRateOptions(spreadRates) {
    return spreadRates.map((rate, index) => `
    <li class="sim-spread-item">
      <label>
      <input type="radio" name="sim-spread-${this.containerElement.id}" data-rate-id="${rate.id}" value="${rate.value}" ${index === 1 ? " checked" : ""}>
      ${rate.label}
      </label>
    </li>
    `).join('\n');
  }

  /**
   * Generates the HTML structure for the restriction options.
   * @method
   * @param {Array} restrictions - Array of restriction options.
   * @returns {String} - HTML string for the restriction options.
   */
  generateRestrictionOptions(restrictions) {
    // Split the restrictions into two columns for better layout
    const midpoint = Math.ceil(restrictions.length / 2);
    const firstHalf = restrictions.slice(0, midpoint);
    const secondHalf = restrictions.slice(midpoint);

    return `
      <div>
        ${this.generateRestrictionsColumn(firstHalf)}
      </div>
      <div>
        ${this.generateRestrictionsColumn(secondHalf)}
      </div>
    `;
  }

  /**
   * Generates the HTML structure for a column of restrictions.
   * @method
   * @param {Array} restrictions - Array of restriction options.
   * @returns {String} - HTML string for the column of restrictions.
   */
  generateRestrictionsColumn(restrictions) {
    return restrictions.map(restriction => {
      const dataAttributes = Object.entries(restriction.multipliers)
        .map(([key, value]) => `data-${key}="${value}"`)
        .join(" ");
  
      return `
      <div class="sim-restriction-item">
        <label data-sim-tooltip="${restriction.tooltip}">
          <input type="checkbox" value="${restriction.id}" ${dataAttributes}>
          ${restriction.label}
        </label>
      </div>
      `;
    }).join('\n');
  }

  /**
   * Generates the HTML structure for the scenario options.
   * @method
   * @param {Array} scenarios - Array of scenario options.
   * @returns {String} - HTML string for the scenario options.
   */
  generateScenarioOptions(scenarios) {
    return scenarios.map((scenario, index) => `
    <option value="${index}">${scenario.label}</option>
    `).join('\n');
  }

  /**
   * Generates the HTML structure for the legend.
   * @method
   * @param {Object} config - Configuration object containing simulation parameters.
   * @returns {String} - HTML string for the legend.
   */
  generateLegend(config) {
    const nodesHTML = `
      <h4>Node Colors:</h4>
      <div class="sim-legend-items">
        <div class="sim-legend-item">
          <div class="sim-legend-node" style="background-color: ${config.nodeColors.healthy};"></div>
          <div class="sim-legend-label">Healthy</div>
        </div>
        <div class="sim-legend-item">
          <div class="sim-legend-node" style="background-color: ${config.nodeColors.infected};"></div>
          <div class="sim-legend-label">Infected</div>
        </div>
      </div>
    `;

    const linksHTML = `
      <br>
      <h4>Connection Types:</h4>
      <div class="sim-legend-items">
        ${config.connectionTypes.map(type => `
        <div class="sim-legend-item">
          <div class="sim-legend-line" style="background-color: ${type.color};"></div>
          <div class="sim-legend-label">${type.label}</div>
        </div>
        `).join('')}
      </div>
    `;

    const noteHTML = `
      <div class="sim-legend-note">
        <p>Note: Thicker lines indicate that at least one connected node is infected.</p>
        <div class="sim-legend-thickness">
            <div class="sim-legend-thickness-item">
              <div class="sim-legend-thickness-line" style="background-color: #0000ff; height: 1px;"></div>
              <div class="sim-legend-thickness-label">Regular connection</div>
            </div>
            <div class="sim-legend-thickness-item">
              <div class="sim-legend-thickness-line" style="background-color: #0000ff; height: 3px;"></div>
              <div class="sim-legend-thickness-label">Infected connection</div>
            </div>
        </div>
      </div>
    `;

    return nodesHTML + linksHTML + noteHTML;
  }

  /**
   * Creates an info icon with a tooltip.
   * @method
   * @param {String} tooltipText - The text to display in the tooltip.
   * @returns {String} - HTML string for the info icon.
   */
  createInfoIcon(tooltipText) {
    return `<span class="info-icon" data-sim-tooltip="${tooltipText}">ⓘ</span>`;
  }

  /**
   * Returns the info texts for the simulation parameters.
   * @method
   * @returns {Object} - Object containing the info texts for the simulation parameters.
   */
  getInfoTexts() {
    return {
      nodeCount: "Number of people in the simulation. If the slider is set to 0, a random number of nodes will be generated.",
      infectedPercentage: "How many people are infected at the start of the simulation.",
      virusAggressiveness: "Base of how likely the virus is to spread from one person to another.",
      restrictions: "Different measures that affect the spread of the virus. Hover over them to get a basic idea of their effect.",
      scenarios: "Predefined sets of restrictions and virus aggressivity that might be interesting to compare.",
    };
  }
}

/**
 * Ties together the simulation logic and graphics, and manages the user input.
 * @class
 */
class SimulationController {
  /**
   * @constructor
   * @param {Object} config - Configuration object containing simulation parameters.
   * @param {String} simID - The ID of the HTML element to contain the simulation.
   * @param {Object} randomFunctionsFactories - Object containing custom random functions factories.
   */
  constructor(config, simID, randomFunctionsFactories = {}) {
    this.config = config;
    this.containerElement = document.getElementById(simID);

    this.eventListeners = {
      'simulationStarted': [],
      'simulationStopped': [],
      'simulationUpdated': []
    };

    this.simulation = new SimulationLogic(config, randomFunctionsFactories);
    this.simulationGraphics = new SimulationGraphics(this.simulation, config, this.containerElement);

    this.simulationGraphics.generateHTML(config);

    this.initializeElements();
    this.initializeEventListeners();
    this.createInitialSimulation();
  }

  /**
   * Adds an event listener for a specific event.
   * @method
   * @param {String} eventName - The name of the event to listen for.
   * @param {Function} callback - The callback function to execute when the event is triggered.
   * @returns {Boolean} - True if the event listener was added successfully, false otherwise.
   */
  addEventListener(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].push(callback);
      return true;
    }
    return false;
  }

  /**
   * Removes an event listener for a specific event.
   * @method
   * @param {String} eventName - The name of the event to stop listening for.
   * @param {Function} callback - The callback function to remove.
   * @returns {Boolean} - True if the event listener was removed successfully, false otherwise.
   */
  removeEventListener(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName]
        .filter(listener => listener !== callback);
      return true;
    }
    return false;
  }

  /**
   * Executes all callbacks associated with an event.
   * @method
   * @param {String} eventName - The name of the event to trigger.
   * @param {Object} data - The data to pass to the event listeners.
   */
  triggerEvent(eventName, data) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(callback =>
      {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error executing event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Extracts the elements from the HTML structure.
   * @method
   */
  initializeElements() {
    this.nodeSlider = this.containerElement.querySelector(".node-count-slider");
    this.infectedSlider = this.containerElement.querySelector(".infected-percentage-slider");
    this.startButton = this.containerElement.querySelector(".sim-start-button");
    this.stopButton = this.containerElement.querySelector(".sim-stop-button");
    this.scenarioMenu = this.containerElement.querySelector(".sim-scenario-menu");
    this.visualizationArea = this.containerElement.querySelector(".sim-visualization-area");
    this.chartArea = this.containerElement.querySelector(".sim-chart-area");
  }

  /**
   * Initializes the event listeners for the simulation controls.
   * @method
   */
  initializeEventListeners() {
    const sliderCallback = () => this.createInitialSimulation();

    this.nodeSlider.oninput = sliderCallback;
    this.infectedSlider.oninput = sliderCallback;

    this.startButton.onclick = () => { 
      this.updateSimulationParameters();
      
      this.simulation.intervalID = setInterval(() => {
        this.simulationGraphics.updateSimulation();
        this.updateChart();

        this.triggerEvent('simulationUpdated', {
          nodesAmount: this.simulation.nodes.length,
          newInfections: this.simulation.infectedAmounts[this.simulation.infectedAmounts.length - 1].y,
          totalInfected: this.simulation.nodes.filter(node => node.infected).length,
          tickCount: this.simulation.tickCount
          
        });
      }, 1000);

      this.triggerEvent('simulationStarted', {
        nodesAmount: this.simulation.nodes.length,
        initialInfectedCount: this.simulation.nodes.filter(node => node.infected).length,
        spreadRate: this.simulation.spreadRate,
        connectionProbabilities: [...this.simulation.probabilities]
      });

      this.disableInputs();
    };

    this.stopButton.onclick = () => { 
      clearInterval(this.simulation.intervalID); 

      this.triggerEvent('simulationStopped', {
        nodesAmount: this.simulation.nodes.length,
        finalInfectedCount: this.simulation.nodes.filter(node => node.infected).length,
        duration: this.simulation.tickCount,
        infectedAmounts: [...this.simulation.infectedAmounts],
        totalInfectedAmounts: [...this.simulation.totalInfectedAmounts]
      });

      this.enableInputs();
    };

    this.scenarioMenu.onchange = () => {
      this.updateScenario();
    };
  }

  /**
   * Creates a simulation based on the selected parameters.
   * @method
   */
  createInitialSimulation() {
    // Clear the previous simulation
    this.visualizationArea.innerHTML = "";

    const simulation = this.simulationGraphics.drawSimulation(
      Number(this.nodeSlider.value), 
      Number(this.infectedSlider.value) / 100,
    );

    this.visualizationArea.appendChild(simulation);
    this.updateChart();
  }

  /**
   * Updates the chart with the current simulation data.
   * @method
   */
  updateChart() {
    SimulationGraphics.drawChart(
      this.simulation.infectedAmounts, 
      this.simulation.totalInfectedAmounts, 
      this.chartArea
    );
  }

  /**
   * Updates the simulation parameters based on the UI inputs.
   * @method
   */
  updateSimulationParameters() {
    const selectedSpreadRate = this.containerElement.querySelector(".sim-spread-item input:checked");
    this.simulation.spreadRate = parseFloat(selectedSpreadRate.value);

    const activeRestrictionIds = Array.from(
      this.containerElement.querySelectorAll(".sim-restriction-item input:checked")
    ).map(input => input.value);
    this.simulation.applyRestrictions(activeRestrictionIds);
  }

  /**
   * Sets the state of the input elements (enabled/disabled).
   * @method
   * @param {Boolean} disabled - Whether to disable the inputs or enable them.
   */
  setInputState(disabled) {
    this.startButton.disabled = disabled;
    // Stop button is an exception, the logic is inverted
    this.stopButton.disabled = !disabled;

    this.nodeSlider.disabled = disabled;
    this.infectedSlider.disabled = disabled;

    this.scenarioMenu.disabled = disabled;
  
    const inputs = this.containerElement.querySelectorAll(
      ".sim-spread-item input, .sim-restriction-item input"
    );
    inputs.forEach(input => input.disabled = disabled);
  }

  /**
   * Disables the input elements (enables the stop button).
   * @method
   */
  disableInputs() {
    this.setInputState(true);
  }

  /**
   * Enables the input elements (disables the stop button).
   * @method
   */
  enableInputs() {
    this.setInputState(false);
  }

  /**
   * Selects a spread rate radio button based on the provided ID.
   * @method
   * @param {String} id - The ID of the spread rate to select.
   */
  selectSpreadRate(id) {
    const inputs = this.containerElement.querySelectorAll(".sim-spread-item input");

    inputs.forEach(input => {
      input.checked = input.dataset.rateId === id;
    });
  }

  /**
   * Selects the restrictions checkboxes based on the provided IDs.
   * @method
   * @param {Array} restrictionsToSelect - Array of restriction IDs to select.
   */
  selectRestrictions(restrictionsToSelect = []) {
    const checkboxes = this.containerElement.querySelectorAll(".sim-restriction-item input");

    checkboxes.forEach(checkbox => {
      checkbox.checked = restrictionsToSelect.includes(checkbox.value);
    });
  }

  /**
   * Updates the UI elements based on the selected scenario.
   * @method
   */
  updateScenario() {
    // Use index instead of ID
    const scenarioIndex = parseInt(this.scenarioMenu.value);
    const scenario = this.config.scenarios[scenarioIndex];

    if (scenario.spreadRate) {
      this.selectSpreadRate(scenario.spreadRate);
    }

    if (scenario.restrictions.length === this.config.restrictions.length) {
      const allRestrictionsIds = this.config.restrictions.map(restriction => restriction.id);
      this.selectRestrictions(allRestrictionsIds);
    } else {
      this.selectRestrictions(scenario.restrictions);
    }
  }
}

export { SimulationController };
export { SimulationLogic };