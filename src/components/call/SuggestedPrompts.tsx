import React, { useState } from "react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, MessageSquareQuote, PlayCircle } from "lucide-react"

interface SuggestedPromptsProps {
  onSelectPrompt?: (prompt: string) => void
  disabled?: boolean
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const prompts = [
    { text: "Where is my order ORD-101?", label: "Order Tracking (ORD-101)" },
    { text: "Can I return my sunscreen? It's ORD-102", label: "Return Policy Check (ORD-102)" },
    { text: "Cancel my order ORD-103", label: "Cancellation Flow (ORD-103)" },
    { text: "Do you charge for shipping?", label: "Shipping Policy" },
    { text: "Can you book me a flight to Goa?", label: "Out of Scope Guardrail" },
  ]

  return (
    <div className="w-full mt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1.5 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <MessageSquareQuote className="w-3.5 h-3.5 text-zinc-400" />
              <span>Suggested Evaluator Test Prompts</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-1.5 animate-in fade-in-0 duration-200">
          <p className="text-[11px] text-zinc-400 px-1 mb-2">
            Speak any of these into your mic, or click &ldquo;Say this&rdquo; to test Aria&rsquo;s response immediately:
          </p>
          <div className="flex flex-col gap-1.5">
            {prompts.map((p, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onSelectPrompt && onSelectPrompt(p.text)}
                className="group w-full text-left p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 block text-[11px]">
                    {p.label}
                  </span>
                  <span className="text-zinc-500 text-[11px] italic">
                    &ldquo;{p.text}&rdquo;
                  </span>
                </div>
                {onSelectPrompt && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                    <PlayCircle className="w-3 h-3" />
                    <span>Say</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
