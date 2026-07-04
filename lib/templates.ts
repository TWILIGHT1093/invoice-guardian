export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function buildReminderVariables(invoice: {
  clientName: string;
  amount: { toString(): string };
  invoiceNumber: string | null;
  dueDate: Date;
  daysOverdue: number;
}): Record<string, string> {
  return {
    client_name: invoice.clientName,
    amount: `$${invoice.amount.toString()}`,
    invoice_number: invoice.invoiceNumber || "N/A",
    due_date: invoice.dueDate.toLocaleDateString(),
    days_overdue: invoice.daysOverdue.toString(),
  };
}
