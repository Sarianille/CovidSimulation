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

/**
 * Represents a node in the graph.
 */
class GraphNode {
  /**
   * @constructor
   * @param {Boolean} infected - Whether the node is infected or not.
   */
  constructor(infected) {
    this.infected = infected;
  }
}

/**
 * Tries to infect uninfected nodes based on the probability and spread rate.
 * 
 * Can't be a method of the GraphNode class. The nodes get mutated in the simulation
 * and calling this method on a node would then result in an error.
 * @param {*} node - The node to try to infect.
 * @param {Number} probability - The probability of infecting the node.
 * @param {Number} spreadRate - The aggressiveness of the virus.
 * @returns {Boolean} - Whether the node was newly infected or not.
 */
function tryInfect(node, probability, spreadRate) {
  if (node.infected) {
    return false;
  }

  node.infected = d3r.randomBernoulli(probability * spreadRate)();
  return node.infected;
}

/**
 * Represents a simulation of a virus spreading.
 */
 class Simulation {
  /**
   * Contains the amount of infected nodes at each tick.
   * Starts with helper values for the correct drawing of the chart in the beginning.
   */
  infectedAmounts = [{x: 0, y: 0}, {x: 5, y: 0}];

  /**
   * Decides the amount of nodes in the graph.
   * @param {Number} nodesAmount - The amount of nodes specified by the user.
   * @returns {Number} - The amount of nodes to be used in the graph.
   */
  decideNodeCount(nodesAmount) {
    // If the user has not specified the amount of nodes, generate a random amount.
    if (nodesAmount == 0) {
      return d3r.randomInt(10, 100)();
    } else {
      return nodesAmount;
    }
  }

  /**
   * Creates the nodes in the graph.
   * @param {Array} nodes - The array to store the nodes in.
   * @param {Number} nodesAmount - The amount of nodes to be created.
   * @param {Number} percentageOfInfected - The percentage of nodes that are infected.
   */
  createNodes(nodes, nodesAmount, percentageOfInfected) {
    for (let i = 0; i < nodesAmount; i++) {
      nodes.push(new GraphNode(d3r.randomBernoulli(percentageOfInfected)()));
    }
  }

  /**
   * Reindexes node after some nodes have been deleted.
   * @param {Number} currentIndex - The current index of the node.
   * @param {Array} unlinkedIndexes - The indexes of the nodes that have been deleted.
   * @returns {Number} - The new index of the node.
   */
  reIndexNode(currentIndex, unlinkedIndexes) {
    let difference = 0;

    unlinkedIndexes.forEach(element => {
      if (currentIndex > element) {
        difference++;
      }
    });

    return currentIndex - difference;
  }

  /**
   * Reindexes the source and target nodes of the links after some nodes have been deleted.
   * @param {Array} links - The links in the graph.
   * @param {Array} unlinkedIndexes - The indexes of the nodes that have been deleted.
   */
  reIndexLinkNodes(links, unlinkedIndexes) {
    links.forEach(element => {
      element.source = this.reIndexNode(element.source, unlinkedIndexes);
      element.target = this.reIndexNode(element.target, unlinkedIndexes);
    });
  }

  /**
   * Deletes nodes that are not linked to any other nodes.
   * @param {Array} links - The links in the graph.
   * @param {Array} nodes - The nodes in the graph.
   */
  deleteUnlinkedNodes(links, nodes) {
    let unlinkedIndexes = nodes.map((node, index) => index);

    // Remove the indexes of the nodes that are linked to other nodes.
    links.forEach(element => {
      if (unlinkedIndexes.includes(element.source)) {
        unlinkedIndexes.splice(unlinkedIndexes.indexOf(element.source), 1);
      }
      if (unlinkedIndexes.includes(element.target)) {
        unlinkedIndexes.splice(unlinkedIndexes.indexOf(element.target), 1);
      }
    });

    // Reverse the array to avoid index shifting when deleting nodes.
    unlinkedIndexes.reverse().forEach(element => {
      nodes.splice(element, 1);
    });

    this.reIndexLinkNodes(links, unlinkedIndexes);
  }

  /**
   * Creates the links in the graph.
   * @param {Array} links - The array to store the links in.
   * @param {Array} nodes - The nodes in the graph.
   * @param {Number} nodesAmount - The amount of nodes in the graph.
   */
  createLinks(links, nodes, nodesAmount) {
    for (let i = 0; i < nodesAmount * 2; i++) {
      const source = d3r.randomInt(0, nodesAmount)();
      let target = d3r.randomInt(0, nodesAmount)();
      // Make sure the source and target are not the same.
      while (source === target) {
        target = d3r.randomInt(0, nodesAmount)();
      }

      const value = nodes[source].infected || nodes[target].infected ? 3 : 1;
      const type = d3r.randomInt(0, 4)();
      links.push({source: source, target: target, value: value, type: type});
    }

    this.deleteUnlinkedNodes(links, nodes);
  }

  /**
   * Creates the nodes and links in the graph.
   * @param {Number} nodesAmount - The amount of nodes in the graph.
   * @param {Number} percentageOfInfected - The percentage of nodes that are infected.
   * @returns {Object} - The nodes and links in the graph.
   */
  createData(nodesAmount, percentageOfInfected) {
    const nodes = [];
    const links = [];
    let actualNodesAmount = this.decideNodeCount(nodesAmount);

    this.createNodes(nodes, actualNodesAmount, percentageOfInfected);
    this.createLinks(links, nodes, actualNodesAmount);

    return { nodes, links };
  }

  /**
   * Draws the simulation.
   * @param {Number} nodeCount - The amount of nodes in the graph.
   * @param {Number} infectedPercentage - The percentage of nodes that are infected.
   * @returns {Element} - The SVG element of the simulation.
   */
  drawSimulation(nodeCount, infectedPercentage) {
    let data = this.createData(nodeCount, infectedPercentage);
    let tickCounter = 5;

    // Specify the dimensions of the chart.
    const width = 800;
    const height = 500;
  
    // In the order of uninfected, infected.
    const nodeColor = ['gray', 'red'];
    // In the order of family, friends, workplace/school, strangers.
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

    // Spread the infection to the nodes.
    function spreadInfection(intervalID, probabilities, spreadRate) {
      // Stop the simulation if all nodes are infected.
      if (nodes.filter(node => !node.infected).length == 0) {
        clearInterval(intervalID);
      }

      // We need to store the newly infected nodes separately to avoid
      // infecting more nodes than intended in the same tick.
      const newlyInfected = [];
      const infectedLinks = links.filter(link => link.value == 3);

      infectedLinks.forEach(link => {
        if (link.source.infected && !newlyInfected.includes(link.source)) {
          if (tryInfect(link.target, probabilities[link.type], spreadRate)) {
            newlyInfected.push(link.target);
          }
        }
        if (link.target.infected && !newlyInfected.includes(link.target)) {
          if (tryInfect(link.source, probabilities[link.type], spreadRate)) {
            newlyInfected.push(link.source);
          }
        }
      });

      links.forEach(link => {
        if (newlyInfected.includes(link.source) || newlyInfected.includes(link.target)) {
          link.value = 3;
        }
      });

      // Update the chart every 5 ticks.
      if (tickCounter == 0) {
        Chart.createSVG(this.infectedAmount);
        this.infectedAmount.push({x: (this.infectedAmount[this.infectedAmount.length - 1].x + 5), y: newlyInfected.length});
        tickCounter = 5;
      } else {
        tickCounter--;
        this.infectedAmount[this.infectedAmount.length - 1].y += newlyInfected.length;
      }

      // Restart the simulation to update the nodes and links.
      simulation.restart();
    }

    // Bind the spreadInfection function to the simulation.
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

  /**
   * Creates the initial SVG elements for the simulation and the chart.
   */
  createSVG() {
    const simulation = this.drawSimulation(0, 0.1);
    d3sel.select("body").append(() => simulation);
    Chart.createSVG(this.infectedAmounts[0]);
  }

  /**
   * Remove the old SVG elements and create new ones.
   * @param {Number} nodeCount - The amount of nodes in the graph.
   * @param {Number} infectedPercentage - The percentage of nodes that are infected.
   */
  modifySVG(nodeCount, infectedPercentage) {
    const simulation = this.drawSimulation(nodeCount, infectedPercentage);
    d3sel.selectAll("svg").remove();
    d3sel.select("body").append(() => simulation);

    // Reset the infected amount to the initial values.
    this.infectedAmounts = [{x: 0, y: 0}, {x: 5, y: 0}];
    Chart.createSVG(this.infectedAmounts[0]);
  }
}

/**
 * Represents a chart of the newly infected nodes.
 */
class Chart {
  /**
   * Draws the chart of the newly infected nodes.
   * @param {Array} infectedAmount - The amount of infected nodes at each tick.
   * @returns {Element} - The SVG element of the chart.
   */
  static drawChart(infectedAmount) {
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

    // Create a line generator.
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

  /**
   * Creates the SVG element of the chart.
   * @param {Array} infectedAmount - The amount of infected nodes at each tick.
   */
  static createSVG(infectedAmount) {
    // Remove the old chart if it exists.
    if (d3sel.selectAll("svg")._groups[0].length > 1) {
      d3sel.selectAll("svg")._groups[0][1].remove();
    }

    const chart = Chart.drawChart(infectedAmount);
    d3sel.select("body").append(() => chart);
  }
}

/**
 * Represents the data and the user interface of the simulation.
 */
class Data {
  /**
   * Initializes the data and the user interface.
   * @constructor
   */
  constructor() {
    this.nodeSlider = document.getElementById("nodeCount");
    this.infectedSlider = document.getElementById("infectedPercentage");
    this.startButton = document.getElementById("startButton");
    this.stopButton = document.getElementById("stopButton");
    this.scenarioMenu = document.getElementById("scenarioMenu");
    this.spreadRate = 1;
    this.intervalID;
    this.probabilities = [0.1, 0.05, 0.05, 0.01];
    this.modifiedProbabilities = [];
    this.simulation = new Simulation();

    const sliderCallback = () => {
      this.simulation.modifySVG(Number(this.nodeSlider.value), Number(this.infectedSlider.value) / 100);
    };

    this.simulation.createSVG();

    this.nodeSlider.oninput = sliderCallback;
    this.infectedSlider.oninput = sliderCallback;

    this.startButton.onclick = () => { 
      this.modifyProbabilities();
      this.updateSpreadRate();
      this.intervalID = setInterval(() => this.simulation.spreadInfection(this.intervalID, this.modifiedProbabilities, this.spreadRate), 1000); 
      this.disableInputs();
    };

    this.stopButton.onclick = () => { 
      clearInterval(this.intervalID); 
      this.enableInputs();
    };

    this.scenarioMenu.onchange = () => {
      this.updateScenario();
    }
  }

  /**
   * Updates the spread rate based on the user's selection.
   */
  updateSpreadRate() {
    const elements = document.getElementsByName("spread");
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        this.spreadRate = elements[i].value;
      }
    }
  }

  /**
   * Modifies the probabilities based on the user's selection.
   */
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
  }

  /**
   * Disables or enables the user inputs.
   * @param {Boolean} enabled 
   */
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

  /**
   * Disables the user inputs when the simulation is running.
   */
  disableInputs() {
    this.setInputState(true);
  }

  /**
   * Enables the user inputs when the simulation is stopped.
   */
  enableInputs() {
    this.setInputState(false);
  }

  /**
   * Changes the chosen spread rate based on the user's selection.
   * @param {String} id - The id of the chosen spread rate.
   */
  changeCheckedSpread(id) {
    let elements = document.getElementsByName("spread");
    for (let i = 0; i < elements.length; i++) {
      elements[i].checked = false;
    }
  
    document.getElementById(id).checked = true;
  }

  /**
   * Changes the selection of the restrictions.
   * @param {Boolen} selected - Whether the restrictions should be selected or not.
   */
  changeRestrictionsSelection(selected) {
    let elements = document.getElementById("restrictions").getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
      elements[i].checked = selected;
    }
  }
  
  /**
   * Unselects all the restrictions.
   */
  unselectAllRestrictions() {
    this.changeRestrictionsSelection(false);
  }
  
  /**
   * Selects all the restrictions.
   */
  selectAllRestrictions() {
    this.changeRestrictionsSelection(true);
  }
  
  /**
   * Selects some of the restrictions.
   * @param {Array} checkedRestrictions - The restrictions to be selected.
   */
  selectSomeRestrictions(checkedRestrictions) {
    this.unselectAllRestrictions();
  
    let elements = document.getElementById("restrictions").getElementsByTagName("input");
    for (let i = 0; i < elements.length; i++) {
      if (checkedRestrictions.includes(elements[i].id)) {
        elements[i].checked = true;
      }
    }
  }
  
  /**
   * Updates the user interface based on the user's selection of the scenario.
   */
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

let data = new Data();