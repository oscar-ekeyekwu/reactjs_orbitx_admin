import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
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
  DialogFooter,
  Select,
} from '@/components/ui';
import { faqApi, type CreateFAQDto, type UpdateFAQDto } from '@/services/api';
import type { FAQ } from '@/types';

const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  answer: z.string().min(10, 'Answer must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean(),
});

type FAQFormData = z.infer<typeof faqSchema>;

const categories = ['General', 'Orders', 'Payments', 'Drivers', 'Account'];

export function FAQsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

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
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      isActive: true,
    },
  });

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ?')) {
      deleteMutation.mutate(id);
    }
  };

  // Group FAQs by category
  const groupedFaqs = faqs?.reduce((acc, faq) => {
    const category = faq.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div>
      <Header title="FAQs" subtitle="Manage frequently asked questions" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {/* FAQs List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !faqs?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No FAQs found. Create your first FAQ to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFaqs || {}).map(([category, categoryFaqs]) => (
              <Card key={category}>
                <CardContent className="p-4">
                  <h3 className="mb-4 text-lg font-semibold">{category}</h3>
                  <div className="space-y-3">
                    {categoryFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="flex items-start gap-3 rounded-lg border p-4"
                      >
                        <GripVertical className="mt-1 h-5 w-5 cursor-grab text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{faq.question}</h4>
                            <Badge variant={faq.isActive ? 'success' : 'secondary'}>
                              {faq.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="flex gap-1">
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
                            onClick={() => handleDelete(faq.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={closeDialog}>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Create FAQ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select id="category" {...register('category')}>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input id="question" {...register('question')} />
              {errors.question && (
                <p className="text-sm text-red-500">{errors.question.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea id="answer" rows={4} {...register('answer')} />
              {errors.answer && (
                <p className="text-sm text-red-500">{errors.answer.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

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
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
