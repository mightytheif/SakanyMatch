import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const lifestyleSchema = z.object({
  workLocation: z.string(),
  budget: z.number().min(0),
  commute: z.string(),
  lifestyle: z.array(z.string()),
});

export default function Lifestyle() {
  const form = useForm({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: {
      workLocation: "",
      budget: 2000,
      commute: "car",
      lifestyle: [],
    },
  });

  function onSubmit(data: z.infer<typeof lifestyleSchema>) {
    console.log(data);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Lifestyle Questionnaire</h1>
        <p className="text-muted-foreground">
          Help us understand your preferences to find your perfect home
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="workLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Where do you work/study?</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location..." {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Budget</FormLabel>
                <FormControl>
                  <Slider
                    min={500}
                    max={10000}
                    step={100}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                </FormControl>
                <FormDescription>
                  ${field.value.toLocaleString()} per month
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="commute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Commute Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select commute method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="public">Public Transport</SelectItem>
                    <SelectItem value="bike">Bicycle</SelectItem>
                    <SelectItem value="walk">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Find Matches
          </Button>
        </form>
      </Form>
    </div>
  );
}
