import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import GraphViewer from './GraphViewer';
import GraphViewer2 from './index2';
import GraphViewer3 from './index3';

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [viewer, setViewer] = useState(1); // State to manage the current viewer

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

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

    console.log("First cell (A1):", jsonData[0][0]);

    if (jsonData[0][0] === '' || jsonData[0][0] === undefined) {
      processTableFormat(jsonData);
    } else {
      const parsedData = jsonData.slice(1).map((row) => ({
        source_node: row[0],
        edge_weight: row[1],
        destination_node: row[2],
      }));
      processParsedData(parsedData);
    }
  };

  const processTableFormat = (jsonData) => {
    const nodeMap = {};
    const newLinks = [];
    const width = window.innerWidth * 0.85;
    const height = window.innerHeight * 0.8;

    const destinationNodes = jsonData[0].slice(1).map(destination => destination.trim());
    const sourceNodes = jsonData.slice(1).map(row => row[0].trim());

    sourceNodes.forEach((source, rowIndex) => {
      if (!nodeMap[source]) {
        nodeMap[source] = { id: source, x: Math.random() * width, y: Math.random() * height };
      }

      destinationNodes.forEach((destination, colIndex) => {
        if (!nodeMap[destination]) {
          nodeMap[destination] = { id: destination, x: Math.random() * width, y: Math.random() * height };
        }

        const edgeWeight = jsonData[rowIndex + 1][colIndex + 1] / 10;
        if (edgeWeight && edgeWeight > 0) {
          newLinks.push({ source: source, target: destination, value: edgeWeight });
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
      const { source_node, edge_weight, destination_node } = row;

      if (!nodeMap[source_node]) {
        nodeMap[source_node] = { id: source_node, x: Math.random() * 800, y: Math.random() * 600 };
      }

      if (!nodeMap[destination_node]) {
        nodeMap[destination_node] = { id: destination_node, x: Math.random() * 800, y: Math.random() * 600 };
      }

      for (let i = 0; i < edge_weight; i++) {
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
      <div>
        <button onClick={() => setViewer(1)}>Graph Viewer 1</button>
        <button onClick={() => setViewer(2)}>Graph Viewer 2</button>
        <button onClick={() => setViewer(3)}>Graph Viewer 3</button>
      </div>
      {viewer === 1 && <GraphViewer nodes={nodes} links={links} />}
      {viewer === 2 && <GraphViewer2 nodes={nodes} links={links} />}
      {viewer === 3 && <GraphViewer3 nodes={nodes} links={links} />}
    </div>
  );
};

export default App;
