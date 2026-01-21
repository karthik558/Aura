import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export type FilterOption = "today" | "week" | "month" | "year" | "custom";

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

interface DateFilterProps {
  value?: FilterOption;
  onChange?: (value: FilterOption) => void;
  range?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
}

export function DateFilter({ value, onChange, range, onRangeChange }: DateFilterProps) {
  const [internalSelected, setInternalSelected] = useState<FilterOption>("week");
  const [internalRange, setInternalRange] = useState<DateRange | undefined>();
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const selected = value ?? internalSelected;
  const selectedRange = range ?? internalRange;

  const customLabel = useMemo(() => {
    if (!selectedRange?.from) return "Custom Range";
    if (!selectedRange.to) return format(selectedRange.from, "MMM dd, yyyy");
    return `${format(selectedRange.from, "MMM dd, yyyy")} – ${format(selectedRange.to, "MMM dd, yyyy")}`;
  }, [selectedRange]);

  const selectedLabel = selected === "custom"
    ? customLabel
    : filterOptions.find(o => o.value === selected)?.label;

  useEffect(() => {
    if (selected === "custom") {
      setIsCustomOpen(true);
    }
  }, [selected]);

  return (
    <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="line-clamp-1">{selectedLabel}</span>
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-2">
        <div className="grid gap-1">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              className={cn(
                "justify-start h-9",
                selected === option.value && "bg-accent font-medium",
              )}
              onClick={() => {
                if (option.value === "custom") {
                  if (onChange) {
                    onChange(option.value);
                  } else {
                    setInternalSelected(option.value);
                  }
                  setIsCustomOpen(true);
                  return;
                }

                if (onChange) {
                  onChange(option.value);
                } else {
                  setInternalSelected(option.value);
                }
                setIsCustomOpen(false);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {selected === "custom" && (
          <div className="mt-2 rounded-lg border border-border/60 p-2">
            <CalendarComponent
              mode="range"
              numberOfMonths={1}
              selected={selectedRange}
              onSelect={(newRange) => {
                if (onRangeChange) {
                  onRangeChange(newRange);
                } else {
                  setInternalRange(newRange);
                }
                if (newRange?.from && newRange?.to) {
                  if (onChange) {
                    onChange("custom");
                  } else {
                    setInternalSelected("custom");
                  }
                  setIsCustomOpen(false);
                }
              }}
              initialFocus
              className="pointer-events-auto w-full max-w-none border-0 shadow-none p-0"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
