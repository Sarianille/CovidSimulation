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

  constructor(probabilities, spreadRate) {
    this.nodes = [];
    this.links = [];
    this.probabilities = probabilities;
    this.spreadRate = spreadRate;
    this.intervalID = null;
  }

  decideNodeCount(nodeCount) {
    return nodeCount === 0 ? d3r.randomInt(10, 100)() : nodeCount;
  }

  createNodes(nodeCount, infectedPercentage) {
    this.nodes = Array.from({ length: nodeCount }, () => new GraphNode(d3r.randomBernoulli(infectedPercentage)()));
  }

  createLinks(nodeCount) {
    this.links = [];
    for (let i = 0; i < nodeCount * 2; i++) {
      const source = d3r.randomInt(0, nodeCount)();
      let target = d3r.randomInt(0, nodeCount)();
      while (source === target) target = d3r.randomInt(0, nodeCount)();
      
      const value = this.nodes[source].infected || this.nodes[target].infected ? 3 : 1;
      const type = d3r.randomInt(0, 4)();
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
  constructor(simulationLogic) {
    this.simulationLogic = simulationLogic;
    this.width = 800;
    this.height = 500;
    this.nodeColor = ["gray", "red"];
    this.linkColor = ["green", "purple", "blue", "gray"];
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
      .force("link", d3f.forceLink(links).id(d => d.index).strength(d => (d.type === 3 ? 0.1 : 0.7)))
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

  static drawChart(infectedAmounts) {
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

    return svg.node();
  }

  updateSimulation() {
    const newInfections = this.simulationLogic.spreadInfection();
    if (newInfections === -1) return;
    else if (newInfections > 0) this.simulation.restart();
  }
}

class SimulationController {
  constructor() {
    this.nodeSlider = document.getElementById("nodeCount");
    this.infectedSlider = document.getElementById("infectedPercentage");
    this.startButton = document.getElementById("startButton");
    this.stopButton = document.getElementById("stopButton");
    this.scenarioMenu = document.getElementById("scenarioMenu");

    this.spreadRate = 1;
    this.probabilities = [0.1, 0.05, 0.05, 0.01];
    this.modifiedProbabilities = [];

    this.simulation = new SimulationLogic(this.probabilities, this.spreadRate);
    this.simulationGraphics = new SimulationGraphics(this.simulation);

    this.initializeEventListeners();
    this.createInitialSimulation();
  }

  initializeEventListeners() {
    const sliderCallback = () => {
      this.createInitialSimulation();
    };

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
    d3sel.selectAll("svg").remove();
    const simulation = this.simulationGraphics.drawSimulation(
      Number(this.nodeSlider.value), 
      Number(this.infectedSlider.value) / 100,
    );
    d3sel.select("body").append(() => simulation);
    this.updateChart();
  }

  updateChart() {
    if (this.simulation.infectedAmounts.length > 1) {
      const secondChartSvg = SimulationGraphics.drawChart(this.simulation.infectedAmounts);
      const existingCharts = d3sel.selectAll("svg");
      if (existingCharts.size() > 1) {
        existingCharts.nodes()[1].remove();
      }
      d3sel.select("body").append(() => secondChartSvg);
    }
  }

  updateSpreadRate() {
    const elements = document.getElementsByName("spread");
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        this.spreadRate = elements[i].value;
        this.simulation.spreadRate = elements[i].value;
      }
    }
  }

  modifyProbabilities() {
    let inputs = document.getElementById("restrictions").getElementsByTagName("input");
    this.modifiedProbabilities = this.probabilities.map((i) => i);
  
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].checked) {
        this.modifiedProbabilities[0] *= inputs[i].dataset.family ?? 1;
        this.modifiedProbabilities[1] *= inputs[i].dataset.friends ?? 1;
        this.modifiedProbabilities[2] *= inputs[i].dataset.workSchool ?? 1;
        this.modifiedProbabilities[3] *= inputs[i].dataset.strangers ?? 1;
      }
    }

    this.simulation.probabilities = this.modifiedProbabilities;
  }

  setInputState(enabled) {
    this.startButton.disabled = enabled;
    this.stopButton.disabled = !enabled;

    let spreadInputs = document.getElementsByName("spread");
    for (let i = 0; i < spreadInputs.length; i++) {
      spreadInputs[i].disabled = enabled;
    }

    let restrictionsInputs = document.getElementById("restrictions").getElementsByTagName("input");
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
    let elements = document.getElementsByName("spread");
    for (let i = 0; i < elements.length; i++) {
      elements[i].checked = false;
    }
  
    document.getElementById(id).checked = true;
  }

  changeRestrictionsSelection(selected) {
    let elements = document.getElementById("restrictions").getElementsByTagName("input");
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
  
    let elements = document.getElementById("restrictions").getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
      if (checkedRestrictions.includes(elements[i].id)) {
        elements[i].checked = true;
      }
    }
  }

  updateScenario() {
    let scenario = document.getElementById("scenarioMenu").value;
    switch (scenario) {
      case "0":
        return;
      case "1":
        this.changeCheckedSpread("spreadLow");
        this.unselectAllRestrictions();
        break;
      case "2":
        this.changeCheckedSpread("spreadLow");
        this.selectAllRestrictions();
        break;
      case "3":
        this.changeCheckedSpread("spreadMedium");
        this.unselectAllRestrictions();
        break;
      case "4":
        this.changeCheckedSpread("spreadMedium");
        this.selectSomeRestrictions(["respirators", "quarantine", "distancing"])
        break;
      case "5":
        this.changeCheckedSpread("spreadMedium");
        this.selectAllRestrictions();
        break;
      case "6":
        this.changeCheckedSpread("spreadHigh");
        this.unselectAllRestrictions();
        break;
      case "7":
        this.changeCheckedSpread("spreadHigh");
        this.selectAllRestrictions();
        break;
    }
  }
}

let simulationController = new SimulationController();