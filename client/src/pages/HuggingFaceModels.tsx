import { useState, useEffect } from 'react';
import { Plus, Download, Trash2, RefreshCw, Settings, Play, Cpu, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/components/ui/api-error';
import { huggingFaceApi, type HuggingFaceModel } from '@/lib/huggingface-api';

const MODEL_TYPES = [
  { value: 'text-generation', label: 'Text Generation' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'text2text-generation', label: 'Text-to-Text Generation' },
  { value: 'summarization', label: 'Summarization' },
  { value: 'translation', label: 'Translation' },
  { value: 'question-answering', label: 'Question Answering' },
  { value: 'fill-mask', label: 'Fill Mask' },
  { value: 'sentiment-analysis', label: 'Sentiment Analysis' },
];

export default function HuggingFaceModels() {
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<HuggingFaceModel | null>(null);
  const [loadingModel, setLoadingModel] = useState<string | null>(null);

  // Add Model Form State
  const [newModel, setNewModel] = useState({
    model_id: '',
    name: '',
    model_type: '',
    description: '',
    parameters: {
      max_new_tokens: 100,
      temperature: 0.7,
      do_sample: true,
      top_p: 0.9,
      top_k: 50,
      repetition_penalty: 1.1
    }
  });

  useEffect(() => {
    fetchModels();
  }, [filterType]);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await huggingFaceApi.getModels(filterType === 'all' ? undefined : filterType);
      setModels(response.models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModel = async () => {
    try {
      await huggingFaceApi.addModel(newModel);
      setIsAddModalOpen(false);
      setNewModel({
        model_id: '',
        name: '',
        model_type: '',
        description: '',
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.1
        }
      });
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add model');
    }
  };

  const handleUpdateModel = async () => {
    if (!editingModel) return;
    
    try {
      await huggingFaceApi.updateModel(editingModel.model_id, {
        name: editingModel.name,
        description: editingModel.description,
        parameters: editingModel.parameters
      });
      setIsEditModalOpen(false);
      setEditingModel(null);
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    
    try {
      await huggingFaceApi.deleteModel(modelId);
      fetchModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    }
  };

  const handleLoadModel = async (modelId: string) => {
    setLoadingModel(modelId);
    try {
      await huggingFaceApi.loadModel(modelId);
      fetchModels(); // Refresh to get updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setLoadingModel(null);
    }
  };

  const getModelTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'text-generation': 'bg-blue-500',
      'conversational': 'bg-green-500',
      'text2text-generation': 'bg-purple-500',
      'summarization': 'bg-orange-500',
      'translation': 'bg-cyan-500',
      'question-answering': 'bg-pink-500',
      'fill-mask': 'bg-yellow-500',
      'sentiment-analysis': 'bg-red-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <ApiError
          error={new Error(error)}
          onRetry={fetchModels}
          title="Failed to Connect to HuggingFace API"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 p-8 border border-purple-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-purple-400 font-medium">HF_MODELS</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">REGISTRY_ACTIVE</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <Button 
                onClick={fetchModels} 
                disabled={isLoading}
                className="tech-button h-9 px-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="mono">REFRESH</span>
              </Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              HuggingFace Models
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and configure HuggingFace models for text generation, conversation, and NLP tasks
            </p>
          </div>

          {/* Model Count and Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-purple-400">{models.length}</div>
              <div className="text-sm text-muted-foreground">Total Models</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-emerald-400">{models.filter(m => m.status === 'available').length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-cyan-400">{models.reduce((sum, m) => sum + m.usage_count, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Usage</div>
            </div>
            <div className="bg-card/50 backdrop-blur rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-pink-400">{new Set(models.map(m => m.model_type)).size}</div>
              <div className="text-sm text-muted-foreground">Model Types</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {MODEL_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add HuggingFace Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model_id">Model ID</Label>
                  <Input
                    id="model_id"
                    value={newModel.model_id}
                    onChange={(e) => setNewModel(prev => ({ ...prev, model_id: e.target.value }))}
                    placeholder="e.g., gpt2, microsoft/DialoGPT-medium"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={newModel.name}
                    onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., GPT-2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="model_type">Model Type</Label>
                <Select value={newModel.model_type} onValueChange={(value) => setNewModel(prev => ({ ...prev, model_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newModel.description}
                  onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Model description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_tokens">Max New Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={newModel.parameters.max_new_tokens}
                    onChange={(e) => setNewModel(prev => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, max_new_tokens: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={newModel.parameters.temperature}
                    onChange={(e) => setNewModel(prev => ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, temperature: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddModel}>
                  Add Model
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : models.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Models Found</h3>
          <p className="text-muted-foreground mb-4">
            {filterType === 'all' 
              ? 'Get started by adding your first HuggingFace model'
              : `No models found for type "${filterType}"`
            }
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Model
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Card key={model.model_id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 group-hover:text-purple-400 transition-colors">
                      {model.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{model.model_id}</p>
                  </div>
                  <Badge className={`${getModelTypeColor(model.model_type)} text-white`}>
                    {model.model_type}
                  </Badge>
                </div>
                {model.description && (
                  <p className="text-sm text-muted-foreground mt-2">{model.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Model Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-cyan-400" />
                    <span className="text-muted-foreground">Used {model.usage_count}x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" />
                    <span className="text-muted-foreground">
                      {model.last_used ? 'Recently' : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-purple-400" />
                    <span className="text-muted-foreground">{model.status}</span>
                  </div>
                </div>

                {/* Model Details */}
                <div className="text-xs text-muted-foreground">
                  <div>Added: {formatDate(model.added_date)}</div>
                  {model.last_used && (
                    <div>Last used: {formatDate(model.last_used)}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLoadModel(model.model_id)}
                      disabled={loadingModel === model.model_id}
                      className="h-8 px-3"
                    >
                      <Play className={`h-3 w-3 mr-1 ${loadingModel === model.model_id ? 'animate-spin' : ''}`} />
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingModel(model);
                        setIsEditModalOpen(true);
                      }}
                      className="h-8 px-3"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteModel(model.model_id)}
                    className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Model Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Model: {editingModel?.name}</DialogTitle>
          </DialogHeader>
          {editingModel && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Display Name</Label>
                <Input
                  id="edit_name"
                  value={editingModel.name}
                  onChange={(e) => setEditingModel(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingModel.description || ''}
                  onChange={(e) => setEditingModel(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_max_tokens">Max New Tokens</Label>
                  <Input
                    id="edit_max_tokens"
                    type="number"
                    value={editingModel.parameters?.max_new_tokens || 100}
                    onChange={(e) => setEditingModel(prev => prev ? ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, max_new_tokens: parseInt(e.target.value) }
                    }) : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_temperature">Temperature</Label>
                  <Input
                    id="edit_temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={editingModel.parameters?.temperature || 0.7}
                    onChange={(e) => setEditingModel(prev => prev ? ({ 
                      ...prev, 
                      parameters: { ...prev.parameters, temperature: parseFloat(e.target.value) }
                    }) : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateModel}>
                  Update Model
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}