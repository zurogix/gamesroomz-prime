import type { Prisma } from "@prisma/client";

/**
 * Exactly the fields the games list shows. The assessment state JSON (which can be large)
 * is deliberately not selected.
 */
export const GAME_LIST_SELECT = {
  id: true,
  name: true,
  updatedAt: true,
  assessment: {
    select: {
      status: true,
      updatedAt: true,
      updatedBy: { select: { name: true } },
    },
  },
} satisfies Prisma.GameSelect;
