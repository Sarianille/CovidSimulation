/* eslint-disable no-undef */

import * as d3f from "d3-force";
import * as d3sel from "d3-selection";
import * as d3d from "d3-drag";
import * as d3r from "d3-random";
import * as d3sc from "d3-scale";
import * as d3a from "d3-axis";
import * as d3sh from "d3-shape";

/* 
 * A lot of the code in this file is based on the following examples:
 * https://observablehq.com/@d3/force-directed-graph/2?intent=fork
 * https://observablehq.com/@d3/inline-labels/2?intent=fork
 * I have made some modifications to the original code and added some
 * of my own code to make the simulation and chart work as intended.
 */

class GraphNode {
  constructor(infected) {
    this.infected = infected;
  }
}

function tryInfect(node, probability) {
  if (node.infected) {
    return false;
  }

  node.infected = d3r.randomBernoulli(probability * spreadRate)();
  return node.infected;
}

 class Simulation {
  infectedAmount = [{x: 0, y: 0}, {x: 5, y: 0}];

  decideNodeCount(nodesAmount) {
    if (nodesAmount == 0) {
      return d3r.randomInt(10, 100)();
    } else {
      return nodesAmount;
    }
  }

  createNodes(nodes, nodesAmount, percentageOfInfected) {
    for (let i = 0; i < nodesAmount; i++) {
      nodes.push(new GraphNode(d3r.randomBernoulli(percentageOfInfected)()));
    }
  }

  reIndexNode(currentIndex, unlinkedIndexes) {
    let difference = 0;

    unlinkedIndexes.forEach(element => {
      if (currentIndex > element) {
        difference++;
      }
    });

    return currentIndex - difference;
  }

  reIndexLinkNodes(links, unlinkedIndexes) {
    links.forEach(element => {
      element.source = this.reIndexNode(element.source, unlinkedIndexes);
      element.target = this.reIndexNode(element.target, unlinkedIndexes);
    });
  }

  deleteUnlinkedNodes(links, nodes) {
    let unlinkedIndexes = nodes.map((node, index) => index);

    links.forEach(element => {
      if (unlinkedIndexes.includes(element.source)) {
        unlinkedIndexes.splice(unlinkedIndexes.indexOf(element.source), 1);
      }
      if (unlinkedIndexes.includes(element.target)) {
        unlinkedIndexes.splice(unlinkedIndexes.indexOf(element.target), 1);
      }
    });

    unlinkedIndexes.reverse().forEach(element => {
      nodes.splice(element, 1);
    });

    this.reIndexLinkNodes(links, unlinkedIndexes);
  }

  createLinks(links, nodes, nodesAmount) {
    for (let i = 0; i < nodesAmount * 2; i++) {
      const source = d3r.randomInt(0, nodesAmount)();
      let target = d3r.randomInt(0, nodesAmount)();
      while (source === target) {
        target = d3r.randomInt(0, nodesAmount)();
      }
      const value = nodes[source].infected || nodes[target].infected ? 3 : 1;
      const type = d3r.randomInt(0, 4)();
      links.push({source: source, target: target, value: value, type: type});
    }

    this.deleteUnlinkedNodes(links, nodes);
  }

  createData(nodesAmount, percentageOfInfected) {
    const nodes = [];
    const links = [];
    let actualNodesAmount = this.decideNodeCount(nodesAmount);

    this.createNodes(nodes, actualNodesAmount, percentageOfInfected);
    this.createLinks(links, nodes, actualNodesAmount);

    return { nodes, links };
  }

  async drawChart(nodeCount, infectedPercentage) {
    let data = this.createData(nodeCount, infectedPercentage);
    let tickCounter = 5;

    // Specify the dimensions of the chart.
    const width = 800;
    const height = 500;
  
    // Specify the color scale.
    const nodeColor = ['gray', 'red'];
    // In the order of family, friends, workplace/school, strangers
    const linkColor = ['green', 'purple', 'blue', 'gray'];
  
    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({...d}));
    const nodes = data.nodes.map(d => ({...d}));

    // Create a simulation with several forces.
    const simulation = d3f.forceSimulation(nodes)
        .force("link", d3f.forceLink(links).id(d => d.index).strength(d => { if (d.type == 3) return 0.1; else return 0.7 }))
        .force("charge", d3f.forceManyBody())
        .force("center", d3f.forceCenter(width / 2, height / 2))
        .on("tick", ticked.bind(this));
  
    // Create the SVG container.
    const svg = d3sel.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");
  
    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll()
      .data(links)
      .join("line")
        .attr("stroke-width", d => d.value)
        .attr("style", d => "stroke: " + linkColor[d.type] + ";");
  
    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll()
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", d => nodeColor[+ d.infected]);
  
    // Add a drag behavior.
    node.call(d3d.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  
    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
      link
          .attr("x1", d => d.source.x ?? 0)
          .attr("y1", d => d.source.y ?? 0)
          .attr("x2", d => d.target.x ?? 0)
          .attr("y2", d => d.target.y ?? 0)
          .attr("stroke-width", d => d.value);
  
      node
          .attr("cx", d => d.x ?? 0)
          .attr("cy", d => d.y ?? 0)
          .attr("fill", d => nodeColor[+ d.infected]);
    }

    function spreadInfection(intervalID, probabilities) {
      if (nodes.filter(node => !node.infected).length == 0) {
        clearInterval(intervalID);
      }

      const newlyInfected = [];
      const infectedLinks = links.filter(link => link.value == 3);

      infectedLinks.forEach(link => {
        if (link.source.infected && !newlyInfected.includes(link.source)) {
          if (tryInfect(link.target, probabilities[link.type])) {
            newlyInfected.push(link.target);
          }
        }
        if (link.target.infected && !newlyInfected.includes(link.target)) {
          if (tryInfect(link.source, probabilities[link.type])) {
            newlyInfected.push(link.source);
          }
        }
      });

      links.forEach(link => {
        if (newlyInfected.includes(link.source) || newlyInfected.includes(link.target)) {
          link.value = 3;
        }
      });

      if (tickCounter == 0) {
        Chart.createSVG(this.infectedAmount);
        this.infectedAmount.push({x: (this.infectedAmount[this.infectedAmount.length - 1].x + 5), y: newlyInfected.length});
        tickCounter = 5;
      } else {
        tickCounter--;
        this.infectedAmount[this.infectedAmount.length - 1].y += newlyInfected.length;
      }

      simulation.restart();
    }

    this.spreadInfection = spreadInfection.bind(this);
    
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    // Update the subject (dragged node) position during drag.
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  
    return svg.node();
  }

  async createSVG() {
    const chart = await this.drawChart(0, 0.1);
    d3sel.select("body").append(() => chart);
    Chart.createSVG(this.infectedAmount[0]);
  }

  async modifySVG(nodeCount, infectedPercentage) {
    const chart = await this.drawChart(nodeCount, infectedPercentage);
    d3sel.selectAll("svg").remove();
    d3sel.select("body").append(() => chart);

    this.infectedAmount = [{x: 0, y: 0}, {x: 5, y: 0}];
    Chart.createSVG(this.infectedAmount[0]);
  }
}

