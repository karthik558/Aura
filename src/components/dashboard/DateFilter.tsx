import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterOption = "today" | "week" | "month" | "year" | "custom";

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export function DateFilter() {
  const [selected, setSelected] = useState<FilterOption>("week");

  const selectedLabel = filterOptions.find(o => o.value === selected)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[160px]">
          <Calendar className="w-4 h-4" />
          <span>{selectedLabel}</span>
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {filterOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={cn(
              selected === option.value && "bg-accent font-medium"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
