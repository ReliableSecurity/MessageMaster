import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface NewCampaignDialogProps {
  onCreateCampaign?: (data: { name: string; subject: string; description: string }) => void;
}

export function NewCampaignDialog({ onCreateCampaign }: NewCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    console.log('Create campaign:', { name, subject, description });
    onCreateCampaign?.({ name, subject, description });
    setName("");
    setSubject("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-campaign">
          <Plus className="w-4 h-4 mr-2" />
          Новая кампания
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать кампанию</DialogTitle>
          <DialogDescription>
            Создайте новую email-кампанию. Вы сможете выбрать шаблон и получателей на следующих шагах.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Название кампании</Label>
            <Input
              id="campaign-name"
              placeholder="Например: Весенняя распродажа 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-campaign-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Тема письма</Label>
            <Input
              id="email-subject"
              placeholder="Например: Не пропустите наши скидки!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-email-subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание кампании"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!name || !subject} data-testid="button-create">
            Создать кампанию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
