import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphViewer3 = () => {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [svgWidth, setSvgWidth] = useState(0);
  const [svgHeight, setSvgHeight] = useState(0);
  const [enableDragEnd, setEnableDragEnd] = useState(true); // State for the checkbox

  useEffect(() => {
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.8;

    setSvgWidth(width);
    setSvgHeight(height);

    const svg = d3.select(svgRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-10))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links).id(d => d.id).distance(50))
      .on("tick", ticked);

    const link = svg.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    const node = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragend))
      .on("click", (event, d) => {
        setSelectedNode(d);
        setShowModal(true);
      });

    node.append("circle")
      .attr("r", 5)
      .attr("fill", d => d3.interpolateRainbow(d.id / nodes.length)); // Color based on node id

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.id);

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.2).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragend(event) {
      if (!enableDragEnd) return;
      if (!event.active) simulation.alphaTarget(1.0).alphaDecay(0.0001);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, enableDragEnd]);

  const handleAddNode = () => {
    const newNode = { id: nodes.length + 1, x: Math.random() * svgWidth, y: Math.random() * svgHeight };
    setNodes([...nodes, newNode]);
  };

  const handleLinkNodes = (targetNode) => {
    const newLink = { source: selectedNode, target: targetNode };
    setLinks([...links, newLink]);
    setShowModal(false);
  };

  return (
    <div>
      <svg ref={svgRef} width={svgWidth} height={svgHeight}>
        {/* SVG content will be added here */}
      </svg>
      <button onClick={handleAddNode}>Add Node</button>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Select a node to link</h2>
            {nodes.map(node => (
              <button key={node.id} onClick={() => handleLinkNodes(node)}>
                {node.id}
              </button>
            ))}
          </div>
        </div>
      )}
      <label>
        <input
          type="checkbox"
          checked={enableDragEnd}
          onChange={() => setEnableDragEnd(!enableDragEnd)}
        />
        Enable Drag End
      </label>
    </div>
  );
};

export default GraphViewer3;
