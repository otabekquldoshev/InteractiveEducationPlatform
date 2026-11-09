const ACCESS_KEY = "edu_access_token"
const REFRESH_KEY = "edu_refresh_token"

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  retry?: boolean
}
let refreshing: Promise<boolean> | null = null

export const tokens = {
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
}

async function refreshSession() {
  const refreshToken = tokens.refresh()
  if (!refreshToken) return false
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) {
    tokens.clear()
    return false
  }
  const data = await response.json()
  tokens.set(data.accessToken, data.refreshToken)
  return true
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const accessToken = tokens.access()
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  if (options.body !== undefined && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json")
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
  })
  if (response.status === 401 && options.retry !== false && tokens.refresh()) {
    refreshing ||= refreshSession().finally(() => {
      refreshing = null
    })
    if (await refreshing) return api<T>(path, { ...options, retry: false })
  }
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Server bilan aloqa xatosi" }))
    throw new Error(payload.error || "So'rov bajarilmadi")
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** Uploads multipart data while reporting the browser's real transfer progress. */
export function uploadForm<T>(
  path: string,
  body: FormData,
  onProgress?: (percentage: number) => void,
): Promise<T> {
  return uploadFormAttempt(path, body, onProgress, true)
}

function uploadFormAttempt<T>(
  path: string,
  body: FormData,
  onProgress: ((percentage: number) => void) | undefined,
  canRetry: boolean,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open("POST", `/api${path}`)
    const accessToken = tokens.access()
    if (accessToken)
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`)
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener("load", async () => {
      let payload: any = undefined
      try {
        payload = request.responseText
          ? JSON.parse(request.responseText)
          : undefined
      } catch {
        // A non-JSON server/proxy response is handled by the generic error below.
      }
      if (request.status === 401 && canRetry && tokens.refresh()) {
        refreshing ||= refreshSession().finally(() => {
          refreshing = null
        })
        try {
          if (await refreshing) {
            uploadFormAttempt<T>(path, body, onProgress, false).then(
              resolve,
              reject,
            )
            return
          }
        } catch {
          reject(new Error("Sessiyani yangilab bo'lmadi"))
          return
        }
      }
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100)
        resolve(payload as T)
      } else {
        reject(new Error(payload?.error || "Faylni yuklab bo'lmadi"))
      }
    })
    request.addEventListener("error", () =>
      reject(new Error("Server bilan aloqa uzildi")),
    )
    request.addEventListener("abort", () =>
      reject(new Error("Fayl yuklash bekor qilindi")),
    )
    request.send(body)
  })
}
