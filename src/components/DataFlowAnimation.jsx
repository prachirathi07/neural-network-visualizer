import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { renderNetwork } from '../utils/networkRenderingUtils';

const DataFlowAnimation = ({ 
  networkConfig, 
  trainingPhase, 
  dataPoints, 
  colors = {}, 
  animationSpeed = 1500,
  onAnimationComplete
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !networkConfig || !dataPoints) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    canvas.width = width;
    canvas.height = height;

    const { neuronPositions, connections } = renderNetwork(networkConfig, width, height);
    ctx.clearRect(0, 0, width, height);
    drawNetwork(ctx, neuronPositions, connections);

    const animate = trainingPhase === 'forward' ? animateForwardPropagation : animateBackwardPropagation;
    animate(ctx, neuronPositions, dataPoints, () => {
      if (onAnimationComplete) onAnimationComplete(trainingPhase);
    });

  }, [networkConfig, trainingPhase, dataPoints, dimensions, colors, animationSpeed, onAnimationComplete]);

  const drawNetwork = (ctx, neuronPositions, connections) => {
    connections.forEach(({ source, target }) => {
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = '#999';
      ctx.stroke();
    });

    neuronPositions.flat().forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = '#69b3a2';
      ctx.fill();
    });
  };

  const animateForwardPropagation = () => {
    if (!activations || activations.length === 0) return;

    const layerDelay = 500; // ms delay between layers

    activations.forEach((layerActivations, layerIndex) => {
      setTimeout(() => {
        allNeurons
          .filter(neuron => d3.select(neuron).datum().layerIndex === layerIndex)
          .forEach((neuron, neuronIndex) => {
            const activation = layerActivations[neuronIndex];
            d3.select(neuron).select('circle')
              .transition()
              .duration(500)
              .attr('fill', d3.interpolateRgb('#69b3a2', '#4CAF50')(activation))
              .attr('r', 6 + activation * 8);
            
            // Animate connections from this neuron to the next layer
            if (layerIndex < activations.length - 1) {
              allConnections
                .filter(conn => conn.source.layerIndex === layerIndex && conn.source.neuronIndex === neuronIndex)
                .forEach(conn => {
                  d3.select(conn)
                    .transition()
                    .delay(250)
                    .duration(250)
                    .attr('stroke', '#4CAF50')
                    .attr('opacity', 0.8 * activation);
                });
            }
          });
      }, layerIndex * layerDelay);
    });
  };

  const animateBackwardPropagation = (ctx, neuronPositions, dataPoints, callback) => {
    let currentLayer = neuronPositions.length - 1;

    const animateLayer = () => {
      if (currentLayer < 0) {
        if (callback) callback();
        return;
      }

      dataPoints[currentLayer].forEach((gradient, neuronIndex) => {
        const { x, y } = neuronPositions[currentLayer][neuronIndex];
        const initialRadius = 15;
        const finalRadius = d3.scaleLinear().domain([0, 1]).range([15, 10])(gradient);

        d3.select(ctx.canvas)
          .transition()
          .duration(animationSpeed)
          .tween("radius", () => {
            return (t) => {
              const interpolatedRadius = d3.interpolate(initialRadius, finalRadius)(t);
              ctx.beginPath();
              ctx.arc(x, y, interpolatedRadius, 0, 2 * Math.PI);
              ctx.fillStyle = d3.interpolateRgb(colors.baseColor || '#69b3a2', colors.errorColor || 'red')(gradient);
              ctx.fill();
            };
          });
      });

      currentLayer--;
      setTimeout(animateLayer, animationSpeed);
    };

    animateLayer();
  };

  const addActivationLabels = () => {
    allNeurons.forEach((neuron) => {
      const neuronData = d3.select(neuron).datum();
      const activation = activations[neuronData.layerIndex][neuronData.neuronIndex];
      
      d3.select(neuron).select('text.activation-value').remove(); // Remove existing label
      
      d3.select(neuron).append('text')
        .attr('class', 'activation-value')
        .attr('x', 10)
        .attr('y', 5)
        .text(activation.toFixed(2))
        .style('font-size', '10px')
        .style('fill', 'white');
    });
  };

  const showInputData = (inputData) => {
    const inputLayer = d3.select(svgRef.current).select('.input-layer');
    inputLayer.selectAll('.input-value').remove();
    
    inputData.forEach((value, index) => {
      inputLayer.append('text')
        .attr('class', 'input-value')
        .attr('x', -30)
        .attr('y', index * 30 + 15)
        .text(value.toFixed(2))
        .style('font-size', '12px')
        .style('fill', 'white');
    });
  };

  const addLayerLabels = () => {
    const layers = ['Input', 'Hidden', 'Output'];
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.layer-label').remove();
    
    layers.forEach((label, index) => {
      svg.append('text')
        .attr('class', 'layer-label')
        .attr('x', index * (width / (layers.length - 1)))
        .attr('y', height + 20)
        .text(label)
        .style('font-size', '14px')
        .style('fill', 'white')
        .style('text-anchor', 'middle');
    });
  };

  // Call this function after creating the initial network visualization

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', marginTop: '20px' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
    </div>
  );
};

export default DataFlowAnimation;
