export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const JSON_TYPE = "application/json";

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && Object.getPrototypeOf(value) === Object.prototype;
}

function parseBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string") {
    throw new TypeError("baseUrl должен быть строкой.");
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError(`baseUrl должен быть абсолютным адресом: ${baseUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать схему http или https.");
  }
  if (url.search !== "" || url.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query и hash.");
  }
  return url;
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = parseBaseUrl(baseUrl);
  if (typeof path !== "string" || path.trim() === "") {
    throw new TypeError("path должен быть непустой строкой.");
  }
  if (!isPlainObject(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  const basePath = base.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  const url = new URL(`${basePath}/${relativePath}`, base.origin);

  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  return url.toString();
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);


export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  parseBaseUrl(baseUrl);
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }
  const defaultTimeoutMs = timeoutMs;


  function abortError(url, cause, externalSignal, timeoutSignal) {
    if (externalSignal?.aborted) {
      return new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
    }
    if (timeoutSignal.aborted) {
      return new ApiError("Превышено время ожидания ответа.", { kind: "timeout", url, cause });
    }
    return null;
  }

  async function readErrorPayload(response) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes(JSON_TYPE)) return null;
    try {
      const payload = await response.json();
      return payload?.error && typeof payload.error === "object" ? payload.error : null;
    } catch {
      return null;
    }
  }

  async function requestJson(path, {
    method = "GET",
    query,
    body,
    signal,
    timeoutMs: requestTimeoutMs,
  } = {}) {
    const normalizedMethod = typeof method === "string" ? method.toUpperCase() : "";
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      throw new TypeError(`Неподдерживаемый HTTP-метод: ${method}.`);
    }
    if (normalizedMethod === "GET" && body !== undefined) {
      throw new TypeError("Запрос GET не может содержать тело.");
    }

    const url = buildUrl(baseUrl, path, query);
    const headers = { Accept: JSON_TYPE };
    const init = { method: normalizedMethod, headers };
    if (body !== undefined) {
      headers["Content-Type"] = JSON_TYPE;
      init.body = JSON.stringify(body);
    }
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs ?? defaultTimeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    let response;
    try {
      response = await fetchFn(url, { ...init, signal: combinedSignal });
    } catch (error) {
      throw abortError(url, error, signal, timeoutSignal)
        ?? new ApiError("Не удалось получить ответ сервера.", { kind: "network", url, cause: error });
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул значение, не являющееся Response.", {
        kind: "invalid-response",
        url,
      });
    }

    if (!response.ok) {
      const apiError = await readErrorPayload(response);
      throw new ApiError(apiError?.message ?? `Сервер вернул HTTP ${response.status}.`, {
        kind: "http",
        status: response.status,
        code: apiError?.code ?? null,
        details: apiError?.details ?? null,
        url,
      });
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes(JSON_TYPE)) {
      throw new ApiError(`Ожидался JSON, получен Content-Type: ${contentType || "не указан"}.`, {
        kind: "invalid-response",
        url,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      throw abortError(url, error, signal, timeoutSignal)
        ?? new ApiError("Ответ сервера содержит некорректный JSON.", {
          kind: "invalid-response",
          url,
          cause: error,
        });
    }
  }

  return { requestJson };
}
