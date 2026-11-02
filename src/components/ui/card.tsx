import * as React from 'react'
import { cn } from '@/lib/utils'
export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('glass rounded-2xl text-card-foreground', className)} {...p} />
export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col gap-1 p-4 sm:p-5 pb-2', className)} {...p} />
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('title-caps text-lg leading-none', className)} {...p} />
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm text-muted-foreground', className)} {...p} />
export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-4 sm:p-5 pt-2', className)} {...p} />
export const CardFooter = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex items-center p-4 sm:p-5 pt-0', className)} {...p} />
