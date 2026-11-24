export interface ConsignmentItemCalc {
  productId: string;
  droppedQty: number;
  soldQty: number;
  returnedQty: number;
  unitPrice: number;
  unitCost: number;
}

export function calculateRemainingAtPartner(
  droppedQty: number,
  soldQty: number,
  returnedQty: number
): number {
  return Math.max(0, droppedQty - soldQty - returnedQty);
}

export function calculateSettlementDue(
  items: { soldQty: number; unitPrice: number }[]
): number {
  return items.reduce((acc, item) => acc + item.soldQty * item.unitPrice, 0);
}
