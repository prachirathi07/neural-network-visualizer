import React, { useState, useEffect } from 'react';
import { TextField, Slider, Button, Select, MenuItem, InputLabel, FormControl, Typography, FormHelperText } from '@mui/material';

const TrainingControls = ({ onUpdate, networkConfig }) => {
  const [config, setConfig] = useState({
    layers: 1,
    neurons: [64],
    activation: 'relu',
    learningRate: 0.01,
    epochs: 10,
    batchSize: 32,
    optimizer: 'adam',
    lossFunction: 'mse',
    regularization: 'none',
    regularizationRate: 0.01,
    dropout: 0,
    validationSplit: 0.2,
    earlyStoppingPatience: 0,
    ...networkConfig, // Overriding with passed props
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setConfig(networkConfig);
  }, [networkConfig]);

  const handleLayersChange = (e) => {
    const newLayers = parseInt(e.target.value, 10);
    setConfig(prevConfig => ({
      ...prevConfig,
      layers: newLayers,
      neurons: Array(newLayers).fill(0).map((_, i) => prevConfig.neurons[i] || 64) // Default to 64 neurons
    }));
  };

  const handleNeuronsChange = (index, value) => {
    setConfig(prevConfig => {
      const updatedNeurons = [...prevConfig.neurons];
      updatedNeurons[index] = parseInt(value, 10);
      return { ...prevConfig, neurons: updatedNeurons };
    });
  };

  const handleChange = (field, value) => {
    setConfig(prevConfig => ({ ...prevConfig, [field]: value }));
  };

  const validateConfig = () => {
    const newErrors = {};
    if (config.layers < 1 || config.layers > 10) newErrors.layers = 'Layers must be between 1 and 10';
    if (config.neurons.some(n => n < 1 || n > 1024)) newErrors.neurons = 'Neurons must be between 1 and 1024';
    if (config.epochs < 1 || config.epochs > 1000) newErrors.epochs = 'Epochs must be between 1 and 1000';
    if (config.batchSize < 1 || config.batchSize > 1024) newErrors.batchSize = 'Batch size must be between 1 and 1024';
    if (config.dropout < 0 || config.dropout > 0.5) newErrors.dropout = 'Dropout must be between 0 and 0.5';
    if (config.validationSplit < 0 || config.validationSplit > 0.5) newErrors.validationSplit = 'Validation split must be between 0 and 0.5';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateConfig()) {
      onUpdate(config);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '20px' }}>
      <Typography variant="h6">Neural Network Configuration</Typography>
      
      <FormControl fullWidth margin="normal" error={!!errors.layers}>
        <TextField
          label="Number of Layers"
          type="number"
          value={config.layers}
          onChange={handleLayersChange}
          inputProps={{ min: 1, max: 10 }}
        />
        {errors.layers && <FormHelperText>{errors.layers}</FormHelperText>}
      </FormControl>

      {config.neurons.map((neuron, index) => (
        <FormControl fullWidth margin="normal" key={index} error={!!errors.neurons}>
          <TextField
            label={`Neurons in Layer ${index + 1}`}
            type="number"
            value={neuron}
            onChange={(e) => handleNeuronsChange(index, e.target.value)}
            inputProps={{ min: 1, max: 1024 }}
          />
          {errors.neurons && <FormHelperText>{errors.neurons}</FormHelperText>}
        </FormControl>
      ))}

      <FormControl fullWidth margin="normal">
        <InputLabel>Activation Function</InputLabel>
        <Select
          value={config.activation}
          label="Activation Function"
          onChange={(e) => handleChange('activation', e.target.value)}
        >
          {['relu', 'sigmoid', 'tanh', 'leaky-relu', 'softmax'].map(act => (
            <MenuItem key={act} value={act}>{act}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Learning Rate</Typography>
        <Slider
          value={config.learningRate}
          onChange={(_, newValue) => handleChange('learningRate', newValue)}
          step={0.001}
          min={0.0001}
          max={0.1}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl fullWidth margin="normal" error={!!errors.epochs}>
        <TextField
          label="Epochs"
          type="number"
          value={config.epochs}
          onChange={(e) => handleChange('epochs', parseInt(e.target.value, 10))}
          inputProps={{ min: 1, max: 1000 }}
        />
        {errors.epochs && <FormHelperText>{errors.epochs}</FormHelperText>}
      </FormControl>

      <FormControl fullWidth margin="normal" error={!!errors.batchSize}>
        <TextField
          label="Batch Size"
          type="number"
          value={config.batchSize}
          onChange={(e) => handleChange('batchSize', parseInt(e.target.value, 10))}
          inputProps={{ min: 1, max: 1024 }}
        />
        {errors.batchSize && <FormHelperText>{errors.batchSize}</FormHelperText>}
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Optimizer</InputLabel>
        <Select
          value={config.optimizer}
          label="Optimizer"
          onChange={(e) => handleChange('optimizer', e.target.value)}
        >
          {['sgd', 'adam', 'rmsprop'].map(opt => (
            <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Loss Function</InputLabel>
        <Select
          value={config.lossFunction}
          label="Loss Function"
          onChange={(e) => handleChange('lossFunction', e.target.value)}
        >
          {['mse', 'binary_crossentropy', 'categorical_crossentropy'].map(loss => (
            <MenuItem key={loss} value={loss}>{loss}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Regularization</InputLabel>
        <Select
          value={config.regularization}
          label="Regularization"
          onChange={(e) => handleChange('regularization', e.target.value)}
        >
          {['none', 'l1', 'l2'].map(reg => (
            <MenuItem key={reg} value={reg}>{reg}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Dropout Rate</Typography>
        <Slider
          value={config.dropout}
          onChange={(_, newValue) => handleChange('dropout', newValue)}
          step={0.01}
          min={0}
          max={0.5}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Validation Split</Typography>
        <Slider
          value={config.validationSplit}
          onChange={(_, newValue) => handleChange('validationSplit', newValue)}
          step={0.01}
          min={0}
          max={0.5}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Early Stopping Patience</Typography>
        <Slider
          value={config.earlyStoppingPatience}
          onChange={(_, newValue) => handleChange('earlyStoppingPatience', newValue)}
          step={1}
          min={0}
          max={10}
          valueLabelDisplay="auto"
        />
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Update Configuration
      </Button>
    </div>
  );
};

export default TrainingControls;
