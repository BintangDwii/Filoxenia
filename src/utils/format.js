export const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);

export const formatNumber = (number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(
    Number(number) || 0
  );

export const formatPercent = (number, maximumFractionDigits = 1) =>
  `${formatNumber(number, maximumFractionDigits)}%`;

export const formatQuantity = (number) => formatNumber(number, 3);

export const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(`${String(value).replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatDate = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
