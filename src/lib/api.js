const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) return null;

  return response.json().catch(() => null);
};

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.', 0);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') {
      window.dispatchEvent(new Event('filoxenia:unauthorized'));
    }

    throw new ApiError(data?.error || 'Terjadi kesalahan pada server.', response.status);
  }

  return data;
};
