import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Loader2, AlertCircle, Circle } from 'lucide-react';

interface Props {
  status?: string | null;
  error?: string | null;
  enrolled?: boolean | null;
}

export default function EnrollmentStatusPill({ status, error, enrolled }: Props) {
  // Backwards compat: derive from face_enrolled when status unset
  const s = status || (enrolled ? 'synced' : 'not_enrolled');

  if (s === 'synced') {
    return (
      <Badge className="bg-success/15 text-success border border-success/30">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Synced
      </Badge>
    );
  }
  if (s === 'pending') {
    return (
      <Badge className="bg-warning/15 text-warning border border-warning/30">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Pending
      </Badge>
    );
  }
  if (s === 'failed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-destructive/15 text-destructive border border-destructive/30 cursor-help">
              <AlertCircle className="h-3 w-3 mr-1" /> Failed
            </Badge>
          </TooltipTrigger>
          {error && <TooltipContent className="max-w-xs">{error}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Circle className="h-3 w-3 mr-1" /> Not enrolled
    </Badge>
  );
}
