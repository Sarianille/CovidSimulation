/* eslint-disable no-undef */

import * as d3f from "d3-force";
import * as d3sel from "d3-selection";
import * as d3d from "d3-drag";
import * as d3r from "d3-random";
import * as d3sc from "d3-scale";
import * as d3a from "d3-axis";
import * as d3sh from "d3-shape";


class GraphNode {
  constructor(infected) {
    this.infected = infected;
  }
}

class SimulationLogic {
  infectedAmounts = [{ x: 0, y: 0 }];
  totalInfectedAmounts = [{ x: 0, y: 0 }];
  tickCount = 0;

  constructor(config, randomFunctionsFactories = {}) {
    this.nodes = [];
    this.links = [];

    this.intervalID = null;
    this.config = config;

    this.baseProbabilities = config.connectionTypes.map(type => type.baseProbability);
    this.probabilities = [...this.baseProbabilities]; // Current active probabilities
    this.spreadRate = 1;

    // dependency injection
    this.randomInt = randomFunctionsFactories.randomInt || d3r.randomInt;
    this.randomBernoulli = randomFunctionsFactories.randomBernoulli || d3r.randomBernoulli;
  }

  resetProbabilities() {
    this.probabilities = [...this.baseProbabilities];
  }

  applyRestrictions(activeRestrictionIds) {
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

  decideNodeCount(nodeCount) {
    return nodeCount === 0 ? this.randomInt(this.config.nodeCount.min + 1, this.config.nodeCount.max)() : nodeCount;
  }

  createNodes(nodeCount, infectedPercentage) {
    this.nodes = Array.from({ length: nodeCount }, () => new GraphNode(this.randomBernoulli(infectedPercentage)()));

    const initialInfectedCount = this.nodes.filter(node => node.infected).length;
    this.totalInfectedAmounts[0].y = initialInfectedCount;
  }

  createLinks(nodeCount) {
    if (nodeCount < 2) return;

    this.links = [];
    for (let i = 0; i < nodeCount * 2; i++) {
      const source = this.randomInt(0, nodeCount)();
      let target = this.randomInt(0, nodeCount)();

      while (source === target) target = this.randomInt(0, nodeCount)();
      
      const value = this.nodes[source].infected || this.nodes[target].infected ? 3 : 1;
      const type = this.randomInt(0, this.config.connectionTypes.length)();
      
      this.links.push({ source, target, value, type });
    }
    this.deleteUnlinkedNodes();
  }

  deleteUnlinkedNodes() {
    const unlinkedIndexes = new Set(this.nodes.map((_, i) => i));
    this.links.forEach(link => {
      unlinkedIndexes.delete(link.source);
      unlinkedIndexes.delete(link.target);
    });

    Array.from(unlinkedIndexes).reverse().forEach(idx => this.nodes.splice(idx, 1));
    this.reIndexLinkNodes(Array.from(unlinkedIndexes));
  }

  reIndexLinkNodes(unlinkedIndexes) {
    this.links.forEach(link => {
      link.source = this.reIndexNode(link.source, unlinkedIndexes);
      link.target = this.reIndexNode(link.target, unlinkedIndexes);
    });
  }

  reIndexNode(currentIndex, unlinkedIndexes) {
    let offset = 0;
    unlinkedIndexes.forEach(idx => {
      if (currentIndex > idx) offset++;
    });
    return currentIndex - offset;
  }

  tryInfect(node, probability, spreadRate) {
    if (node.infected) return false;
  
    node.infected = this.randomBernoulli(probability * spreadRate)();
    return node.infected;
  }

  spreadInfection() {
    if (this.nodes.every(node => node.infected)) {
      clearInterval(this.intervalID);
      return -1;
    }

    const newlyInfected = [];
    this.links
      .filter(link => link.value === 3)
      .forEach(link => {
        if (link.source.infected && this.tryInfect(link.target, this.probabilities[link.type], this.spreadRate))
          newlyInfected.push(link.target);
        if (link.target.infected && this.tryInfect(link.source, this.probabilities[link.type], this.spreadRate))
          newlyInfected.push(link.source);
      });

    this.links
      .filter(link => link.value !== 3)
      .forEach(link => {
        if (newlyInfected.includes(link.source) || newlyInfected.includes(link.target))
          link.value = 3;
      });

    this.updateInfectedAmounts(newlyInfected.length);

    return newlyInfected.length;
  }

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

  resetChartData() {
    const initialInfectedCount = this.nodes.filter(node => node.infected).length;

    this.infectedAmounts = [{ x: 0, y: 0 }];
    this.totalInfectedAmounts = [{ x: 0, y: initialInfectedCount }];
    this.tickCount = 0;
  }

  initializeSimulation(nodeCount, infectedPercentage) {
    const actualNodeCount = this.decideNodeCount(nodeCount);
    this.createNodes(actualNodeCount, infectedPercentage);
    this.createLinks(actualNodeCount);
    this.resetChartData();
  }
}

class SimulationGraphics {
  constructor(simulationLogic, config, containerElement) {
    this.simulationLogic = simulationLogic;
    this.width = 800;
    this.height = 500;

    this.config = config;
    this.containerElement = containerElement

    this.nodeColor = [this.config.nodeColors.healthy, this.config.nodeColors.infected];
    this.linkColor = this.config.connectionTypes.map(type => type.color);
  }

