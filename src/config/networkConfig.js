import React from 'react';
import { 
  Typography, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Box, 
  FormControl, 
  InputLabel,
  Slider,
  Tooltip
} from '@mui/material';

const NetworkConfig = ({ config, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...config, [field]: value });
  };

  const handleLayerChange = (index, value) => {
    const newNeurons = [...config.neurons];
    newNeurons[index] = Math.max(1, parseInt(value, 10) || 1);
    onUpdate({ ...config, neurons: newNeurons });
  };

  const addLayer = () => {
    onUpdate({
      ...config,
      layers: config.layers + 1,
      neurons: [...config.neurons, 64],
    });
  };

  const removeLayer = () => {
    if (config.layers > 1) {
      onUpdate({
        ...config,
        layers: config.layers - 1,
        neurons: config.neurons.slice(0, -1),
      });
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '5px', mt: 2 }}>
      <Typography variant="h5" gutterBottom>Network Configuration</Typography>
      
      <FormControl fullWidth margin="normal">
        <InputLabel id="activation-label">Activation Function</InputLabel>
        <Select
          labelId="activation-label"
          value={config.activation}
          onChange={(e) => handleChange('activation', e.target.value)}
        >
          <MenuItem value="relu">ReLU</MenuItem>
          <MenuItem value="sigmoid">Sigmoid</MenuItem>
          <MenuItem value="tanh">Tanh</MenuItem>
          <MenuItem value="leaky_relu">Leaky ReLU</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="optimizer-label">Optimizer</InputLabel>
        <Select
          labelId="optimizer-label"
          value={config.optimizer}
          onChange={(e) => handleChange('optimizer', e.target.value)}
        >
          <MenuItem value="sgd">SGD</MenuItem>
          <MenuItem value="adam">Adam</MenuItem>
          <MenuItem value="rmsprop">RMSprop</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="loss-label">Loss Function</InputLabel>
        <Select
          labelId="loss-label"
          value={config.lossFunction}
          onChange={(e) => handleChange('lossFunction', e.target.value)}
        >
          <MenuItem value="mse">Mean Squared Error</MenuItem>
          <MenuItem value="categorical_crossentropy">Categorical Cross-Entropy</MenuItem>
          <MenuItem value="binary_crossentropy">Binary Cross-Entropy</MenuItem>
        </Select>
      </FormControl>

      <Tooltip title="Adjust the learning rate (typically between 0.1 and 0.0001)">
        <TextField
          fullWidth
          margin="normal"
          label="Learning Rate"
          type="number"
          value={config.learningRate}
          onChange={(e) => handleChange('learningRate', parseFloat(e.target.value))}
          inputProps={{ step: "0.0001", min: "0.0001", max: "1" }}
        />
      </Tooltip>

      <Tooltip title="Number of complete passes through the training dataset">
        <TextField
          fullWidth
          margin="normal"
          label="Epochs"
          type="number"
          value={config.epochs}
          onChange={(e) => handleChange('epochs', parseInt(e.target.value, 10))}
          inputProps={{ min: "1", max: "1000" }}
        />
      </Tooltip>

      <Tooltip title="Number of samples per gradient update">
        <TextField
          fullWidth
          margin="normal"
          label="Batch Size"
          type="number"
          value={config.batchSize}
          onChange={(e) => handleChange('batchSize', parseInt(e.target.value, 10))}
          inputProps={{ min: "1", max: "1024" }}
        />
      </Tooltip>

      <Typography gutterBottom>Validation Split</Typography>
      <Tooltip title="Fraction of the training data to be used as validation data">
        <Slider
          value={config.validationSplit}
          onChange={(_, newValue) => handleChange('validationSplit', newValue)}
          step={0.01}
          marks
          min={0}
          max={0.5}
          valueLabelDisplay="auto"
        />
      </Tooltip>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Layers</Typography>
      {config.neurons.map((neurons, index) => (
        <TextField
          key={index}
          fullWidth
          margin="normal"
          label={`Layer ${index + 1} Neurons`}
          type="number"
          value={neurons}
          onChange={(e) => handleLayerChange(index, e.target.value)}
          inputProps={{ min: "1", max: "1024" }}
        />
      ))}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={addLayer} sx={{ mr: 1 }}>
          Add Layer
        </Button>
        <Button 
          variant="contained" 
          onClick={removeLayer} 
          disabled={config.layers <= 1}
        >
          Remove Layer
        </Button>
      </Box>
    </Box>
  );
};

export default NetworkConfig;