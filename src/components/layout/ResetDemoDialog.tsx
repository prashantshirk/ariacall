import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resetDemoData } from "@/lib/api"
import { toast } from "sonner"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ResetDemoDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export const ResetDemoDialog: React.FC<ResetDemoDialogProps> = ({ trigger, onSuccess }) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      await resetDemoData()
      toast.success("Demo orders reset to initial seed state.")
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (e) {
      toast.error("Failed to reset demo data.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5 flex items-center gap-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <DialogTitle className="text-base font-bold font-brand">Reset Demo Data?</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            This will restore ORD-101, ORD-102, and ORD-103 back to their original database status (e.g. reversing any cancellations made during testing).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleReset}
            disabled={loading}
            className="text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            {loading ? "Resetting..." : "Confirm Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
