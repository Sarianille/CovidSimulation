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

function tryInfect(node, probability, spreadRate) {
  if (node.infected) return false;

  node.infected = d3r.randomBernoulli(probability * spreadRate)();
  return node.infected;
}

class SimulationLogic {
  infectedAmounts = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
  tickCounter = 5;

  constructor(config) {
    this.nodes = [];
    this.links = [];

    this.intervalID = null;
    this.config = config;

    this.probabilities = config.connectionTypes.map(type => type.baseProbability);
    this.spreadRate = 1;
  }

  decideNodeCount(nodeCount) {
    return nodeCount === 0 ? d3r.randomInt(this.config.nodeCount.min, this.config.nodeCount.max)() : nodeCount;
  }

  createNodes(nodeCount, infectedPercentage) {
    this.nodes = Array.from({ length: nodeCount }, () => new GraphNode(d3r.randomBernoulli(infectedPercentage)()));
  }

  createLinks(nodeCount) {
    if (nodeCount < 2) return;

    this.links = [];
    for (let i = 0; i < nodeCount * 2; i++) {
      const source = d3r.randomInt(0, nodeCount)();
      let target = d3r.randomInt(0, nodeCount)();
      while (source === target) target = d3r.randomInt(0, nodeCount)();
      
      const value = this.nodes[source].infected || this.nodes[target].infected ? 3 : 1;
      const type = d3r.randomInt(0, this.config.connectionTypes.length)();
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

  spreadInfection() {
    if (this.nodes.every(node => node.infected)) {
      clearInterval(this.intervalID);
      return -1;
    }

    const newlyInfected = [];
    this.links
      .filter(link => link.value === 3)
      .forEach(link => {
        if (link.source.infected && tryInfect(link.target, this.probabilities[link.type], this.spreadRate))
          newlyInfected.push(link.target);
        if (link.target.infected && tryInfect(link.source, this.probabilities[link.type], this.spreadRate))
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
    const lastEntry = this.infectedAmounts[this.infectedAmounts.length - 1];

    if (this.tickCounter === 0) {
      this.infectedAmounts.push({
        x: lastEntry.x + 5,
        y: newInfectionsCount
      });
      this.tickCounter = 5;
    } else {
      this.tickCounter--;
      lastEntry.y += newInfectionsCount;
    }
  }

  resetChartData() {
    this.infectedAmounts = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
    this.tickCounter = 5;
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

  static drawChart(infectedAmounts, chartContainer) {
    const width = 800;
    const height = 300;
    const marginTop = 30;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 30;

    const x = d3sc.scaleLinear()
      .domain([0, 100])
      .range([marginLeft, width - marginRight]);

    const y = d3sc.scaleLinear()
      .domain([0, 50])
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
      .attr("x", width - 30)
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
      .text("Newly infected");

    const line = d3sh.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("d", line(infectedAmounts));

    chartContainer.innerHTML = "";
    chartContainer.appendChild(svg.node());

    return svg.node();
  }

  updateSimulation() {
    const newInfections = this.simulationLogic.spreadInfection();
    if (newInfections === -1) return;
    else if (newInfections > 0) this.simulation.restart();
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
  constructor(config, simID) {
    this.config = config;

    this.containerElement = document.getElementById(simID);

    this.spreadRate = 1;
    this.probabilities = config.connectionTypes.map(type => type.baseProbability);
    this.modifiedProbabilities = [...this.probabilities];

    this.simulation = new SimulationLogic(config);
    this.simulationGraphics = new SimulationGraphics(this.simulation, config, this.containerElement);

    this.simulationGraphics.generateHTML(config);

    this.initializeElements();
    this.initializeEventListeners();
    this.createInitialSimulation();
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
      this.modifyProbabilities();
      this.updateSpreadRate();
      this.simulation.intervalID = setInterval(() => {
        this.simulationGraphics.updateSimulation();
        if (this.simulation.tickCounter === 0) this.updateChart();
      }, 1000);
      this.disableInputs();
    };

    this.stopButton.onclick = () => { 
      clearInterval(this.simulation.intervalID); 
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
    SimulationGraphics.drawChart(this.simulation.infectedAmounts, this.chartArea);
  }

  updateSpreadRate() {
    const elements = this.containerElement.querySelectorAll(".sim-spread-item input");
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        this.spreadRate = elements[i].value;
        this.simulation.spreadRate = elements[i].value;
      }
    }
  }

  modifyProbabilities() {
    let inputs = this.containerElement.querySelectorAll(".sim-restriction-item input");
    this.modifiedProbabilities = [...this.probabilities];
  
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        const restrictionId = inputs[i].value;
        const restriction = this.config.restrictions.find(r => r.id === restrictionId);
  
        this.config.connectionTypes.forEach((type, index) => {
          const typeId = type.id;
          if (restriction.multipliers[typeId]) {
            this.modifiedProbabilities[index] *= restriction.multipliers[typeId];
          }
        });
      }
    }
  
    this.simulation.probabilities = this.modifiedProbabilities;
  }

  setInputState(enabled) {
    this.startButton.disabled = enabled;
    this.stopButton.disabled = !enabled;

    this.nodeSlider.disabled = enabled;
    this.infectedSlider.disabled = enabled;

    this.scenarioMenu.disabled = enabled;
  
    let spreadInputs = this.containerElement.querySelectorAll(".sim-spread-item input");
    for (let i = 0; i < spreadInputs.length; i++) {
      spreadInputs[i].disabled = enabled;
    }
  
    let restrictionsInputs = this.containerElement.querySelectorAll(".sim-restriction-item input");
    for (let i = 0; i < restrictionsInputs.length; i++) {
      restrictionsInputs[i].disabled = enabled;
    }
  }

  disableInputs() {
    this.setInputState(true);
  }

  enableInputs() {
    this.setInputState(false);
  }

  changeCheckedSpread(id) {
    let elements = this.containerElement.querySelectorAll(".sim-spread-item input");
    for (let i = 0; i < elements.length; i++) {
      elements[i].checked = false;
    }
  
    this.containerElement.querySelector(`.sim-spread-item input[data-rate-id="${id}"]`).checked = true;
  }

  changeRestrictionsSelection(selected) {
    let elements = this.containerElement.querySelectorAll(".sim-restriction-item input");
    for (let i = 0; i < elements.length; i++) {
      elements[i].checked = selected;
    }
  }

  unselectAllRestrictions() {
    this.changeRestrictionsSelection(false);
  }

  selectAllRestrictions() {
    this.changeRestrictionsSelection(true);
  }

  selectSomeRestrictions(checkedRestrictions) {
    this.unselectAllRestrictions();
  
    let elements = this.containerElement.querySelectorAll(".sim-restriction-item input");
    for (let i = 0; i < elements.length; i++) {
      if (checkedRestrictions.includes(elements[i].value)) {
        elements[i].checked = true;
      }
    }
  }

  updateScenario() {
    const scenarioIndex = parseInt(this.scenarioMenu.value);
    const scenario = this.config.scenarios[scenarioIndex];

    if (scenario.spreadRate) {
      this.changeCheckedSpread(scenario.spreadRate);
    }

    if (scenario.restrictions.length === 0) {
      this.unselectAllRestrictions();
    } else if (scenario.restrictions.length === this.config.restrictions.length) {
      this.selectAllRestrictions();
    } else { 
      this.selectSomeRestrictions(scenario.restrictions);
    }
  }
}

export { SimulationController };