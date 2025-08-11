import { useRef } from "react";
import { Button } from "../ui/button";
import { Paperclip } from "lucide-react";
interface FileUploadProps {
  onFileProcessed: (text: string, fileName: string) => void;
}

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      onFileProcessed(text, file.name);
    };
    reader.readAsText(file); // 对于代码、文本、markdown 等文件
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        hidden
        accept=".txt,.md,.js,.ts,.json,.py,.java,.html,.css,.png,.jpg,.jpeg"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        variant="outline"
        size="icon"
        className="text-gray-500 hover:text-black"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  );
};
