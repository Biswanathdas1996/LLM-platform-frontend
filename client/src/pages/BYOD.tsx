import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, Search, Trash2, Plus, FileText, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { RAGIndex, RAGQueryResult, RAGUploadResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function BYOD() {
  const { toast } = useToast();
  const [newIndexName, setNewIndexName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [queryText, setQueryText] = useState("");
  const [searchMode, setSearchMode] = useState<'hybrid' | 'vector' | 'keyword'>('hybrid');

  const { data: indexesData, isLoading: indexesLoading } = useQuery<{ indexes: RAGIndex[] }>({
    queryKey: ['/api/rag/indexes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/rag/indexes`);
      if (!res.ok) throw new Error('Failed to fetch indexes');
      return res.json();
    }
  });

  const { data: indexInfo } = useQuery<RAGIndex>({
    queryKey: ['/api/rag/indexes', selectedIndex],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/rag/indexes/${selectedIndex}`);
      if (!res.ok) throw new Error('Failed to fetch index info');
      return res.json();
    },
    enabled: !!selectedIndex
  });

  const createIndexMutation = useMutation({
    mutationFn: async (indexName: string) => {
      const res = await fetch(`${API_BASE}/api/rag/indexes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index_name: indexName })
      });
      if (!res.ok) throw new Error('Failed to create index');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rag/indexes'] });
      toast({ title: "Success", description: "Index created successfully" });
      setNewIndexName("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const uploadDocsMutation = useMutation({
    mutationFn: async ({ indexName, files }: { indexName: string, files: FileList }) => {
      const formData = new FormData();
      formData.append('index_name', indexName);
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch(`${API_BASE}/api/rag/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload documents');
      return res.json() as Promise<RAGUploadResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rag/indexes', selectedIndex] });
      toast({ 
        title: "Upload Complete", 
        description: `${data.total_processed} files processed, ${data.total_errors} errors` 
      });
      setSelectedFiles(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (error: Error) => {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteIndexMutation = useMutation({
    mutationFn: async (indexName: string) => {
      const res = await fetch(`${API_BASE}/api/rag/indexes/${indexName}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete index');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rag/indexes'] });
      toast({ title: "Success", description: "Index deleted successfully" });
      setSelectedIndex("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const queryMutation = useMutation<RAGQueryResult, Error, { indexName: string, query: string, mode: string }>({
    mutationFn: async ({ indexName, query, mode }) => {
      const res = await fetch(`${API_BASE}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index_name: indexName, query, mode, k: 5 })
      });
      if (!res.ok) throw new Error('Failed to query documents');
      return res.json();
    }
  });

  const handleCreateIndex = () => {
    if (newIndexName.trim()) {
      createIndexMutation.mutate(newIndexName.trim());
    }
  };

  const handleUpload = () => {
    if (selectedIndex && selectedFiles) {
      uploadDocsMutation.mutate({ indexName: selectedIndex, files: selectedFiles });
    }
  };

  const handleQuery = () => {
    if (selectedIndex && queryText.trim()) {
      queryMutation.mutate({ indexName: selectedIndex, query: queryText, mode: searchMode });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BYOD - Bring Your Own Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload documents, create indexes, and query using hybrid RAG search (vector + keyword)
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="query" data-testid="tab-query">
            <Search className="w-4 h-4 mr-2" />
            Query Documents
          </TabsTrigger>
          <TabsTrigger value="indexes" data-testid="tab-indexes">
            <Database className="w-4 h-4 mr-2" />
            Manage Indexes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents to Index</CardTitle>
              <CardDescription>
                Upload multiple documents (PDF, DOCX, TXT, MD, HTML, CSV). Files will be chunked, embedded, and stored for RAG queries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="select-index">Select Index</Label>
                <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                  <SelectTrigger id="select-index" data-testid="select-index">
                    <SelectValue placeholder="Choose an index" />
                  </SelectTrigger>
                  <SelectContent>
                    {indexesData?.indexes?.map((index) => (
                      <SelectItem key={index.name} value={index.name}>
                        {index.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {indexInfo && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center gap-4 text-sm">
                      <span><strong>Documents:</strong> {indexInfo.stats.total_documents}</span>
                      <span><strong>Chunks:</strong> {indexInfo.stats.total_chunks}</span>
                      <span><strong>Size:</strong> {(indexInfo.stats.total_size / 1024).toFixed(2)} KB</span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.md,.html,.htm,.csv"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  data-testid="input-file-upload"
                />
                {selectedFiles && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedIndex || !selectedFiles || uploadDocsMutation.isPending}
                className="w-full"
                data-testid="button-upload-docs"
              >
                {uploadDocsMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Documents</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Documents</CardTitle>
              <CardDescription>
                Search across your documents using hybrid search (combines vector similarity and keyword matching)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query-index">Select Index</Label>
                <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                  <SelectTrigger id="query-index" data-testid="select-query-index">
                    <SelectValue placeholder="Choose an index" />
                  </SelectTrigger>
                  <SelectContent>
                    {indexesData?.indexes?.map((index) => (
                      <SelectItem key={index.name} value={index.name}>
                        {index.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-mode">Search Mode</Label>
                <Select value={searchMode} onValueChange={(val) => setSearchMode(val as any)}>
                  <SelectTrigger id="search-mode" data-testid="select-search-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid (Vector + Keyword)</SelectItem>
                    <SelectItem value="vector">Vector Only</SelectItem>
                    <SelectItem value="keyword">Keyword Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query-input">Your Query</Label>
                <Input
                  id="query-input"
                  placeholder="Enter your question or search query..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  data-testid="input-query"
                />
              </div>

              <Button
                onClick={handleQuery}
                disabled={!selectedIndex || !queryText.trim() || queryMutation.isPending}
                className="w-full"
                data-testid="button-query"
              >
                {queryMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="w-4 h-4 mr-2" /> Search</>
                )}
              </Button>

              {queryMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Search Results</CardTitle>
                    <CardDescription>
                      Found {queryMutation.data.total_results} results using {queryMutation.data.mode} search
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {queryMutation.data.results.map((result, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Score: {result.score.toFixed(3)}</Badge>
                                  {result.metadata.document_name && (
                                    <Badge variant="secondary">
                                      <FileText className="w-3 h-3 mr-1" />
                                      {result.metadata.document_name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm leading-relaxed" data-testid={`result-text-${idx}`}>
                                  {result.text}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Index</CardTitle>
              <CardDescription>
                Create a new document index for organizing your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter index name..."
                  value={newIndexName}
                  onChange={(e) => setNewIndexName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateIndex()}
                  data-testid="input-new-index"
                />
                <Button
                  onClick={handleCreateIndex}
                  disabled={!newIndexName.trim() || createIndexMutation.isPending}
                  data-testid="button-create-index"
                >
                  {createIndexMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Create</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Indexes</CardTitle>
              <CardDescription>Manage your document indexes</CardDescription>
            </CardHeader>
            <CardContent>
              {indexesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : indexesData?.indexes && indexesData.indexes.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {indexesData.indexes.map((index) => (
                      <Card key={index.name}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold" data-testid={`index-name-${index.name}`}>
                                {index.name}
                              </h4>
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{index.stats.total_documents} docs</span>
                                <span>{index.stats.total_chunks} chunks</span>
                                <span>{(index.stats.total_size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteIndexMutation.mutate(index.name)}
                              disabled={deleteIndexMutation.isPending}
                              data-testid={`button-delete-${index.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No indexes created yet. Create one to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
