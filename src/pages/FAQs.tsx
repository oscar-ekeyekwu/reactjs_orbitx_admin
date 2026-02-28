import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import { faqApi, type CreateFAQDto, type UpdateFAQDto } from '@/services/api';
import type { FAQ } from '@/types';

const faqSchema = z.object({
  question: z.string().min(5, 'Must be at least 5 characters').max(200, 'Must be under 200 characters'),
  answer: z.string().min(10, 'Must be at least 10 characters').max(1000, 'Must be under 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  isActive: z.boolean(),
});

type FAQFormData = z.infer<typeof faqSchema>;

const categories = ['General', 'Orders', 'Payments', 'Drivers', 'Account'];

export function FAQsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const queryClient = useQueryClient();

  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: faqApi.getAll,
    placeholderData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFAQDto) => faqApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFAQDto }) =>
      faqApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setDeletingFaqId(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: { isActive: true },
  });

  const watchedQuestion = watch('question') ?? '';
  const watchedAnswer = watch('answer') ?? '';
  const watchedCategory = watch('category') ?? '';
  const watchedIsActive = watch('isActive') ?? true;

  const openCreateDialog = () => {
    setEditingFaq(null);
    reset({ question: '', answer: '', category: '', isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFaq(null);
    reset();
  };

  const onSubmit = (data: FAQFormData) => {
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.isActive).length || 0;
  const inactiveFaqs = totalFaqs - activeFaqs;

  const filteredFaqs = faqs?.filter((faq) => {
    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || faq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedFaqs = filteredFaqs?.reduce((acc, faq) => {
    const cat = faq.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categoryCounts = faqs?.reduce((acc, faq) => {
    const cat = faq.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <Header title="FAQs" subtitle="Manage frequently asked questions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFaqs}</p>
                <p className="text-sm text-muted-foreground">Total FAQs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeFaqs}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-2">
                <XCircle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveFaqs}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1" />
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...categories].map((cat) => {
            const count = cat === 'All' ? totalFaqs : (categoryCounts?.[cat] || 0);
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive
                      ? 'bg-white/20 text-primary-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQs List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !filteredFaqs?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search || categoryFilter !== 'All'
                ? 'No FAQs match your filters.'
                : 'No FAQs found. Create your first FAQ to get started.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedFaqs || {}).map(([category, categoryFaqs]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category}</CardTitle>
                    <Badge variant="secondary">{categoryFaqs.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {categoryFaqs.map((faq) => {
                    const isExpanded = expandedIds.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-lg border transition-all ${
                          !faq.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          onClick={() => toggleExpanded(faq.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="flex-1 text-sm font-medium">{faq.question}</span>
                          <Badge
                            variant={faq.isActive ? 'success' : 'secondary'}
                            className="shrink-0"
                          >
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <div
                            className="flex gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingFaqId(faq.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-4 py-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={closeDialog} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq
                ? 'Update the details of this frequently asked question.'
                : 'Add a question and answer to help your users.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <input type="hidden" {...register('category')} />
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat, { shouldValidate: true })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      watchedCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Question */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="question">Question</Label>
                <span
                  className={`text-xs tabular-nums ${
                    watchedQuestion.length > 180 ? 'text-orange-500' : 'text-muted-foreground'
                  }`}
                >
                  {watchedQuestion.length} / 200
                </span>
              </div>
              <Input
                id="question"
                autoFocus
                placeholder="e.g. How do I track my order?"
                className={errors.question ? 'border-red-500 focus-visible:ring-red-500' : ''}
                {...register('question')}
              />
              {errors.question && (
                <p className="text-xs text-red-500">{errors.question.message}</p>
              )}
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="answer">Answer</Label>
                <span
                  className={`text-xs tabular-nums ${
                    watchedAnswer.length > 900 ? 'text-orange-500' : 'text-muted-foreground'
                  }`}
                >
                  {watchedAnswer.length} / 1000
                </span>
              </div>
              <Textarea
                id="answer"
                rows={4}
                placeholder="Provide a clear, helpful answer..."
                className={errors.answer ? 'border-red-500 focus-visible:ring-red-500' : ''}
                {...register('answer')}
              />
              {errors.answer && (
                <p className="text-xs text-red-500">{errors.answer.message}</p>
              )}
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Publish FAQ</p>
                <p className="text-xs text-muted-foreground">Make visible to users immediately</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                <div className="relative h-5 w-9 rounded-full bg-muted transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:after:translate-x-4" />
              </label>
            </div>

            {/* Live preview */}
            {(watchedQuestion || watchedAnswer) && (
              <div className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-1.5">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Preview
                  </span>
                </div>
                <div className="p-3 bg-muted/20">
                  <div className="rounded-lg border bg-background overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">
                        {watchedQuestion || (
                          <span className="italic text-muted-foreground">Your question…</span>
                        )}
                      </span>
                      <Badge variant={watchedIsActive ? 'success' : 'secondary'} className="shrink-0">
                        {watchedIsActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {watchedAnswer && (
                      <div className="border-t bg-muted/30 px-3 py-2.5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {watchedAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingFaq
                  ? 'Update FAQ'
                  : 'Create FAQ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingFaqId} onOpenChange={() => setDeletingFaqId(null)}>
        <DialogContent onClose={() => setDeletingFaqId(null)}>
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this FAQ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingFaqId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingFaqId && deleteMutation.mutate(deletingFaqId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
