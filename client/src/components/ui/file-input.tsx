import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange?: (files: File[]) => void;
  onClear?: () => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  description?: string;
  error?: string;
  value?: File | File[];
  preview?: boolean;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      onChange,
      onClear,
      multiple = false,
      accept,
      label,
      description,
      error,
      value,
      preview = false,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [files, setFiles] = React.useState<File[]>([]);
    const [previews, setPreviews] = React.useState<string[]>([]);

    React.useEffect(() => {
      if (value) {
        const fileArray = Array.isArray(value) ? value : [value];
        setFiles(fileArray);
        
        if (preview) {
          const urls: string[] = [];
          fileArray.forEach(file => {
            // Verificar se file e file.type existem antes de usar startsWith
            if (file && file.type && typeof file.type === 'string' && file.type.startsWith('image/')) {
              const url = URL.createObjectURL(file);
              urls.push(url);
            }
          });
          setPreviews(urls);
          
          return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
          };
        }
      } else {
        setFiles([]);
        setPreviews([]);
      }
    }, [value, preview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      
      if (onChange) {
        onChange(selectedFiles);
      }
      
      if (preview) {
        // Clean up old preview URLs
        previews.forEach(url => URL.revokeObjectURL(url));
        
        const newPreviews = selectedFiles
          .filter(file => file && file.type && typeof file.type === 'string' && file.type.startsWith('image/'))
          .map(file => URL.createObjectURL(file));
        
        setPreviews(newPreviews);
      }
      
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleClear = () => {
      setFiles([]);
      setPreviews([]);
      
      if (onClear) {
        onClear();
      }
      
      // Reset input value
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleClick = () => {
      inputRef.current?.click();
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && <div className="text-sm font-medium">{label}</div>}
        
        <div 
          className={cn(
            "border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors",
            error && "border-destructive"
          )}
          onClick={handleClick}
        >
          <input
            type="file"
            ref={(node) => {
              // Handle both refs
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              inputRef.current = node;
            }}
            className="hidden"
            onChange={handleFileChange}
            multiple={multiple}
            accept={accept}
            {...props}
          />
          
          <div className="flex flex-col items-center gap-1">
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">
              {files.length > 0 
                ? `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}`
                : 'Clique para fazer upload'}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            {preview && previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Preview ${index}`} 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove specific file from preview
                        const newFiles = [...files];
                        newFiles.splice(index, 1);
                        setFiles(newFiles);
                        
                        const newPreviews = [...previews];
                        URL.revokeObjectURL(newPreviews[index]);
                        newPreviews.splice(index, 1);
                        setPreviews(newPreviews);
                        
                        if (onChange) {
                          onChange(newFiles);
                        }
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {!preview && (
              <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <span className="text-sm truncate max-w-[80%]">
                  {files.length === 1 
                    ? files[0].name 
                    : `${files.length} arquivos selecionados`}
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
