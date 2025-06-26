import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useNotifications } from '@/hooks/useNotifications';

const apiSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  endpoint: z.string().url('Please enter a valid URL'),
  apiKey: z.string().min(1, 'API key is required'),
});

type ApiFormData = z.infer<typeof apiSchema>;

export function ExternalAPIConfig() {
  const { addNotification } = useNotifications();
  
  const form = useForm<ApiFormData>({
    resolver: zodResolver(apiSchema),
    defaultValues: {
      modelName: '',
      endpoint: '',
      apiKey: '',
    },
  });

  const onSubmit = async (data: ApiFormData) => {
    try {
      // TODO: Implement API storage
      console.log('Adding external API:', data);
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'External API added successfully',
      });
      
      form.reset();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add external API',
      });
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
          Add External API
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Model Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="GPT-4, Claude-3, etc." 
                      {...field}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    API Endpoint
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://api.openai.com/v1/chat/completions" 
                      {...field}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    API Key
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="sk-..." 
                      {...field}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={form.formState.isSubmitting}
            >
              Add API
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
