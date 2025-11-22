import { useState, useEffect } from "react";
import { Star, GripVertical, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface QuickMenuItem {
  title: string;
  url: string;
  icon: any;
}

interface QuickMenuManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickMenuItems: QuickMenuItem[];
  onUpdate: (items: QuickMenuItem[]) => void;
  allMenuItems: QuickMenuItem[];
}

export function QuickMenuManager({
  open,
  onOpenChange,
  quickMenuItems,
  onUpdate,
  allMenuItems,
}: QuickMenuManagerProps) {
  const [items, setItems] = useState<QuickMenuItem[]>(quickMenuItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(quickMenuItems);
  }, [quickMenuItems]);

  const handleRemove = (url: string) => {
    const newItems = items.filter((item) => item.url !== url);
    setItems(newItems);
    onUpdate(newItems);
  };

  const handleAdd = (item: QuickMenuItem) => {
    if (!items.find((i) => i.url === item.url)) {
      const newItems = [...items, item];
      setItems(newItems);
      onUpdate(newItems);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    onUpdate(newItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveItem(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isInQuickMenu = (url: string) => items.some((item) => item.url === url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Kelola Quick Menu</DialogTitle>
          <DialogDescription>
            Tambahkan menu favorit Anda untuk akses cepat. Seret untuk mengubah urutan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Quick Menu Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Quick Menu ({items.length})
            </h3>
            <ScrollArea className="h-[400px] border rounded-md p-2">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Belum ada quick menu
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.url}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md bg-muted/50 cursor-move hover:bg-muted transition-colors",
                          draggedIndex === index && "opacity-50"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <ItemIcon className="h-4 w-4" />
                        <span className="text-sm flex-1">{item.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemove(item.url)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* All Available Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Semua Menu
            </h3>
            <ScrollArea className="h-[400px] border rounded-md p-2">
              <div className="space-y-1">
                {allMenuItems.map((item) => {
                  const ItemIcon = item.icon;
                  const inQuickMenu = isInQuickMenu(item.url);
                  return (
                    <div
                      key={item.url}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md transition-colors",
                        inQuickMenu
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 cursor-pointer"
                      )}
                      onClick={() => !inQuickMenu && handleAdd(item)}
                    >
                      <ItemIcon className="h-4 w-4" />
                      <span className="text-sm flex-1">{item.title}</span>
                      {inQuickMenu && (
                        <Star className="h-4 w-4 fill-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
