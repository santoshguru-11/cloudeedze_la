import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Calendar, DollarSign, Trash2, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '');

interface SavedAnalysis {
  id: string;
  requirements: any;
  results: any;
  createdAt: string;
  updatedAt: string;
}

export default function SavedAnalysesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [analysisToRename, setAnalysisToRename] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyses`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analyses');
      const data = await response.json();
      setAnalyses(data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load saved analyses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (analysisId: string) => {
    setLocation(`/results/${analysisId}`);
  };

  const handleDeleteClick = (analysisId: string) => {
    setAnalysisToDelete(analysisId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete analysis');

      toast({
        title: "Success",
        description: "Analysis deleted successfully",
      });
      // Refresh the list
      fetchAnalyses();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const handleRenameClick = (analysisId: string, currentName: string) => {
    setAnalysisToRename(analysisId);
    setNewName(currentName);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!analysisToRename || !newName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisToRename}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ customName: newName.trim() })
      });
      if (!response.ok) throw new Error('Failed to rename analysis');

      toast({
        title: "Success",
        description: "Analysis renamed successfully",
      });
      // Refresh the list
      fetchAnalyses();
    } catch (error) {
      console.error('Error renaming analysis:', error);
      toast({
        title: "Error",
        description: "Failed to rename analysis",
        variant: "destructive",
      });
    } finally {
      setRenameDialogOpen(false);
      setAnalysisToRename(null);
      setNewName('');
    }
  };

  const getCustomName = (analysis: SavedAnalysis): string => {
    return analysis.requirements?.customName || `Analysis ${analysis.id.substring(0, 8)}`;
  };

  const getTotalCost = (analysis: SavedAnalysis): number => {
    const results = analysis.results;
    if (!results || !results.providers) return 0;

    // Find the cheapest provider's total cost
    // providers is an object with keys like aws, azure, gcp, oracle
    const costs = Object.values(results.providers).map((p: any) => p.total);
    return costs.length > 0 ? Math.min(...costs) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading saved analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Cost Analyses</h1>
        <p className="mt-2 text-gray-600">
          View and manage your saved cost analysis results
        </p>
      </div>

      {analyses.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Saved Analyses
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't saved any cost analyses yet. Run a cost calculation and save it to see it here.
          </p>
          <Button onClick={() => setLocation('/calculator')}>
            Go to Calculator
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getCustomName(analysis)}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRenameClick(analysis.id, getCustomName(analysis))}
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(analysis.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-900">
                  <DollarSign className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Starting from</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  ${getTotalCost(analysis).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}/mo
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Analysis ID
                </div>
                <div className="text-sm font-mono text-gray-700 truncate" title={analysis.id}>
                  {analysis.id}
                </div>
              </div>

              <Button
                onClick={() => handleViewAnalysis(analysis.id)}
                className="w-full"
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Analysis</DialogTitle>
            <DialogDescription>
              Enter a new name for this analysis
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Analysis name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConfirm();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={!newName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