  drawSimulation(nodeCount, infectedPercentage) {
    this.simulationLogic.initializeSimulation(nodeCount, infectedPercentage);
    const { nodes, links } = this.simulationLogic;

    const svg = d3sel.create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height])
      .attr("style", "max-width: 100%; height: auto;");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.value)
      .attr("style", d => `stroke: ${this.linkColor[d.type]};`);

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

    // Initialize the D3 force simulation
    this.simulation = d3f.forceSimulation(nodes)
      .force("link", d3f.forceLink(links).id(d => d.index).strength(d => {
        return this.config.connectionTypes[d.type].attractionStrength;
      }))
      .force("charge", d3f.forceManyBody())
      .force("center", d3f.forceCenter(this.width / 2, this.height / 2))
      .on("tick", () => this.ticked(link, node));

    return svg.node();
  }

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

  dragstarted(event) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragended(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  static drawChart(infectedAmounts, totalInfectedAmounts, chartContainer) {
    const width = 800;
    const height = 300;
    const marginTop = 30;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 30;

    const maxX = Math.max(
      ...infectedAmounts.map(d => d.x),
      ...totalInfectedAmounts.map(d => d.x)
    )

    const maxY = Math.max(
      ...infectedAmounts.map(d => d.y),
      ...totalInfectedAmounts.map(d => d.y)
    )

    const x = d3sc.scaleLinear()
      .domain([0, Math.max(100, maxX)])
      .range([marginLeft, width - marginRight]);

    const y = d3sc.scaleLinear()
      .domain([0, Math.max(50, maxY)])
      .range([height - marginBottom, marginTop]);

    const svg = d3sel.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

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

    const newlyInfectedLine = d3sh.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", newlyInfectedLine(infectedAmounts));

    const totalInfectedLine = d3sh.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("d", totalInfectedLine(totalInfectedAmounts));

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

    chartContainer.innerHTML = "";
    chartContainer.appendChild(svg.node());

    return svg.node();
  }

  updateSimulation() {
    const newInfections = this.simulationLogic.spreadInfection();
    if (newInfections === -1) return;
    else this.simulation.restart();
  }

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

  generateRestrictionOptions(restrictions) {
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

  generateScenarioOptions(scenarios) {
    return scenarios.map((scenario, index) => `
    <option value="${index}">${scenario.label}</option>
    `).join('\n');
  }

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

  createInfoIcon(tooltipText) {
    return `<span class="info-icon" data-sim-tooltip="${tooltipText}">ⓘ</span>`;
  }

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

class SimulationController {
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

  addEventListener(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].push(callback);
      return true;
    }
    return false;
  }

  removeEventListener(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName]
        .filter(listener => listener !== callback);
      return true;
    }
    return false;
  }

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

  initializeElements() {
    this.nodeSlider = this.containerElement.querySelector(".node-count-slider");
    this.infectedSlider = this.containerElement.querySelector(".infected-percentage-slider");
    this.startButton = this.containerElement.querySelector(".sim-start-button");
    this.stopButton = this.containerElement.querySelector(".sim-stop-button");
    this.scenarioMenu = this.containerElement.querySelector(".sim-scenario-menu");
    this.visualizationArea = this.containerElement.querySelector(".sim-visualization-area");
    this.chartArea = this.containerElement.querySelector(".sim-chart-area");
  }

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

  createInitialSimulation() {    
    this.visualizationArea.innerHTML = "";

    const simulation = this.simulationGraphics.drawSimulation(
      Number(this.nodeSlider.value), 
      Number(this.infectedSlider.value) / 100,
    );

    this.visualizationArea.appendChild(simulation);
    this.updateChart();
  }

  updateChart() {
    SimulationGraphics.drawChart(
      this.simulation.infectedAmounts, 
      this.simulation.totalInfectedAmounts, 
      this.chartArea
    );
  }

  updateSimulationParameters() {
    const selectedSpreadRate = this.containerElement.querySelector(".sim-spread-item input:checked");
    this.simulation.spreadRate = parseFloat(selectedSpreadRate.value);

    const activeRestrictionIds = Array.from(
      this.containerElement.querySelectorAll(".sim-restriction-item input:checked")
    ).map(input => input.value);
    this.simulation.applyRestrictions(activeRestrictionIds);
  }

  setInputState(disabled) {
    this.startButton.disabled = disabled;
    this.stopButton.disabled = !disabled;

    this.nodeSlider.disabled = disabled;
    this.infectedSlider.disabled = disabled;

    this.scenarioMenu.disabled = disabled;
  
    const inputs = this.containerElement.querySelectorAll(
      ".sim-spread-item input, .sim-restriction-item input"
    );
    inputs.forEach(input => input.disabled = disabled);
  }

  disableInputs() {
    this.setInputState(true);
  }

  enableInputs() {
    this.setInputState(false);
  }

  selectSpreadRate(id) {
    const inputs = this.containerElement.querySelectorAll(".sim-spread-item input");

    inputs.forEach(input => {
      input.checked = input.dataset.rateId === id;
    });
  }

  selectRestrictions(restrictionsToSelect = []) {
    const checkboxes = this.containerElement.querySelectorAll(".sim-restriction-item input");

    checkboxes.forEach(checkbox => {
      checkbox.checked = restrictionsToSelect.includes(checkbox.value);
    });
  }

  updateScenario() {
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