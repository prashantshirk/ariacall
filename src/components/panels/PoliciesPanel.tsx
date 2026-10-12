import React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CreditCard, HelpCircle, RotateCcw, ShieldCheck, Truck, XCircle } from "lucide-react"

export const PoliciesPanel: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="pb-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-brand flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Brand Policies & Guardrails</span>
        </h4>
        <p className="text-[11px] text-zinc-400">
          Aria strictly respects Aura Skincare brand policies when responding to customer requests.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-0.5">
          Brand Overview
        </span>
        <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
          Aura Skincare is a premium organic Indian skincare brand focused on simple, effective skincare products made with thoughtfully selected natural ingredients.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="shipping" className="w-full">
        {/* Shipping Policy */}
        <AccordionItem value="shipping">
          <AccordionTrigger className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Shipping & Delivery Policy</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-6">
            <p>
              • <strong>Free Delivery:</strong> All orders above <strong>₹499</strong> qualify for free standard shipping.
            </p>
            <p>
              • <strong>Delivery Fee:</strong> Orders below ₹499 incur a flat <strong>₹50</strong> shipping charge.
            </p>
            <p>
              • <strong>Delivery Window:</strong> Standard delivery arrives within <strong>3–5 business days</strong> across India.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Returns & Refunds */}
        <AccordionItem value="returns">
          <AccordionTrigger className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:no-underline">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Returns & Refunds Policy</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-6">
            <p>
              • <strong>Window:</strong> Returns are accepted within <strong>7 days of delivery</strong> for unopened, unused products in original packaging.
            </p>
            <p>
              • <strong>Opened Products:</strong> For hygiene reasons, opened or used skincare items cannot be returned.
            </p>
            <p>
              • <strong>Damaged / Defective:</strong> Must be reported within <strong>48 hours of delivery</strong> with photos for immediate free replacement.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Cancellation Policy */}
        <AccordionItem value="cancellation">
          <AccordionTrigger className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:no-underline">
            <div className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span>Cancellation Policy</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-6">
            <p>
              • <strong>Eligibility:</strong> Orders can be cancelled <em>only</em> while their status is <strong>Processing</strong>.
            </p>
            <p>
              • <strong>Shipped / Out for Delivery:</strong> Once an order is marked Shipped or Out for Delivery, it cannot be cancelled in system.
            </p>
            <p>
              • <strong>Doorstep Refusal:</strong> Customers may refuse the parcel upon delivery at their doorstep.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Cash on Delivery */}
        <AccordionItem value="cod">
          <AccordionTrigger className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:no-underline">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
              <span>Cash on Delivery (COD)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-6">
            <p>
              • <strong>Limit:</strong> Cash on Delivery is available for all orders up to <strong>₹2,500</strong>.
            </p>
            <p>
              • <strong>Payment Methods:</strong> Customers can pay either via cash or instant <strong>UPI QR code</strong> at the doorstep.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
