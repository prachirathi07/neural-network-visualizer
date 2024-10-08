import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Button, Slider, Typography, Box, Paper, Tooltip } from '@mui/material';
import * as tf from '@tensorflow/tfjs';

const NetworkCanvas = ({ 
  config, 
  dataset, 
  model, 
  activations, 
  setActivations, 
  networkConfig,
  onLearningRateChange
}) => {
  const svgRef = useRef(null);
  const [animationPhase, setAnimationPhase] = useState(null);
  const [allNeurons, setAllNeurons] = useState([]);
  const [allConnections, setAllConnections] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const neuronPositions = useMemo(() => {
    if (!config?.neurons?.length) return [];

    const { width, height } = dimensions;
    const layerSpacing = width / (config.layers + 1);

    return Array.from({ length: config.layers }, (_, layerIndex) => {
      let neuronsInLayer = config.neurons[layerIndex] || 0;
      if (layerIndex === 0 && dataset?.inputShape) {
        neuronsInLayer = dataset.inputShape[0];
      } else if (layerIndex === config.layers - 1 && dataset?.outputShape) {
        neuronsInLayer = dataset.outputShape[0];
      }
      const neuronSpacing = height / (neuronsInLayer + 1);
      return Array.from({ length: neuronsInLayer }, (_, neuronIndex) => ({
        x: layerSpacing * (layerIndex + 1),
        y: neuronSpacing * (neuronIndex + 1),
        layerIndex,
        neuronIndex,
        activation: networkConfig.activationFunction,
      }));
    });
  }, [config, dataset, dimensions, networkConfig.activationFunction]);

  useEffect(() => {
    if (!svgRef.current || neuronPositions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = svg.node().getBoundingClientRect();
    setDimensions({ width, height });

    const zoomG = svg.append('g');
    const connections = zoomG.append('g').attr('class', 'connections');
    const neurons = zoomG.append('g').attr('class', 'neurons');

    const newConnections = [];
    for (let i = 0; i < neuronPositions.length - 1; i++) {
      neuronPositions[i].forEach((sourceNeuron) => {
        neuronPositions[i + 1].forEach((targetNeuron) => {
          const connection = connections.append('line')
            .attr('x1', sourceNeuron.x)
            .attr('y1', sourceNeuron.y)
            .attr('x2', targetNeuron.x)
            .attr('y2', targetNeuron.y)
            .attr('stroke', '#888')
            .attr('stroke-width', 1)
            .attr('opacity', 0.4);
          newConnections.push(connection);
        });
      });
    }
    setAllConnections(newConnections);

    const neuronData = neuronPositions.flat().map(d => ({...d}));

    const newNeurons = neurons.selectAll('.neuron')
      .data(neuronData)
      .enter()
      .append('g')
      .attr('class', 'neuron')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    newNeurons.append('circle')
      .attr('r', 6)
      .attr('fill', '#69b3a2')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    newNeurons.append('title')
      .text(d => `Neuron ${d.neuronIndex + 1} in layer ${d.layerIndex + 1}\nActivation: ${d.activation}`);

    setAllNeurons(newNeurons.nodes());

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        zoomG.attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [neuronPositions]);

  useEffect(() => {
    const animateForwardProp = () => {
      if (!activations || activations.length === 0) return;

      allNeurons.forEach((neuron) => {
        const neuronData = d3.select(neuron).datum();
        const layerIndex = neuronData.layerIndex;
        const neuronIndex = neuronData.neuronIndex;
        
        if (activations[layerIndex] && activations[layerIndex][neuronIndex] !== undefined) {
          const activation = activations[layerIndex][neuronIndex];
          d3.select(neuron).select('circle')
            .transition()
            .duration(500)
            .attr('fill', d3.interpolateRgb('#69b3a2', '#4CAF50')(activation))
            .attr('r', 6 + activation * 8);
        }
      });

      allConnections.forEach((connection) => {
        connection
          .transition()
          .duration(300)
          .attr('stroke', '#4CAF50')
          .attr('opacity', 0.8);
      });
    };

    const animateBackwardProp = () => {
      allNeurons.forEach((neuron) => {
        d3.select(neuron).select('circle')
          .transition()
          .duration(500)
          .attr('fill', '#F44336')
          .attr('r', 6);
      });

      allConnections.forEach((connection) => {
        connection
          .transition()
          .duration(300)
          .attr('stroke', '#F44336')
          .attr('opacity', 0.7);
      });
    };

    if (animationPhase === 'forward') {
      animateForwardProp();
    } else if (animationPhase === 'backward') {
      animateBackwardProp();
    }

  }, [animationPhase, allNeurons, allConnections, activations]);

  const handleLearningRateChange = (event, newValue) => {
    onLearningRateChange(newValue);
  };

  const calculateForwardProp = () => {
    if (!model || !dataset) {
      console.error("Model or dataset is not available");
      return [];
    }

    const sampleIndex = Math.floor(Math.random() * dataset.xs.shape[0]);
    const input = dataset.xs.slice([sampleIndex, 0], [1, -1]);

    const activations = [];
    let layerOutput = input;

    model.layers.forEach((layer, index) => {
      layerOutput = layer.apply(layerOutput);
      
      const layerActivations = Array.from(layerOutput.dataSync());
      activations.push(layerActivations);

      if (index < model.layers.length - 1) {
        layerOutput = tf.tidy(() => {
          switch(networkConfig.activationFunction.toLowerCase()) {
            case 'relu':
              return tf.relu(layerOutput);
            case 'sigmoid':
              return tf.sigmoid(layerOutput);
            case 'tanh':
              return tf.tanh(layerOutput);
            default:
              return layerOutput;
          }
        });
      }
    });

    return activations;
  };

  const handleForwardProp = () => {
    console.log("Forward prop button clicked");
    const newActivations = calculateForwardProp();
    setActivations(newActivations);
    setAnimationPhase('forward');
  };

  const handleBackwardProp = () => {
    console.log("Backward prop button clicked");
    setAnimationPhase('backward');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper elevation={3} sx={{ flex: 1, mb: 2, p: 2, position: 'relative' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
      </Paper>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography gutterBottom>Learning Rate: {networkConfig.learningRate}</Typography>
        <Slider
          value={networkConfig.learningRate}
          onChange={handleLearningRateChange}
          min={0.001}
          max={0.1}
          step={0.001}
          valueLabelDisplay="auto"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Tooltip title="Visualize how data flows through the network">
            <Button 
              variant="contained" 
              onClick={handleForwardProp}
              sx={{ mr: 1 }}
            >
              Forward Prop
            </Button>
          </Tooltip>
          <Tooltip title="Visualize how errors propagate backwards">
            <Button 
              variant="contained" 
              onClick={handleBackwardProp}
              sx={{ mr: 1 }}
            >
              Backward Prop
            </Button>
          </Tooltip>
          <Tooltip title="Perform one complete training step">
            <Button 
              variant="contained" 
              onClick={() => {
                handleForwardProp();
                setTimeout(handleBackwardProp, 1000);
              }}
            >
              Simulate Training Step
            </Button>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
};

export default NetworkCanvas;