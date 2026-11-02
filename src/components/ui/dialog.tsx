import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 grid max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-night-800 p-5 shadow-2xl', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md opacity-70 hover:opacity-100 cursor-pointer"><X className="size-5" /><span className="sr-only">Fermer</span></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
export const DialogHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1 pr-6', className)} {...p} />
export const DialogFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...p} />
export const DialogTitle = ({ className, ...p }: React.ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn('title-caps text-xl', className)} {...p} />
export const DialogDescription = ({ className, ...p }: React.ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...p} />
