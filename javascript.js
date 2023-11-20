/* eslint-disable no-undef */

class GraphNode {
  infected;

  constructor(infected) {
    this.infected = infected;
  }

  infect() {
    this.infected = true;
  }
}

function decideNodeCount(nodesAmount) {
  if (nodesAmount == 0) {
    return Math.min(Math.floor(Math.random() * 100 + 10), 100);
  } else {
    return nodesAmount;
  }
}

function createNodes(nodes, nodesAmount, percentageOfInfected) {
  for (let i = 0; i < nodesAmount; i++) {
    nodes.push(new GraphNode(Math.random() < percentageOfInfected));
  }
}

function createLinks(links, nodes, nodesAmount) {
  for (let i = 0; i < nodesAmount * 2; i++) {
    const source = Math.floor(Math.random() * nodesAmount);
    const target = Math.floor(Math.random() * nodesAmount);
    const value = nodes[source].infected || nodes[target].infected ? 3 : 1;
    const type = (Math.floor(Math.random() * 100)) % 4;
    links.push({ source: source, target: target, value: value, type: type });
  }
}

function createData(nodesAmount = 0, percentageOfInfected = 0.1) {
  const nodes = [];
  const links = [];
  let actualNodesAmount = decideNodeCount(nodesAmount);

  createNodes(nodes, actualNodesAmount, percentageOfInfected);
  createLinks(links, nodes, actualNodesAmount);

  return { nodes, links };
}

async function drawChart(nodeCount, infectedPercentage) {
    let data = createData(nodeCount, infectedPercentage);

    // Specify the dimensions of the chart.
    const width = 928;
    const height = 600;
  
    // Specify the color scale.
    const nodeColor = ['gray', 'red'];
    const linkColor = ['green', 'purple', 'blue', 'gray'];
  
    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({...d}));
    const nodes = data.nodes.map(d => ({...d}));
  
    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.index).strength(d => { console.log(d); if (d.type == 3) return 0; else return 2 }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);
  
    // Create the SVG container.
    const svg = d3.create("svg")
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
    node.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
  
    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    }
  
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

async function createSVG() {
    const chart = await drawChart();
    d3.select("body").append(() => chart);
}

async function modifySVG(nodeCount, infectedPercentage) {
    const chart = await drawChart(nodeCount, infectedPercentage);
    d3.select("svg").remove();
    d3.select("body").append(() => chart);
}

createSVG();

var nodeSlider = document.getElementById("nodeCount");
var infectedSlider = document.getElementById("infectedPercentage");

// Update the current slider value (each time you drag the slider handle)
nodeSlider.oninput = async function() {
  await modifySVG(this.value, infectedSlider.value / 100);
}

infectedSlider.oninput = async function() {
  await modifySVG(nodeSlider.value, this.value / 100);
}