class Chart {
  static async drawChart(infectedAmount) {
    // Specify the chart’s dimensions.
    const width = 800;
    const height = 300;
    const marginTop = 30;
    const marginRight = 50;
    const marginBottom = 30;
    const marginLeft = 30;

    // Create the horizontal and vertical scales.
    const x = d3sc.scaleLinear()
        .domain([0, 100])
        .range([marginLeft, width - marginRight]);

    const y = d3sc.scaleLinear()
        .domain([0, 50])
        .range([height - marginBottom, marginTop]);

    // Create the SVG container.
    const svg = d3sel.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3a.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
        .append("text")
        .attr("x", width - 30)
        .attr("y", -6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text("Time");

    // Add the y-axis.
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

    // Draw the line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", line(infectedAmount));

    return svg.node();
  }

  static async createSVG(infectedAmount) {
    if (d3sel.selectAll("svg")._groups[0].length > 1) {
      d3sel.selectAll("svg")._groups[0][1].remove();
    }

    const chart = await Chart.drawChart(infectedAmount);
    d3sel.select("body").append(() => chart);
  }
}

let simulation = new Simulation();
simulation.createSVG();

let nodeSlider = document.getElementById("nodeCount");
let infectedSlider = document.getElementById("infectedPercentage");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let scenario = document.getElementById("scenario");
let intervalID;
let spreadRate;

function updateSpreadRate() {
  const elements = document.getElementsByName("spread");
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].checked) {
      spreadRate = elements[i].value;
    }
  }
}

