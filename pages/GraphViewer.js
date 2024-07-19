import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphViewer = ({ nodes, links }) => {
  const svgRef = useRef(null);
  const [enableDragEnd, setEnableDragEnd] = useState(true); // State for the checkbox

  useEffect(() => {
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.8;

    const svg = d3.select(svgRef.current);
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg.selectAll("*").remove(); // Clear previous contents

    // Define arrow marker
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15) // Adjust this value to control the position of the arrow relative to the end of the link
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links).id(d => d.id).distance(250))
      .on("tick", ticked);

    const link = svg.append("g")
      .selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 0.5)
      .attr("marker-end", "url(#arrow)"); // Add the marker-end attribute to create arrows

    const node = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 5)
      .attr("fill", (d, i) => d3.interpolateRainbow(i / nodes.length));

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

    function dragended(event) {
      if (!enableDragEnd) return;
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, enableDragEnd]);

  return (
    <div>
      <svg ref={svgRef} />
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

export default GraphViewer;
