<<<<<<< HEAD
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
=======
'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
=======
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
<<<<<<< HEAD
      className={cn("flex items-center justify-center text-current")}
=======
      className={cn('flex items-center justify-center text-current')}
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
<<<<<<< HEAD
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
=======
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
>>>>>>> 8344bfa6dd8885c404265f805a3b5044bbf07f87
