/* eslint-disable no-undef */

import * as d3f from "d3-force";
import * as d3s from "d3-selection";
import * as d3d from "d3-drag";
import * as d3r from "d3-random";

/* 
 * A lot of the code in this file is based on the following example:
 * https://observablehq.com/@d3/force-directed-graph/2?intent=fork
 * I have made some modifications to the original code and added some
 * of my own code to make the simulation work as intended.
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

  node.infected = d3r.randomBernoulli(probability)();
  return node.infected;
}

 class Simulation {
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

    // Specify the dimensions of the chart.
    const width = 928;
    const height = 600;
  
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
    const svg = d3s.create("svg")
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

    function spreadInfection(intervalID) {
      if (nodes.filter(node => !node.infected).length == 0) {
        clearInterval(intervalID);
      }

      const newlyInfected = [];
      const infectedLinks = links.filter(link => link.value == 3);
      const probabilities = [0.1, 0.05, 0.05, 0.01];

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
    d3s.select("body").append(() => chart);
  }

  async modifySVG(nodeCount, infectedPercentage) {
    const chart = await this.drawChart(nodeCount, infectedPercentage);
    d3s.select("svg").remove();
    d3s.select("body").append(() => chart);
  }
}

let simulation = new Simulation();
simulation.createSVG();

let nodeSlider = document.getElementById("nodeCount");
let infectedSlider = document.getElementById("infectedPercentage");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let intervalID;

const sliderCallback = async function() {
  await simulation.modifySVG(Number(nodeSlider.value), Number(infectedSlider.value) / 100);
 }

// Update the current slider value (each time you drag the slider handle)
nodeSlider.oninput = sliderCallback;
infectedSlider.oninput = sliderCallback;
startButton.onclick = function() { intervalID = setInterval(() => simulation.spreadInfection(intervalID), 1000); startButton.disabled = true; stopButton.disabled = false; };
stopButton.onclick = function() { clearInterval(intervalID); startButton.disabled = false; stopButton.disabled = true; };