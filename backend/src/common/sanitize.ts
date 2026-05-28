import sanitizeHtml from 'sanitize-html';

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function sanitizePlainText(value: string | null | undefined) {
  const normalized = trimOrNull(value);
  if (!normalized) {
    return null;
  }

  return sanitizeHtml(normalized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeMultilineText(value: string | null | undefined) {
  const normalized = trimOrNull(value);
  if (!normalized) {
    return null;
  }

  return sanitizeHtml(normalized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function sanitizeFilename(value: string | null | undefined) {
  const normalized = trimOrNull(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/[^\w.\-() ]+/g, '_').replace(/\s+/g, ' ').trim();
}