const probabilities = [0.1, 0.05, 0.05, 0.01];
let modifiedProbabilities = [];

function modifyProbabilities() {
  let inputs = document.getElementById("restrictions").getElementsByTagName("input");
  modifiedProbabilities = probabilities.map((i) => i);

  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].checked) {
      modifiedProbabilities[0] *= inputs[i].dataset.family ?? 1;
      modifiedProbabilities[1] *= inputs[i].dataset.friends ?? 1;
      modifiedProbabilities[2] *= inputs[i].dataset.workSchool ?? 1;
      modifiedProbabilities[3] *= inputs[i].dataset.strangers ?? 1;
    }
  }
}

function disableInputs() {
  startButton.disabled = true; 
  stopButton.disabled = false; 

  updateSpreadRate();
  let elements = document.getElementsByName("spread");
  for (let i = 0; i < elements.length; i++) {
    elements[i].disabled = true;
  }

  let inputs = document.getElementById("restrictions").getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].disabled = true;
  }
}

function enableInputs() {
  startButton.disabled = false; 
  stopButton.disabled = true; 

  let elements = document.getElementsByName("spread");
  for (let i = 0; i < elements.length; i++) {
    elements[i].disabled = false;
  }

  let inputs = document.getElementById("restrictions").getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].disabled = false;
  }
}

function changeCheckedSpread(id) {
  let elements = document.getElementsByName("spread");
  for (let i = 0; i < elements.length; i++) {
    elements[i].checked = false;
  }

  document.getElementById(id).checked = true;
}

function changeRestrictionsSelection(bool) {
  let elements = document.getElementById("restrictions").getElementsByTagName("input");
  for (let i = 0; i < elements.length; i++) {
    elements[i].checked = bool;
  }
}

function unselectAllRestrictions() {
  changeRestrictionsSelection(false);
}

function selectAllRestrictions() {
  changeRestrictionsSelection(true);
}

function selectSomeRestrictions(checkedRestrictions) {
  unselectAllRestrictions();

  let elements = document.getElementById("restrictions").getElementsByTagName("input");
  for (let i = 0; i < elements.length; i++) {
    if (checkedRestrictions.includes(elements[i].id)) {
      elements[i].checked = true;
    }
  }
}

function updateScenario() {
  let scenario = document.getElementById("scenario").value;
  switch (scenario) {
    case "0":
      return;
    case "1":
      changeCheckedSpread("spreadLow");
      unselectAllRestrictions();
      break;
    case "2":
      changeCheckedSpread("spreadLow");
      selectAllRestrictions();
      break;
    case "3":
      changeCheckedSpread("spreadMedium");
      unselectAllRestrictions();
      break;
    case "4":
      changeCheckedSpread("spreadMedium");
      selectSomeRestrictions(["respirators", "quarantine", "distancing"])
      break;
    case "5":
      changeCheckedSpread("spreadMedium");
      selectAllRestrictions();
      break;
    case "6":
      changeCheckedSpread("spreadHigh");
      unselectAllRestrictions();
      break;
    case "7":
      changeCheckedSpread("spreadHigh");
      selectAllRestrictions();
      break;
  }

}

const sliderCallback = async function() {
  await simulation.modifySVG(Number(nodeSlider.value), Number(infectedSlider.value) / 100);
 }

// Update the current slider value (each time you drag the slider handle)
nodeSlider.oninput = sliderCallback;
infectedSlider.oninput = sliderCallback;

startButton.onclick = function() { 
  modifyProbabilities(); 
  intervalID = setInterval(() => simulation.spreadInfection(intervalID, modifiedProbabilities), 1000); 
  disableInputs();
};
stopButton.onclick = function() { 
  clearInterval(intervalID); 
  enableInputs();
};

scenario.onchange = function() {
  updateScenario();
}