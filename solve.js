export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const length = text.length;
  const rows = [];
  const errors = [];
  let columns = null;
  let width = -1;
  let position = text.charCodeAt(0) === 65279 ? 1 : 0;
  let line = 1;

  while (position < length) {
    let code = text.charCodeAt(position);
    if (code === 10) {
      position++;
      line++;
      continue;
    }
    if (code === 13 && text.charCodeAt(position + 1) === 10) {
      position += 2;
      line++;
      continue;
    }
    const recordLine = line;
    const recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let more = true;
    let quoted = false;
    while (more) {
      let value = '';
      let start = position;
      quoted = text.charCodeAt(position) === 34;
      let junk = false;
      if (quoted) {
        const opening = position++;
        const openingLine = line;
        start = position;
        let closed = false;
        while (position < length) {
          code = text.charCodeAt(position);
          if (code === 34) {
            value += text.slice(start, position);
            if (text.charCodeAt(position + 1) === 34) {
              value += '"';
              position += 2;
              start = position;
              continue;
            }
            position++;
            closed = true;
            break;
          }
          if (code === 13) {
            value += text.slice(start, position) + '\n';
            position += text.charCodeAt(position + 1) === 10 ? 2 : 1;
            start = position;
            line++;
            continue;
          }
          if (code === 10) line++;
          position++;
        }
        if (!closed) {
          position = opening + 1;
          line = openingLine;
          value = '"';
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
        } else {
          junk = true;
        }
        start = position;
      }
      let added = 0;
      while (position < length) {
        code = text.charCodeAt(position);
        if (code === 44 || code === 10) break;
        if (code === 13) {
          if (text.charCodeAt(position + 1) === 10) break;
          added += position - start;
          value += text.slice(start, position);
          errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
          start = ++position;
          continue;
        }
        position++;
      }
      added += position - start;
      value += text.slice(start, position);
      if (junk && added > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
      fields.push(value);
      code = text.charCodeAt(position);
      more = code === 44;
      if (more) position++;
      else if (position < length) {
        position += code === 13 ? 2 : 1;
        line++;
      }
    }
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
