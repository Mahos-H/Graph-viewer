import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as d3 from 'd3';

const GraphViewer = ({ nodes, links }) => {
  const svgRef = useRef(null);
  const [enableDragEnd, setEnableDragEnd] = useState(false);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current);
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg.selectAll("*").remove();

    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-1))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
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
      .attr("marker-end", "url(#arrow)");

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

      node.attr("transform", d => `translate(${Math.max(5, Math.min(width - 5, d.x))},${Math.max(5, Math.min(height - 5, d.y))})`);
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

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      if (file.type === 'text/csv') {
        parseCSV(contents);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        parseXLSX(contents);
      } else {
        console.error('Unsupported file type.');
      }
    };

    if (file.type === 'text/csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const parseCSV = (contents) => {
    Papa.parse(contents, {
      header: true,
      complete: (results) => {
        processParsedData(results.data);
      },
    });
  };

  const parseXLSX = (contents) => {
    const workbook = XLSX.read(new Uint8Array(contents), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData[0][0] === '' || jsonData[0][0] === undefined) {
      processTableFormat(jsonData);
      console.log('Table format detected.');
    } else {
      console.log('CSV format detected.');
      const parsedData = jsonData.slice(1).map((row) => ({
        source_node: row[0],
        edgeWeight: row[1],
        destination_node: row[2],
      }));
      processParsedData(parsedData);
    }
  };

  const processTableFormat = (jsonData) => {
    const nodeMap = {};
    const newLinks = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    const destinationNodes = jsonData[0].slice(1).map(destination => destination.trim());
    const sourceNodes = jsonData.slice(1).map(row => row[0].trim());

    const clusterOffsetX = 20; // Horizontal offset between clusters
    const clusterOffsetY = 10; // Vertical offset between clusters

    sourceNodes.forEach((source, rowIndex) => {
      const clusterCenterX = (rowIndex % 10) * clusterOffsetX + width / 10;
      const clusterCenterY = Math.floor(rowIndex / 10) * clusterOffsetY + height / 10;

      // Create a central node for each source
      if (!nodeMap[source]) {
        nodeMap[source] = { id: source, x: clusterCenterX, y: clusterCenterY };
      }

      destinationNodes.forEach((destination, colIndex) => {
        const edgeWeight = jsonData[rowIndex + 1][colIndex + 1] / 10;
        const nodeID = `${source}-${destination}`;
        if (!isNaN(edgeWeight) && edgeWeight > 0) {
          if (!nodeMap[nodeID]) {
            nodeMap[nodeID] = { id: nodeID, x: clusterCenterX + (Math.random() - 0.5) * clusterOffsetX, y: clusterCenterY + (Math.random() - 0.5) * clusterOffsetY };
          }
          for (let i = 0; i < edgeWeight; i++) {
            newLinks.push({ source: source, target: nodeID });
          }
        }
      });
    });

    setNodes(Object.values(nodeMap));
    setLinks(newLinks);
  };

  const processParsedData = (data) => {
    const nodeMap = {};
    const newLinks = [];

    data.forEach((row) => {
      const { source_node, edgeWeight, destination_node } = row;

      if (!nodeMap[source_node]) {
        nodeMap[source_node] = { id: source_node, x: Math.random() * 800, y: Math.random() * 600 };
      }

      if (!nodeMap[destination_node]) {
        nodeMap[destination_node] = { id: destination_node, x: Math.random() * 800, y: Math.random() * 600 };
      }

      for (let i = 0; i < edgeWeight; i++) {
        newLinks.push({ source: source_node, target: destination_node });
      }
    });

    setNodes(Object.values(nodeMap));
    setLinks(newLinks);
  };

  return (
    <div>
      <h1>File Reader</h1>
      <input type="file" accept=".csv, .xlsx" onChange={handleFileSelect} />
      <GraphViewer nodes={nodes} links={links} />
    </div>
  );
};

export default App;
