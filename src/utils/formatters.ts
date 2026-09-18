export function formatCurrency(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatQuantity(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

export function generateItemId(existingItems: { id: string }[]): string {
  const prefix = 'ITEM-';
  let maxNumber = 0;
  existingItems.forEach(item => {
    if (item.id && item.id.startsWith(prefix)) {
      const numPart = parseInt(item.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  });
  return `${prefix}${(maxNumber + 1).toString().padStart(3, '0')}`;
}

export function generateMovementId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 900 + 100);
  return `MOV-${timestamp}${random}`;
}
