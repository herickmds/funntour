import React, { useState, useEffect, useRef } from "react";
import { Input, InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PrefixedInputProps extends Omit<InputProps, 'onChange'> {
  prefix: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  prefixClassName?: string;
  inputClassName?: string;
}

export function PrefixedInput({
  prefix,
  value = "",
  onChange,
  className,
  prefixClassName,
  inputClassName,
  ...props
}: PrefixedInputProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar o estado local quando value prop muda
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handlePrefixClick = () => {
    // Focar no input quando o usuário clica no prefixo
    inputRef.current?.focus();
  };

  return (
    <div className={cn("flex rounded-md border border-input", className)}>
      <div 
        className={cn(
          "flex items-center bg-muted px-3 py-2 text-sm text-muted-foreground rounded-l-md border-r border-input cursor-pointer select-none",
          prefixClassName
        )}
        onClick={handlePrefixClick}
      >
        {prefix}
      </div>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        className={cn("border-0 rounded-none rounded-r-md focus-visible:ring-0 focus-visible:ring-offset-0", inputClassName)}
        {...props}
      />
    </div>
  );
}