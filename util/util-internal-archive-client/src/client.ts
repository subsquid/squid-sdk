import {
	type HttpClient,
	type HttpResponse,
	HttpError,
	HttpTimeoutError,
} from "@subsquid/http-client";
import type { Logger } from "@subsquid/logger";
import { wait, withErrorContext } from "@subsquid/util-internal";
import assert from "node:assert";

export interface ArchiveQuery {
	fromBlock: number;
	toBlock?: number;
}

export interface Block {
	header: {
		number: number;
		hash: string;
	};
}

export interface ArchiveClientOptions {
	http: HttpClient;
	url: string;
	queryTimeout?: number;
	apiKey?: string;
	log?: Logger;
}

export class ArchiveCredentialsError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly docs: string,
	) {
		super(message);
	}

	get name(): string {
		return "ArchiveCredentialsError";
	}
}

export class ArchiveClient {
	private url: URL;
	private http: HttpClient;
	private queryTimeout: number;
	private apiKey?: string;
	private retrySchedule = [5000, 10000, 20000, 30000, 60000];
	private log?: Logger;

	constructor(options: ArchiveClientOptions) {
		this.url = new URL(options.url);
		this.http = options.http;
		this.queryTimeout = options.queryTimeout ?? 180_000;
		this.apiKey = options.apiKey || process.env.SQD_API_KEY;
		this.log = options.log;
	}

	private getRouterUrl(path: string): string {
		const u = new URL(this.url);
		if (this.url.pathname.endsWith("/")) {
			u.pathname += path;
		} else {
			u.pathname += `/${path}`;
		}
		return u.toString();
	}

	getHeight(): Promise<number> {
		return this.retry(() => this._getHeight());
	}

    private async _getHeight(): Promise<number> {
        const res = await this.routerGetResponse<string>("height");
        const height = Number.parseInt(res.body);
        assert(Number.isSafeInteger(height));
        return height;
    }

	query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(
		query: Q,
	): Promise<B[]> {
		return this.retry(async () => this._query(query));
	}

    private async _query<B extends Block = Block, Q extends ArchiveQuery = ArchiveQuery>(query: Q): Promise<B[]> {
        const res = await this.routerGetResponse<string>(`${query.fromBlock}/worker`);
        const worker = res.body;
        const headers = this.getWorkerHeaders(res.headers);
        return this.http
            .post(worker, {
                json: query,
                headers,
                retryAttempts: 0,
                httpTimeout: this.queryTimeout,
            })
            .catch(
                withErrorContext({
                    archiveQuery: query,
                }),
            );
    }

	private async routerGetResponse<T>(path: string): Promise<HttpResponse<T>> {
		this.warnAboutMissingApiKey();

		try {
			const res = await this.http.request<T>("GET", this.getRouterUrl(path), {
				headers: this.getRouterHeaders(),
				retryAttempts: 0,
				httpTimeout: 10_000,
			});
			this.handleRouterResponse(res);
			return res;
		} catch (err: unknown) {
			if (err instanceof HttpError) {
				this.handleRouterResponse(err.response);
				throw this.getCredentialsError(err) || err;
			}
			throw err;
		}
	}

	private getRouterHeaders(): Record<string, string> {
		if (this.apiKey == null) return {};
		return {
			Authorization: `Bearer ${this.apiKey}`,
			Token: this.apiKey,
		};
	}

	private getWorkerHeaders(
		headers?: HttpResponse["headers"],
	): Record<string, string> | undefined {
		const result: Record<string, string> = {};
		if (headers == null) return result;
		for (const [name, value] of headers) {
			if (!name.startsWith("x-sqd-")) continue;
			result[name] = value;
		}
		return result;
	}

	private warnAboutMissingApiKey(): void {
		if (this.apiKey != null || missingApiKeyWarningEmitted) return;
		missingApiKeyWarningEmitted = true;
		this.log?.warn(
			"v2 Archive will require API keys after 19 May 2026 — get yours at https://portal.sqd.dev",
		);
	}

	private handleRouterResponse(res: HttpResponse): void {
		const sunset = res.headers.get("x-sqd-sunset");
		if (sunset == null) return;
		if (sunsetWarningEmitted) return;

		const date = parseHttpDate(sunset);
		if (!Number.isFinite(date.getTime())) return;

		sunsetWarningEmitted = true;
		this.log?.warn(
			{
				sunsetDate: date.toUTCString(),
				docs: "docs/v2-keys.md",
			},
			"Subsquid Archive endpoint sunset warning",
		);
	}

	private getCredentialsError(
		err: HttpError,
	): ArchiveCredentialsError | undefined {
		const res = err.response;
		if (res.status !== 403) return undefined;

		const body = res.body;
		if (!isCredentialsErrorBody(body)) return undefined;

		return new ArchiveCredentialsError(body.message, body.error, body.docs);
	}

	private async retry<T>(request: () => Promise<T>): Promise<T> {
		let retries = 0;
		while (true) {
			try {
				return await request();
			} catch (err: unknown) {
				if (err instanceof Error && this.http.isRetryableError(err)) {
					const pause =
						this.retrySchedule[
							Math.min(retries, this.retrySchedule.length - 1)
						];
					if (this.log?.isWarn()) {
						const warn =
							retries > 3 ||
							(err instanceof HttpTimeoutError && err.ms > 10_000);
						if (warn) {
							this.log.warn(
								{
									reason: err.message,
									...err,
								},
								`archive request failed, will retry in ${Math.round(pause / 1000)} secs`,
							);
						}
					}
					retries += 1;
					await wait(pause);
				} else {
					throw err;
				}
			}
		}
	}
}

let missingApiKeyWarningEmitted = false;
let sunsetWarningEmitted = false;

interface CredentialsErrorBody {
	error: string;
	message: string;
	docs: string;
}

function isCredentialsErrorBody(body: any): body is CredentialsErrorBody {
	return (
		typeof body === "object" &&
		body != null &&
		typeof body.error === "string" &&
		typeof body.message === "string" &&
		typeof body.docs === "string"
	);
}

function parseHttpDate(value: string): Date {
	const match = HTTP_DATE_REGEX.exec(value);
	return new Date(match?.[0] ?? Number.NaN);
}

const HTTP_DATE_REGEX =
	/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT\b/;
