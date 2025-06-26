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
    <Card className="modern-card overflow-hidden border-2 border-cyan-200/60 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/50 to-teal-50/30 dark:from-cyan-950/20 dark:to-teal-950/10 backdrop-blur-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
      <CardHeader className="pb-3 relative">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <svg className="h-5 w-5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          Add External API
        </CardTitle>
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 rounded-bl-full"></div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Model Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="GPT-4, Claude-3, etc." 
                      {...field}
                      className="border-border/50 focus:border-primary/50 transition-colors duration-300 bg-background/50 backdrop-blur-sm"
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
                  <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    API Endpoint
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://api.openai.com/v1/chat/completions" 
                      {...field}
                      className="border-border/50 focus:border-cyan-500/50 transition-colors duration-300 bg-background/50 backdrop-blur-sm"
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
                  <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    API Key
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="sk-..." 
                      {...field}
                      className="border-border/50 focus:border-purple-500/50 transition-colors duration-300 bg-background/50 backdrop-blur-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 group"
              disabled={form.formState.isSubmitting}
            >
              <div className="flex items-center justify-center space-x-2">
                {form.formState.isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding API...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add External API</span>
                  </>
                )}
              </div>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
