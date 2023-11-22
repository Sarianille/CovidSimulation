/* eslint-disable no-undef */
//@ts-check

class GraphNode implements d3.SimulationNodeDatum {
  index: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  infected: boolean;

  constructor(index: number, infected: boolean) {
    this.index = index;
    this.infected = infected;
  }

  public infect(): void {
    this.infected = true;
  }

  public clone(): GraphNode {
    return new GraphNode(this.index, this.infected);
  }
}

class GraphLink implements d3.SimulationLinkDatum<GraphNode> {
  source: number;
  target: number;
  sourceIndex: number;
  targetIndex: number;
  value: number;
  type: number;
  index?: number;

  constructor(sourceIndex: number, targetIndex: number, value: number, type: number) {
    this.source = sourceIndex;
    this.target = targetIndex;
    this.sourceIndex = sourceIndex;
    this.targetIndex = targetIndex;
    this.value = value;
    this.type = type;
  }
 }

function decideNodeCount(nodesAmount: number): number {
  if (nodesAmount == 0) {
    return Math.min(Math.floor(Math.random() * 100 + 10), 100);
  } else {
    return nodesAmount;
  }
}

function createNodes(nodes: GraphNode[], nodesAmount: number, percentageOfInfected: number): void {
  for (let i = 0; i < nodesAmount; i++) {
    nodes.push(new GraphNode(i, Math.random() < percentageOfInfected));
  }
}

function createLinks(links: GraphLink[], nodes: GraphNode[], nodesAmount: number): void {
  for (let i = 0; i < nodesAmount * 2; i++) {
    const source = Math.floor(Math.random() * nodesAmount);
    const target = Math.floor(Math.random() * nodesAmount);
    const value = nodes[source].infected || nodes[target].infected ? 3 : 1;
    const type = (Math.floor(Math.random() * 100)) % 4;
    links.push(new GraphLink(source, target, value, type));
  }
}

function createData(nodesAmount: number, percentageOfInfected: number): { nodes: GraphNode[], links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  let actualNodesAmount = decideNodeCount(nodesAmount);

  createNodes(nodes, actualNodesAmount, percentageOfInfected);
  createLinks(links, nodes, actualNodesAmount);

  return { nodes, links };
}

async function drawChart(nodeCount: number, infectedPercentage: number): Promise<SVGSVGElement | null> {
    let data = createData(nodeCount, infectedPercentage);

    // Specify the dimensions of the chart.
    const width = 928;
    const height = 600;
  
    // Specify the color scale.
    const nodeColor = ['gray', 'red'];
    const linkColor = ['green', 'purple', 'blue', 'gray'];
  
    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links: GraphLink[] = data.links.map(d => ({...d}));
    const nodes: GraphNode[] = data.nodes.map(d => d.clone());

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(nodes)
        .force("link", d3.forceLink(links).strength(d => { if (d.type == 3) return 0; else return 2 }))
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
    const drag = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended); 

    // hack to make drag work with TS, consult other possible solutions
    node.call(drag as any);
  
    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
      link
          .attr("x1", d => nodes[d.sourceIndex].x ?? 0)
          .attr("y1", d => nodes[d.sourceIndex].y ?? 0)
          .attr("x2", d => nodes[d.targetIndex].x ?? 0)
          .attr("y2", d => nodes[d.targetIndex].y ?? 0);
  
      node
          .attr("cx", d => d.x ?? 0)
          .attr("cy", d => d.y ?? 0);
    }
  
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event): void {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    // Update the subject (dragged node) position during drag.
    function dragged(event): void {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event): void {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  
    return svg.node();
  }

async function createSVG(): Promise<void> {
    const chart = await drawChart(0, 0.1);
    d3.select("body").append(() => chart);
}

async function modifySVG(nodeCount: number, infectedPercentage: number): Promise<void> {
    const chart = await drawChart(nodeCount, infectedPercentage);
    d3.select("svg").remove();
    d3.select("body").append(() => chart);
}

createSVG();

let nodeSlider = document.getElementById("nodeCount") as HTMLInputElement;
let infectedSlider = document.getElementById("infectedPercentage") as HTMLInputElement;

const sliderCallback = async function() {
  await modifySVG(Number(nodeSlider.value), Number(infectedSlider.value) / 100);
 }

// Update the current slider value (each time you drag the slider handle)
nodeSlider.oninput = sliderCallback;
infectedSlider.oninput = sliderCallback;