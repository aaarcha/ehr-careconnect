import * as React from "react";
import { format, parse, isValid, setYear, setMonth, getYear, getMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithInputProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Generate years from 1900 to current year + 10
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => 1900 + i).reverse();

export function DatePickerWithInput({
  date,
  onDateChange,
  placeholder = "MM/DD/YYYY",
  className,
  disabled = false,
}: DatePickerWithInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [calendarDate, setCalendarDate] = React.useState<Date>(date || new Date());

  // Sync input value with date prop
  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, "MM/dd/yyyy"));
      setCalendarDate(date);
    } else {
      setInputValue("");
    }
  }, [date]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Try to parse the date
    const parsedDate = parse(value, "MM/dd/yyyy", new Date());
    if (isValid(parsedDate) && value.length === 10) {
      onDateChange(parsedDate);
      setCalendarDate(parsedDate);
    }
  };

  const handleInputBlur = () => {
    // If invalid, reset to the current date value
    if (inputValue && date) {
      const parsedDate = parse(inputValue, "MM/dd/yyyy", new Date());
      if (!isValid(parsedDate)) {
        setInputValue(format(date, "MM/dd/yyyy"));
      }
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setCalendarDate(selectedDate);
      setOpen(false);
    }
  };

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(calendarDate, parseInt(monthStr));
    setCalendarDate(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(calendarDate, parseInt(yearStr));
    setCalendarDate(newDate);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex items-center justify-between gap-2 p-3 border-b">
            <Select
              value={getMonth(calendarDate).toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={getYear(calendarDate).toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            month={calendarDate}
            onMonthChange={setCalendarDate}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
