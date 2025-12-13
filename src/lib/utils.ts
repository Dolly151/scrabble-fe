/*
 *  ###################
 *  #                 #
 *  #   #####         #
 *  #        ######   #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #                 #
 *  ###################
 *
 * Faculty of Information Technologies
 * Brno University of Technology
 * User Interface Programming (ITU)
 *
 * File: src/lib/utils.ts
 *
 * Description:
 *  Utility functions for working with CSS classes in a Tailwind environment.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import type { ClassValue } from 'clsx';

/*
 * cn (class names):
 *  Standard helper used in modern Next.js / Tailwind projects.
 *  Usage:
 *    cn("p-2", condition && "bg-red-500", ["text-sm", otherClass])
 *
 *  Output:
 *    - a string with the resulting classes
 *    - with Tailwind class conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
